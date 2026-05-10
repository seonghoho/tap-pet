import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLocalPetStorage } from '~/composables/useLocalPetStorage'
import { PET_STORAGE_KEY, PET_STORAGE_VERSION } from '~/constants/pet'

class MemoryStorage implements Storage {
  private readonly entries = new Map<string, string>()

  get length(): number {
    return this.entries.size
  }

  clear(): void {
    this.entries.clear()
  }

  getItem(key: string): string | null {
    return this.entries.has(key) ? (this.entries.get(key) as string) : null
  }

  key(index: number): string | null {
    return Array.from(this.entries.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.entries.delete(key)
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value)
  }
}

describe('useLocalPetStorage corruption handling', () => {
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
    vi.stubGlobal('localStorage', storage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null and reports an error when the stored payload is not valid JSON', () => {
    storage.setItem(PET_STORAGE_KEY, '{not really json')

    const { loadPetState, storageError } = useLocalPetStorage()

    expect(loadPetState(1000)).toBeNull()
    expect(storageError.value).toBeTruthy()
  })

  it('returns null without flagging an error when no state has been saved', () => {
    const { loadPetState, storageError } = useLocalPetStorage()

    expect(loadPetState(1000)).toBeNull()
    expect(storageError.value).toBeNull()
  })

  it('returns null without flagging an error when the stored version is unknown', () => {
    storage.setItem(PET_STORAGE_KEY, JSON.stringify({ version: 99, species: 'cat' }))

    const { loadPetState, storageError } = useLocalPetStorage()

    expect(loadPetState(1000)).toBeNull()
    expect(storageError.value).toBeNull()
  })

  it('returns null when the stored species is not recognised', () => {
    storage.setItem(
      PET_STORAGE_KEY,
      JSON.stringify({ version: PET_STORAGE_VERSION, species: 'bird' }),
    )

    const { loadPetState, storageError } = useLocalPetStorage()

    expect(loadPetState(1000)).toBeNull()
    expect(storageError.value).toBeNull()
  })

  it('rewrites the stored payload after recovering a partial state', () => {
    storage.setItem(
      PET_STORAGE_KEY,
      JSON.stringify({
        version: PET_STORAGE_VERSION,
        species: 'cat',
        stats: { fullness: 9999, energy: -50, cleanliness: Number.NaN },
        lastUpdatedAt: 1000,
      }),
    )

    const { loadPetState } = useLocalPetStorage()
    const restored = loadPetState(2000)

    expect(restored?.stats.fullness).toBeLessThanOrEqual(100)
    expect(restored?.stats.energy).toBeGreaterThanOrEqual(0)
    expect(restored?.stats.cleanliness).toBeGreaterThanOrEqual(0)

    const persisted = storage.getItem(PET_STORAGE_KEY)
    expect(persisted).toBeTruthy()
    const parsed = JSON.parse(persisted as string)
    expect(parsed.version).toBe(PET_STORAGE_VERSION)
    expect(parsed.stats.fullness).toBeLessThanOrEqual(100)
    expect(parsed.stats.cleanliness).toBeGreaterThanOrEqual(0)
  })

  it('exposes the previous update timestamp when loading with metadata', () => {
    storage.setItem(
      PET_STORAGE_KEY,
      JSON.stringify({
        version: PET_STORAGE_VERSION,
        species: 'cat',
        stats: { fullness: 80, energy: 80, cleanliness: 80 },
        lastUpdatedAt: 1000,
        lastPlayedAt: 1000,
      }),
    )

    const { loadPetStateWithMeta } = useLocalPetStorage()
    const loaded = loadPetStateWithMeta(1000 + 1000 * 60 * 60)

    expect(loaded.state?.lastUpdatedAt).toBe(1000 + 1000 * 60 * 60)
    expect(loaded.previousLastUpdatedAt).toBe(1000)
  })
})
