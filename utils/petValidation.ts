import {
  DEFAULT_GROWTH,
  DEFAULT_PET_NAMES,
  DEFAULT_SETTINGS,
  PET_STORAGE_VERSION,
  STAT_MAX,
  STAT_MIN,
} from '~/constants/pet'
import { DISGUISE_TITLES } from '~/constants/titles'
import { PET_THEMES } from '~/constants/themes'
import type {
  DisguiseTitleId,
  PetActionLimit,
  PetGrowth,
  PetSettings,
  PetSpecies,
  PetState,
  PetStats,
  StoredPetState,
  ThemeId,
} from '~/types/pet'
import { normalizeActionLimit } from '~/utils/petActionLimit'
import { normalizeGrowth } from '~/utils/petGrowth'

const PET_SPECIES = ['cat', 'dog'] as const

export function clampStat(value: number): number {
  if (!Number.isFinite(value)) return STAT_MIN

  return Math.min(STAT_MAX, Math.max(STAT_MIN, Math.round(value)))
}

export function isPetSpecies(value: unknown): value is PetSpecies {
  return PET_SPECIES.includes(value as PetSpecies)
}

export function isDisguiseTitleId(value: unknown): value is DisguiseTitleId {
  return DISGUISE_TITLES.some((title) => title.id === value)
}

export function isThemeId(value: unknown): value is ThemeId {
  return PET_THEMES.some((theme) => theme.id === value)
}

export function normalizeStats(value: unknown): PetStats {
  const stats = isRecord(value) ? value : {}

  return {
    fullness: clampStat(Number(stats.fullness ?? 0)),
    energy: clampStat(Number(stats.energy ?? 0)),
    cleanliness: clampStat(Number(stats.cleanliness ?? 70)),
  }
}

export function normalizeSettings(value: unknown): PetSettings {
  const settings = isRecord(value) ? value : {}

  return {
    ...DEFAULT_SETTINGS,
    titleMode: settings.titleMode === 'disguise' ? 'disguise' : 'status',
    titleVisibility: settings.titleVisibility === 'always' ? 'always' : 'inactive-only',
    disguiseTitleId: isDisguiseTitleId(settings.disguiseTitleId)
      ? settings.disguiseTitleId
      : DEFAULT_SETTINGS.disguiseTitleId,
    customDisguiseTitle:
      typeof settings.customDisguiseTitle === 'string' ? settings.customDisguiseTitle : '',
    titleAnimationEnabled: settings.titleAnimationEnabled === true,
    themeId: isThemeId(settings.themeId) ? settings.themeId : DEFAULT_SETTINGS.themeId,
  }
}

export function parseStoredPetState(value: unknown, now = Date.now()): PetState | null {
  if (!isRecord(value)) return null
  if (!isPetSpecies(value.species)) return null

  if (value.version === PET_STORAGE_VERSION) {
    return parseStoredPetStateV2(value, now)
  }

  if (value.version === 1) {
    return parseStoredPetStateV1(value, now)
  }

  return null
}

export function toStoredPetState(state: PetState, version: number): StoredPetState {
  return {
    ...state,
    name: normalizePetName(state.name, state.species),
    stats: normalizeStats(state.stats),
    growth: normalizeGrowth(state.growth),
    settings: normalizeSettings(state.settings),
    actionLimit: normalizeStoredActionLimit(state.actionLimit, state.lastUpdatedAt),
    version,
  }
}

function parseStoredPetStateV2(value: Record<string, unknown>, now: number): PetState {
  const species = value.species as PetSpecies
  const lastUpdatedAt = normalizeTimestamp(value.lastUpdatedAt, now)

  return {
    species,
    name: normalizePetName(value.name, species),
    stats: normalizeStats(value.stats),
    growth: normalizeStoredGrowth(value.growth),
    settings: normalizeSettings(getStoredSettingsValue(value)),
    actionLimit: normalizeStoredActionLimit(value.actionLimit, now),
    lastUpdatedAt,
    lastPlayedAt: normalizeTimestamp(value.lastPlayedAt, now),
  }
}

function parseStoredPetStateV1(value: Record<string, unknown>, now: number): PetState {
  const species = value.species as PetSpecies
  const lastUpdatedAt = normalizeTimestamp(value.lastUpdatedAt, now)

  return {
    species,
    name: normalizePetName(value.name, species),
    stats: normalizeStats(value.stats),
    growth: { ...DEFAULT_GROWTH },
    settings: normalizeSettings({
      disguiseTitleId: value.disguiseTitleId,
      themeId: normalizeLegacyThemeId(value.themeId),
    }),
    actionLimit: normalizeStoredActionLimit(value.actionLimit, now),
    lastUpdatedAt,
    lastPlayedAt: normalizeTimestamp(value.lastPlayedAt, lastUpdatedAt),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizePetName(value: unknown, species: PetSpecies): string {
  if (typeof value !== 'string') return DEFAULT_PET_NAMES[species]

  return value.trim() || DEFAULT_PET_NAMES[species]
}

function normalizeStoredGrowth(value: unknown): PetGrowth {
  if (!isRecord(value)) return { ...DEFAULT_GROWTH }

  return normalizeGrowth(value as Partial<PetGrowth>)
}

function normalizeStoredActionLimit(value: unknown, now: number): PetActionLimit {
  return normalizeActionLimit(value, now)
}

function normalizeTimestamp(value: unknown, fallback: number): number {
  const timestamp = Number(value)

  return Number.isFinite(timestamp) ? timestamp : fallback
}

function getStoredSettingsValue(value: Record<string, unknown>): unknown {
  if (isRecord(value.settings)) return value.settings

  return {
    disguiseTitleId: value.disguiseTitleId,
    themeId: normalizeLegacyThemeId(value.themeId),
  }
}

function normalizeLegacyThemeId(value: unknown): ThemeId {
  if (isThemeId(value)) return value

  return value === 'night' ? 'dark' : 'system'
}
