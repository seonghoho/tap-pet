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
  recommendationEvidenceText?: { value: string }
  shouldShowRecommendationEvidence?: { value: boolean }
  recommendationCtaStatusText?: { value: string }
  recommendationCtaStatusClass?: { value: string }
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

function getComponentPropExpression(template: string, componentName: string, propName: string): string | undefined {
  const match = template.match(new RegExp(`<${componentName}[\\s\\S]*?/>`))

  return match?.[0].match(new RegExp(`:${propName}="([^"]+)"`))?.[1]
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
    lastPlayedAt: 1000,
    cooldowns: {
      feed: 0,
      play: 0,
      sleep: 0,
      wash: 0,
    },
    activeReaction: null,
    actionLimitInfo: {
      used: 2,
      limit: 5,
      remaining: 3,
      resetAt: 31 * 60 * 1000,
      windowMs: 30 * 60 * 1000,
    },
    careFeedback: null,
    actionLimitRewardFeedback: null,
    recommendedCareAction: {
      action: 'sleep',
      reason: 'lowest-stat',
      status: 'happy',
      statKey: 'energy',
    },
    recommendedCareRewardPreview: null,
    levelProgress: null,
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

describe('pet recommendation evidence', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('passes current stats into the action controls', () => {
    const appTemplate = readComponentTemplate('app.vue')
    const source = readSource('components/PetActions.vue')

    expect(getComponentPropExpression(appTemplate, 'PetActions', 'stats')).toBe('currentPet.stats')
    expect(source).toContain('stats: PetStats')
  })

  it('passes last played time into the action controls', () => {
    const appTemplate = readComponentTemplate('app.vue')
    const source = readSource('components/PetActions.vue')

    expect(getComponentPropExpression(appTemplate, 'PetActions', 'last-played-at')).toBe(
      'currentPet.lastPlayedAt',
    )
    expect(source).toContain('lastPlayedAt: number')
  })

  it('summarizes the recommended stat and current value', () => {
    const setup = setupPetActions()

    expect(setup.shouldShowRecommendationEvidence?.value).toBe(true)
    expect(setup.recommendationEvidenceText?.value).toBe('근거 에너지 21/100')
  })

  it('separates ready recommendation CTA status from the detail copy', () => {
    const setup = setupPetActions()

    expect(setup.recommendationCtaStatusText?.value).toBe('지금 가능 · 결과 확인')
    expect(setup.recommendationCtaStatusClass?.value).toBe('action-recommendation__cta--ready')
  })

  it('shows cooldown CTA status for a recommended action that is not ready yet', () => {
    const setup = setupPetActions({
      cooldowns: {
        feed: 0,
        play: 0,
        sleep: 4500,
        wash: 0,
      },
    })

    expect(setup.recommendationCtaStatusText?.value).toBe('추천 대기 · 4s 후 가능')
    expect(setup.recommendationCtaStatusClass?.value).toBe('action-recommendation__cta--cooldown')
  })

  it('summarizes idle time when play is recommended', () => {
    const setup = setupPetActions({
      lastPlayedAt: 1000 - 1000 * 60 * 135,
      recommendedCareAction: {
        action: 'play',
        reason: 'need',
        status: 'bored',
      },
    })

    expect(setup.shouldShowRecommendationEvidence?.value).toBe(true)
    expect(setup.recommendationEvidenceText?.value).toBe('근거 마지막 놀이 2시간 15분 전')
  })

  it('hides evidence when the recommendation has no stat key', () => {
    const setup = setupPetActions({
      recommendedCareAction: {
        action: 'feed',
        reason: 'need',
        status: 'hungry',
      },
    })

    expect(setup.shouldShowRecommendationEvidence?.value).toBe(false)
    expect(setup.recommendationEvidenceText?.value).toBe('')
  })

  it('renders evidence inside the recommendation support area', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const supportBlock = extractElementBlock(template, 'action-recommendation__support')

    expect(supportBlock).toContain('class="action-recommendation__evidence"')
    expect(supportBlock).toContain('v-if="shouldShowRecommendationEvidence"')
    expect(supportBlock).toContain('recommendationEvidenceText')
    expect(supportBlock).toContain('class="action-recommendation__cta"')
    expect(supportBlock).toContain(':class="recommendationCtaStatusClass"')
    expect(supportBlock).toContain('recommendationCtaStatusText')
  })

  it('keeps recommendation evidence copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const careRecommendation = I18N_MESSAGES[locale].careRecommendation

      expect(careRecommendation.statEvidence).toContain('{stat}')
      expect(careRecommendation.statEvidence).toContain('{value}')
      expect(careRecommendation.playEvidence).toContain('{time}')
      expect(careRecommendation.ctaReady.length).toBeGreaterThan(0)
      expect(careRecommendation.ctaCooldown).toContain('{time}')
      expect(I18N_MESSAGES[locale].time.minutesAgo).toContain('{minutes}')
      expect(I18N_MESSAGES[locale].time.hoursAgo).toContain('{hours}')
      expect(I18N_MESSAGES[locale].time.hoursMinutesAgo).toContain('{hours}')
      expect(I18N_MESSAGES[locale].time.hoursMinutesAgo).toContain('{minutes}')
    }
    expect(I18N_MESSAGES.en.careRecommendation.ctaReady).toBe('Ready now · see result')
    expect(I18N_MESSAGES.ko.careRecommendation.ctaReady).toBe('지금 가능 · 결과 확인')
    expect(I18N_MESSAGES.ja.careRecommendation.ctaReady).toBe('今すぐ可能 · 結果を確認')
  })

  it('defines compact responsive evidence styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.action-recommendation__evidence')
    expect(css).toContain('.action-recommendation__cta')
    expect(css).toContain('.action-recommendation__cta--ready')
    expect(css).toContain('.action-recommendation__cta--cooldown')
    expect(css).toMatch(/\.action-recommendation__evidence\s*\{[^}]*display: inline-block;/)
    expect(css).toMatch(/\.action-recommendation__evidence\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.action-recommendation__cta\s*\{[^}]*display: inline-block;/)
    expect(css).toMatch(/\.action-recommendation__cta\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.action-recommendation__reward\s*\{[^}]*min-width: 0;/)
    expect(css).toMatch(/\.action-recommendation__reward\s*\{[^}]*width: fit-content;/)
    expect(css).toMatch(/\.action-recommendation__cta\s*\{[^}]*min-width: 0;/)
    expect(css).toMatch(/\.action-recommendation__cta\s*\{[^}]*width: fit-content;/)
    expect(css).toMatch(/\.action-recommendation__evidence\s*\{[^}]*min-width: 0;/)
    expect(css).toMatch(/\.action-recommendation__evidence\s*\{[^}]*width: fit-content;/)
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.action-recommendation__evidence\s*\{[^}]*text-align: left;/,
    )
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.action-recommendation__cta\s*\{[^}]*text-align: left;/,
    )
  })
})
