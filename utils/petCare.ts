import {
  ACTION_EFFECTS,
  BASE_ACTION_EXP,
  BASE_AFFINITY_EXP,
  OVERCARE_REWARD_MULTIPLIER,
  OVERCARE_THRESHOLD,
} from '~/constants/pet'
import type { PetAction, PetGrowth, PetStats } from '~/types/pet'
import {
  addAffinityExp,
  addLevelExp,
  getAffinityLevel,
  getExperienceMultiplier,
  normalizeGrowth,
} from '~/utils/petGrowth'
import { clampStat } from '~/utils/petValidation'

export type CareActionInput = {
  stats: PetStats
  growth: PetGrowth
  action: PetAction
}

export type CareActionResult = {
  stats: PetStats
  growth: PetGrowth
  gainedExp: number
  gainedAffinityExp: number
  rewardMultiplier: number
  wasReduced: boolean
}

export function applyCareAction(input: CareActionInput): CareActionResult {
  const effect = ACTION_EFFECTS[input.action]
  const stats: PetStats = {
    fullness: clampStat(input.stats.fullness + effect.fullness),
    energy: clampStat(input.stats.energy + effect.energy),
    cleanliness: clampStat(input.stats.cleanliness + effect.cleanliness),
  }
  const growth = normalizeGrowth(input.growth)
  const wasReduced = isOvercareAction(input.stats, input.action)
  const reductionMultiplier = wasReduced ? OVERCARE_REWARD_MULTIPLIER : 1
  const rewardMultiplier = getExperienceMultiplier(getAffinityLevel(growth.affinityExp))
  const gainedExp = Math.max(
    1,
    Math.round(BASE_ACTION_EXP[input.action] * rewardMultiplier * reductionMultiplier),
  )
  const gainedAffinityExp = Math.max(
    0,
    Math.round(BASE_AFFINITY_EXP[input.action] * reductionMultiplier),
  )
  const leveledGrowth = addLevelExp(growth, gainedExp)

  return {
    stats,
    growth: addAffinityExp(leveledGrowth, gainedAffinityExp),
    gainedExp,
    gainedAffinityExp,
    rewardMultiplier,
    wasReduced,
  }
}

export function isOvercareAction(stats: PetStats, action: PetAction): boolean {
  if (action === 'feed') return stats.fullness >= OVERCARE_THRESHOLD
  if (action === 'sleep') return stats.energy >= OVERCARE_THRESHOLD
  if (action === 'wash') return stats.cleanliness >= OVERCARE_THRESHOLD

  return false
}
