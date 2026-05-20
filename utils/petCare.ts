import {
  ACTION_EFFECTS,
  BASE_ACTION_EXP,
  BASE_AFFINITY_EXP,
  OVERCARE_REWARD_MULTIPLIER,
  OVERCARE_THRESHOLD,
} from '~/constants/pet'
import type {
  PetAction,
  PetCareRecommendation,
  PetGrowth,
  PetPersonalityBonus,
  PetStatKey,
  PetStats,
  PetStatus,
} from '~/types/pet'
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
  rewardBonus?: Pick<PetPersonalityBonus, 'expBonus' | 'affinityBonus'> | null
}

export type CareActionResult = {
  stats: PetStats
  growth: PetGrowth
  gainedExp: number
  gainedAffinityExp: number
  rewardMultiplier: number
  wasReduced: boolean
}

export type CareActionRewardPreview = Pick<
  CareActionResult,
  'gainedExp' | 'gainedAffinityExp' | 'rewardMultiplier' | 'wasReduced'
>

const STATUS_RECOMMENDATIONS: Partial<Record<PetStatus, PetCareRecommendation>> = {
  hungry: {
    action: 'feed',
    reason: 'need',
    status: 'hungry',
    statKey: 'fullness',
  },
  sleepy: {
    action: 'sleep',
    reason: 'need',
    status: 'sleepy',
    statKey: 'energy',
  },
  dirty: {
    action: 'wash',
    reason: 'need',
    status: 'dirty',
    statKey: 'cleanliness',
  },
  bored: {
    action: 'play',
    reason: 'need',
    status: 'bored',
  },
}

const STAT_RECOMMENDATION_ORDER: Array<{
  key: PetStatKey
  action: PetAction
}> = [
  {
    key: 'fullness',
    action: 'feed',
  },
  {
    key: 'energy',
    action: 'sleep',
  },
  {
    key: 'cleanliness',
    action: 'wash',
  },
]

export function applyCareAction(input: CareActionInput): CareActionResult {
  const effect = ACTION_EFFECTS[input.action]
  const stats: PetStats = {
    fullness: clampStat(input.stats.fullness + effect.fullness),
    energy: clampStat(input.stats.energy + effect.energy),
    cleanliness: clampStat(input.stats.cleanliness + effect.cleanliness),
  }
  const growth = normalizeGrowth(input.growth)
  const rewardPreview = getCareActionRewardPreview(input)
  const gainedExp = rewardPreview.gainedExp + normalizeRewardBonus(input.rewardBonus?.expBonus)
  const gainedAffinityExp =
    rewardPreview.gainedAffinityExp + normalizeRewardBonus(input.rewardBonus?.affinityBonus)
  const leveledGrowth = addLevelExp(growth, gainedExp)

  return {
    stats,
    growth: addAffinityExp(leveledGrowth, gainedAffinityExp),
    ...rewardPreview,
    gainedExp,
    gainedAffinityExp,
  }
}

export function getCareActionRewardPreview(input: CareActionInput): CareActionRewardPreview {
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

  return {
    gainedExp,
    gainedAffinityExp,
    rewardMultiplier,
    wasReduced,
  }
}

export function getRecommendedCareAction(input: {
  stats: PetStats
  status: PetStatus
}): PetCareRecommendation {
  const statusRecommendation = STATUS_RECOMMENDATIONS[input.status]
  if (statusRecommendation) return statusRecommendation

  const lowestStat = STAT_RECOMMENDATION_ORDER.reduce((lowest, current) =>
    input.stats[current.key] < input.stats[lowest.key] ? current : lowest,
  )

  return {
    action: lowestStat.action,
    reason: 'lowest-stat',
    status: input.status,
    statKey: lowestStat.key,
  }
}

export function isOvercareAction(stats: PetStats, action: PetAction): boolean {
  if (action === 'feed') return stats.fullness >= OVERCARE_THRESHOLD
  if (action === 'sleep') return stats.energy >= OVERCARE_THRESHOLD
  if (action === 'wash') return stats.cleanliness >= OVERCARE_THRESHOLD

  return false
}

function normalizeRewardBonus(value: unknown): number {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return 0

  return Math.max(0, Math.floor(numberValue))
}
