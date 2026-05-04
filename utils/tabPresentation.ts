import { DEFAULT_SETTINGS } from '~/constants/pet'
import {
  APP_DEFAULT_TITLE,
  DEFAULT_DISGUISE_TITLE_ID,
  getDisguiseTitleLabel,
  STATUS_TITLE_MESSAGES,
} from '~/constants/titles'
import { DEFAULT_THEME_ID } from '~/constants/themes'
import { DEFAULT_LOCALE } from '~/constants/i18n'
import type { AppLocale } from '~/types/i18n'
import type { DisguiseTitleId, PetSettings, PetSpecies, PetStatus, ThemeId } from '~/types/pet'
import {
  getPetPixelPalette,
  renderPetPixelSpriteSvg,
} from '~/utils/petPixelSprite'
import { getThemeById } from '~/utils/theme'

export type TabPresentation = {
  title: string
  faviconSvg: string
}

export function getDisguiseTitleValue(
  titleId: DisguiseTitleId,
  locale: AppLocale,
  customTitle = '',
): string {
  const trimmedCustomTitle = customTitle.trim()
  if (trimmedCustomTitle) return trimmedCustomTitle

  return getDisguiseTitleLabel(titleId, locale)
}

export function getTabTitle(input: {
  status: PetStatus
  settings: PetSettings
  locale: AppLocale
  isDocumentVisible: boolean
}): string {
  if (input.settings.titleMode === 'disguise') {
    return getDisguiseTitleValue(
      input.settings.disguiseTitleId,
      input.locale,
      input.settings.customDisguiseTitle,
    )
  }

  if (input.settings.titleVisibility === 'inactive-only' && input.isDocumentVisible) {
    return APP_DEFAULT_TITLE
  }

  return STATUS_TITLE_MESSAGES[input.status]?.[input.locale] ?? APP_DEFAULT_TITLE
}

export function getTabPresentation(input: {
  species?: PetSpecies
  status?: PetStatus
  settings?: PetSettings
  locale?: AppLocale
  isDocumentVisible?: boolean
  themeId?: ThemeId
  disguiseTitleId?: DisguiseTitleId
}): TabPresentation {
  const species = input.species ?? 'cat'
  const status = input.status ?? 'happy'
  const locale = input.locale ?? DEFAULT_LOCALE
  const settings = getPresentationSettings(input)
  const themeId = input.themeId ?? settings.themeId

  return {
    title: getTabTitle({
      status,
      settings,
      locale,
      isDocumentVisible: input.isDocumentVisible ?? false,
    }),
    faviconSvg: getFaviconSvg(species, status, themeId),
  }
}

export function getFaviconSvg(
  species: PetSpecies,
  status: PetStatus,
  themeId: ThemeId,
): string {
  const theme = getThemeById(themeId)
  const baseColor = theme.statusColors[status]
  const contrast = theme.colors.petContrast
  const bgColor = theme.colors.surface

  return renderPetPixelSpriteSvg({
    species,
    status,
    backgroundColor: bgColor,
    palette: getPetPixelPalette({
      body: baseColor,
      contrast,
      accent: theme.statusColors.excited,
      dirt: theme.colors.warning,
      bubble: theme.statusColors.sleepy,
    }),
  })
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function getPresentationSettings(input: {
  settings?: PetSettings
  themeId?: ThemeId
  disguiseTitleId?: DisguiseTitleId
}): PetSettings {
  if (input.settings) return input.settings

  return {
    ...DEFAULT_SETTINGS,
    titleMode: 'disguise',
    titleVisibility: 'always',
    disguiseTitleId: input.disguiseTitleId ?? DEFAULT_DISGUISE_TITLE_ID,
    themeId: input.themeId ?? DEFAULT_THEME_ID,
  }
}
