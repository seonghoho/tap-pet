import { computed, readonly } from 'vue'
import { useState } from '#app'
import type { DisguiseTitleId, PetAction, PetSpecies, PetState, ThemeId } from '~/types/pet'
import { applyPetAction } from '~/utils/petActions'
import { createInitialPetState } from '~/utils/petFactory'
import { getPetStatus } from '~/utils/petStatus'
import { isDisguiseTitleId, isPetSpecies, isThemeId } from '~/utils/petValidation'

export function usePetStore() {
  const storage = useLocalPetStorage()
  const petState = useState<PetState | null>('tab-pet:pet-state', () => null)
  const isReady = useState<boolean>('tab-pet:is-ready', () => false)
  const hasRestored = useState<boolean>('tab-pet:has-restored', () => false)

  const petStatus = computed(() => {
    if (!petState.value) return null

    return getPetStatus(petState.value.stats)
  })

  function restorePet(): void {
    if (!import.meta.client || hasRestored.value) return

    petState.value = storage.loadPetState()
    hasRestored.value = true
    isReady.value = true
  }

  function initializePet(species: PetSpecies): void {
    if (!isPetSpecies(species)) return

    commitState(createInitialPetState(species))
  }

  function performAction(action: PetAction): void {
    if (!petState.value) return

    commitState({
      ...petState.value,
      stats: applyPetAction(petState.value.stats, action),
    })
  }

  function setDisguiseTitle(disguiseTitleId: DisguiseTitleId): void {
    if (!petState.value || !isDisguiseTitleId(disguiseTitleId)) return

    commitState({
      ...petState.value,
      disguiseTitleId,
    })
  }

  function setTheme(themeId: ThemeId): void {
    if (!petState.value || !isThemeId(themeId)) return

    commitState({
      ...petState.value,
      themeId,
    })
  }

  function resetPet(): void {
    petState.value = null
    storage.clearPetState()
  }

  function commitState(nextState: PetState): void {
    const now = Date.now()
    const committedState: PetState = {
      ...nextState,
      lastUpdatedAt: now,
    }

    petState.value = committedState
    storage.savePetState(committedState, now)
  }

  return {
    petState: readonly(petState),
    isReady: readonly(isReady),
    petStatus,
    storageError: storage.storageError,
    restorePet,
    initializePet,
    performAction,
    setDisguiseTitle,
    setTheme,
    resetPet,
  }
}
