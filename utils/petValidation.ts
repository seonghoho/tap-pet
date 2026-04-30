import { PET_STORAGE_VERSION, STAT_MAX, STAT_MIN } from '~/constants/pet'
import { DEFAULT_DISGUISE_TITLE_ID, DISGUISE_TITLES } from '~/constants/titles'
import { DEFAULT_THEME_ID, PET_THEMES } from '~/constants/themes'
import type {
  DisguiseTitleId,
  PetSpecies,
  PetState,
  PetStats,
  StoredPetState,
  ThemeId,
} from '~/types/pet'

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

export function parseStoredPetState(value: unknown): PetState | null {
  if (!isRecord(value)) return null
  if (value.version !== PET_STORAGE_VERSION) return null
  if (!isPetSpecies(value.species)) return null

  const lastUpdatedAt = Number(value.lastUpdatedAt)

  return {
    species: value.species,
    stats: normalizeStats(value.stats),
    disguiseTitleId: isDisguiseTitleId(value.disguiseTitleId)
      ? value.disguiseTitleId
      : DEFAULT_DISGUISE_TITLE_ID,
    themeId: isThemeId(value.themeId) ? value.themeId : DEFAULT_THEME_ID,
    lastUpdatedAt: Number.isFinite(lastUpdatedAt) ? lastUpdatedAt : Date.now(),
  }
}

export function toStoredPetState(state: PetState, version: number): StoredPetState {
  return {
    ...state,
    stats: normalizeStats(state.stats),
    version,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
