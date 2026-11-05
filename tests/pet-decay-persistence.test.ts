import { describe, expect, it } from 'vitest'
import { createInitialPetState } from '~/utils/petFactory'
import { applyOfflineDecayWithCarry } from '~/utils/petDecay'
import { loadPet, serializePet } from '~/extension/src/petCore'

const HOUR = 60 * 60 * 1000

describe('decay survives frequent refreshes', () => {
  it('keeps the fraction rounding drops', () => {
    const { stats, carry } = applyOfflineDecayWithCarry({ fullness: 70, energy: 70, cleanliness: 70 }, 0, 5 * 60 * 1000)

    expect(stats.fullness).toBe(70)
    expect(carry.fullness).toBeLessThan(0)
  })

  it('extension pet still gets hungry when only looked at every 5 minutes', () => {
    const start = 1_000_000
    const stored = serializePet(createInitialPetState('cat', start))
    const initial = loadPet(stored, start)!.stats.fullness

    // The background alarm reads every 5 minutes but no longer writes back.
    let pet = loadPet(stored, start)
    for (let t = start; t <= start + 3 * HOUR; t += 5 * 60 * 1000) pet = loadPet(stored, t)

    expect(pet!.stats.fullness).toBeLessThan(initial)
  })
})
