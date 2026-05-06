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
  shouldShowFeedbackNextAction: { value: boolean }
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

describe('pet care feedback summary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders a key result summary and next-action prompt inside care feedback', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const source = readSource('components/PetActions.vue')

    expect(template).toContain('care-feedback__summary')
    expect(template).toContain('careFeedbackSummary')
    expect(template).toContain('care-feedback__next')
    expect(template).toContain('v-if="shouldShowFeedbackNextAction"')
    expect(template).toContain('feedbackNextActionTitle')
    expect(template).toContain('feedbackNextActionDetail')
    expect(template).toContain('messages.careFeedback.summaryLabel')
    expect(template).toContain('messages.careFeedback.nextLabel')
    expect(source).toContain('messages.value.careFeedback.statSummary')
    expect(source).toContain('messages.value.careFeedback.nextTitle')
  })

  it('hides the feedback next action when the action limit is reached', () => {
    vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

    const setup = component.setup(
      {
        cooldowns: {
          feed: 0,
          play: 0,
          sleep: 0,
          wash: 0,
        },
        activeReaction: null,
        actionLimitInfo: {
          used: 5,
          limit: 5,
          remaining: 0,
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
      },
      {
        emit: vi.fn(),
        expose: vi.fn(),
      },
    )

    expect(setup.shouldShowFeedbackNextAction.value).toBe(false)
  })

  it('shows the feedback next action when feedback and remaining actions are both available', () => {
    vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

    const setup = component.setup(
      {
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
      },
      {
        emit: vi.fn(),
        expose: vi.fn(),
      },
    )

    expect(setup.shouldShowFeedbackNextAction.value).toBe(true)
  })

  it('keeps standalone recommendations hidden while result feedback is visible', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const source = readSource('components/PetActions.vue')

    expect(template).toContain('v-if="shouldShowRecommendation"')
    expect(source).toContain('!props.careFeedback')
  })

  it('keeps feedback summary copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const careFeedback = I18N_MESSAGES[locale].careFeedback

      expect(careFeedback.summaryLabel.length).toBeGreaterThan(0)
      expect(careFeedback.statSummary).toContain('{stat}')
      expect(careFeedback.statSummary).toContain('{value}')
      expect(careFeedback.affinitySummary).toContain('{stat}')
      expect(careFeedback.affinitySummary).toContain('{value}')
      expect(careFeedback.expSummary).toContain('{value}')
      expect(careFeedback.nextLabel.length).toBeGreaterThan(0)
      expect(careFeedback.nextTitle).toContain('{action}')
    }
  })

  it('defines responsive result summary styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.care-feedback__summary')
    expect(css).toContain('.care-feedback__next')
    expect(css).toMatch(/\.care-feedback__summary strong\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.care-feedback__next strong\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.care-feedback__summary\s*\{[^}]*grid-template-columns: 1fr;/,
    )
  })
})
