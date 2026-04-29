import { DEFAULT_STATS } from '~/constants/pet'
import { DEFAULT_DISGUISE_TITLE_ID } from '~/constants/titles'
import { DEFAULT_THEME_ID } from '~/constants/themes'
import type { PetSpecies, PetState } from '~/types/pet'

export function createInitialPetState(species: PetSpecies, now = Date.now()): PetState {
  return {
    species,
    stats: { ...DEFAULT_STATS },
    disguiseTitleId: DEFAULT_DISGUISE_TITLE_ID,
    themeId: DEFAULT_THEME_ID,
    lastUpdatedAt: now,
  }
}
