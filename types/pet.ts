import type { AppLocale } from '~/types/i18n'

export type PetSpecies = 'cat' | 'dog' | 'hedgehog'

export type PetNeedStatus = 'fine' | 'hungry' | 'sleepy' | 'dirty' | 'bored'
export type PetDisplayStatus = PetNeedStatus | 'happy' | 'excited'
export type PetStatus = PetDisplayStatus

export type PetAction = 'feed' | 'play' | 'sleep' | 'wash'
export type PetStatKey = keyof PetStats
export type PetCareRecommendationReason = 'need' | 'lowest-stat'

export type PetCareRecommendation = {
  action: PetAction
  reason: PetCareRecommendationReason
  status: PetStatus
  statKey?: PetStatKey
}

export type ThemeId = 'system' | 'light' | 'dark'

export type DisguiseTitleId =
  | 'project-dashboard'
  | 'quarterly-report'
  | 'inbox'
  | 'analytics'
  | 'untitled-document'
  | 'meeting-notes'

export type TitleMode = 'status' | 'disguise'
export type TitleVisibility = 'inactive-only' | 'always'

export type PetStats = {
  fullness: number
  energy: number
  cleanliness: number
}

export type PetGrowth = {
  level: number
  exp: number
  affinityExp: number
}

export type PetSettings = {
  titleMode: TitleMode
  titleVisibility: TitleVisibility
  disguiseTitleId: DisguiseTitleId
  customDisguiseTitle: string
  titleAnimationEnabled: boolean
  themeId: ThemeId
}

export type PetActionLimit = {
  windowStartedAt: number
  used: number
  bonusUses: number
}

export type PetActionLimitInfo = {
  used: number
  limit: number
  remaining: number
  resetAt: number
  windowMs: number
}

export type PetActionLimitRewardFeedback = {
  addedUses: number
  createdAt: number
}

export type PetCareFeedback = {
  action: PetAction
  statChanges: PetStats
  gainedExp: number
  gainedAffinityExp: number
  didLevelUp: boolean
  didAffinityLevelUp: boolean
  wasReduced: boolean
  createdAt: number
}

export type PetReturnReportBucket = 'short' | 'medium' | 'long' | 'capped'

export type PetReturnReport = {
  id: string
  elapsedMs: number
  bucket: PetReturnReportBucket
  status: PetStatus
  primaryStat: PetStatKey
  recommendedAction?: PetAction
  createdAt: number
}

export type PetDailyGoalId = 'recommended-care'

export type PetDailyGoalState = {
  dateKey: string
  goalId: PetDailyGoalId
  progress: number
  completedAt: number | null
  claimedAt: number | null
}

export type PetDailyGoalRewardFeedback = {
  gainedExp: number
  gainedAffinityExp: number
  createdAt: number
}

export type PetState = {
  species: PetSpecies
  name: string
  stats: PetStats
  growth: PetGrowth
  settings: PetSettings
  actionLimit: PetActionLimit
  dailyGoal: PetDailyGoalState
  lastUpdatedAt: number
  lastPlayedAt: number
}

export type StoredPetState = PetState & {
  version: number
}

export type DisguiseTitlePreset = {
  id: DisguiseTitleId
  values: Record<AppLocale, string>
}

export type PetTheme = {
  id: ThemeId
  name: string
  description: string
  premium: boolean
  colors: {
    background: string
    surface: string
    surfaceStrong: string
    border: string
    text: string
    muted: string
    accent: string
    accentText: string
    warning: string
    success: string
    statFillStart: string
    statFillEnd: string
    petBase: string
    petContrast: string
  }
  statusColors: Record<PetStatus, string>
}
