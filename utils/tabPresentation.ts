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
import { getAvailableLevelUnlocks } from '~/utils/petLevelUnlocks'
import { petNeedsCare, renderPetArtSvg } from '~/utils/petArt'

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
  const shouldSignal = input.settings.titleVisibility === 'always' || !input.isDocumentVisible

  if (input.settings.titleMode === 'disguise') {
    const disguiseTitle = getDisguiseTitleValue(
      input.settings.disguiseTitleId,
      input.locale,
      input.settings.customDisguiseTitle,
    )

    // Borrow the unread-count pattern every work app uses, so the signal never looks like a pet.
    return shouldSignal && petNeedsCare(input.status) ? `(1) ${disguiseTitle}` : disguiseTitle
  }

  if (!shouldSignal) {
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
  level?: number
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
    faviconSvg: getFaviconSvg(species, status, themeId, { level: input.level }),
  }
}

export function getFaviconSvg(
  species: PetSpecies,
  status: PetStatus,
  _themeId: ThemeId,
  options: {
    level?: number
  } = {},
): string {
  const hasBrightAccent = getAvailableLevelUnlocks(options.level ?? 1).some(
    (unlock) => unlock.id === 'favicon-bright-accent',
  )

  return renderPetArtSvg({
    species,
    status,
    variant: 'icon',
    idPrefix: 'tab-pet-favicon',
    accentBoost: hasBrightAccent,
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
