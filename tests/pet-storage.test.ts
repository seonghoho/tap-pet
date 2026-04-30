import { describe, expect, it } from 'vitest'
import { PET_STORAGE_VERSION } from '~/constants/pet'
import { createInitialPetState } from '~/utils/petFactory'
import { parseStoredPetState, toStoredPetState } from '~/utils/petValidation'

describe('pet storage validation', () => {
  it('round-trips a valid v2 pet state', () => {
    const state = createInitialPetState('cat', 1000)
    const stored = toStoredPetState(state, PET_STORAGE_VERSION)

    expect(parseStoredPetState(stored, 2000)).toEqual(state)
  })

  it('preserves legacy root settings from a v2 pet state', () => {
    const parsed = parseStoredPetState(
      {
        version: 2,
        species: 'cat',
        stats: {
          fullness: 50,
          energy: 60,
          cleanliness: 70,
        },
        growth: {
          level: 2,
          exp: 10,
          affinityExp: 20,
        },
        disguiseTitleId: 'analytics',
        themeId: 'light',
        lastUpdatedAt: 1000,
        lastPlayedAt: 1000,
      },
      2000,
    )

    expect(parsed?.settings).toMatchObject({
      disguiseTitleId: 'analytics',
      themeId: 'light',
    })
  })

  it('migrates a v1 mood-based pet state', () => {
    const migrated = parseStoredPetState(
      {
        version: 1,
        species: 'dog',
        stats: {
          fullness: 40,
          mood: 20,
          energy: 60,
        },
        disguiseTitleId: 'inbox',
        themeId: 'night',
        lastUpdatedAt: 1000,
      },
      2000,
    )

    expect(migrated).toMatchObject({
      species: 'dog',
      name: '초코',
      stats: {
        fullness: 40,
        energy: 60,
        cleanliness: 70,
      },
      growth: {
        level: 1,
        exp: 0,
        affinityExp: 0,
      },
      settings: {
        titleMode: 'status',
        titleVisibility: 'inactive-only',
        disguiseTitleId: 'inbox',
        customDisguiseTitle: '',
        titleAnimationEnabled: false,
        themeId: 'dark',
      },
      lastUpdatedAt: 1000,
      lastPlayedAt: 1000,
    })
  })

  it('preserves valid new theme ids when migrating v1 state', () => {
    const migrated = parseStoredPetState(
      {
        version: 1,
        species: 'cat',
        stats: {
          fullness: 40,
          mood: 20,
          energy: 60,
        },
        themeId: 'light',
        lastUpdatedAt: 1000,
      },
      2000,
    )

    expect(migrated?.settings.themeId).toBe('light')
  })

  it('rejects invalid species', () => {
    expect(parseStoredPetState({ version: PET_STORAGE_VERSION, species: 'bird' }, 1000)).toBeNull()
  })
})
