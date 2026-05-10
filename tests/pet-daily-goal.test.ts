import { describe, expect, it } from 'vitest'
import {
  DAILY_GOAL_REWARD_AFFINITY_EXP,
  DAILY_GOAL_REWARD_EXP,
  PET_STORAGE_VERSION,
} from '~/constants/pet'
import { createInitialPetState } from '~/utils/petFactory'
import {
  claimDailyGoalReward,
  createDailyGoal,
  getLocalDateKey,
  progressDailyGoal,
  resolveDailyGoalForToday,
} from '~/utils/petDailyGoal'
import { parseStoredPetState, toStoredPetState } from '~/utils/petValidation'

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
