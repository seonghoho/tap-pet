import type { PetAction, PetStats } from '~/types/pet'

export const PET_STORAGE_KEY = 'tab-pet:state'
export const PET_STORAGE_VERSION = 1

export const STAT_MIN = 0
export const STAT_MAX = 100

export const DEFAULT_STATS: PetStats = {
  fullness: 70,
  mood: 70,
  energy: 70,
}

export const STATUS_THRESHOLDS = {
  hungryFullness: 25,
  sleepyEnergy: 20,
  sadMood: 25,
  boredMood: 45,
  excitedMood: 85,
  excitedFullness: 70,
  excitedEnergy: 50,
} as const

export const ACTION_EFFECTS: Record<PetAction, PetStats> = {
  feed: {
    fullness: 30,
    mood: 5,
    energy: -5,
  },
  play: {
    fullness: -10,
    mood: 25,
    energy: -15,
  },
  sleep: {
    fullness: -8,
    mood: 5,
    energy: 35,
  },
}

export const DECAY_PER_HOUR: PetStats = {
  fullness: -6,
  mood: -4,
  energy: -3,
}

export const MAX_OFFLINE_DECAY_HOURS = 24
