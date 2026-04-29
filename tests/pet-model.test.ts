import { describe, expect, it } from 'vitest'
import { PET_STORAGE_VERSION } from '~/constants/pet'
import { applyPetAction } from '~/utils/petActions'
import { applyOfflineDecay } from '~/utils/petDecay'
import { createInitialPetState } from '~/utils/petFactory'
import { getPetStatus } from '~/utils/petStatus'
import { getDisguiseTitleValue, getTabPresentation, getTabTitle } from '~/utils/tabPresentation'
import { parseStoredPetState, toStoredPetState } from '~/utils/petValidation'

describe('pet status model', () => {
  it('prioritizes hungry before other low stats', () => {
    expect(getPetStatus({ fullness: 10, mood: 10, energy: 10 })).toBe('hungry')
  })

  it('detects sleepy, sad, bored, excited, and happy states', () => {
    expect(getPetStatus({ fullness: 50, mood: 50, energy: 10 })).toBe('sleepy')
    expect(getPetStatus({ fullness: 50, mood: 10, energy: 50 })).toBe('sad')
    expect(getPetStatus({ fullness: 50, mood: 40, energy: 50 })).toBe('bored')
    expect(getPetStatus({ fullness: 90, mood: 90, energy: 90 })).toBe('excited')
    expect(getPetStatus({ fullness: 70, mood: 70, energy: 70 })).toBe('happy')
  })
})

describe('pet actions', () => {
  it('applies action effects and clamps stat bounds', () => {
    expect(applyPetAction({ fullness: 90, mood: 98, energy: 2 }, 'feed')).toEqual({
      fullness: 100,
      mood: 100,
      energy: 0,
    })
  })
})

describe('offline decay', () => {
  it('caps offline decay at the configured maximum', () => {
    const now = 1000 * 60 * 60 * 48

    expect(applyOfflineDecay({ fullness: 100, mood: 100, energy: 100 }, 0, now)).toEqual({
      fullness: 0,
      mood: 4,
      energy: 28,
    })
  })

  it('ignores negative elapsed time', () => {
    expect(applyOfflineDecay({ fullness: 70, mood: 70, energy: 70 }, 2000, 1000)).toEqual({
      fullness: 70,
      mood: 70,
      energy: 70,
    })
  })
})

describe('tab presentation', () => {
  it('appends compact status signals to disguise titles', () => {
    expect(getTabTitle('Project Dashboard', 'happy')).toBe('Project Dashboard')
    expect(getTabTitle('Project Dashboard', 'hungry')).toBe('Project Dashboard *')
  })

  it('localizes disguise title values', () => {
    expect(getDisguiseTitleValue('inbox', 'ko')).toBe('받은 편지함')
    expect(getDisguiseTitleValue('meeting-notes', 'ja')).toBe('会議メモ')
    expect(
      getTabPresentation({
        disguiseTitleId: 'analytics',
        status: 'excited',
        locale: 'ko',
      }).title,
    ).toBe('분석 +')
  })
})

describe('stored pet state parsing', () => {
  it('round-trips a valid stored state', () => {
    const initialState = createInitialPetState('cat', 1000)
    const stored = toStoredPetState(initialState, PET_STORAGE_VERSION)

    expect(parseStoredPetState(stored)).toEqual(initialState)
  })

  it('rejects invalid versions and invalid species', () => {
    expect(parseStoredPetState({ version: 999, species: 'cat' })).toBeNull()
    expect(parseStoredPetState({ version: PET_STORAGE_VERSION, species: 'bird' })).toBeNull()
  })
})
