import type { AppLocale } from '~/types/i18n'

export type PetSpecies = 'cat' | 'dog'

export type PetStatus =
  | 'happy'
  | 'hungry'
  | 'sleepy'
  | 'bored'
  | 'sad'
  | 'excited'

export type PetAction = 'feed' | 'play' | 'sleep'

export type ThemeId = 'default' | 'focus' | 'night' | 'pastel'

export type DisguiseTitleId =
  | 'project-dashboard'
  | 'quarterly-report'
  | 'inbox'
  | 'analytics'
  | 'untitled-document'
  | 'meeting-notes'

export type PetStats = {
  fullness: number
  mood: number
  energy: number
}

export type PetState = {
  species: PetSpecies
  stats: PetStats
  disguiseTitleId: DisguiseTitleId
  themeId: ThemeId
  lastUpdatedAt: number
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
    petBase: string
    petContrast: string
  }
  statusColors: Record<PetStatus, string>
}
