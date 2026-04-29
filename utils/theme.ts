import { DEFAULT_THEME_ID, PET_THEMES } from '~/constants/themes'
import type { PetTheme, ThemeId } from '~/types/pet'

export function getThemeById(themeId: ThemeId): PetTheme {
  return PET_THEMES.find((theme) => theme.id === themeId) ?? getDefaultTheme()
}

export function getDefaultTheme(): PetTheme {
  const theme = PET_THEMES.find((item) => item.id === DEFAULT_THEME_ID)

  if (!theme) {
    throw new Error('Default theme is missing.')
  }

  return theme
}
