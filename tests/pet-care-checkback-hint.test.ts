import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
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
  careFeedbackCheckbackText?: { value: string }
  shouldShowFeedbackCheckback?: { value: boolean }
  shouldShowFeedbackFollowup?: { value: boolean }
  shouldShowFeedbackNextAction?: { value: boolean }
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

describe('care feedback checkback hint', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('renders the next check hint inside the feedback follow-up section', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const source = readSource('components/PetActions.vue')
    const followupBlock = extractElementBlock(template, 'care-feedback__follow-up')

    expect(followupBlock).toContain('class="care-feedback__checkback"')
    expect(followupBlock).toContain('v-if="shouldShowFeedbackCheckback"')
    expect(followupBlock).toContain('messages.careFeedback.checkbackLabel')
    expect(followupBlock).toContain('careFeedbackCheckbackText')
    expect(source).toContain('messages.value.careFeedback.checkbackNow')
    expect(source).toContain('messages.value.careFeedback.checkbackCooldown')
    expect(source).toContain('messages.value.careFeedback.checkbackLimit')
  })

  it('keeps follow-up visible when only a next check hint is available', () => {
    const setup = setupPetActions({
      recommendedCareAction: null,
    })

    expect(setup.shouldShowFeedbackNextAction?.value).toBe(false)
    expect(setup.shouldShowFeedbackCheckback?.value).toBe(true)
    expect(setup.shouldShowFeedbackFollowup?.value).toBe(true)
    expect(setup.careFeedbackCheckbackText?.value).toBe(
      '탭을 열어두고 펫 신호가 바뀌면 다시 확인하세요.',
    )
  })

  it('guides users to continue now when a next recommendation is available', () => {
    const setup = setupPetActions()

    expect(setup.careFeedbackCheckbackText?.value).toBe(
      '지금 이어서 다음 추천을 돌볼 수 있어요.',
    )
  })

  it('guides users to the limit reset time when no care uses remain', () => {
    const setup = setupPetActions({
      actionLimitInfo: {
        used: 5,
        limit: 5,
        remaining: 0,
        resetAt: 31 * 60 * 1000 + 1000,
        windowMs: 30 * 60 * 1000,
      },
    })

    expect(setup.careFeedbackCheckbackText?.value).toBe(
      '31m 00s 후 돌봄 횟수가 돌아와요. 그때 다시 확인하거나 지금 추가할 수 있어요.',
    )
  })

  it('guides users to the nearest cooldown when no immediate recommendation exists', () => {
    const setup = setupPetActions({
      cooldowns: {
        feed: 4500,
        play: 0,
        sleep: 2100,
        wash: 0,
      },
      recommendedCareAction: null,
    })

    expect(setup.careFeedbackCheckbackText?.value).toBe(
      '재우기: 2s 후 다시 가능해요. 그때 확인하세요.',
    )
  })

  it('keeps checkback copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const careFeedback = I18N_MESSAGES[locale].careFeedback

      expect(careFeedback.checkbackLabel.length).toBeGreaterThan(0)
      expect(careFeedback.checkbackNow.length).toBeGreaterThan(0)
      expect(careFeedback.checkbackCooldown).toContain('{action}')
      expect(careFeedback.checkbackCooldown).toContain('{time}')
      expect(careFeedback.checkbackLimit).toContain('{time}')
      expect(careFeedback.checkbackReady.length).toBeGreaterThan(0)
      expect(careFeedback.checkbackLater.length).toBeGreaterThan(0)
    }
  })

  it('defines compact checkback styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.care-feedback__checkback')
    expect(css).toMatch(/\.care-feedback__checkback\s*\{[^}]*grid-template-columns: minmax\(0, 0\.42fr\) minmax\(0, 1fr\);/)
    expect(css).toMatch(/\.care-feedback__checkback small\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.care-feedback__checkback\s*\{[^}]*grid-template-columns: 1fr;/,
    )
  })
})
