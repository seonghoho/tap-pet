import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const
const requireModule = createRequire(import.meta.url)

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type PetActionsSetup = {
  shouldShowFeedbackGrowth: { value: boolean }
  feedbackGrowthCurrent: { value: number }
  feedbackGrowthRequired: { value: number }
  feedbackGrowthRemaining: { value: number }
  feedbackGrowthPercent: { value: number }
  feedbackGrowthTitle: { value: string }
  feedbackGrowthDetail: { value: string }
}

type GrowthCareFeedbackMessages = {
  growthLabel: string
  growthRemaining: string
  growthComplete: string
  growthDetail: string
  growthCompleteDetail: string
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

function createPetActionsProps(overrides: Record<string, unknown> = {}) {
  return {
    cooldowns: {
      feed: 0,
      play: 0,
      sleep: 0,
      wash: 0,
    },
    activeReaction: null,
    actionLimitInfo: {
      used: 1,
      limit: 5,
      remaining: 4,
      resetAt: 31 * 60 * 1000,
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
    levelProgress: {
      current: 42,
      required: 100,
      percent: 42,
    },
    ...overrides,
  }
}

describe('care feedback growth target', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('passes level progress into action feedback', () => {
    const template = readComponentTemplate('app.vue')

    expect(getComponentPropExpression(template, 'PetActions', 'level-progress')).toBe(
      'pet.levelProgress.value',
    )
  })

  it('renders a growth target section inside the care feedback card', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const source = readSource('components/PetActions.vue')
    const feedbackIndex = template.indexOf('class="care-feedback"')
    const growthIndex = template.indexOf('class="care-feedback__growth"')
    const nextIndex = template.indexOf('class="care-feedback__next"')

    expect(feedbackIndex).toBeGreaterThan(-1)
    expect(growthIndex).toBeGreaterThan(feedbackIndex)
    expect(nextIndex).toBeGreaterThan(growthIndex)
    expect(template).toContain('v-if="shouldShowFeedbackGrowth"')
    expect(template).toContain('feedbackGrowthTitle')
    expect(template).toContain('feedbackGrowthDetail')
    expect(template).toContain(':aria-valuenow="feedbackGrowthCurrent"')
    expect(template).toContain(':aria-valuemax="feedbackGrowthRequired"')
    expect(template).toContain(':style="{ width: `${feedbackGrowthPercent}%` }"')
    expect(source).toContain('levelProgress?: ProgressInfo | null')
    expect(source).toContain('messages.value.careFeedback.growthRemaining')
    expect(source).toContain('messages.value.careFeedback.growthComplete')
  })

  it('summarizes remaining EXP toward the next level', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

    const setup = component.setup(createPetActionsProps(), {
      emit: vi.fn(),
      expose: vi.fn(),
    })

    expect(setup.shouldShowFeedbackGrowth.value).toBe(true)
    expect(setup.feedbackGrowthCurrent.value).toBe(42)
    expect(setup.feedbackGrowthRequired.value).toBe(100)
    expect(setup.feedbackGrowthRemaining.value).toBe(58)
    expect(setup.feedbackGrowthPercent.value).toBe(42)
    expect(setup.feedbackGrowthTitle.value).toBe('다음 레벨까지 58 경험치')
    expect(setup.feedbackGrowthDetail.value).toBe('현재 42/100 경험치까지 채웠습니다.')
  })

  it('uses level-up copy when the result reaches a new level', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

    const setup = component.setup(
      createPetActionsProps({
        careFeedback: {
          action: 'play',
          statChanges: {
            fullness: -8,
            energy: -14,
            cleanliness: -8,
          },
          gainedExp: 18,
          gainedAffinityExp: 14,
          didLevelUp: true,
          didAffinityLevelUp: false,
          wasReduced: false,
          createdAt: 1000,
        },
        levelProgress: {
          current: 8,
          required: 135,
          percent: 6,
        },
      }),
      {
        emit: vi.fn(),
        expose: vi.fn(),
      },
    )

    expect(setup.feedbackGrowthTitle.value).toBe('새 레벨에 도달했어요')
    expect(setup.feedbackGrowthDetail.value).toBe('새 성장 게이지가 8/135 경험치에서 시작됐습니다.')
    expect(setup.feedbackGrowthPercent.value).toBe(6)
  })

  it('keeps growth target copy localized with required placeholders', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const careFeedback = I18N_MESSAGES[locale].careFeedback as GrowthCareFeedbackMessages

      expect(careFeedback.growthLabel.length).toBeGreaterThan(0)
      expect(careFeedback.growthRemaining).toContain('{remaining}')
      expect(careFeedback.growthRemaining).toContain('{exp}')
      expect(careFeedback.growthComplete.length).toBeGreaterThan(0)
      expect(careFeedback.growthDetail).toContain('{current}')
      expect(careFeedback.growthDetail).toContain('{required}')
      expect(careFeedback.growthDetail).toContain('{exp}')
      expect(careFeedback.growthCompleteDetail).toContain('{current}')
      expect(careFeedback.growthCompleteDetail).toContain('{required}')
      expect(careFeedback.growthCompleteDetail).toContain('{exp}')
    }
  })

  it('defines responsive growth target styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.care-feedback__growth')
    expect(css).toContain('.care-feedback__growth-track')
    expect(css).toContain('.care-feedback__growth-fill')
    expect(css).toMatch(/\.care-feedback__growth strong\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.care-feedback__growth small\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.care-feedback__growth\s*\{[^}]*grid-template-columns: 1fr;/,
    )
  })
})
