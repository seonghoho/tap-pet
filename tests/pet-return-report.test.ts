import { describe, expect, it } from 'vitest'
import {
  PET_RETURN_REPORT_MIN_ELAPSED_MS,
  PET_RETURN_REPORT_SHORT_MAX_MS,
  PET_RETURN_REPORT_MEDIUM_MAX_MS,
  PET_RETURN_REPORT_LONG_MAX_MS,
} from '~/constants/pet'
import type { PetState } from '~/types/pet'
import { createInitialPetState } from '~/utils/petFactory'
import {
  createPetReturnReport,
  getPetReturnReportBucket,
  getPrimaryReturnReportStat,
} from '~/utils/petReturnReport'

function createState(overrides: Partial<PetState> = {}): PetState {
  return {
    ...createInitialPetState('cat', 1000, { name: '몽이' }),
    ...overrides,
  }
}

describe('pet return report', () => {
  it('does not create a report for short absence', () => {
    const now = 1000 + PET_RETURN_REPORT_MIN_ELAPSED_MS - 1
    const state = createState({ lastUpdatedAt: now })

    expect(
      createPetReturnReport({
        state,
        previousLastUpdatedAt: 1000,
        now,
        recommendedCareAction: null,
      }),
    ).toBeNull()
  })

  it.each([
    [PET_RETURN_REPORT_MIN_ELAPSED_MS, 'short'],
    [PET_RETURN_REPORT_SHORT_MAX_MS + 1, 'medium'],
    [PET_RETURN_REPORT_MEDIUM_MAX_MS + 1, 'long'],
    [PET_RETURN_REPORT_LONG_MAX_MS + 1, 'capped'],
  ] as const)('maps %s elapsed ms to %s bucket', (elapsedMs, bucket) => {
    expect(getPetReturnReportBucket(elapsedMs)).toBe(bucket)
  })

  it('selects the lowest stat as primary report evidence', () => {
    expect(getPrimaryReturnReportStat({ fullness: 20, energy: 70, cleanliness: 80 })).toBe(
      'fullness',
    )
    expect(getPrimaryReturnReportStat({ fullness: 80, energy: 20, cleanliness: 70 })).toBe(
      'energy',
    )
    expect(getPrimaryReturnReportStat({ fullness: 80, energy: 70, cleanliness: 20 })).toBe(
      'cleanliness',
    )
  })

  it('creates a deterministic report from restored state and recommendation', () => {
    const now = 1000 + PET_RETURN_REPORT_MEDIUM_MAX_MS + 1000
    const state = createState({
      stats: {
        fullness: 18,
        energy: 60,
        cleanliness: 70,
      },
      lastUpdatedAt: now,
    })

    expect(
      createPetReturnReport({
        state,
        previousLastUpdatedAt: 1000,
        now,
        recommendedCareAction: {
          action: 'feed',
          reason: 'need',
          status: 'hungry',
          statKey: 'fullness',
        },
      }),
    ).toEqual({
      id: `return-${1000}-${now}`,
      elapsedMs: now - 1000,
      bucket: 'long',
      status: 'hungry',
      primaryStat: 'fullness',
      recommendedAction: 'feed',
      createdAt: now,
    })
  })
})
