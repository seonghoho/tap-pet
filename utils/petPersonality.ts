import {
  PET_PERSONALITY_ASSIGNMENT_ACTION_COUNT,
  PET_PERSONALITY_REWARD_BONUS_RATE,
} from '~/constants/pet'
import type {
  PetAction,
  PetPersonality,
  PetPersonalityBonus,
  PetPersonalityState,
} from '~/types/pet'

const PET_ACTIONS: PetAction[] = ['feed', 'play', 'sleep', 'wash']

const ACTION_PERSONALITY_MAP: Record<PetAction, Exclude<PetPersonality, 'calm'>> = {
  feed: 'hungry',
  play: 'playful',
  sleep: 'sleepy',
  wash: 'neat',
}

const PERSONALITY_ACTION_MAP: Partial<Record<PetPersonality, PetAction>> = {
  hungry: 'feed',
  playful: 'play',
  sleepy: 'sleep',
  neat: 'wash',
}

export function createPetPersonalityState(): PetPersonalityState {
  return {
    personality: null,
    earlyActionCounts: createEmptyActionCounts(),
    assignedAt: null,
  }
}

export function recordPersonalityCareAction(
  state: PetPersonalityState,
  action: PetAction,
  now = Date.now(),
): PetPersonalityState {
  const normalizedState = normalizePetPersonalityState(state, now)

  if (normalizedState.personality) return normalizedState

  const earlyActionCounts = {
    ...normalizedState.earlyActionCounts,
    [action]: normalizedState.earlyActionCounts[action] + 1,
  }
  const completedActions = getCompletedEarlyActionCount(earlyActionCounts)

  if (completedActions < PET_PERSONALITY_ASSIGNMENT_ACTION_COUNT) {
    return {
      personality: null,
      earlyActionCounts,
      assignedAt: null,
    }
  }

  return {
    personality: resolvePetPersonality(earlyActionCounts),
    earlyActionCounts,
    assignedAt: now,
  }
}

export function getPetPersonalityProgress(state: PetPersonalityState): {
  current: number
  required: number
  remaining: number
} {
  const normalizedState = normalizePetPersonalityState(state)
  const current = Math.min(
    PET_PERSONALITY_ASSIGNMENT_ACTION_COUNT,
    getCompletedEarlyActionCount(normalizedState.earlyActionCounts),
  )

  return {
    current,
    required: PET_PERSONALITY_ASSIGNMENT_ACTION_COUNT,
    remaining: Math.max(0, PET_PERSONALITY_ASSIGNMENT_ACTION_COUNT - current),
  }
}

export function getPetPersonalityBonus(input: {
  personality: PetPersonality | null
  action: PetAction
  gainedExp: number
  gainedAffinityExp: number
}): PetPersonalityBonus | null {
  if (!input.personality) return null

  const matchingAction = PERSONALITY_ACTION_MAP[input.personality]
  if (!matchingAction || matchingAction !== input.action) return null

  if (input.personality === 'sleepy') {
    return {
      personality: input.personality,
      action: input.action,
      expBonus: getBonusAmount(input.gainedExp),
      affinityBonus: 0,
    }
  }

  return {
    personality: input.personality,
    action: input.action,
    expBonus: 0,
    affinityBonus: getBonusAmount(input.gainedAffinityExp),
  }
}

export function normalizePetPersonalityState(
  value: unknown,
  now = Date.now(),
): PetPersonalityState {
  if (!isRecord(value)) return createPetPersonalityState()

  const personality = isPetPersonality(value.personality) ? value.personality : null
  if (value.personality !== null && value.personality !== undefined && !personality) {
    return createPetPersonalityState()
  }

  return {
    personality,
    earlyActionCounts: normalizeActionCounts(value.earlyActionCounts),
    assignedAt: personality ? normalizeNullableTimestamp(value.assignedAt, now) : null,
  }
}

function resolvePetPersonality(counts: Record<PetAction, number>): PetPersonality {
  const sortedActions = [...PET_ACTIONS].sort((current, next) => counts[next] - counts[current])
  const topAction = sortedActions[0]
  const nextAction = sortedActions[1]

  if (counts[topAction] > counts[nextAction]) return ACTION_PERSONALITY_MAP[topAction]

  return 'calm'
}

function createEmptyActionCounts(): Record<PetAction, number> {
  return {
    feed: 0,
    play: 0,
    sleep: 0,
    wash: 0,
  }
}

function normalizeActionCounts(value: unknown): Record<PetAction, number> {
  const counts = isRecord(value) ? value : {}

  return {
    feed: normalizeNonNegativeInteger(counts.feed),
    play: normalizeNonNegativeInteger(counts.play),
    sleep: normalizeNonNegativeInteger(counts.sleep),
    wash: normalizeNonNegativeInteger(counts.wash),
  }
}

function getCompletedEarlyActionCount(counts: Record<PetAction, number>): number {
  return PET_ACTIONS.reduce((total, action) => total + counts[action], 0)
}

function getBonusAmount(value: number): number {
  const normalizedValue = normalizeNonNegativeInteger(value)
  if (normalizedValue <= 0) return 0

  return Math.max(1, Math.round(normalizedValue * PET_PERSONALITY_REWARD_BONUS_RATE))
}

function normalizeNonNegativeInteger(value: unknown): number {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return 0

  return Math.max(0, Math.floor(numberValue))
}

function normalizeNullableTimestamp(value: unknown, fallback: number): number | null {
  if (value === null || value === undefined) return fallback

  const timestamp = Number(value)

  return Number.isFinite(timestamp) ? timestamp : fallback
}

function isPetPersonality(value: unknown): value is PetPersonality {
  return (
    value === 'calm' ||
    value === 'hungry' ||
    value === 'playful' ||
    value === 'sleepy' ||
    value === 'neat'
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
