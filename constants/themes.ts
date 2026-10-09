import type { PetTheme, ThemeId } from '~/types/pet'

export const DEFAULT_THEME_ID: ThemeId = 'system'

// Warm paper tones instead of cool blue-grey; one coral accent shared with the favicon badge.
const LIGHT_THEME_COLORS: PetTheme['colors'] = {
  background: '#f5f1ea',
  surface: '#fffdf9',
  surfaceStrong: '#efe9df',
  border: '#e6ded2',
  text: '#2a2420',
  muted: '#7a7068',
  accent: '#ff6b4a',
  accentText: '#ffffff',
  warning: '#d9822b',
  success: '#3e9b6e',
  statFillStart: '#f4a861',
  statFillEnd: '#f4a861',
  petBase: '#f6c08a',
  petContrast: '#3b2f2a',
}

// Room light per mood: the pet keeps its own colors, the room around it shifts.
const LIGHT_STATUS_COLORS: PetTheme['statusColors'] = {
  fine: '#f7e7cf',
  happy: '#f7e7cf',
  excited: '#ffe4b8',
  hungry: '#fbe0cc',
  sleepy: '#dfe3f1',
  dirty: '#e9e3d2',
  bored: '#ece6dd',
}

const DARK_THEME_COLORS: PetTheme['colors'] = {
  background: '#191614',
  surface: '#221e1b',
  surfaceStrong: '#2d2824',
  border: '#3a332d',
  text: '#f3ede6',
  muted: '#a3998f',
  accent: '#ff7a5c',
  accentText: '#1d1512',
  warning: '#eb9a4b',
  success: '#5cbf8f',
  statFillStart: '#f4a861',
  statFillEnd: '#f4a861',
  petBase: '#f6c08a',
  petContrast: '#3b2f2a',
}

const DARK_STATUS_COLORS: PetTheme['statusColors'] = {
  fine: '#3a3029',
  happy: '#3a3029',
  excited: '#46372a',
  hungry: '#45322a',
  sleepy: '#2b2d3c',
  dirty: '#38342b',
  bored: '#33302c',
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
    description: 'Warm paper tones.',
    premium: false,
    colors: { ...LIGHT_THEME_COLORS },
    statusColors: { ...LIGHT_STATUS_COLORS },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Warm dark room.',
    premium: false,
    colors: DARK_THEME_COLORS,
    statusColors: DARK_STATUS_COLORS,
  },
]
