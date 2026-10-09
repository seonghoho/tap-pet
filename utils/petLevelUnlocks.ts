import type { PetLevelUnlock } from '~/types/pet'

export { type PetLevelUnlock } from '~/types/pet'

// One visible reward per step early on, then room items spaced out so there is
// always something to grow toward.
export const PET_LEVEL_UNLOCKS: PetLevelUnlock[] = [
  { id: 'room-frame', requiredLevel: 2, category: 'room' },
  { id: 'favicon-bright-accent', requiredLevel: 3, category: 'favicon' },
  { id: 'habitat-reaction-spark', requiredLevel: 4, category: 'habitat' },
  { id: 'room-lamp', requiredLevel: 5, category: 'room' },
  { id: 'room-plant', requiredLevel: 7, category: 'room' },
  { id: 'room-lights', requiredLevel: 10, category: 'room' },
]

export function getAvailableLevelUnlocks(level: number): PetLevelUnlock[] {
  const normalizedLevel = normalizeLevel(level)

  return PET_LEVEL_UNLOCKS.filter((unlock) => unlock.requiredLevel <= normalizedLevel)
}

export function getNextLevelUnlock(level: number): PetLevelUnlock | null {
  const normalizedLevel = normalizeLevel(level)

  return PET_LEVEL_UNLOCKS.find((unlock) => unlock.requiredLevel > normalizedLevel) ?? null
}

export function getLevelUnlocksForTransition(
  previousLevel: number,
  nextLevel: number,
): PetLevelUnlock[] {
  const normalizedPreviousLevel = normalizeLevel(previousLevel)
  const normalizedNextLevel = normalizeLevel(nextLevel)

  if (normalizedNextLevel <= normalizedPreviousLevel) return []

  return PET_LEVEL_UNLOCKS.filter(
    (unlock) =>
      unlock.requiredLevel > normalizedPreviousLevel &&
      unlock.requiredLevel <= normalizedNextLevel,
  )
}

function normalizeLevel(level: number): number {
  const numberLevel = Number(level)

  if (!Number.isFinite(numberLevel)) return 1

  return Math.max(1, Math.floor(numberLevel))
}
