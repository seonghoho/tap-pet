import {
  ACTION_LIMIT_AD_REWARD_USES,
  ACTION_LIMIT_BASE_USES,
  ACTION_LIMIT_WINDOW_MS,
} from '~/constants/pet'
import type { PetActionLimit, PetActionLimitInfo } from '~/types/pet'

export function createPetActionLimit(now = Date.now()): PetActionLimit {
  return {
    windowStartedAt: now,
    used: 0,
    bonusUses: 0,
  }
}

export function normalizeActionLimit(value: unknown, now = Date.now()): PetActionLimit {
  if (!isRecord(value)) return createPetActionLimit(now)

  const windowStartedAt = normalizeTimestamp(value.windowStartedAt, now)
  const used = normalizeCount(value.used)
  const bonusUses = normalizeCount(value.bonusUses)

  return resetExpiredActionLimit({
    windowStartedAt,
    used,
    bonusUses,
  }, now)
}

export function getActionLimitInfo(limit: PetActionLimit, now = Date.now()): PetActionLimitInfo {
  const currentLimit = resetExpiredActionLimit(limit, now)
  const limitCount = ACTION_LIMIT_BASE_USES + currentLimit.bonusUses

  return {
    used: currentLimit.used,
    limit: limitCount,
    remaining: Math.max(0, limitCount - currentLimit.used),
    resetAt: currentLimit.windowStartedAt + ACTION_LIMIT_WINDOW_MS,
    windowMs: ACTION_LIMIT_WINDOW_MS,
  }
}

export function consumeActionLimitUse(limit: PetActionLimit, now = Date.now()): PetActionLimit | null {
  const currentLimit = resetExpiredActionLimit(limit, now)
  const info = getActionLimitInfo(currentLimit, now)

  if (info.remaining <= 0) return null

  return {
    ...currentLimit,
    used: currentLimit.used + 1,
  }
}

export function grantRewardedActionUses(limit: PetActionLimit, now = Date.now()): PetActionLimit {
  const currentLimit = resetExpiredActionLimit(limit, now)

  return {
    ...currentLimit,
    bonusUses: currentLimit.bonusUses + ACTION_LIMIT_AD_REWARD_USES,
  }
}

function resetExpiredActionLimit(limit: PetActionLimit, now: number): PetActionLimit {
  if (now < limit.windowStartedAt + ACTION_LIMIT_WINDOW_MS) return limit

  return createPetActionLimit(now)
}

function normalizeCount(value: unknown): number {
  const count = Number(value)

  if (!Number.isFinite(count)) return 0

  return Math.max(0, Math.floor(count))
}

function normalizeTimestamp(value: unknown, fallback: number): number {
  const timestamp = Number(value)

  return Number.isFinite(timestamp) ? timestamp : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
