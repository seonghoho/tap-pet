import { describe, expect, it } from 'vitest'
import {
  ACTION_LIMIT_AD_REWARD_USES,
  ACTION_LIMIT_BASE_USES,
  ACTION_LIMIT_WINDOW_MS,
} from '~/constants/pet'
import {
  createPetActionLimit,
  getActionLimitInfo,
  grantRewardedActionUses,
  normalizeActionLimit,
} from '~/utils/petActionLimit'

const DAY = 1000 * 60 * 60 * 24
const NOON = new Date(2026, 9, 9, 12, 0, 0).getTime()

describe('once-a-day action recharge', () => {
  it('adds uses the first time in a day', () => {
    const recharged = grantRewardedActionUses(createPetActionLimit(NOON), NOON)

    expect(recharged).not.toBeNull()
    expect(getActionLimitInfo(recharged!, NOON).limit).toBe(ACTION_LIMIT_BASE_USES + ACTION_LIMIT_AD_REWARD_USES)
    expect(getActionLimitInfo(recharged!, NOON).canRecharge).toBe(false)
  })

  it('refuses a second recharge on the same day', () => {
    const recharged = grantRewardedActionUses(createPetActionLimit(NOON), NOON)!

    expect(grantRewardedActionUses(recharged, NOON + 1000)).toBeNull()
  })

  it('keeps the daily lock across 30-minute window resets', () => {
    const recharged = grantRewardedActionUses(createPetActionLimit(NOON), NOON)!
    const later = NOON + ACTION_LIMIT_WINDOW_MS + 1

    expect(getActionLimitInfo(recharged, later).canRecharge).toBe(false)
    expect(grantRewardedActionUses(recharged, later)).toBeNull()
  })

  it('allows the recharge again the next day', () => {
    const recharged = grantRewardedActionUses(createPetActionLimit(NOON), NOON)!

    expect(getActionLimitInfo(recharged, NOON + DAY).canRecharge).toBe(true)
    expect(grantRewardedActionUses(recharged, NOON + DAY)).not.toBeNull()
  })

  it('restores the daily lock from storage and ignores junk values', () => {
    const recharged = grantRewardedActionUses(createPetActionLimit(NOON), NOON)!

    expect(normalizeActionLimit(JSON.parse(JSON.stringify(recharged)), NOON).rechargedOn).toBe(recharged.rechargedOn)
    expect(normalizeActionLimit({ ...recharged, rechargedOn: 42 }, NOON).rechargedOn).toBeUndefined()
  })
})
