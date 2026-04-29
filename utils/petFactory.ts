import { DEFAULT_STATS } from '~/constants/pet'
import { DEFAULT_DISGUISE_TITLE_ID } from '~/constants/titles'
import { DEFAULT_THEME_ID } from '~/constants/themes'
import type { DisguiseTitleId, PetSpecies, PetState, ThemeId } from '~/types/pet'

export function createInitialPetState(
  species: PetSpecies,
  now = Date.now(),
  options: {
    disguiseTitleId?: DisguiseTitleId
    themeId?: ThemeId
  } = {},
): PetState {
  return {
    species,
    stats: { ...DEFAULT_STATS },
    disguiseTitleId: options.disguiseTitleId ?? DEFAULT_DISGUISE_TITLE_ID,
    themeId: options.themeId ?? DEFAULT_THEME_ID,
    lastUpdatedAt: now,
  }
}
