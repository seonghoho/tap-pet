import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import type { Ref } from 'vue'
import ts from 'typescript'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ACTION_LIMIT_AD_REWARD_USES } from '~/constants/pet'
import { I18N_MESSAGES } from '~/constants/i18n'
import { createInitialPetState } from '~/utils/petFactory'
import * as petCare from '~/utils/petCare'
import { usePetStore } from '~/composables/usePetStore'
import type { PetState } from '~/types/pet'

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const
const requireModule = createRequire(import.meta.url)
const nuxtState = vi.hoisted(() => new Map<string, Ref<unknown>>())

vi.mock('#app', async () => {
  const { ref } = await vi.importActual<typeof import('vue')>('vue')

  return {
    useState: <T>(key: string, init: () => T): Ref<T> => {
      if (!nuxtState.has(key)) {
        nuxtState.set(key, ref(init()) as Ref<unknown>)
      }

      return nuxtState.get(key) as Ref<T>
    },
  }
})

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type PetActionsSetup = {
  shouldShowRecommendationReward: { value: boolean }
  recommendationRewardText: { value: string }
  recommendationRewardReducedText: { value: string }
}

type CareActionRewardPreview = {
  gainedExp: number
  gainedAffinityExp: number
  rewardMultiplier: number
  wasReduced: boolean
}

type CareRecommendationMessages = {
  rewardHint: string
  rewardReduced: string
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
      used: 1,
      limit: 5,
      remaining: 4,
      resetAt: 31 * 60 * 1000,
      windowMs: 30 * 60 * 1000,
    },
    careFeedback: null,
    actionLimitRewardFeedback: null,
    recommendedCareAction: {
      action: 'feed',
      reason: 'lowest-stat',
      status: 'happy',
      statKey: 'fullness',
    },
    levelProgress: {
      current: 0,
      required: 100,
      percent: 0,
    },
    recommendedCareRewardPreview: {
      gainedExp: 13,
      gainedAffinityExp: 2,
      rewardMultiplier: 1.1,
      wasReduced: false,
    },
    ...overrides,
  }
}

function getCareActionRewardPreview(input: Parameters<typeof petCare.applyCareAction>[0]): CareActionRewardPreview {
  const preview = (petCare as unknown as {
    getCareActionRewardPreview?: (input: Parameters<typeof petCare.applyCareAction>[0]) => CareActionRewardPreview
  }).getCareActionRewardPreview

  expect(typeof preview).toBe('function')

  return preview?.(input) as CareActionRewardPreview
}

describe('pet recommendation reward preview', () => {
  beforeEach(() => {
    nuxtState.clear()
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocalPetStorage', () => ({
      storageError: { value: null },
      loadPetState: () => null,
      savePetState: vi.fn(),
      clearPetState: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('previews the same rewards used by completed care actions', () => {
    const input = {
      stats: {
        fullness: 60,
        energy: 70,
        cleanliness: 80,
      },
      growth: {
        level: 1,
        exp: 0,
        affinityExp: 0,
      },
      action: 'play',
    } as const

    const preview = getCareActionRewardPreview(input)
    const result = petCare.applyCareAction(input)

    expect(preview).toEqual({
      gainedExp: result.gainedExp,
      gainedAffinityExp: result.gainedAffinityExp,
      rewardMultiplier: result.rewardMultiplier,
      wasReduced: result.wasReduced,
    })
    expect(preview).toMatchObject({
      gainedExp: 20,
      gainedAffinityExp: 14,
      rewardMultiplier: 1.1,
      wasReduced: false,
    })
  })

  it('previews reduced rewards before overcare actions', () => {
    const preview = getCareActionRewardPreview({
      stats: {
        fullness: 95,
        energy: 80,
        cleanliness: 80,
      },
      growth: {
        level: 1,
        exp: 0,
        affinityExp: 0,
      },
      action: 'feed',
    })

    expect(preview).toMatchObject({
      gainedExp: 5,
      gainedAffinityExp: 1,
      rewardMultiplier: 1.1,
      wasReduced: true,
    })
  })

  it('exposes reward preview for the current recommended care from the store', () => {
    const store = usePetStore()

    store.initializePet('cat')

    expect(store.recommendedCareAction.value?.action).toBe('feed')
    expect(store.recommendedCareRewardPreview.value).toMatchObject({
      gainedExp: 13,
      gainedAffinityExp: 2,
      rewardMultiplier: 1.1,
      wasReduced: false,
    })
  })

  it('passes recommended reward preview into action controls', () => {
    const template = readComponentTemplate('app.vue')

    expect(getComponentPropExpression(template, 'PetActions', 'recommended-care-reward-preview')).toBe(
      'pet.recommendedCareRewardPreview.value',
    )
  })

  it('formats localized reward preview copy for the recommendation', () => {
    vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

    const setup = component.setup(createBaseProps(), {
      emit: vi.fn(),
      expose: vi.fn(),
    })
    const reducedSetup = component.setup(
      createBaseProps({
        recommendedCareRewardPreview: {
          gainedExp: 5,
          gainedAffinityExp: 1,
          rewardMultiplier: 1.1,
          wasReduced: true,
        },
      }),
      {
        emit: vi.fn(),
        expose: vi.fn(),
      },
    )

    expect(setup.shouldShowRecommendationReward.value).toBe(true)
    expect(setup.recommendationRewardText.value).toBe(
      I18N_MESSAGES.ko.careRecommendation.rewardHint
        .replace('{exp}', '+13')
        .replace('{affinity}', '+2')
        .replace('{bonus}', '1.1'),
    )
    expect(setup.recommendationRewardReducedText.value).toBe('')
    expect(reducedSetup.recommendationRewardText.value).toBe(
      I18N_MESSAGES.ko.careRecommendation.rewardHint
        .replace('{exp}', '+5')
        .replace('{affinity}', '+1')
        .replace('{bonus}', '1.1'),
    )
    expect(reducedSetup.recommendationRewardReducedText.value).toBe(
      I18N_MESSAGES.ko.careRecommendation.rewardReduced,
    )
  })

  it('computes reward preview copy from the recommended care prop', () => {
    const source = readSource('components/PetActions.vue')

    expect(source).toContain('recommendedCareRewardPreview?: CareActionRewardPreview | null')
    expect(source).toContain('messages.value.careRecommendation.rewardHint')
    expect(source).toContain('messages.value.careRecommendation.rewardReduced')
  })

  it('keeps reward preview copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const careRecommendation = I18N_MESSAGES[locale].careRecommendation as CareRecommendationMessages

      expect(careRecommendation.rewardHint).toContain('{exp}')
      expect(careRecommendation.rewardHint).toContain('{affinity}')
      expect(careRecommendation.rewardHint).toContain('{bonus}')
      expect(careRecommendation.rewardReduced.length).toBeGreaterThan(0)
    }
  })
})
