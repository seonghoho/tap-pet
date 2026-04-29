import { STATUS_THRESHOLDS } from '~/constants/pet'
import type { PetStats, PetStatus } from '~/types/pet'

export function getPetStatus(stats: PetStats): PetStatus {
  if (stats.fullness <= STATUS_THRESHOLDS.hungryFullness) return 'hungry'
  if (stats.energy <= STATUS_THRESHOLDS.sleepyEnergy) return 'sleepy'
  if (stats.mood <= STATUS_THRESHOLDS.sadMood) return 'sad'
  if (stats.mood <= STATUS_THRESHOLDS.boredMood) return 'bored'

  const isExcited =
    stats.mood >= STATUS_THRESHOLDS.excitedMood &&
    stats.fullness >= STATUS_THRESHOLDS.excitedFullness &&
    stats.energy >= STATUS_THRESHOLDS.excitedEnergy

  return isExcited ? 'excited' : 'happy'
}
