import type { PetStatus } from '~/types/pet'

export type HabitatBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export type HabitatMotion = {
  intervalMs: number
  speedMs: number
}

export const DEFAULT_HABITAT_POSITION = {
  x: 52,
  y: 58,
} as const

export const STATUS_HABITAT_BOUNDS: Record<PetStatus, HabitatBounds> = {
  fine: {
    minX: 18,
    maxX: 82,
    minY: 34,
    maxY: 67,
  },
  happy: {
    minX: 18,
    maxX: 82,
    minY: 34,
    maxY: 67,
  },
  hungry: {
    minX: 16,
    maxX: 84,
    minY: 48,
    maxY: 70,
  },
  sleepy: {
    minX: 64,
    maxX: 82,
    minY: 58,
    maxY: 72,
  },
  bored: {
    minX: 30,
    maxX: 70,
    minY: 48,
    maxY: 68,
  },
  dirty: {
    minX: 18,
    maxX: 40,
    minY: 58,
    maxY: 72,
  },
  excited: {
    minX: 12,
    maxX: 88,
    minY: 28,
    maxY: 64,
  },
}

export const STATUS_HABITAT_MOTION: Record<PetStatus, HabitatMotion> = {
  fine: {
    intervalMs: 2800,
    speedMs: 1200,
  },
  happy: {
    intervalMs: 2800,
    speedMs: 1200,
  },
  hungry: {
    intervalMs: 1700,
    speedMs: 850,
  },
  sleepy: {
    intervalMs: 5200,
    speedMs: 1800,
  },
  bored: {
    intervalMs: 4200,
    speedMs: 1500,
  },
  dirty: {
    intervalMs: 4600,
    speedMs: 1600,
  },
  excited: {
    intervalMs: 1300,
    speedMs: 620,
  },
}
