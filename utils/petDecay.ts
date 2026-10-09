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
    energy: clampStat(stats.energy + DECAY_PER_HOUR.energy * decayHours),
    cleanliness: clampStat(stats.cleanliness + DECAY_PER_HOUR.cleanliness * decayHours),
  }
}

export type LiveDecayResult = {
  delta: PetStats
  carry: PetStats
}

// Stats are stored as whole numbers, so a one-minute tick (fullness -0.08) would round
// away to nothing. Keep the fractional part in a carry and only release whole units.
export function accumulateLiveDecay(carry: PetStats, elapsedMs: number): LiveDecayResult {
  const hours = Math.min(Math.max(0, elapsedMs) / MS_PER_HOUR, MAX_OFFLINE_DECAY_HOURS)
  const next: PetStats = {
    fullness: carry.fullness + DECAY_PER_HOUR.fullness * hours,
    energy: carry.energy + DECAY_PER_HOUR.energy * hours,
    cleanliness: carry.cleanliness + DECAY_PER_HOUR.cleanliness * hours,
  }
  const delta: PetStats = {
    fullness: wholeUnits(next.fullness),
    energy: wholeUnits(next.energy),
    cleanliness: wholeUnits(next.cleanliness),
  }

  return {
    delta,
    carry: {
      fullness: next.fullness - delta.fullness,
      energy: next.energy - delta.energy,
      cleanliness: next.cleanliness - delta.cleanliness,
    },
  }
}

// Ignore float noise so sixty one-minute ticks land exactly on the hourly rate.
function wholeUnits(value: number): number {
  return Math.trunc(Math.round(value * 1e6) / 1e6) || 0
}
