import type { PetStreak } from '~/types/pet'
import { getLocalDateKey } from '~/utils/petDailyGoal'

export function createPetStreak(): PetStreak {
  return {
    current: 0,
    best: 0,
    lastCareDateKey: null,
  }
}

export function normalizePetStreak(value: unknown): PetStreak {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return createPetStreak()

  const record = value as Record<string, unknown>
  const current = normalizeCount(record.current)

  return {
    current,
    best: Math.max(current, normalizeCount(record.best)),
    lastCareDateKey: typeof record.lastCareDateKey === 'string' ? record.lastCareDateKey : null,
  }
}

// Counts days in a row with at least one completed care. Missing a day restarts at 1.
export function recordStreakCare(streak: PetStreak, now = Date.now()): PetStreak {
  const today = getLocalDateKey(now)
  if (streak.lastCareDateKey === today) return streak

  const current = streak.lastCareDateKey === getPreviousDateKey(now) ? streak.current + 1 : 1

  return {
    current,
    best: Math.max(streak.best, current),
    lastCareDateKey: today,
  }
}

// What to show right now: a streak is still alive until the end of the day after the last care.
export function getActiveStreak(streak: PetStreak, now = Date.now()): number {
  if (streak.lastCareDateKey === getLocalDateKey(now)) return streak.current
  if (streak.lastCareDateKey === getPreviousDateKey(now)) return streak.current

  return 0
}

export function hasCaredToday(streak: PetStreak, now = Date.now()): boolean {
  return streak.lastCareDateKey === getLocalDateKey(now)
}

function getPreviousDateKey(now: number): string {
  const date = new Date(now)
  date.setDate(date.getDate() - 1)

  return getLocalDateKey(date.getTime())
}

function normalizeCount(value: unknown): number {
  const count = Number(value)

  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
}
