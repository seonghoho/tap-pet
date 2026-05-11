import { describe, expect, it } from 'vitest'
import {
  getAvailableLevelUnlocks,
  getLevelUnlocksForTransition,
  getNextLevelUnlock,
} from '~/utils/petLevelUnlocks'

describe('pet level unlocks', () => {
  it('keeps early visible rewards in a small deterministic level table', () => {
    expect(getAvailableLevelUnlocks(1)).toEqual([])
    expect(getAvailableLevelUnlocks(2).map((unlock) => unlock.id)).toEqual([
      'title-focus-signal',
    ])
    expect(getAvailableLevelUnlocks(3).map((unlock) => unlock.id)).toEqual([
      'title-focus-signal',
      'favicon-bright-accent',
    ])
    expect(getAvailableLevelUnlocks(4).map((unlock) => unlock.id)).toEqual([
      'title-focus-signal',
      'favicon-bright-accent',
      'habitat-reaction-spark',
    ])
  })

  it('returns the next locked reward by current level', () => {
    expect(getNextLevelUnlock(1)?.id).toBe('title-focus-signal')
    expect(getNextLevelUnlock(2)?.id).toBe('favicon-bright-accent')
    expect(getNextLevelUnlock(3)?.id).toBe('habitat-reaction-spark')
    expect(getNextLevelUnlock(4)).toBeNull()
  })

  it('finds newly unlocked rewards across a level transition', () => {
    expect(getLevelUnlocksForTransition(1, 1)).toEqual([])
    expect(getLevelUnlocksForTransition(1, 3).map((unlock) => unlock.id)).toEqual([
      'title-focus-signal',
      'favicon-bright-accent',
    ])
    expect(getLevelUnlocksForTransition(2, 4).map((unlock) => unlock.id)).toEqual([
      'favicon-bright-accent',
      'habitat-reaction-spark',
    ])
  })

  it('normalizes invalid level inputs safely', () => {
    expect(getAvailableLevelUnlocks(Number.NaN)).toEqual([])
    expect(getNextLevelUnlock(-10)?.id).toBe('title-focus-signal')
    expect(getLevelUnlocksForTransition(3.8, 4.2).map((unlock) => unlock.id)).toEqual([
      'habitat-reaction-spark',
    ])
  })
})
