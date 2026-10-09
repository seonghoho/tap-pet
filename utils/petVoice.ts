import type { PetStatus } from '~/types/pet'

export type VoicePools = Record<PetStatus | 'morning' | 'night', readonly string[]>

// Calm states get a time-of-day greeting; anything that needs care always speaks to the need.
export function pickVoiceLine(input: {
  pools: VoicePools
  status: PetStatus
  hour: number
  seed: number
}): string {
  const calm = input.status === 'fine' || input.status === 'happy'
  const pool = calm && input.hour >= 6 && input.hour < 10
    ? input.pools.morning
    : calm && (input.hour >= 22 || input.hour < 5)
      ? input.pools.night
      : input.pools[input.status]

  return pool[Math.abs(Math.floor(input.seed)) % pool.length] ?? ''
}
