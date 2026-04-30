import { describe, expect, it } from 'vitest'
import { PET_STORAGE_VERSION } from '~/constants/pet'
import { applyPetAction } from '~/utils/petActions'
import { applyOfflineDecay } from '~/utils/petDecay'
import { createInitialPetState } from '~/utils/petFactory'
import { getPetStatus } from '~/utils/petStatus'
import { getDisguiseTitleValue, getTabPresentation, getTabTitle } from '~/utils/tabPresentation'
import { parseStoredPetState, toStoredPetState } from '~/utils/petValidation'

describe('pet status model', () => {
  it('prioritizes the most severe need', () => {
    expect(getPetStatus({ fullness: 10, energy: 80, cleanliness: 80 }, 0, 0)).toBe('hungry')
    expect(getPetStatus({ fullness: 80, energy: 10, cleanliness: 80 }, 0, 0)).toBe('sleepy')
    expect(getPetStatus({ fullness: 80, energy: 80, cleanliness: 10 }, 0, 0)).toBe('dirty')
  })

  it('detects bored from last played time', () => {
    const now = 1000 * 60 * 60 * 3

    expect(getPetStatus({ fullness: 80, energy: 80, cleanliness: 80 }, 0, now)).toBe('bored')
  })

  it('detects excited and happy display states', () => {
    expect(getPetStatus({ fullness: 90, energy: 90, cleanliness: 90 }, Date.now(), Date.now())).toBe('excited')
    expect(getPetStatus({ fullness: 70, energy: 70, cleanliness: 70 }, Date.now(), Date.now())).toBe('happy')
  })
})

describe('pet actions', () => {
  it('applies action effects and clamps stat bounds', () => {
    expect(
      applyPetAction(
        { fullness: 90, energy: 2, cleanliness: 99 },
        'feed',
        { level: 1, exp: 0, affinityExp: 0 },
      ),
    ).toEqual({
      fullness: 100,
      energy: 0,
      cleanliness: 97,
    })
  })
})

describe('offline decay', () => {
  it('caps offline decay at the configured maximum', () => {
    const now = 1000 * 60 * 60 * 48

    expect(applyOfflineDecay({ fullness: 100, energy: 100, cleanliness: 100 }, 0, now)).toEqual({
      fullness: 0,
      energy: 28,
      cleanliness: 4,
    })
  })

  it('ignores negative elapsed time', () => {
    expect(applyOfflineDecay({ fullness: 70, energy: 70, cleanliness: 70 }, 2000, 1000)).toEqual({
      fullness: 70,
      energy: 70,
      cleanliness: 70,
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
