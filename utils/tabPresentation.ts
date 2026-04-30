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
  const earPath =
    species === 'cat'
      ? `<path d="M18 23 L25 10 L32 23" fill="${baseColor}" stroke="${contrast}" stroke-width="3" stroke-linejoin="round"/><path d="M46 23 L53 10 L60 23" fill="${baseColor}" stroke="${contrast}" stroke-width="3" stroke-linejoin="round"/>`
      : `<path d="M19 27 C11 29 8 39 14 47 C18 52 25 45 25 34" fill="${baseColor}" stroke="${contrast}" stroke-width="3"/><path d="M61 27 C69 29 72 39 66 47 C62 52 55 45 55 34" fill="${baseColor}" stroke="${contrast}" stroke-width="3"/>`
  const face = getFaceSvg(status, contrast)

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">`,
    `<rect width="80" height="80" rx="18" fill="${bgColor}"/>`,
    earPath,
    `<circle cx="40" cy="42" r="26" fill="${baseColor}" stroke="${contrast}" stroke-width="3"/>`,
    face,
    `</svg>`,
  ].join('')
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

function getFaceSvg(status: PetStatus, color: string): string {
  const happyFace = `<circle cx="30" cy="38" r="3" fill="${color}"/><circle cx="50" cy="38" r="3" fill="${color}"/><path d="M31 51 C36 56 44 56 49 51" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`

  if (status === 'fine' || status === 'happy') {
    return happyFace
  }

  if (status === 'sleepy') {
    return `<path d="M25 39 H34" stroke="${color}" stroke-width="4" stroke-linecap="round"/><path d="M46 39 H55" stroke="${color}" stroke-width="4" stroke-linecap="round"/><path d="M34 53 C38 56 42 56 46 53" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
  }

  if (status === 'dirty') {
    return `<circle cx="30" cy="38" r="3" fill="${color}"/><circle cx="50" cy="38" r="3" fill="${color}"/><path d="M31 55 C36 50 44 50 49 55" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/><path d="M55 26 L61 20" stroke="${color}" stroke-width="3" stroke-linecap="round"/><path d="M58 31 L66 29" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
  }

  if (status === 'bored') {
    return `<path d="M26 38 H34" stroke="${color}" stroke-width="4" stroke-linecap="round"/><path d="M46 38 H54" stroke="${color}" stroke-width="4" stroke-linecap="round"/><path d="M33 52 H47" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
  }

  if (status === 'hungry') {
    return `<circle cx="30" cy="38" r="3" fill="${color}"/><circle cx="50" cy="38" r="3" fill="${color}"/><ellipse cx="40" cy="54" rx="5" ry="7" fill="none" stroke="${color}" stroke-width="3"/>`
  }

  if (status === 'excited') {
    return `<circle cx="30" cy="38" r="4" fill="${color}"/><circle cx="50" cy="38" r="4" fill="${color}"/><path d="M30 51 C35 59 45 59 50 51" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/><path d="M61 20 L64 25 L69 26 L65 29 L66 34 L61 31 L56 34 L57 29 L53 26 L58 25 Z" fill="${color}"/>`
  }

  return happyFace
}
