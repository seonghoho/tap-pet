import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'
import { ACTION_LIMIT_AD_REWARD_USES } from '~/constants/pet'
import type { PetPersonalityState, PetSettings } from '~/types/pet'
import * as petGrowth from '~/utils/petGrowth'
import * as petLevelUnlocks from '~/utils/petLevelUnlocks'
import * as petPersonality from '~/utils/petPersonality'

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const
const requireModule = createRequire(import.meta.url)

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type PetSidePanelSetup = {
  personalityProgress: { value: ReturnType<typeof petPersonality.getPetPersonalityProgress> }
  personalityName: { value: string }
  personalityDetail: { value: string }
  personalityBonusText: { value: string }
}

type PetActionsSetup = {
  shouldShowFeedbackPersonalityReveal: { value: boolean }
  shouldShowFeedbackPersonalityBonus: { value: boolean }
  feedbackPersonalityName: { value: string }
  feedbackPersonalityBonusText: { value: string }
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
    if (id === '~/utils/petGrowth') return petGrowth
    if (id === '~/utils/petLevelUnlocks') return petLevelUnlocks
    if (id === '~/utils/petPersonality') return petPersonality

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

function createTestSettings(overrides: Partial<PetSettings> = {}): PetSettings {
  return {
    titleMode: 'status',
    titleVisibility: 'inactive-only',
    disguiseTitleId: 'project-dashboard',
    customDisguiseTitle: '',
    titleAnimationEnabled: false,
    themeId: 'system',
    ...overrides,
  }
}

function createPersonality(overrides: Partial<PetPersonalityState> = {}): PetPersonalityState {
  return {
    personality: null,
    earlyActionCounts: {
      feed: 0,
      play: 0,
      sleep: 0,
      wash: 0,
    },
    assignedAt: null,
    ...overrides,
  }
}

function createSidePanelProps(overrides: Record<string, unknown> = {}) {
  return {
    mode: 'status',
    name: '탭펫',
    level: 3,
    levelProgress: {
      current: 80,
      required: 135,
      percent: 59,
    },
    affinityProgress: {
      level: 2,
      current: 30,
      required: 110,
      percent: 27,
    },
    dailyGoal: {
      dateKey: '2026-05-20',
      goalId: 'recommended-care',
      progress: 0,
      completedAt: null,
      claimedAt: null,
    },
    dailyGoalRewardFeedback: null,
    personality: createPersonality(),
    settings: createTestSettings(),
    ...overrides,
  }
}

function createPetActionsProps(overrides: Record<string, unknown> = {}) {
  return {
    stats: {
      fullness: 70,
      energy: 70,
      cleanliness: 70,
    },
    lastPlayedAt: 0,
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
      gainedAffinityExp: 3,
      didLevelUp: false,
      didAffinityLevelUp: false,
      wasReduced: false,
      createdAt: 1000,
      personalityReveal: {
        personality: 'hungry',
        reasonActionCounts: {
          feed: 2,
          play: 1,
          sleep: 0,
          wash: 0,
        },
      },
      personalityBonus: {
        personality: 'hungry',
        action: 'feed',
        expBonus: 0,
        affinityBonus: 1,
      },
    },
    actionLimitRewardFeedback: null,
    recommendedCareAction: null,
    levelProgress: {
      current: 8,
      required: 135,
      percent: 6,
    },
    ...overrides,
  }
}

describe('pet personality UI', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('passes personality state into the side panel', () => {
    const template = readComponentTemplate('app.vue')

    expect(template).toContain(':personality="currentPet.personality"')
  })

  it('renders personality sections in the side panel and care feedback', () => {
    const sideTemplate = readComponentTemplate('components/PetSidePanel.vue')
    const actionsTemplate = readComponentTemplate('components/PetActions.vue')

    expect(sideTemplate).toContain('class="pet-personality"')
    expect(sideTemplate).toContain('personalityProgress')
    expect(sideTemplate).toContain('messages.personality.heading')
    expect(actionsTemplate).toContain('class="care-feedback__personality"')
    expect(actionsTemplate).toContain('shouldShowFeedbackPersonalityReveal')
    expect(actionsTemplate).toContain('shouldShowFeedbackPersonalityBonus')
  })

  it('formats forming and assigned personality copy from localized messages', () => {
    vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
    const component = loadScriptSetupComponent<PetSidePanelSetup>('components/PetSidePanel.vue')

    const forming = component.setup(createSidePanelProps({
      personality: createPersonality({
        earlyActionCounts: {
          feed: 1,
          play: 0,
          sleep: 0,
          wash: 0,
        },
      }),
    }), {
      emit: vi.fn(),
      expose: vi.fn(),
    })

    expect(forming.personalityProgress.value).toEqual({
      current: 1,
      required: 3,
      remaining: 2,
    })
    expect(forming.personalityName.value).toBe('성향 형성 중')
    expect(forming.personalityDetail.value).toBe('초반 돌봄 2회를 더 완료하면 성격이 정해져요.')

    const assigned = component.setup(createSidePanelProps({
      personality: createPersonality({
        personality: 'playful',
        earlyActionCounts: {
          feed: 0,
          play: 3,
          sleep: 0,
          wash: 0,
        },
        assignedAt: 1000,
      }),
    }), {
      emit: vi.fn(),
      expose: vi.fn(),
    })

    expect(assigned.personalityName.value).toBe('활발형')
    expect(assigned.personalityBonusText.value).toContain('놀아주기')
  })

  it('formats personality reveal and bonus feedback', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

    const setup = component.setup(createPetActionsProps(), {
      emit: vi.fn(),
      expose: vi.fn(),
    })

    expect(setup.shouldShowFeedbackPersonalityReveal.value).toBe(true)
    expect(setup.shouldShowFeedbackPersonalityBonus.value).toBe(true)
    expect(setup.feedbackPersonalityName.value).toBe('푸근형')
    expect(setup.feedbackPersonalityBonusText.value).toContain('+1')
  })

  it('keeps personality copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const personality = I18N_MESSAGES[locale].personality

      expect(personality.heading.length).toBeGreaterThan(0)
      expect(personality.formingName.length).toBeGreaterThan(0)
      expect(personality.formingDetail).toContain('{remaining}')
      expect(personality.progress).toContain('{current}')
      expect(personality.progress).toContain('{required}')
      expect(personality.revealLabel.length).toBeGreaterThan(0)
      expect(personality.bonusLabel.length).toBeGreaterThan(0)
      expect(personality.bonusApplied).toContain('{name}')
      expect(personality.bonusApplied).toContain('{bonus}')

      for (const personalityId of ['calm', 'hungry', 'playful', 'sleepy', 'neat'] as const) {
        expect(personality.personalities[personalityId].name.length).toBeGreaterThan(0)
        expect(personality.personalities[personalityId].detail.length).toBeGreaterThan(0)
        expect(personality.personalities[personalityId].bonus.length).toBeGreaterThan(0)
      }
    }
  })

  it('defines compact responsive personality styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.pet-personality')
    expect(css).toContain('.care-feedback__personality')
    expect(css).toMatch(/\.pet-personality strong\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.care-feedback__personality strong\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.care-feedback__personality\s*\{[^}]*grid-template-columns: 1fr;/,
    )
  })
})
