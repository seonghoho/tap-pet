import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ACTION_LIMIT_AD_REWARD_USES } from '~/constants/pet'
import { I18N_MESSAGES } from '~/constants/i18n'

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const
const requireModule = createRequire(import.meta.url)

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type PetActionsSetup = {
  careFeedbackRetentionTitle?: { value: string }
  careFeedbackCheckbackText?: { value: string }
  shouldShowFeedbackCheckback?: { value: boolean }
}

function loadScriptSetupComponent<T>(componentPath: string): SetupComponent<T> {
  const filename = resolve(componentPath)
  const source = readFileSync(filename, 'utf8')
  const descriptor = parse(source, { filename }).descriptor
  const compiled = compileScript(descriptor, { id: filename })
  const output = ts.transpileModule(compiled.content, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const module = { exports: {} }
  const localRequire = (id: string): unknown => {
    if (id === 'vue') return requireModule('vue')
    if (id === '~/constants/pet') return { ACTION_LIMIT_AD_REWARD_USES }

    return requireModule(id)
  }

  new Function('require', 'exports', 'module', output)(localRequire, module.exports, module)

  return (module.exports as { default: SetupComponent<T> }).default
}

function readComponentTemplate(componentPath: string): string {
  const filename = resolve(componentPath)
  const source = readFileSync(filename, 'utf8')
  const descriptor = parse(source, { filename }).descriptor

  return descriptor.template?.content ?? ''
}

function readSource(sourcePath: string): string {
  return readFileSync(resolve(sourcePath), 'utf8')
}

function extractElementBlock(template: string, className: string): string {
  const openPattern = new RegExp(`<([A-Za-z][\\w-]*)(?=[^>]*class="${className}")[^>]*>`)
  const openMatch = openPattern.exec(template)

  expect(openMatch).not.toBeNull()

  const start = openMatch?.index ?? 0
  const tagName = openMatch?.[1] ?? ''
  const tagPattern = /<\/?([A-Za-z][\w-]*)(?:\s[^>]*)?>/g
  let depth = 0

  for (const match of template.slice(start).matchAll(tagPattern)) {
    const tag = match[1]
    if (tag !== tagName) continue

    const tagText = match[0]
    if (tagText.endsWith('/>')) continue

    if (tagText.startsWith('</')) {
      depth -= 1
    } else {
      depth += 1
    }

    if (depth === 0) {
      const end = start + match.index + tagText.length

      return template.slice(start, end)
    }
  }

  throw new Error(`Unable to find closing tag for ${className}.`)
}

function createBaseProps(overrides: Record<string, unknown> = {}) {
  return {
    stats: {
      fullness: 74,
      energy: 21,
      cleanliness: 64,
    },
    cooldowns: {
      feed: 0,
      play: 0,
      sleep: 0,
      wash: 0,
    },
    activeReaction: null,
    actionLimitInfo: {
      used: 4,
      limit: 5,
      remaining: 1,
      resetAt: 31 * 60 * 1000 + 1000,
      windowMs: 30 * 60 * 1000,
    },
    careFeedback: {
      action: 'feed',
      statChanges: {
        fullness: 28,
        energy: -3,
        cleanliness: -2,
      },
      gainedExp: 12,
      gainedAffinityExp: 2,
      didLevelUp: false,
      didAffinityLevelUp: false,
      wasReduced: false,
      createdAt: 1000,
    },
    actionLimitRewardFeedback: null,
    recommendedCareAction: {
      action: 'sleep',
      reason: 'lowest-stat',
      status: 'happy',
      statKey: 'energy',
    },
    recommendedCareRewardPreview: null,
    levelProgress: {
      current: 42,
      required: 100,
      percent: 42,
    },
    ...overrides,
  }
}

function setupPetActions(props: Record<string, unknown> = {}): PetActionsSetup {
  vi.useFakeTimers()
  vi.setSystemTime(1000)
  vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

  return component.setup(createBaseProps(props), {
    emit: vi.fn(),
    expose: vi.fn(),
  })
}

describe('care feedback retention hint', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('shows an immediate return hint when the next recommendation is available', () => {
    const setup = setupPetActions()

    expect(setup.shouldShowFeedbackCheckback?.value).toBe(true)
    expect(setup.careFeedbackRetentionTitle?.value).toBe('지금 다시 확인')
    expect(setup.careFeedbackCheckbackText?.value).toBe(
      '다음 추천을 돌보면 결과 카드와 성장 변화를 바로 확인할 수 있어요.',
    )
  })

  it('shows the nearest cooldown as the next check time', () => {
    const setup = setupPetActions({
      cooldowns: {
        feed: 4500,
        play: 0,
        sleep: 2100,
        wash: 0,
      },
      recommendedCareAction: null,
    })

    expect(setup.careFeedbackRetentionTitle?.value).toBe('2s 후 다시 확인')
    expect(setup.careFeedbackCheckbackText?.value).toBe(
      '재우기: 2s 후 반복 돌봄 결과를 확인할 수 있어요.',
    )
  })

  it('uses cooldown timing when the recommended follow-up is still cooling down', () => {
    const setup = setupPetActions({
      cooldowns: {
        feed: 0,
        play: 0,
        sleep: 6100,
        wash: 0,
      },
    })

    expect(setup.careFeedbackRetentionTitle?.value).toBe('6s 후 다시 확인')
    expect(setup.careFeedbackCheckbackText?.value).toBe(
      '재우기: 6s 후 반복 돌봄 결과를 확인할 수 있어요.',
    )
  })

  it('shows the action limit reset as the next check time', () => {
    const setup = setupPetActions({
      actionLimitInfo: {
        used: 5,
        limit: 5,
        remaining: 0,
        resetAt: 31 * 60 * 1000 + 1000,
        windowMs: 30 * 60 * 1000,
      },
    })

    expect(setup.careFeedbackRetentionTitle?.value).toBe('31m 00s 후 다시 확인')
    expect(setup.careFeedbackCheckbackText?.value).toBe(
      '돌봄 횟수가 돌아오면 상태 변화와 다음 추천을 다시 확인할 수 있어요.',
    )
  })

  it('renders retention title and detail inside the feedback follow-up', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const checkbackBlock = extractElementBlock(template, 'care-feedback__checkback')

    expect(checkbackBlock).toContain('careFeedbackRetentionTitle')
    expect(checkbackBlock).toContain('careFeedbackCheckbackText')
    expect(checkbackBlock).toMatch(/<strong>\s*\{\{\s*careFeedbackRetentionTitle\s*\}\}\s*<\/strong>/)
    expect(checkbackBlock).toMatch(/<small>\s*\{\{\s*careFeedbackCheckbackText\s*\}\}\s*<\/small>/)
  })

  it('keeps retention copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const careFeedback = I18N_MESSAGES[locale].careFeedback

      expect(careFeedback.retentionNowTitle.length).toBeGreaterThan(0)
      expect(careFeedback.retentionInTitle).toContain('{time}')
      expect(careFeedback.retentionReadyTitle.length).toBeGreaterThan(0)
      expect(careFeedback.retentionLaterTitle.length).toBeGreaterThan(0)
      expect(careFeedback.retentionNowDetail.length).toBeGreaterThan(0)
      expect(careFeedback.retentionCooldownDetail).toContain('{action}')
      expect(careFeedback.retentionCooldownDetail).toContain('{time}')
      expect(careFeedback.retentionLimitDetail.length).toBeGreaterThan(0)
      expect(careFeedback.retentionReadyDetail.length).toBeGreaterThan(0)
      expect(careFeedback.retentionLaterDetail.length).toBeGreaterThan(0)
    }
  })

  it('defines compact responsive retention hint styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toMatch(/\.care-feedback__checkback div\s*\{[^}]*display: grid;/)
    expect(css).toMatch(/\.care-feedback__checkback strong\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.care-feedback__checkback small\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.care-feedback__checkback\s*\{[^}]*grid-template-columns: 1fr;/,
    )
  })
})
