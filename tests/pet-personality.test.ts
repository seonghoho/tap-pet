import { describe, expect, it } from 'vitest'
import type { PetAction, PetPersonalityState } from '~/types/pet'
import {
  createPetPersonalityState,
  getPetPersonalityBonus,
  getPetPersonalityProgress,
  normalizePetPersonalityState,
  recordPersonalityCareAction,
} from '~/utils/petPersonality'

function recordActions(actions: PetAction[]): PetPersonalityState {
  return actions.reduce(
    (state, action, index) => recordPersonalityCareAction(state, action, 1000 + index),
    createPetPersonalityState(),
  )
}

describe('pet personality', () => {
  it('creates an unassigned state with zero early action counts', () => {
    expect(createPetPersonalityState()).toEqual({
      personality: null,
      earlyActionCounts: {
        feed: 0,
        play: 0,
        sleep: 0,
        wash: 0,
      },
      assignedAt: null,
    })
  })

  it.each([
    [['feed', 'feed', 'play'], 'hungry'],
    [['play', 'wash', 'play'], 'playful'],
    [['sleep', 'feed', 'sleep'], 'sleepy'],
    [['wash', 'wash', 'sleep'], 'neat'],
  ] as const)('assigns %s to %s when one early action dominates', (actions, personality) => {
    expect(recordActions([...actions]).personality).toBe(personality)
  })

  it('assigns calm when the first three completed actions are mixed', () => {
    expect(recordActions(['feed', 'play', 'wash']).personality).toBe('calm')
    expect(recordActions(['sleep', 'wash', 'feed']).personality).toBe('calm')
  })

  it('does not assign before the third completed action', () => {
    const state = recordActions(['feed', 'feed'])

    expect(state.personality).toBeNull()
    expect(getPetPersonalityProgress(state)).toEqual({
      current: 2,
      required: 3,
      remaining: 1,
    })
  })

  it('does not change an already assigned personality', () => {
    const assigned = recordActions(['feed', 'feed', 'play'])
    const next = recordPersonalityCareAction(assigned, 'wash', 2000)

    expect(next).toEqual(assigned)
  })

  it('normalizes invalid stored personality data safely', () => {
    expect(normalizePetPersonalityState({ personality: 'loud' }, 1000)).toEqual(
      createPetPersonalityState(),
    )
    expect(
      normalizePetPersonalityState(
        {
          personality: 'playful',
          earlyActionCounts: {
            feed: '1',
            play: 2,
            sleep: Number.NaN,
            wash: -1,
          },
          assignedAt: '2000',
        },
        1000,
      ),
    ).toEqual({
      personality: 'playful',
      earlyActionCounts: {
        feed: 1,
        play: 2,
        sleep: 0,
        wash: 0,
      },
      assignedAt: 2000,
    })
  })

  it('returns a small matching-action bonus only for matching personalities', () => {
    expect(
      getPetPersonalityBonus({
        personality: 'hungry',
        action: 'feed',
        gainedExp: 12,
        gainedAffinityExp: 2,
      }),
    ).toEqual({
      personality: 'hungry',
      action: 'feed',
      expBonus: 0,
      affinityBonus: 1,
    })

    expect(
      getPetPersonalityBonus({
        personality: 'sleepy',
        action: 'sleep',
        gainedExp: 9,
        gainedAffinityExp: 1,
      }),
    ).toEqual({
      personality: 'sleepy',
      action: 'sleep',
      expBonus: 1,
      affinityBonus: 0,
    })

    expect(
      getPetPersonalityBonus({
        personality: 'calm',
        action: 'feed',
        gainedExp: 12,
        gainedAffinityExp: 2,
      }),
    ).toBeNull()

    expect(
      getPetPersonalityBonus({
        personality: 'playful',
        action: 'wash',
        gainedExp: 12,
        gainedAffinityExp: 3,
      }),
    ).toBeNull()
  })
})
