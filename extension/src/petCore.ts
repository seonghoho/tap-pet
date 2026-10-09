// The extension's pet model: the same rules as the website, minus the page-only parts
// (reaction hold, cooldown timers, reward feedback). Pure functions, easy to test.
import { PET_STORAGE_VERSION } from '~/constants/pet'
import type { PetAction, PetSpecies, PetState, PetStatus } from '~/types/pet'
import { consumeActionLimitUse, getActionLimitInfo } from '~/utils/petActionLimit'
import { applyCareAction } from '~/utils/petCare'
import { applyOfflineDecay } from '~/utils/petDecay'
import { createInitialPetState } from '~/utils/petFactory'
import { recordPersonalityCareAction } from '~/utils/petPersonality'
import { getPetStatus } from '~/utils/petStatus'
import { recordStreakCare } from '~/utils/petStreak'
import { parseStoredPetState, toStoredPetState } from '~/utils/petValidation'

export type CareOutcome =
  | { ok: true, state: PetState, gainedExp: number }
  | { ok: false, reason: 'limit' }

export function loadPet(raw: unknown, now: number): PetState | null {
  const parsed = parseStoredPetState(raw, now)
  if (!parsed) return null

  return {
    ...parsed,
    stats: applyOfflineDecay(parsed.stats, parsed.lastUpdatedAt, now),
    lastUpdatedAt: now,
  }
}

export function serializePet(state: PetState): unknown {
  return toStoredPetState(state, PET_STORAGE_VERSION)
}

export function adoptPet(species: PetSpecies, name: string, now: number): PetState {
  return createInitialPetState(species, now, {
    name,
    settings: { titleMode: 'disguise' },
  })
}

export function careFor(state: PetState, action: PetAction, now: number): CareOutcome {
  const actionLimit = consumeActionLimitUse(state.actionLimit, now)
  if (!actionLimit) return { ok: false, reason: 'limit' }

  const result = applyCareAction({ stats: state.stats, growth: state.growth, action })

  return {
    ok: true,
    gainedExp: result.gainedExp,
    state: {
      ...state,
      stats: result.stats,
      growth: result.growth,
      actionLimit,
      personality: recordPersonalityCareAction(state.personality, action, now),
      streak: recordStreakCare(state.streak, now),
      lastPlayedAt: action === 'play' ? now : state.lastPlayedAt,
      lastUpdatedAt: now,
    },
  }
}

export function statusOf(state: PetState, now: number): PetStatus {
  return getPetStatus(state.stats, state.lastPlayedAt, now)
}

export function remainingCare(state: PetState, now: number): number {
  return getActionLimitInfo(state.actionLimit, now).remaining
}
