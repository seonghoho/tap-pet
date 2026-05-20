import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'
import { ACTION_LIMIT_AD_REWARD_USES } from '~/constants/pet'
import type { PetSettings } from '~/types/pet'
import * as petGrowth from '~/utils/petGrowth'
import * as petLevelUnlocks from '~/utils/petLevelUnlocks'
import * as petPersonality from '~/utils/petPersonality'

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const
const requireModule = createRequire(import.meta.url)

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type PetSidePanelSetup = {
  availableLevelUnlocks: { value: ReturnType<typeof petLevelUnlocks.getAvailableLevelUnlocks> }
  nextLevelUnlock: { value: ReturnType<typeof petLevelUnlocks.getNextLevelUnlock> }
  getLevelUnlockName: (unlock: petLevelUnlocks.PetLevelUnlock) => string
  getLevelUnlockDetail: (unlock: petLevelUnlocks.PetLevelUnlock) => string
  getLevelUnlockRequirement: (unlock: petLevelUnlocks.PetLevelUnlock) => string
}

type PetActionsSetup = {
  shouldShowFeedbackLevelUnlocks: { value: boolean }
  feedbackLevelUnlocks: { value: ReturnType<typeof petLevelUnlocks.getAvailableLevelUnlocks> }
  getLevelUnlockName: (unlock: petLevelUnlocks.PetLevelUnlock) => string
  getLevelUnlockDetail: (unlock: petLevelUnlocks.PetLevelUnlock) => string
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
      dateKey: '2026-05-11',
      goalId: 'recommended-care',
      progress: 0,
      completedAt: null,
      claimedAt: null,
    },
    dailyGoalRewardFeedback: null,
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
      gainedAffinityExp: 2,
      didLevelUp: true,
      didAffinityLevelUp: false,
      wasReduced: false,
      createdAt: 1000,
      levelUnlocks: [petLevelUnlocks.getAvailableLevelUnlocks(2)[0]],
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

describe('pet level unlock UI', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('renders current and next level rewards in the side panel', () => {
    const template = readComponentTemplate('components/PetSidePanel.vue')

    expect(template).toContain('class="level-unlocks"')
    expect(template).toContain('availableLevelUnlocks')
    expect(template).toContain('nextLevelUnlock')
    expect(template).toContain('messages.levelUnlocks.heading')
    expect(template).toContain('getLevelUnlockName')
    expect(template).toContain('getLevelUnlockRequirement')
  })

  it('summarizes available and next level rewards from current level', () => {
    vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
    const component = loadScriptSetupComponent<PetSidePanelSetup>('components/PetSidePanel.vue')

    const setup = component.setup(createSidePanelProps(), {
      emit: vi.fn(),
      expose: vi.fn(),
    })

    expect(setup.availableLevelUnlocks.value.map((unlock) => unlock.id)).toEqual([
      'title-focus-signal',
      'favicon-bright-accent',
    ])
    expect(setup.nextLevelUnlock.value?.id).toBe('habitat-reaction-spark')
    expect(setup.getLevelUnlockName(setup.availableLevelUnlocks.value[0])).toBe('집중 제목 신호')
    expect(setup.getLevelUnlockRequirement(setup.nextLevelUnlock.value!)).toBe('레벨 4')
    expect(setup.getLevelUnlockDetail(setup.nextLevelUnlock.value!)).toBe(
      '돌봄 직후 방 안 반응이 조금 더 선명해져요.',
    )
  })

  it('shows newly unlocked rewards in the care feedback card', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const source = readSource('composables/usePetStore.ts')
    const appSource = readSource('app.vue')

    expect(template).toContain('class="care-feedback__unlock"')
    expect(template).toContain('shouldShowFeedbackLevelUnlocks')
    expect(template).toContain('feedbackLevelUnlocks')
    expect(template).toContain('messages.levelUnlocks.unlockedLabel')
    expect(source).toContain('getLevelUnlocksForTransition(previousState.growth.level, result.growth.level)')
    expect(appSource).toContain('level: currentPet.value?.growth.level')
  })

  it('formats feedback unlock copy from localized reward messages', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

    const setup = component.setup(createPetActionsProps(), {
      emit: vi.fn(),
      expose: vi.fn(),
    })

    expect(setup.shouldShowFeedbackLevelUnlocks.value).toBe(true)
    expect(setup.feedbackLevelUnlocks.value.map((unlock) => unlock.id)).toEqual([
      'title-focus-signal',
    ])
    expect(setup.getLevelUnlockName(setup.feedbackLevelUnlocks.value[0])).toBe('집중 제목 신호')
    expect(setup.getLevelUnlockDetail(setup.feedbackLevelUnlocks.value[0])).toBe(
      '탭 제목 상태 문구가 더 차분한 업무 신호로 보입니다.',
    )
  })

  it('keeps level unlock copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const levelUnlocks = I18N_MESSAGES[locale].levelUnlocks

      expect(levelUnlocks.heading.length).toBeGreaterThan(0)
      expect(levelUnlocks.description.length).toBeGreaterThan(0)
      expect(levelUnlocks.availableLabel.length).toBeGreaterThan(0)
      expect(levelUnlocks.nextLabel.length).toBeGreaterThan(0)
      expect(levelUnlocks.unlockedLabel.length).toBeGreaterThan(0)
      expect(levelUnlocks.levelRequirement).toContain('{level}')
      expect(levelUnlocks.allUnlocked.length).toBeGreaterThan(0)
      expect(levelUnlocks.rewards['title-focus-signal'].name.length).toBeGreaterThan(0)
      expect(levelUnlocks.rewards['favicon-bright-accent'].detail.length).toBeGreaterThan(0)
      expect(levelUnlocks.rewards['habitat-reaction-spark'].name.length).toBeGreaterThan(0)
    }
  })

  it('defines compact responsive level unlock styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.level-unlocks')
    expect(css).toContain('.level-unlock')
    expect(css).toContain('.care-feedback__unlock')
    expect(css).toMatch(/\.level-unlock strong\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.care-feedback__unlock strong\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.care-feedback__unlock\s*\{[^}]*grid-template-columns: 1fr;/,
    )
  })
})
