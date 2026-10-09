import type { AppLocale } from '~/types/i18n'

export type PetSpecies = 'cat' | 'dog' | 'hedgehog' | 'rabbit' | 'penguin' | 'hamster'

export type PetOutfitId = 'party-hat' | 'ribbon' | 'scarf' | 'glasses'

export type PetNeedStatus = 'fine' | 'hungry' | 'sleepy' | 'dirty' | 'bored'
export type PetDisplayStatus = PetNeedStatus | 'happy' | 'excited'
export type PetStatus = PetDisplayStatus

export type PetAction = 'feed' | 'play' | 'sleep' | 'wash'
export type PetPersonality = 'calm' | 'hungry' | 'playful' | 'sleepy' | 'neat'
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
  | 'roadmap'
  | 'kpi-review'
  | 'sprint-board'
  | 'client-notes'

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
  careNotifications?: boolean
  outfit?: PetOutfitId | null
}

export type PetActionLimit = {
  windowStartedAt: number
  used: number
  bonusUses: number
  // Local date key of the day the one-a-day recharge was used.
  rechargedOn?: string
}

export type PetActionLimitInfo = {
  used: number
  limit: number
  remaining: number
  resetAt: number
  windowMs: number
  canRecharge: boolean
}

export type PetActionLimitRewardFeedback = {
  addedUses: number
  createdAt: number
}

export type PetPersonalityState = {
  personality: PetPersonality | null
  earlyActionCounts: Record<PetAction, number>
  assignedAt: number | null
}

export type PetPersonalityBonus = {
  personality: PetPersonality
  action: PetAction
  expBonus: number
  affinityBonus: number
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
  levelUnlocks?: readonly PetLevelUnlock[]
  personalityReveal?: {
    personality: PetPersonality
    reasonActionCounts: Record<PetAction, number>
  }
  personalityBonus?: PetPersonalityBonus
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

export type PetLevelUnlockId =
  | 'room-frame'
  | 'favicon-bright-accent'
  | 'habitat-reaction-spark'
  | 'room-lamp'
  | 'room-plant'
  | 'room-lights'

export type PetLevelUnlockCategory = 'room' | 'favicon' | 'habitat'

export type PetLevelUnlock = {
  id: PetLevelUnlockId
  requiredLevel: number
  category: PetLevelUnlockCategory
}

export type PetState = {
  species: PetSpecies
  name: string
  stats: PetStats
  growth: PetGrowth
  settings: PetSettings
  actionLimit: PetActionLimit
  dailyGoal: PetDailyGoalState
  personality: PetPersonalityState
  streak: PetStreak
  lastUpdatedAt: number
  lastPlayedAt: number
}

export type PetStreak = {
  current: number
  best: number
  lastCareDateKey: string | null
}

export type StoredPetState = PetState & {
  version: number
}

export type DisguiseTitlePreset = {
  id: DisguiseTitleId
  values: Record<AppLocale, string>
  // Part of the work-title pack; selectable once that pack is owned.
  premium?: boolean
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
