import type { Ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_STATS } from '~/constants/pet'
import { usePetStore } from '~/composables/usePetStore'
import { accumulateLiveDecay } from '~/utils/petDecay'
import type { PetState } from '~/types/pet'

const nuxtState = vi.hoisted(() => new Map<string, Ref<unknown>>())

vi.mock('#app', async () => {
  const { ref } = await vi.importActual<typeof import('vue')>('vue')

  return {
    useState: <T>(key: string, init: () => T): Ref<T> => {
      if (!nuxtState.has(key)) {
        nuxtState.set(key, ref(init()) as Ref<unknown>)
      }

      return nuxtState.get(key) as Ref<T>
    },
  }
})

const MINUTE = 1000 * 60
const HOUR = MINUTE * 60
const ZERO = { fullness: 0, energy: 0, cleanliness: 0 }

describe('accumulateLiveDecay', () => {
  it('holds sub-unit decay in the carry instead of rounding it away', () => {
    const result = accumulateLiveDecay(ZERO, MINUTE)

    expect(result.delta).toEqual(ZERO)
    expect(result.carry.fullness).toBeCloseTo(-5 / 60)
    expect(result.carry.energy).toBeCloseTo(-3 / 60)
  })

  it('releases whole units once the carry crosses them', () => {
    let carry = ZERO
    let fullness = 0

    for (let minute = 0; minute < 60; minute += 1) {
      const result = accumulateLiveDecay(carry, MINUTE)
      carry = result.carry
      fullness += result.delta.fullness
    }

    expect(fullness).toBe(-5)
    expect(Math.abs(carry.fullness)).toBeLessThan(1e-9)
  })

  it('matches the hourly offline rate for each stat', () => {
    const result = accumulateLiveDecay(ZERO, HOUR * 2)

    expect(result.delta).toEqual({ fullness: -10, energy: -6, cleanliness: -8 })
  })
})

describe('live decay in the pet store', () => {
  beforeEach(() => {
    nuxtState.clear()
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocalPetStorage', () => ({
      storageError: { value: null },
      loadPetState: () => null,
      loadPetStateWithMeta: () => ({ state: null, previousLastUpdatedAt: null }),
      savePetState: (_state: PetState) => {},
      clearPetState: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('lowers stats while the tab stays open', () => {
    const store = usePetStore()
    store.initializePet('cat')

    for (let minute = 1; minute <= 60; minute += 1) {
      store.applyLiveDecay(1000 + minute * MINUTE)
    }

    expect(store.petState.value?.stats).toEqual({
      fullness: DEFAULT_STATS.fullness - 5,
      energy: DEFAULT_STATS.energy - 3,
      cleanliness: DEFAULT_STATS.cleanliness - 4,
    })
  })

  it('eventually turns an untouched pet hungry', () => {
    const store = usePetStore()
    store.initializePet('dog')

    store.applyLiveDecay(1000 + HOUR * 9)

    expect(store.petStatus.value).toBe('hungry')
  })

  it('does nothing before a pet exists or after reset', () => {
    const store = usePetStore()

    store.applyLiveDecay(1000 + HOUR)
    expect(store.petState.value).toBeNull()

    store.initializePet('cat')
    store.resetPet()
    store.applyLiveDecay(1000 + HOUR * 2)
    expect(store.petState.value).toBeNull()
  })
})
