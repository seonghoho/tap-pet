import {
  AFFINITY_EXP_BASE,
  AFFINITY_EXP_BONUS_PER_LEVEL,
  AFFINITY_EXP_GROWTH,
  LEVEL_EXP_BASE,
  LEVEL_EXP_GROWTH,
  MAX_AFFINITY_EXP_BONUS,
} from '~/constants/pet'
import type { PetGrowth } from '~/types/pet'

export type ProgressInfo = {
  current: number
  required: number
  percent: number
}

export type AffinityProgressInfo = ProgressInfo & {
  level: number
}

export function getRequiredExpForLevel(level: number): number {
  const normalizedLevel = normalizePositiveInteger(level)

  return LEVEL_EXP_BASE + (normalizedLevel - 1) * LEVEL_EXP_GROWTH
}

export function getRequiredAffinityExpForLevel(level: number): number {
  const normalizedLevel = normalizePositiveInteger(level)

  return AFFINITY_EXP_BASE + (normalizedLevel - 1) * AFFINITY_EXP_GROWTH
}

export function normalizeGrowth(value: Partial<PetGrowth> | null | undefined): PetGrowth {
  return {
    level: normalizePositiveInteger(value?.level),
    exp: normalizeNonNegativeInteger(value?.exp),
    affinityExp: normalizeNonNegativeInteger(value?.affinityExp),
  }
}

export function addLevelExp(growth: PetGrowth, gainedExp: number): PetGrowth {
  const nextGrowth = normalizeGrowth(growth)
  let nextLevel = nextGrowth.level
  let nextExp = nextGrowth.exp + normalizeNonNegativeInteger(gainedExp)
  let requiredExp = getRequiredExpForLevel(nextLevel)

  while (nextExp >= requiredExp) {
    nextExp -= requiredExp
    nextLevel += 1
    requiredExp = getRequiredExpForLevel(nextLevel)
  }

  return {
    ...nextGrowth,
    level: nextLevel,
    exp: nextExp,
  }
}

export function addAffinityExp(growth: PetGrowth, gainedExp: number): PetGrowth {
  const nextGrowth = normalizeGrowth(growth)

  return {
    ...nextGrowth,
    affinityExp: nextGrowth.affinityExp + normalizeNonNegativeInteger(gainedExp),
  }
}

export function getLevelProgress(growth: PetGrowth): ProgressInfo {
  const normalizedGrowth = normalizeGrowth(growth)
  const required = getRequiredExpForLevel(normalizedGrowth.level)
  const current = Math.min(normalizedGrowth.exp, required)

  return {
    current,
    required,
    percent: getProgressPercent(current, required),
  }
}

export function getAffinityLevel(affinityExp: number): number {
  let remainingExp = normalizeNonNegativeInteger(affinityExp)
  let level = 1
  let requiredExp = getRequiredAffinityExpForLevel(level)

  while (remainingExp >= requiredExp) {
    remainingExp -= requiredExp
    level += 1
    requiredExp = getRequiredAffinityExpForLevel(level)
  }

  return level
}

export function getAffinityProgress(affinityExp: number): AffinityProgressInfo {
  let current = normalizeNonNegativeInteger(affinityExp)
  let level = 1
  let required = getRequiredAffinityExpForLevel(level)

  while (current >= required) {
    current -= required
    level += 1
    required = getRequiredAffinityExpForLevel(level)
  }

  return {
    level,
    current,
    required,
    percent: getProgressPercent(current, required),
  }
}

export function getExperienceMultiplier(affinityLevel: number): number {
  const normalizedAffinityLevel = normalizePositiveInteger(affinityLevel)

  return Math.min(
    MAX_AFFINITY_EXP_BONUS,
    1 + normalizedAffinityLevel * AFFINITY_EXP_BONUS_PER_LEVEL,
  )
}

function normalizePositiveInteger(value: unknown): number {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return 1

  return Math.max(1, Math.floor(numberValue))
}

function normalizeNonNegativeInteger(value: unknown): number {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return 0

  return Math.max(0, Math.floor(numberValue))
}

function getProgressPercent(current: number, required: number): number {
  if (required <= 0) return 0

  return Math.min(100, Math.round((current / required) * 100))
}
