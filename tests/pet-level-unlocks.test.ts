import { describe, expect, it } from 'vitest'
import {
  getAvailableLevelUnlocks,
  getLevelUnlocksForTransition,
  getNextLevelUnlock,
  PET_LEVEL_UNLOCKS,
} from '~/utils/petLevelUnlocks'

const ids = (unlocks: Array<{ id: string }>) => unlocks.map((unlock) => unlock.id)

describe('pet level unlocks', () => {
  it('unlocks one visible reward per level early, then spaced room items', () => {
    expect(getAvailableLevelUnlocks(1)).toEqual([])
    expect(ids(getAvailableLevelUnlocks(2))).toEqual(['room-frame'])
    expect(ids(getAvailableLevelUnlocks(4))).toEqual(['room-frame', 'favicon-bright-accent', 'habitat-reaction-spark'])
    expect(ids(getAvailableLevelUnlocks(10))).toEqual(ids(PET_LEVEL_UNLOCKS))
  })

  it('keeps the table sorted with one reward per level', () => {
    const levels = PET_LEVEL_UNLOCKS.map((unlock) => unlock.requiredLevel)

    expect(levels).toEqual([...levels].sort((a, b) => a - b))
    expect(new Set(levels).size).toBe(levels.length)
  })

  it('returns the next locked reward by current level', () => {
    expect(getNextLevelUnlock(1)?.id).toBe('room-frame')
    expect(getNextLevelUnlock(4)?.id).toBe('room-lamp')
    expect(getNextLevelUnlock(7)?.id).toBe('room-lights')
    expect(getNextLevelUnlock(10)).toBeNull()
  })

  it('finds newly unlocked rewards across a level transition', () => {
    expect(getLevelUnlocksForTransition(1, 1)).toEqual([])
    expect(ids(getLevelUnlocksForTransition(1, 3))).toEqual(['room-frame', 'favicon-bright-accent'])
    expect(ids(getLevelUnlocksForTransition(4, 7))).toEqual(['room-lamp', 'room-plant'])
  })

  it('normalizes invalid level inputs safely', () => {
    expect(getAvailableLevelUnlocks(Number.NaN)).toEqual([])
    expect(getNextLevelUnlock(-10)?.id).toBe('room-frame')
    expect(ids(getLevelUnlocksForTransition(3.8, 4.2))).toEqual(['habitat-reaction-spark'])
  })
})
