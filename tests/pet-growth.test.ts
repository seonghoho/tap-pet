import { describe, expect, it } from 'vitest'
import { applyCareAction } from '~/utils/petCare'
import {
  getAffinityLevel,
  getAffinityProgress,
  getExperienceMultiplier,
  getLevelProgress,
  normalizeGrowth,
} from '~/utils/petGrowth'

describe('pet growth', () => {
  it('normalizes invalid growth values', () => {
    expect(normalizeGrowth({ level: -2, exp: Number.NaN, affinityExp: -10 })).toEqual({
      level: 1,
      exp: 0,
      affinityExp: 0,
    })
  })

  it('floors fractional persisted growth values', () => {
    expect(normalizeGrowth({ level: 2.9, exp: 99.6, affinityExp: 79.6 })).toEqual({
      level: 2,
      exp: 99,
      affinityExp: 79,
    })
  })

  it('calculates level progress from level and exp', () => {
    expect(getLevelProgress({ level: 1, exp: 50, affinityExp: 0 })).toEqual({
      current: 50,
      required: 100,
      percent: 50,
    })
  })

  it('calculates affinity level and progress from cumulative affinity exp', () => {
    expect(getAffinityLevel(0)).toBe(1)
    expect(getAffinityLevel(80)).toBe(2)
    expect(getAffinityProgress(40)).toEqual({
      level: 1,
      current: 40,
      required: 80,
      percent: 50,
    })
    expect(getAffinityLevel(79.6)).toBe(1)
    expect(getAffinityProgress(79.6)).toEqual({
      level: 1,
      current: 79,
      required: 80,
      percent: 99,
    })
  })

  it('caps the affinity experience multiplier', () => {
    expect(getExperienceMultiplier(1)).toBe(1.1)
    expect(getExperienceMultiplier(99)).toBe(1.5)
  })
})

describe('care action result', () => {
  it('applies delayed action effects, exp, and affinity gain', () => {
    const result = applyCareAction({
      stats: { fullness: 70, energy: 70, cleanliness: 70 },
      growth: { level: 1, exp: 0, affinityExp: 0 },
      action: 'play',
    })

    expect(result.stats).toEqual({
      fullness: 62,
      energy: 56,
      cleanliness: 62,
    })
    expect(result.growth.exp).toBe(20)
    expect(result.growth.affinityExp).toBe(14)
    expect(result.rewardMultiplier).toBe(1.1)
    expect(result.wasReduced).toBe(false)
  })

  it('reduces reward for overcare actions', () => {
    const result = applyCareAction({
      stats: { fullness: 95, energy: 70, cleanliness: 70 },
      growth: { level: 1, exp: 0, affinityExp: 0 },
      action: 'feed',
    })

    expect(result.stats.fullness).toBe(100)
    expect(result.growth.exp).toBe(5)
    expect(result.wasReduced).toBe(true)
  })
})
