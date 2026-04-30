import { NEED_THRESHOLDS } from '~/constants/pet'
import type { PetNeedStatus, PetStats } from '~/types/pet'

export type PetAlert = {
  status: PetNeedStatus
  severity: number
}

export type PetAlertInput = {
  stats: PetStats
  lastPlayedAt: number
  now: number
}

const TIE_BREAK_ORDER: PetNeedStatus[] = ['hungry', 'sleepy', 'dirty', 'bored', 'fine']

export function getPrimaryAlert(input: PetAlertInput): PetAlert {
  const alerts: PetAlert[] = [
    {
      status: 'hungry',
      severity: getStatSeverity(input.stats.fullness, NEED_THRESHOLDS.hungryFullness),
    },
    {
      status: 'sleepy',
      severity: getStatSeverity(input.stats.energy, NEED_THRESHOLDS.sleepyEnergy),
    },
    {
      status: 'dirty',
      severity: getStatSeverity(input.stats.cleanliness, NEED_THRESHOLDS.dirtyCleanliness),
    },
    {
      status: 'bored',
      severity: getBoredSeverity(input.lastPlayedAt, input.now),
    },
  ]

  const activeAlerts = alerts.filter((alert) => alert.severity > 0)
  if (activeAlerts.length === 0) return { status: 'fine', severity: 0 }

  return activeAlerts.sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity

    return TIE_BREAK_ORDER.indexOf(a.status) - TIE_BREAK_ORDER.indexOf(b.status)
  })[0]
}

function getStatSeverity(value: number, threshold: number): number {
  if (value > threshold) return 0

  return Math.min(100, threshold - value)
}

function getBoredSeverity(lastPlayedAt: number, now: number): number {
  const elapsed = Math.max(0, now - lastPlayedAt)
  if (elapsed < NEED_THRESHOLDS.boredAfterMs) return 0

  const boredRange = NEED_THRESHOLDS.urgentBoredAfterMs - NEED_THRESHOLDS.boredAfterMs
  const progress = Math.min(1, (elapsed - NEED_THRESHOLDS.boredAfterMs) / boredRange)

  return Math.round(10 + progress * 90)
}
