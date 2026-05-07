import type { Ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ACTION_LIMIT_AD_REWARD_USES,
  ACTION_LIMIT_BASE_USES,
  ACTION_LIMIT_REWARD_FEEDBACK_TTL_MS,
  ACTION_LIMIT_WINDOW_MS,
  ACTION_REACTION_HOLD_MS,
  PET_STORAGE_VERSION,
} from '~/constants/pet'
import { usePetStore } from '~/composables/usePetStore'
import { applyPetAction } from '~/utils/petActions'
import { applyOfflineDecay } from '~/utils/petDecay'
import { createInitialPetState } from '~/utils/petFactory'
import { getPetStatus } from '~/utils/petStatus'
import { getDisguiseTitleValue, getTabPresentation, getTabTitle } from '~/utils/tabPresentation'
import { parseStoredPetState, toStoredPetState } from '~/utils/petValidation'
import type { PetSettings, PetState, ThemeId } from '~/types/pet'

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

describe('pet status model', () => {
  it('prioritizes the most severe need', () => {
    expect(getPetStatus({ fullness: 10, energy: 80, cleanliness: 80 }, 0, 0)).toBe('hungry')
    expect(getPetStatus({ fullness: 80, energy: 10, cleanliness: 80 }, 0, 0)).toBe('sleepy')
    expect(getPetStatus({ fullness: 80, energy: 80, cleanliness: 10 }, 0, 0)).toBe('dirty')
  })

  it('detects bored from last played time', () => {
    const now = 1000 * 60 * 60 * 3

    expect(getPetStatus({ fullness: 80, energy: 80, cleanliness: 80 }, 0, now)).toBe('bored')
  })

  it('detects excited and happy display states', () => {
    expect(getPetStatus({ fullness: 90, energy: 90, cleanliness: 90 }, Date.now(), Date.now())).toBe('excited')
    expect(getPetStatus({ fullness: 70, energy: 70, cleanliness: 70 }, Date.now(), Date.now())).toBe('happy')
  })
})

describe('pet actions', () => {
  it('applies action effects and clamps stat bounds', () => {
    expect(
      applyPetAction(
        { fullness: 90, energy: 2, cleanliness: 99 },
        'feed',
        { level: 1, exp: 0, affinityExp: 0 },
      ),
    ).toEqual({
      fullness: 100,
      energy: 0,
      cleanliness: 97,
      })
  })

  it('holds care reaction animations for four seconds', () => {
    expect(ACTION_REACTION_HOLD_MS).toBe(4000)
  })
})

describe('pet store', () => {
  const savedStates: PetState[] = []
  const createScheduledStore = (callbacks: Array<() => void>) =>
    usePetStore({
      scheduleAction: (callback) => {
        callbacks.push(callback)
      },
    })

  beforeEach(() => {
    nuxtState.clear()
    savedStates.length = 0
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocalPetStorage', () => ({
      storageError: { value: null },
      loadPetState: () => null,
      savePetState: (state: PetState) => {
        savedStates.push(state)
      },
      clearPetState: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('keeps draft settings before initialization and commits settings after initialization', () => {
    const store = usePetStore()

    store.updatePetSettings({
      disguiseTitleId: 'analytics',
      themeId: 'dark',
      titleVisibility: 'always',
    })
    store.initializePet('cat')

    expect(store.petState.value?.settings).toMatchObject({
      disguiseTitleId: 'analytics',
      themeId: 'dark',
      titleVisibility: 'always',
    })
    expect(store.draftDisguiseTitleId.value).toBe('analytics')
    expect(store.draftThemeId.value).toBe('dark')

    store.updatePetSettings({
      disguiseTitleId: 'invalid-title',
      themeId: 'invalid-theme' as ThemeId,
    } as unknown as Partial<PetSettings>)
    expect(store.petState.value?.settings).toMatchObject({
      disguiseTitleId: 'analytics',
      themeId: 'dark',
    })

    store.setTheme('light')
    expect(store.petState.value?.settings.themeId).toBe('light')
    expect(savedStates.at(-1)?.settings.themeId).toBe('light')
  })

  it('trims pet names and ignores empty names', () => {
    const store = usePetStore()

    store.initializePet('dog')
    store.updatePetName('  Berry  ')

    expect(store.petState.value?.name).toBe('Berry')

    store.updatePetName('   ')
    expect(store.petState.value?.name).toBe('Berry')
  })

  it('applies care actions after the reaction hold completes and blocks cooldown repeats', () => {
    const store = usePetStore()

    store.initializePet('cat')
    const initialState = store.petState.value

    store.performAction('play')

    vi.advanceTimersByTime(ACTION_REACTION_HOLD_MS)

    expect(store.petState.value?.stats).not.toEqual(initialState?.stats)
    expect(store.petState.value?.growth.exp).toBeGreaterThan(initialState?.growth.exp ?? 0)
    expect(store.petState.value?.lastPlayedAt).toBe(1000 + ACTION_REACTION_HOLD_MS)
    expect(store.activeReaction.value).toBeNull()
    expect(store.actionCooldowns.value.play).toBe(6000)
    expect(store.isActionCoolingDown('play')).toBe(true)

    const afterPlayState = store.petState.value
    store.performAction('play')
    expect(store.petState.value).toEqual(afterPlayState)

    vi.setSystemTime(6001)
    expect(store.isActionCoolingDown('play')).toBe(false)
  })

  it('ignores delayed actions from a previous pet generation', () => {
    const callbacks: Array<() => void> = []
    const store = createScheduledStore(callbacks)

    store.initializePet('cat')
    store.performAction('feed')
    expect(callbacks).toHaveLength(1)

    store.resetPet()
    store.initializePet('dog')
    const reinitializedState = store.petState.value

    callbacks[0]?.()

    expect(store.petState.value).toEqual(reinitializedState)
    expect(store.activeReaction.value).toBeNull()
  })

  it('does not let an older delayed action clear the latest active reaction', () => {
    const callbacks: Array<() => void> = []
    const store = createScheduledStore(callbacks)

    store.initializePet('cat')
    store.performAction('feed')
    store.performAction('play')

    expect(callbacks).toHaveLength(2)
    expect(store.activeReaction.value).toBe('play')

    callbacks[0]?.()
    expect(store.activeReaction.value).toBe('play')

    callbacks[1]?.()
    expect(store.activeReaction.value).toBeNull()
  })

  it('exposes the latest care result feedback after a delayed action resolves', () => {
    const callbacks: Array<() => void> = []
    const store = createScheduledStore(callbacks)

    store.initializePet('cat')
    store.performAction('play')

    expect(store.lastCareFeedback.value).toBeNull()

    callbacks[0]?.()

    expect(store.lastCareFeedback.value).toMatchObject({
      action: 'play',
      statChanges: {
        fullness: -8,
        energy: -14,
        cleanliness: -8,
      },
      gainedExp: 20,
      gainedAffinityExp: 14,
      didLevelUp: false,
      didAffinityLevelUp: false,
      wasReduced: false,
    })
  })

  it('does not let an older delayed action overwrite newer care feedback', () => {
    const callbacks: Array<() => void> = []
    const store = createScheduledStore(callbacks)

    store.initializePet('cat')
    store.performAction('feed')
    store.performAction('play')

    callbacks[1]?.()
    expect(store.lastCareFeedback.value?.action).toBe('play')

    callbacks[0]?.()
    expect(store.lastCareFeedback.value?.action).toBe('play')
  })

  it('limits care actions to five uses per thirty minute window', () => {
    const store = usePetStore()

    store.initializePet('cat')
    const actions = ['feed', 'play', 'sleep', 'wash', 'feed'] as const

    actions.forEach((action, index) => {
      vi.setSystemTime(1000 + index * 6000)
      store.performAction(action)
    })

    expect(store.actionLimitInfo.value.limit).toBe(ACTION_LIMIT_BASE_USES)
    expect(store.actionLimitInfo.value.remaining).toBe(0)

    const limitedState = store.petState.value
    vi.setSystemTime(1000 + actions.length * 6000)
    store.performAction('play')
    expect(store.petState.value).toEqual(limitedState)

    vi.setSystemTime(1000 + ACTION_LIMIT_WINDOW_MS + 1)
    store.performAction('play')
    expect(store.actionLimitInfo.value.remaining).toBe(ACTION_LIMIT_BASE_USES - 1)
  })

  it('grants additional care uses after a rewarded ad hook succeeds', () => {
    const store = usePetStore()

    store.initializePet('dog')

    ;(['feed', 'play', 'sleep', 'wash', 'feed'] as const).forEach((action, index) => {
      vi.setSystemTime(1000 + index * 6000)
      store.performAction(action)
    })

    expect(store.actionLimitInfo.value.remaining).toBe(0)

    vi.setSystemTime(1000 + 6000 * 5)
    store.grantRewardedAdActions()
    expect(store.actionLimitInfo.value.remaining).toBe(ACTION_LIMIT_AD_REWARD_USES)
    expect(store.actionLimitRewardFeedback.value).toEqual({
      addedUses: ACTION_LIMIT_AD_REWARD_USES,
      createdAt: 1000 + 6000 * 5,
    })

    vi.setSystemTime(1000 + 6000 * 6)
    store.performAction('play')

    expect(store.actionLimitInfo.value.remaining).toBe(ACTION_LIMIT_AD_REWARD_USES - 1)
    expect(store.actionLimitRewardFeedback.value).toBeNull()
  })

  it('hides rewarded action grant feedback after a short confirmation window', () => {
    const store = usePetStore()

    store.initializePet('dog')
    store.grantRewardedAdActions()
    expect(store.actionLimitRewardFeedback.value).toMatchObject({
      addedUses: ACTION_LIMIT_AD_REWARD_USES,
    })

    const nowState = nuxtState.get('tab-pet:now') as Ref<number> | undefined
    expect(nowState).toBeDefined()

    vi.setSystemTime(1000 + ACTION_LIMIT_REWARD_FEEDBACK_TTL_MS + 1)
    nowState!.value = Date.now()

    expect(store.actionLimitRewardFeedback.value).toBeNull()
  })

  it('clears rewarded action grant feedback when the pet is replaced or reset', () => {
    const store = usePetStore()

    store.initializePet('dog')
    store.grantRewardedAdActions()
    expect(store.actionLimitRewardFeedback.value).toMatchObject({
      addedUses: ACTION_LIMIT_AD_REWARD_USES,
    })

    store.initializePet('cat')
    expect(store.actionLimitRewardFeedback.value).toBeNull()

    store.grantRewardedAdActions()
    expect(store.actionLimitRewardFeedback.value).toMatchObject({
      addedUses: ACTION_LIMIT_AD_REWARD_USES,
    })

    store.resetPet()
    expect(store.actionLimitRewardFeedback.value).toBeNull()
  })

  it('reacts to clock changes when deriving pet status', () => {
    const store = usePetStore()

    store.initializePet('cat')
    expect(store.petStatus.value).toBe('happy')

    const nowState = nuxtState.get('tab-pet:now') as Ref<number> | undefined
    expect(nowState).toBeDefined()

    vi.setSystemTime(1000 + 1000 * 60 * 60 * 3)
    nowState!.value = Date.now()

    expect(store.petStatus.value).toBe('bored')
  })

  it('ignores invalid side panel modes', () => {
    const store = usePetStore()

    store.setSidePanelMode('settings')
    expect(store.sidePanelMode.value).toBe('settings')

    store.setSidePanelMode('invalid' as 'settings')
    expect(store.sidePanelMode.value).toBe('settings')
  })
})

describe('offline decay', () => {
  it('caps offline decay at the configured maximum', () => {
    const now = 1000 * 60 * 60 * 48

    expect(applyOfflineDecay({ fullness: 100, energy: 100, cleanliness: 100 }, 0, now)).toEqual({
      fullness: 0,
      energy: 28,
      cleanliness: 4,
    })
  })

  it('ignores negative elapsed time', () => {
    expect(applyOfflineDecay({ fullness: 70, energy: 70, cleanliness: 70 }, 2000, 1000)).toEqual({
      fullness: 70,
      energy: 70,
      cleanliness: 70,
    })
  })
})

describe('tab presentation', () => {
  it('uses localized status title messages', () => {
    const settings = createTestSettings({
      titleMode: 'status',
      titleVisibility: 'always',
    })

    expect(
      getTabTitle({
        status: 'happy',
        settings,
        locale: 'en',
        isDocumentVisible: true,
      }),
    ).toBe('Tab Pet')
    expect(
      getTabTitle({
        status: 'hungry',
        settings,
        locale: 'en',
        isDocumentVisible: true,
      }),
    ).toBe('I am hungry')
  })

  it('localizes disguise title values', () => {
    expect(getDisguiseTitleValue('inbox', 'ko')).toBe('받은 편지함')
    expect(getDisguiseTitleValue('meeting-notes', 'ja')).toBe('会議メモ')
    expect(
      getTabPresentation({
        species: 'cat',
        status: 'excited',
        settings: createTestSettings({
          titleMode: 'disguise',
          disguiseTitleId: 'analytics',
        }),
        locale: 'ko',
        isDocumentVisible: false,
      }).title,
    ).toBe('분석')
  })
})

describe('stored pet state parsing', () => {
  it('round-trips a valid stored state', () => {
    const initialState = createInitialPetState('cat', 1000)
    const stored = toStoredPetState(initialState, PET_STORAGE_VERSION)

    expect(parseStoredPetState(stored, 1000)).toEqual(initialState)
  })

  it('normalizes missing action limit data from older stored states', () => {
    const initialState = createInitialPetState('cat', 1000)
    const storedState = toStoredPetState(initialState, PET_STORAGE_VERSION) as Record<string, unknown>
    const { actionLimit: _actionLimit, ...legacyState } = storedState

    expect(parseStoredPetState(legacyState, 2000)?.actionLimit).toEqual({
      windowStartedAt: 2000,
      used: 0,
      bonusUses: 0,
    })
  })

  it('rejects invalid versions and invalid species', () => {
    expect(parseStoredPetState({ version: 999, species: 'cat' })).toBeNull()
    expect(parseStoredPetState({ version: PET_STORAGE_VERSION, species: 'bird' })).toBeNull()
  })
})

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
