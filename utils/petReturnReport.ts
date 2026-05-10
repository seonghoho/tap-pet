import {
  PET_RETURN_REPORT_LONG_MAX_MS,
  PET_RETURN_REPORT_MEDIUM_MAX_MS,
  PET_RETURN_REPORT_MIN_ELAPSED_MS,
  PET_RETURN_REPORT_SHORT_MAX_MS,
} from '~/constants/pet'
import type {
  PetCareRecommendation,
  PetReturnReport,
  PetReturnReportBucket,
  PetStatKey,
  PetState,
  PetStats,
} from '~/types/pet'
import { getPetStatus } from '~/utils/petStatus'

export function getPetReturnReportBucket(elapsedMs: number): PetReturnReportBucket | null {
  if (!Number.isFinite(elapsedMs) || elapsedMs < PET_RETURN_REPORT_MIN_ELAPSED_MS) return null
  if (elapsedMs <= PET_RETURN_REPORT_SHORT_MAX_MS) return 'short'
  if (elapsedMs <= PET_RETURN_REPORT_MEDIUM_MAX_MS) return 'medium'
  if (elapsedMs <= PET_RETURN_REPORT_LONG_MAX_MS) return 'long'

  return 'capped'
}

export function getPrimaryReturnReportStat(stats: PetStats): PetStatKey {
  const statKeys: PetStatKey[] = ['fullness', 'energy', 'cleanliness']

  return statKeys.reduce((lowest, current) =>
    stats[current] < stats[lowest] ? current : lowest,
  )
}

export function createPetReturnReport(input: {
  state: PetState
  previousLastUpdatedAt: number
  now?: number
  recommendedCareAction?: PetCareRecommendation | null
}): PetReturnReport | null {
  const now = input.now ?? Date.now()
  const elapsedMs = Math.max(0, now - input.previousLastUpdatedAt)
  const bucket = getPetReturnReportBucket(elapsedMs)

  if (!bucket) return null

  const status =
    input.recommendedCareAction?.status ??
    getPetStatus(input.state.stats, input.state.lastPlayedAt, now)
  const recommendedAction = input.recommendedCareAction?.action

  return {
    id: `return-${input.previousLastUpdatedAt}-${now}`,
    elapsedMs,
    bucket,
    status,
    primaryStat: getPrimaryReturnReportStat(input.state.stats),
    ...(recommendedAction ? { recommendedAction } : {}),
    createdAt: now,
  }
}
