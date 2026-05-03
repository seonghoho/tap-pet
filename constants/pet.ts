import type { PetAction, PetGrowth, PetSettings, PetStats } from '~/types/pet'

export const PET_STORAGE_KEY = 'tab-pet:state'
export const PET_STORAGE_VERSION = 2

export const STAT_MIN = 0
export const STAT_MAX = 100

export const DEFAULT_PET_NAMES = {
  cat: '몽이',
  dog: '초코',
} as const

export const DEFAULT_STATS: PetStats = {
  fullness: 70,
  energy: 70,
  cleanliness: 70,
}

export const DEFAULT_GROWTH: PetGrowth = {
  level: 1,
  exp: 0,
  affinityExp: 0,
}

export const DEFAULT_SETTINGS: PetSettings = {
  titleMode: 'status',
  titleVisibility: 'inactive-only',
  disguiseTitleId: 'project-dashboard',
  customDisguiseTitle: '',
  titleAnimationEnabled: false,
  themeId: 'system',
}

export const NEED_THRESHOLDS = {
  hungryFullness: 30,
  sleepyEnergy: 25,
  dirtyCleanliness: 30,
  boredAfterMs: 1000 * 60 * 60 * 2,
  urgentBoredAfterMs: 1000 * 60 * 60 * 5,
  excitedFullness: 85,
  excitedEnergy: 85,
  excitedCleanliness: 85,
} as const

export const ACTION_EFFECTS: Record<PetAction, PetStats> = {
  feed: {
    fullness: 28,
    energy: -3,
    cleanliness: -2,
  },
  play: {
    fullness: -8,
    energy: -14,
    cleanliness: -8,
  },
  sleep: {
    fullness: -8,
    energy: 34,
    cleanliness: -3,
  },
  wash: {
    fullness: -3,
    energy: -4,
    cleanliness: 32,
  },
}

export const BASE_ACTION_EXP: Record<PetAction, number> = {
  feed: 12,
  play: 18,
  sleep: 8,
  wash: 12,
}

export const BASE_AFFINITY_EXP: Record<PetAction, number> = {
  feed: 2,
  play: 14,
  sleep: 1,
  wash: 3,
}

export const ACTION_COOLDOWN_MS: Record<PetAction, number> = {
  feed: 4000,
  play: 5000,
  sleep: 5000,
  wash: 4000,
}

export const OVERCARE_THRESHOLD = 90
export const OVERCARE_REWARD_MULTIPLIER = 0.35

export const LEVEL_EXP_BASE = 100
export const LEVEL_EXP_GROWTH = 35
export const AFFINITY_EXP_BASE = 80
export const AFFINITY_EXP_GROWTH = 30
export const AFFINITY_EXP_BONUS_PER_LEVEL = 0.1
export const MAX_AFFINITY_EXP_BONUS = 1.5

export const DECAY_PER_HOUR: PetStats = {
  fullness: -5,
  energy: -3,
  cleanliness: -4,
}

export const MAX_OFFLINE_DECAY_HOURS = 24
