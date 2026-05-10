import { ref } from 'vue'
import { PET_STORAGE_KEY, PET_STORAGE_VERSION } from '~/constants/pet'
import type { PetState } from '~/types/pet'
import { applyOfflineDecay } from '~/utils/petDecay'
import { parseStoredPetState, toStoredPetState } from '~/utils/petValidation'

type LoadedPetState = {
  state: PetState | null
  previousLastUpdatedAt: number | null
}

export function useLocalPetStorage() {
  const storageError = ref<string | null>(null)

  function loadPetState(now = Date.now()): PetState | null {
    return loadPetStateWithMeta(now).state
  }

  function loadPetStateWithMeta(now = Date.now()): LoadedPetState {
    if (!import.meta.client) {
      return {
        state: null,
        previousLastUpdatedAt: null,
      }
    }

    try {
      storageError.value = null
      const raw = localStorage.getItem(PET_STORAGE_KEY)
      if (!raw) {
        return {
          state: null,
          previousLastUpdatedAt: null,
        }
      }

      const parsed = parseStoredPetState(JSON.parse(raw), now)
      if (!parsed) {
        return {
          state: null,
          previousLastUpdatedAt: null,
        }
      }

      const previousLastUpdatedAt = parsed.lastUpdatedAt
      const restored: PetState = {
        ...parsed,
        stats: applyOfflineDecay(parsed.stats, parsed.lastUpdatedAt, now),
        lastUpdatedAt: now,
      }

      savePetState(restored, now)

      return {
        state: restored,
        previousLastUpdatedAt,
      }
    } catch (error) {
      storageError.value = getErrorMessage(error)

      return {
        state: null,
        previousLastUpdatedAt: null,
      }
    }
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
