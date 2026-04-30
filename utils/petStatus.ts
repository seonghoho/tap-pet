import { NEED_THRESHOLDS } from '~/constants/pet'
import type { PetStats, PetStatus } from '~/types/pet'
import { getPrimaryAlert } from '~/utils/petAlert'

export function getPetStatus(stats: PetStats, lastPlayedAt = Date.now(), now = Date.now()): PetStatus {
  const alert = getPrimaryAlert({ stats, lastPlayedAt, now })

  if (alert.status !== 'fine') return alert.status

  const isExcited =
    stats.fullness >= NEED_THRESHOLDS.excitedFullness &&
    stats.energy >= NEED_THRESHOLDS.excitedEnergy &&
    stats.cleanliness >= NEED_THRESHOLDS.excitedCleanliness

  return isExcited ? 'excited' : 'happy'
}
