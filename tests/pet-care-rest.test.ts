import { describe, expect, it } from 'vitest'
import { CARE_REST_THRESHOLD, DEFAULT_STATS } from '~/constants/pet'
import { getRecommendedCareAction, isPetRestingFromCare } from '~/utils/petCare'

describe('care rest state', () => {
  it('stops suggesting care once every stat has headroom', () => {
    const stats = { fullness: 90, energy: CARE_REST_THRESHOLD, cleanliness: 80 }
    const recommendation = getRecommendedCareAction({ stats, status: 'happy' })

    expect(isPetRestingFromCare(recommendation, stats)).toBe(true)
  })

  it('still suggests care for a brand new pet so the first loop has a next step', () => {
    const recommendation = getRecommendedCareAction({ stats: DEFAULT_STATS, status: 'happy' })

    expect(isPetRestingFromCare(recommendation, DEFAULT_STATS)).toBe(false)
  })

  it('never rests through an actual need', () => {
    const stats = { fullness: 95, energy: 95, cleanliness: 95 }
    const recommendation = getRecommendedCareAction({ stats, status: 'bored' })

    expect(recommendation.reason).toBe('need')
    expect(isPetRestingFromCare(recommendation, stats)).toBe(false)
  })
})
