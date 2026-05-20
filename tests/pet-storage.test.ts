import { describe, expect, it } from 'vitest'
import { PET_STORAGE_VERSION } from '~/constants/pet'
import { createInitialPetState } from '~/utils/petFactory'
import { parseStoredPetState, toStoredPetState } from '~/utils/petValidation'

describe('pet storage validation', () => {
  it('round-trips a valid current pet state', () => {
    const state = createInitialPetState('cat', 1000)
    const stored = toStoredPetState(state, PET_STORAGE_VERSION)

    expect(parseStoredPetState(stored, 2000)).toEqual(state)
  })

  it('creates new pets with unassigned personality state', () => {
    expect(createInitialPetState('cat', 1000).personality).toEqual({
      personality: null,
      earlyActionCounts: {
        feed: 0,
        play: 0,
        sleep: 0,
        wash: 0,
      },
      assignedAt: null,
    })
  })

  it('round-trips a valid v4 pet state with personality', () => {
    const state = {
      ...createInitialPetState('cat', 1000),
      personality: {
        personality: 'playful' as const,
        earlyActionCounts: {
          feed: 0,
          play: 3,
          sleep: 0,
          wash: 0,
        },
        assignedAt: 1200,
      },
    }
    const stored = toStoredPetState(state, PET_STORAGE_VERSION)

    expect(parseStoredPetState(stored, 2000)).toEqual(state)
  })

  it('migrates v3 pet state with default personality state', () => {
    const migrated = parseStoredPetState(
      {
        version: 3,
        species: 'dog',
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
        dailyGoal: {
          dateKey: '1970-01-01',
          goalId: 'recommended-care',
          progress: 0,
          completedAt: null,
          claimedAt: null,
        },
        lastUpdatedAt: 1000,
        lastPlayedAt: 1000,
      },
      1000,
    )

    expect(migrated?.personality).toEqual({
      personality: null,
      earlyActionCounts: {
        feed: 0,
        play: 0,
        sleep: 0,
        wash: 0,
      },
      assignedAt: null,
    })
  })

  it('normalizes invalid personality data without resetting the pet', () => {
    const parsed = parseStoredPetState(
      {
        version: PET_STORAGE_VERSION,
        species: 'cat',
        stats: {
          fullness: 50,
          energy: 60,
          cleanliness: 70,
        },
        personality: {
          personality: 'loud',
          earlyActionCounts: {
            feed: 100,
          },
          assignedAt: 'broken',
        },
        lastUpdatedAt: 1000,
        lastPlayedAt: 1000,
      },
      2000,
    )

    expect(parsed?.species).toBe('cat')
    expect(parsed?.stats).toEqual({
      fullness: 50,
      energy: 60,
      cleanliness: 70,
    })
    expect(parsed?.personality).toEqual({
      personality: null,
      earlyActionCounts: {
        feed: 0,
        play: 0,
        sleep: 0,
        wash: 0,
      },
      assignedAt: null,
    })
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

  it('round-trips a hedgehog pet state', () => {
    const state = createInitialPetState('hedgehog', 1000)
    const stored = toStoredPetState(state, PET_STORAGE_VERSION)

    expect(parseStoredPetState(stored, 2000)).toEqual(state)
    expect(state.name).toBe('밤이')
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

  it('rejects non-record inputs', () => {
    expect(parseStoredPetState(null, 1000)).toBeNull()
    expect(parseStoredPetState(undefined, 1000)).toBeNull()
    expect(parseStoredPetState('serialized', 1000)).toBeNull()
    expect(parseStoredPetState(42, 1000)).toBeNull()
    expect(parseStoredPetState([], 1000)).toBeNull()
  })

  it('rejects unknown version values', () => {
    expect(parseStoredPetState({ version: 99, species: 'cat' }, 1000)).toBeNull()
    expect(parseStoredPetState({ version: '2', species: 'cat' }, 1000)).toBeNull()
    expect(parseStoredPetState({ species: 'cat' }, 1000)).toBeNull()
  })

  it('clamps non-finite stat values to the valid range', () => {
    const parsed = parseStoredPetState(
      {
        version: PET_STORAGE_VERSION,
        species: 'cat',
        stats: { fullness: Number.NaN, energy: Number.POSITIVE_INFINITY, cleanliness: -1000 },
        lastUpdatedAt: 1000,
      },
      2000,
    )

    expect(parsed?.stats).toEqual({ fullness: 0, energy: 0, cleanliness: 0 })
  })

  it('clamps stats above the maximum', () => {
    const parsed = parseStoredPetState(
      {
        version: PET_STORAGE_VERSION,
        species: 'cat',
        stats: { fullness: 9999, energy: 9999, cleanliness: 9999 },
        lastUpdatedAt: 1000,
      },
      2000,
    )

    expect(parsed?.stats).toEqual({ fullness: 100, energy: 100, cleanliness: 100 })
  })

  it('coerces numeric strings in stats', () => {
    const parsed = parseStoredPetState(
      {
        version: PET_STORAGE_VERSION,
        species: 'cat',
        stats: { fullness: '50', energy: '60', cleanliness: '70' },
        lastUpdatedAt: 1000,
      },
      2000,
    )

    expect(parsed?.stats).toEqual({ fullness: 50, energy: 60, cleanliness: 70 })
  })

  it('falls back to defaults when stats payload is missing or wrong shape', () => {
    const missing = parseStoredPetState(
      {
        version: PET_STORAGE_VERSION,
        species: 'cat',
        lastUpdatedAt: 1000,
      },
      2000,
    )
    const wrongShape = parseStoredPetState(
      {
        version: PET_STORAGE_VERSION,
        species: 'cat',
        stats: 'broken',
        lastUpdatedAt: 1000,
      },
      2000,
    )

    expect(missing?.stats).toEqual({ fullness: 0, energy: 0, cleanliness: 70 })
    expect(wrongShape?.stats).toEqual({ fullness: 0, energy: 0, cleanliness: 70 })
  })

  it('falls back when timestamps are non-numeric', () => {
    const parsed = parseStoredPetState(
      {
        version: PET_STORAGE_VERSION,
        species: 'cat',
        lastUpdatedAt: 'not-a-date',
        lastPlayedAt: 'broken',
      },
      2000,
    )

    expect(parsed?.lastUpdatedAt).toBe(2000)
    expect(parsed?.lastPlayedAt).toBe(2000)
  })
})
