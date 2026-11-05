import { ref } from 'vue'
import { PET_STORAGE_KEY, PET_STORAGE_VERSION } from '~/constants/pet'
import type { PetState, PetStats } from '~/types/pet'
import { applyOfflineDecayWithCarry } from '~/utils/petDecay'
import { parseStoredPetState, toStoredPetState } from '~/utils/petValidation'

// A save we couldn't read is copied here before anything can overwrite it.
export const UNREADABLE_PET_STORAGE_KEY = `${PET_STORAGE_KEY}:unreadable`

type LoadedPetState = {
  state: PetState | null
  previousLastUpdatedAt: number | null
  // Fraction of decay that rounding dropped; seeds live decay so nothing is lost.
  decayCarry: PetStats | null
  // True when a save existed but could not be read (it was kept aside, not deleted).
  unreadable: boolean
}

const EMPTY: LoadedPetState = { state: null, previousLastUpdatedAt: null, decayCarry: null, unreadable: false }

export function useLocalPetStorage() {
  const storageError = ref<string | null>(null)

  function loadPetState(now = Date.now()): PetState | null {
    return loadPetStateWithMeta(now).state
  }

  // Read-only: restoring never writes. The stored lastUpdatedAt stays put until the
  // next real change, so reloading a few minutes later can't round decay away.
  function loadPetStateWithMeta(now = Date.now()): LoadedPetState {
    if (!import.meta.client) return { ...EMPTY }

    let raw: string | null = null
    try {
      storageError.value = null
      raw = localStorage.getItem(PET_STORAGE_KEY)
      if (!raw) return { ...EMPTY }

      const parsed = parseStoredPetState(JSON.parse(raw), now)
      if (!parsed) return keepUnreadable(raw)

      // Repair a partly broken save in place, keeping its own lastUpdatedAt.
      const normalized = JSON.stringify(toStoredPetState(parsed, PET_STORAGE_VERSION))
      if (normalized !== raw) localStorage.setItem(PET_STORAGE_KEY, normalized)

      const decayed = applyOfflineDecayWithCarry(parsed.stats, parsed.lastUpdatedAt, now)

      return {
        state: { ...parsed, stats: decayed.stats, lastUpdatedAt: now },
        previousLastUpdatedAt: parsed.lastUpdatedAt,
        decayCarry: decayed.carry,
        unreadable: false,
      }
    } catch (error) {
      storageError.value = getErrorMessage(error)

      return raw ? keepUnreadable(raw) : { ...EMPTY }
    }
  }

  function keepUnreadable(raw: string): LoadedPetState {
    try {
      localStorage.setItem(UNREADABLE_PET_STORAGE_KEY, raw)
    } catch {
      // Storage full or blocked: nothing more we can do without losing data.
    }

    return { ...EMPTY, unreadable: true }
  }

  function savePetState(state: PetState, now = Date.now()): void {
    if (!import.meta.client) return

    try {
      storageError.value = null
      localStorage.setItem(
        PET_STORAGE_KEY,
        JSON.stringify(
          toStoredPetState(
            {
              ...state,
              lastUpdatedAt: now,
            },
            PET_STORAGE_VERSION,
          ),
        ),
      )
    } catch (error) {
      storageError.value = getErrorMessage(error)
    }
  }

  function clearPetState(): void {
    if (!import.meta.client) return

    try {
      storageError.value = null
      localStorage.removeItem(PET_STORAGE_KEY)
    } catch (error) {
      storageError.value = getErrorMessage(error)
    }
  }

  return {
    storageError,
    loadPetState,
    loadPetStateWithMeta,
    savePetState,
    clearPetState,
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Storage is unavailable.'
}
