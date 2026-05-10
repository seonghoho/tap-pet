import {
  DAILY_GOAL_REWARD_AFFINITY_EXP,
  DAILY_GOAL_REWARD_EXP,
} from '~/constants/pet'
import type {
  PetDailyGoalId,
  PetDailyGoalRewardFeedback,
  PetDailyGoalState,
  PetGrowth,
} from '~/types/pet'
import { addAffinityExp, addLevelExp, normalizeGrowth } from '~/utils/petGrowth'

const DAILY_GOAL_ID: PetDailyGoalId = 'recommended-care'

export function getLocalDateKey(now = Date.now()): string {
  const date = new Date(now)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function createDailyGoal(now = Date.now()): PetDailyGoalState {
  return {
    dateKey: getLocalDateKey(now),
    goalId: DAILY_GOAL_ID,
    progress: 0,
    completedAt: null,
    claimedAt: null,
  }
}

export function normalizeDailyGoalState(value: unknown, now = Date.now()): PetDailyGoalState {
  if (!isRecord(value)) return createDailyGoal(now)

  const goal: PetDailyGoalState = {
    dateKey: typeof value.dateKey === 'string' ? value.dateKey : getLocalDateKey(now),
    goalId: value.goalId === DAILY_GOAL_ID ? DAILY_GOAL_ID : DAILY_GOAL_ID,
    progress: normalizeProgress(value.progress),
    completedAt: normalizeNullableTimestamp(value.completedAt),
    claimedAt: normalizeNullableTimestamp(value.claimedAt),
  }

  return resolveDailyGoalForToday(goal, now)
}

export function resolveDailyGoalForToday(
  goal: PetDailyGoalState | null | undefined,
  now = Date.now(),
): PetDailyGoalState {
  if (!goal) return createDailyGoal(now)

  return goal.dateKey === getLocalDateKey(now) ? goal : createDailyGoal(now)
}

export function progressDailyGoal(
  goal: PetDailyGoalState,
  input: {
    goalId: PetDailyGoalId
    now?: number
  },
): PetDailyGoalState {
  const now = input.now ?? Date.now()
  const currentGoal = resolveDailyGoalForToday(goal, now)

  if (currentGoal.goalId !== input.goalId || currentGoal.completedAt !== null) {
    return currentGoal
  }

  return {
    ...currentGoal,
    progress: 1,
    completedAt: now,
  }
}

export function claimDailyGoalReward(input: {
  goal: PetDailyGoalState
  growth: PetGrowth
  now?: number
}): {
  goal: PetDailyGoalState
  growth: PetGrowth
  feedback: PetDailyGoalRewardFeedback
} | null {
  const now = input.now ?? Date.now()
  const goal = resolveDailyGoalForToday(input.goal, now)

  if (goal.completedAt === null || goal.claimedAt !== null) return null

  const growth = addAffinityExp(
    addLevelExp(normalizeGrowth(input.growth), DAILY_GOAL_REWARD_EXP),
    DAILY_GOAL_REWARD_AFFINITY_EXP,
  )

  return {
    goal: {
      ...goal,
      claimedAt: now,
    },
    growth,
    feedback: {
      gainedExp: DAILY_GOAL_REWARD_EXP,
      gainedAffinityExp: DAILY_GOAL_REWARD_AFFINITY_EXP,
      createdAt: now,
    },
  }
}

function normalizeProgress(value: unknown): number {
  const progress = Number(value)

  if (!Number.isFinite(progress)) return 0

  return Math.max(0, Math.min(1, Math.floor(progress)))
}

function normalizeNullableTimestamp(value: unknown): number | null {
  if (value === null || value === undefined) return null

  const timestamp = Number(value)

  return Number.isFinite(timestamp) ? timestamp : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
