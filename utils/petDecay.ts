import { DECAY_PER_HOUR, MAX_OFFLINE_DECAY_HOURS } from '~/constants/pet'
import type { PetStats } from '~/types/pet'
import { clampStat } from '~/utils/petValidation'

const MS_PER_HOUR = 1000 * 60 * 60

export function getOfflineDecayHours(lastUpdatedAt: number, now: number): number {
  const elapsedHours = Math.max(0, (now - lastUpdatedAt) / MS_PER_HOUR)

  return Math.min(elapsedHours, MAX_OFFLINE_DECAY_HOURS)
}

export function applyOfflineDecay(
  stats: PetStats,
  lastUpdatedAt: number,
  now = Date.now(),
): PetStats {
  const decayHours = getOfflineDecayHours(lastUpdatedAt, now)

  return {
    fullness: clampStat(stats.fullness + DECAY_PER_HOUR.fullness * decayHours),
    mood: clampStat(stats.mood + DECAY_PER_HOUR.mood * decayHours),
    energy: clampStat(stats.energy + DECAY_PER_HOUR.energy * decayHours),
  }
}
