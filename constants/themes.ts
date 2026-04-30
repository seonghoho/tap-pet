import type { PetTheme, ThemeId } from '~/types/pet'

export const DEFAULT_THEME_ID: ThemeId = 'system'

const LIGHT_THEME_COLORS: PetTheme['colors'] = {
  background: '#f6f7f9',
  surface: '#ffffff',
  surfaceStrong: '#eef1f5',
  border: '#d9dee7',
  text: '#20242c',
  muted: '#697282',
  accent: '#246bfe',
  accentText: '#ffffff',
  warning: '#b45309',
  success: '#047857',
  petBase: '#f3b15f',
  petContrast: '#2f241b',
}

const LIGHT_STATUS_COLORS: PetTheme['statusColors'] = {
  fine: '#f3b15f',
  hungry: '#eab308',
  sleepy: '#60a5fa',
  dirty: '#b45309',
  bored: '#94a3b8',
  happy: '#f3b15f',
  excited: '#22c55e',
}

const DARK_THEME_COLORS: PetTheme['colors'] = {
  background: '#14161a',
  surface: '#1f2329',
  surfaceStrong: '#2a3038',
  border: '#3a424d',
  text: '#f1f5f9',
  muted: '#a8b2c1',
  accent: '#38bdf8',
  accentText: '#07131d',
  warning: '#f59e0b',
  success: '#34d399',
  petBase: '#c084fc',
  petContrast: '#111827',
}

const DARK_STATUS_COLORS: PetTheme['statusColors'] = {
  fine: '#c084fc',
  hungry: '#facc15',
  sleepy: '#38bdf8',
  dirty: '#f59e0b',
  bored: '#64748b',
  happy: '#c084fc',
  excited: '#2dd4bf',
}

export const PET_THEMES: PetTheme[] = [
  {
    id: 'system',
    name: 'System',
    description: 'Uses your browser color scheme when available.',
    premium: false,
    colors: { ...LIGHT_THEME_COLORS },
    statusColors: { ...LIGHT_STATUS_COLORS },
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Clean workday colors with warm pet accents.',
    premium: false,
    colors: { ...LIGHT_THEME_COLORS },
    statusColors: { ...LIGHT_STATUS_COLORS },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Dark workspace with high contrast controls.',
    premium: false,
    colors: DARK_THEME_COLORS,
    statusColors: DARK_STATUS_COLORS,
  },
]
