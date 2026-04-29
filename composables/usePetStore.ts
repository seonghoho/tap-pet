import { computed, readonly } from 'vue'
import { useState } from '#app'
import { DEFAULT_DISGUISE_TITLE_ID } from '~/constants/titles'
import { DEFAULT_THEME_ID } from '~/constants/themes'
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
  const draftDisguiseTitleId = useState<DisguiseTitleId>(
    'tab-pet:draft-disguise-title-id',
    () => DEFAULT_DISGUISE_TITLE_ID,
  )
  const draftThemeId = useState<ThemeId>('tab-pet:draft-theme-id', () => DEFAULT_THEME_ID)

  const petStatus = computed(() => {
    if (!petState.value) return null

    return getPetStatus(petState.value.stats)
  })

  function restorePet(): void {
    if (!import.meta.client || hasRestored.value) return

    petState.value = storage.loadPetState()
    if (petState.value) {
      draftDisguiseTitleId.value = petState.value.disguiseTitleId
      draftThemeId.value = petState.value.themeId
    }
    hasRestored.value = true
    isReady.value = true
  }

  function initializePet(species: PetSpecies): void {
    if (!isPetSpecies(species)) return

    commitState(
      createInitialPetState(species, Date.now(), {
        disguiseTitleId: draftDisguiseTitleId.value,
        themeId: draftThemeId.value,
      }),
    )
  }

  function performAction(action: PetAction): void {
    if (!petState.value) return

    commitState({
      ...petState.value,
      stats: applyPetAction(petState.value.stats, action),
    })
  }

  function setDisguiseTitle(disguiseTitleId: DisguiseTitleId): void {
    if (!isDisguiseTitleId(disguiseTitleId)) return

    draftDisguiseTitleId.value = disguiseTitleId
    if (!petState.value) return

    commitState({
      ...petState.value,
      disguiseTitleId,
    })
  }

  function setTheme(themeId: ThemeId): void {
    if (!isThemeId(themeId)) return

    draftThemeId.value = themeId
    if (!petState.value) return

    commitState({
      ...petState.value,
      themeId,
    })
  }

  function resetPet(): void {
    petState.value = null
    draftDisguiseTitleId.value = DEFAULT_DISGUISE_TITLE_ID
    draftThemeId.value = DEFAULT_THEME_ID
    storage.clearPetState()
  }

  function commitState(nextState: PetState): void {
    const now = Date.now()
    const committedState: PetState = {
      ...nextState,
      lastUpdatedAt: now,
    }

    petState.value = committedState
    draftDisguiseTitleId.value = committedState.disguiseTitleId
    draftThemeId.value = committedState.themeId
    storage.savePetState(committedState, now)
  }

  return {
    petState: readonly(petState),
    draftDisguiseTitleId: readonly(draftDisguiseTitleId),
    draftThemeId: readonly(draftThemeId),
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
