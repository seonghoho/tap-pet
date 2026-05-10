import {
  DEFAULT_GROWTH,
  DEFAULT_PET_NAMES,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
} from '~/constants/pet'
import type { PetSettings, PetSpecies, PetState } from '~/types/pet'
import { createPetActionLimit } from '~/utils/petActionLimit'
import { createDailyGoal } from '~/utils/petDailyGoal'

export function createInitialPetState(
  species: PetSpecies,
  now = Date.now(),
  options: {
    name?: string
    settings?: Partial<PetSettings>
  } = {},
): PetState {
  return {
    species,
    name: options.name?.trim() || DEFAULT_PET_NAMES[species],
    stats: { ...DEFAULT_STATS },
    growth: { ...DEFAULT_GROWTH },
    settings: {
      ...DEFAULT_SETTINGS,
      ...options.settings,
    },
    actionLimit: createPetActionLimit(now),
    dailyGoal: createDailyGoal(now),
    lastUpdatedAt: now,
    lastPlayedAt: now,
  }
}
