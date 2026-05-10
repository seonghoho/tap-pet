import type { Ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DAILY_GOAL_REWARD_AFFINITY_EXP,
  DAILY_GOAL_REWARD_EXP,
  PET_STORAGE_VERSION,
} from '~/constants/pet'
import { usePetStore } from '~/composables/usePetStore'
import type { PetState } from '~/types/pet'
import { createInitialPetState } from '~/utils/petFactory'
import {
  claimDailyGoalReward,
  createDailyGoal,
  getLocalDateKey,
  progressDailyGoal,
  resolveDailyGoalForToday,
} from '~/utils/petDailyGoal'
import { parseStoredPetState, toStoredPetState } from '~/utils/petValidation'

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

describe('pet daily goal model', () => {
  it('creates a recommended-care daily goal for the local day', () => {
    const now = new Date('2026-05-10T09:00:00+09:00').getTime()

    expect(createDailyGoal(now)).toEqual({
      dateKey: getLocalDateKey(now),
      goalId: 'recommended-care',
      progress: 0,
      completedAt: null,
      claimedAt: null,
    })
  })

  it('resets stale goal state on a new local date', () => {
    const today = new Date('2026-05-10T09:00:00+09:00').getTime()
    const yesterday = new Date('2026-05-09T09:00:00+09:00').getTime()

    expect(resolveDailyGoalForToday(createDailyGoal(yesterday), today)).toEqual(createDailyGoal(today))
  })

  it('completes the goal only when the recommended care goal advances', () => {
    const now = 1000
    const goal = createDailyGoal(now)

    expect(progressDailyGoal(goal, { goalId: 'recommended-care', now })).toEqual({
      ...goal,
      progress: 1,
      completedAt: now,
    })
  })

  it('claims the daily reward once', () => {
    const completedGoal = progressDailyGoal(createDailyGoal(1000), {
      goalId: 'recommended-care',
      now: 2000,
    })
    const result = claimDailyGoalReward({
      goal: completedGoal,
      growth: {
        level: 1,
        exp: 0,
        affinityExp: 0,
      },
      now: 3000,
    })

    expect(result).toEqual({
      goal: {
        ...completedGoal,
        claimedAt: 3000,
      },
      growth: {
        level: 1,
        exp: DAILY_GOAL_REWARD_EXP,
        affinityExp: DAILY_GOAL_REWARD_AFFINITY_EXP,
      },
      feedback: {
        gainedExp: DAILY_GOAL_REWARD_EXP,
        gainedAffinityExp: DAILY_GOAL_REWARD_AFFINITY_EXP,
        createdAt: 3000,
      },
    })
    expect(result).not.toBeNull()
    if (result === null) {
      throw new Error('Expected daily goal reward claim result')
    }

    expect(
      claimDailyGoalReward({
        goal: result.goal,
        growth: result.growth,
        now: 4000,
      }),
    ).toBeNull()
  })
})

describe('pet daily goal store behavior', () => {
  const savedStates: PetState[] = []

  beforeEach(() => {
    nuxtState.clear()
    savedStates.length = 0
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocalPetStorage', () => ({
      storageError: { value: null },
      loadPetState: () => null,
      loadPetStateWithMeta: () => ({
        state: null,
        previousLastUpdatedAt: null,
      }),
      savePetState: (state: PetState) => {
        savedStates.push(state)
      },
      clearPetState: vi.fn(),
    }))
  })

  it('completes and claims the daily goal after recommended care resolves', () => {
    const callbacks: Array<() => void> = []
    const store = usePetStore({
      scheduleAction: (callback) => {
        callbacks.push(callback)
      },
    })

    store.initializePet('cat')
    expect(store.petState.value?.dailyGoal.completedAt).toBeNull()

    store.performAction(store.recommendedCareAction.value!.action)
    callbacks[0]?.()

    expect(store.petState.value?.dailyGoal.completedAt).toBe(1000)

    store.claimDailyGoalReward()

    expect(store.petState.value?.dailyGoal.claimedAt).toBe(1000)
    expect(store.dailyGoalRewardFeedback.value).toMatchObject({
      gainedExp: DAILY_GOAL_REWARD_EXP,
      gainedAffinityExp: DAILY_GOAL_REWARD_AFFINITY_EXP,
    })
    expect(savedStates.at(-1)?.growth.exp).toBeGreaterThan(0)
  })

  it('exposes a fresh incomplete daily goal after the local day rolls over', () => {
    const dayOne = new Date('2026-05-10T09:00:00+09:00').getTime()
    const dayTwo = new Date('2026-05-11T09:00:00+09:00').getTime()
    vi.setSystemTime(dayOne)

    const callbacks: Array<() => void> = []
    const store = usePetStore({
      scheduleAction: (callback) => {
        callbacks.push(callback)
      },
    })

    store.initializePet('cat')
    store.performAction(store.recommendedCareAction.value!.action)
    callbacks[0]?.()
    store.claimDailyGoalReward()

    expect(store.petState.value?.dailyGoal).toEqual({
      ...createDailyGoal(dayOne),
      progress: 1,
      completedAt: dayOne,
      claimedAt: dayOne,
    })

    vi.setSystemTime(dayTwo)
    ;(nuxtState.get('tab-pet:now') as Ref<number>).value = dayTwo

    expect(store.dailyGoal.value).toEqual(createDailyGoal(dayTwo))
  })

  it('commits a fresh incomplete daily goal when claiming a stale completed goal after day rollover', () => {
    const dayOne = new Date('2026-05-10T09:00:00+09:00').getTime()
    const dayTwo = new Date('2026-05-11T09:00:00+09:00').getTime()
    vi.setSystemTime(dayOne)

    const callbacks: Array<() => void> = []
    const store = usePetStore({
      scheduleAction: (callback) => {
        callbacks.push(callback)
      },
    })

    store.initializePet('cat')
    store.performAction(store.recommendedCareAction.value!.action)
    callbacks[0]?.()

    expect(store.petState.value?.dailyGoal).toEqual({
      ...createDailyGoal(dayOne),
      progress: 1,
      completedAt: dayOne,
      claimedAt: null,
    })

    vi.setSystemTime(dayTwo)
    ;(nuxtState.get('tab-pet:now') as Ref<number>).value = dayTwo

    store.claimDailyGoalReward()

    expect(store.petState.value?.dailyGoal).toEqual(createDailyGoal(dayTwo))
    expect(savedStates.at(-1)?.dailyGoal).toEqual(createDailyGoal(dayTwo))
  })

  it('clears the return report when care starts', () => {
    const restoredAt = 1000 * 60 * 60
    const previousLastUpdatedAt = 1000
    const restoredState = createInitialPetState('cat', previousLastUpdatedAt)
    vi.setSystemTime(restoredAt)
    vi.stubGlobal('useLocalPetStorage', () => ({
      storageError: { value: null },
      loadPetState: () => restoredState,
      loadPetStateWithMeta: () => ({
        state: {
          ...restoredState,
          lastUpdatedAt: restoredAt,
        },
        previousLastUpdatedAt,
      }),
      savePetState: (state: PetState) => {
        savedStates.push(state)
      },
      clearPetState: vi.fn(),
    }))

    const callbacks: Array<() => void> = []
    const store = usePetStore({
      scheduleAction: (callback) => {
        callbacks.push(callback)
      },
    })

    store.restorePet()
    expect(store.returnReport.value).not.toBeNull()

    store.performAction(store.recommendedCareAction.value!.action)

    expect(store.returnReport.value).toBeNull()
  })
})

describe('pet daily goal storage migration', () => {
  it('stores version 3 state with a daily goal', () => {
    const state = createInitialPetState('cat', 1000)
    const stored = toStoredPetState(state, PET_STORAGE_VERSION)

    expect(stored.version).toBe(3)
    expect(stored.dailyGoal).toEqual(createDailyGoal(1000))
  })

  it('migrates version 2 stored state to include a daily goal', () => {
    const state = createInitialPetState('cat', 1000)
    const storedV2 = {
      ...toStoredPetState(state, 2),
      version: 2,
    }
    const parsed = parseStoredPetState(storedV2, 2000)

    expect(parsed?.dailyGoal).toEqual(createDailyGoal(2000))
  })
})
