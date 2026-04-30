import { NEED_THRESHOLDS } from '~/constants/pet'
import type { PetNeedStatus, PetStats } from '~/types/pet'

export type PetAlertSeverity = 'none' | 'warning' | 'urgent'

export type PetAlert = {
  status: PetNeedStatus
  severity: PetAlertSeverity
}

export type PetAlertInput = {
  stats: PetStats
  lastPlayedAt: number
  now: number
}

export function getPrimaryAlert(input: PetAlertInput): PetAlert {
  if (input.stats.fullness <= NEED_THRESHOLDS.hungryFullness) {
    return { status: 'hungry', severity: 'warning' }
  }

  if (input.stats.energy <= NEED_THRESHOLDS.sleepyEnergy) {
    return { status: 'sleepy', severity: 'warning' }
  }

  if (input.stats.cleanliness <= NEED_THRESHOLDS.dirtyCleanliness) {
    return { status: 'dirty', severity: 'warning' }
  }

  const idleMs = Math.max(0, input.now - input.lastPlayedAt)

  if (idleMs >= NEED_THRESHOLDS.urgentBoredAfterMs) {
    return { status: 'bored', severity: 'urgent' }
  }

  if (idleMs >= NEED_THRESHOLDS.boredAfterMs) {
    return { status: 'bored', severity: 'warning' }
  }

  return { status: 'fine', severity: 'none' }
}
