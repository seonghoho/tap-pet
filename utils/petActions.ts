import { ACTION_EFFECTS } from '~/constants/pet'
import type { PetAction, PetStats } from '~/types/pet'
import { clampStat } from '~/utils/petValidation'

export function applyPetAction(stats: PetStats, action: PetAction): PetStats {
  const effect = ACTION_EFFECTS[action]

  return {
    fullness: clampStat(stats.fullness + effect.fullness),
    mood: clampStat(stats.mood + effect.mood),
    energy: clampStat(stats.energy + effect.energy),
  }
}
