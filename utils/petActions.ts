import type { PetAction, PetGrowth, PetStats } from '~/types/pet'
import { applyCareAction } from '~/utils/petCare'

export function applyPetAction(stats: PetStats, action: PetAction, growth: PetGrowth): PetStats {
  return applyCareAction({ stats, action, growth }).stats
}
