# Pet Personality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add behavior-derived pet personality after the first three completed care actions, with compact UI feedback and a small matching-action reward bonus.

**Architecture:** Keep personality rules in a pure `utils/petPersonality.ts` module, persist personality as part of `PetState`, and keep Vue components as presentation-only consumers of store state and feedback data. Storage migration bumps the saved pet version and normalizes only the personality slice when invalid data is found.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest, Playwright, localStorage.

---

## Scope

This plan implements `docs/superpowers/specs/2026-05-20-pet-personality-design.md`.

Included:

- First-three-care personality assignment
- `hungry`, `playful`, `sleepy`, `neat`, and `calm` personalities
- Stored personality state and migration
- Matching-action reward bonus
- One-time care feedback reveal
- Persistent side-panel personality display
- `en`, `ko`, and `ja` copy
- Unit, storage, model, static UI, and optional E2E coverage

Excluded:

- Personality selection UI
- Reroll flow
- Personality-specific habitat art
- Personality-specific title or favicon behavior
- Decoration, shards, inventory, seasonal events

## File Structure

Create:

- `utils/petPersonality.ts`: Pure personality state, assignment, normalization, and bonus rules.
- `tests/pet-personality.test.ts`: Unit tests for pure personality rules.
- `tests/pet-personality-ui.test.ts`: Static/component tests for app wiring, side-panel UI, feedback UI, copy, and CSS.

Modify:

- `types/pet.ts`: Add personality types, state field, feedback fields, and bonus payload type.
- `constants/pet.ts`: Bump storage version to 4 and add personality constants.
- `constants/i18n.ts`: Add localized personality copy.
- `utils/petFactory.ts`: Initialize personality for new pets.
- `utils/petValidation.ts`: Parse and migrate personality state.
- `utils/petCare.ts`: Accept optional reward bonus when applying care action.
- `composables/usePetStore.ts`: Record early care actions, assign personality, apply bonus, and expose feedback.
- `app.vue`: Pass personality state to `PetSidePanel`.
- `components/PetSidePanel.vue`: Render forming and assigned personality states.
- `components/PetActions.vue`: Render personality reveal and bonus feedback.
- `assets/css/main.css`: Add compact responsive personality styles.
- `tests/pet-storage.test.ts`: Cover migration and invalid personality normalization.
- `tests/pet-model.test.ts`: Cover store assignment, reveal, persistence, and bonus behavior.

---

### Task 1: Pure Personality Model

**Files:**

- Modify: `types/pet.ts`
- Modify: `constants/pet.ts`
- Create: `utils/petPersonality.ts`
- Create: `tests/pet-personality.test.ts`

- [ ] **Step 1: Write the failing pure personality tests**

Add `tests/pet-personality.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the new pure test to verify it fails**

Run:

```bash
npm run test -- tests/pet-personality.test.ts
```

Expected: FAIL because `utils/petPersonality.ts` and personality types do not exist.

- [ ] **Step 3: Add personality types and constants**

In `types/pet.ts`, add after `PetAction`:

```ts
export type PetPersonality = 'calm' | 'hungry' | 'playful' | 'sleepy' | 'neat'
```

Add after `PetActionLimitRewardFeedback`:

```ts
export type PetPersonalityState = {
  personality: PetPersonality | null
  earlyActionCounts: Record<PetAction, number>
  assignedAt: number | null
}

export type PetPersonalityBonus = {
  personality: PetPersonality
  action: PetAction
  expBonus: number
  affinityBonus: number
}
```

Extend `PetCareFeedback`:

```ts
  personalityReveal?: {
    personality: PetPersonality
    reasonActionCounts: Record<PetAction, number>
  }
  personalityBonus?: PetPersonalityBonus
```

Add to `PetState`:

```ts
  personality: PetPersonalityState
```

In `constants/pet.ts`, change:

```ts
export const PET_STORAGE_VERSION = 4
```

Add near reward constants:

```ts
export const PET_PERSONALITY_ASSIGNMENT_ACTION_COUNT = 3
export const PET_PERSONALITY_REWARD_BONUS_RATE = 0.1
```

- [ ] **Step 4: Implement `utils/petPersonality.ts`**

Create `utils/petPersonality.ts`:

```ts
import {
  PET_PERSONALITY_ASSIGNMENT_ACTION_COUNT,
  PET_PERSONALITY_REWARD_BONUS_RATE,
} from '~/constants/pet'
import type {
  PetAction,
  PetPersonality,
  PetPersonalityBonus,
  PetPersonalityState,
} from '~/types/pet'

const PET_ACTIONS: PetAction[] = ['feed', 'play', 'sleep', 'wash']

const ACTION_PERSONALITY_MAP: Record<PetAction, Exclude<PetPersonality, 'calm'>> = {
  feed: 'hungry',
  play: 'playful',
  sleep: 'sleepy',
  wash: 'neat',
}

const PERSONALITY_ACTION_MAP: Partial<Record<PetPersonality, PetAction>> = {
  hungry: 'feed',
  playful: 'play',
  sleepy: 'sleep',
  neat: 'wash',
}

export function createPetPersonalityState(): PetPersonalityState {
  return {
    personality: null,
    earlyActionCounts: createEmptyActionCounts(),
    assignedAt: null,
  }
}

export function recordPersonalityCareAction(
  state: PetPersonalityState,
  action: PetAction,
  now = Date.now(),
): PetPersonalityState {
  const normalizedState = normalizePetPersonalityState(state, now)

  if (normalizedState.personality) return normalizedState

  const earlyActionCounts = {
    ...normalizedState.earlyActionCounts,
    [action]: normalizedState.earlyActionCounts[action] + 1,
  }
  const completedActions = getCompletedEarlyActionCount(earlyActionCounts)

  if (completedActions < PET_PERSONALITY_ASSIGNMENT_ACTION_COUNT) {
    return {
      personality: null,
      earlyActionCounts,
      assignedAt: null,
    }
  }

  return {
    personality: resolvePetPersonality(earlyActionCounts),
    earlyActionCounts,
    assignedAt: now,
  }
}

export function getPetPersonalityProgress(state: PetPersonalityState): {
  current: number
  required: number
  remaining: number
} {
  const normalizedState = normalizePetPersonalityState(state)
  const current = Math.min(
    PET_PERSONALITY_ASSIGNMENT_ACTION_COUNT,
    getCompletedEarlyActionCount(normalizedState.earlyActionCounts),
  )

  return {
    current,
    required: PET_PERSONALITY_ASSIGNMENT_ACTION_COUNT,
    remaining: Math.max(0, PET_PERSONALITY_ASSIGNMENT_ACTION_COUNT - current),
  }
}

export function getPetPersonalityBonus(input: {
  personality: PetPersonality | null
  action: PetAction
  gainedExp: number
  gainedAffinityExp: number
}): PetPersonalityBonus | null {
  if (!input.personality) return null

  const matchingAction = PERSONALITY_ACTION_MAP[input.personality]
  if (!matchingAction || matchingAction !== input.action) return null

  if (input.personality === 'sleepy') {
    return {
      personality: input.personality,
      action: input.action,
      expBonus: getBonusAmount(input.gainedExp),
      affinityBonus: 0,
    }
  }

  return {
    personality: input.personality,
    action: input.action,
    expBonus: 0,
    affinityBonus: getBonusAmount(input.gainedAffinityExp),
  }
}

export function normalizePetPersonalityState(
  value: unknown,
  now = Date.now(),
): PetPersonalityState {
  if (!isRecord(value)) return createPetPersonalityState()

  const personality = isPetPersonality(value.personality) ? value.personality : null
  if (value.personality !== null && value.personality !== undefined && !personality) {
    return createPetPersonalityState()
  }

  return {
    personality,
    earlyActionCounts: normalizeActionCounts(value.earlyActionCounts),
    assignedAt: personality ? normalizeNullableTimestamp(value.assignedAt, now) : null,
  }
}

function resolvePetPersonality(counts: Record<PetAction, number>): PetPersonality {
  const sortedActions = [...PET_ACTIONS].sort((current, next) => counts[next] - counts[current])
  const topAction = sortedActions[0]
  const nextAction = sortedActions[1]

  if (counts[topAction] > counts[nextAction]) return ACTION_PERSONALITY_MAP[topAction]

  return 'calm'
}

function createEmptyActionCounts(): Record<PetAction, number> {
  return {
    feed: 0,
    play: 0,
    sleep: 0,
    wash: 0,
  }
}

function normalizeActionCounts(value: unknown): Record<PetAction, number> {
  const counts = isRecord(value) ? value : {}

  return {
    feed: normalizeNonNegativeInteger(counts.feed),
    play: normalizeNonNegativeInteger(counts.play),
    sleep: normalizeNonNegativeInteger(counts.sleep),
    wash: normalizeNonNegativeInteger(counts.wash),
  }
}

function getCompletedEarlyActionCount(counts: Record<PetAction, number>): number {
  return PET_ACTIONS.reduce((total, action) => total + counts[action], 0)
}

function getBonusAmount(value: number): number {
  const normalizedValue = normalizeNonNegativeInteger(value)
  if (normalizedValue <= 0) return 0

  return Math.max(1, Math.round(normalizedValue * PET_PERSONALITY_REWARD_BONUS_RATE))
}

function normalizeNonNegativeInteger(value: unknown): number {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return 0

  return Math.max(0, Math.floor(numberValue))
}

function normalizeNullableTimestamp(value: unknown, fallback: number): number | null {
  if (value === null || value === undefined) return fallback

  const timestamp = Number(value)

  return Number.isFinite(timestamp) ? timestamp : fallback
}

function isPetPersonality(value: unknown): value is PetPersonality {
  return (
    value === 'calm' ||
    value === 'hungry' ||
    value === 'playful' ||
    value === 'sleepy' ||
    value === 'neat'
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
```

- [ ] **Step 5: Run the pure personality test to verify it passes**

Run:

```bash
npm run test -- tests/pet-personality.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the pure model**

```bash
git add types/pet.ts constants/pet.ts utils/petPersonality.ts tests/pet-personality.test.ts
git commit -m "feat(personality): add pure personality rules"
```

---

### Task 2: Storage Migration and Default State

**Files:**

- Modify: `utils/petFactory.ts`
- Modify: `utils/petValidation.ts`
- Modify: `tests/pet-storage.test.ts`

- [ ] **Step 1: Write failing storage tests**

Add these tests inside `describe('pet storage validation', () => { ... })` in `tests/pet-storage.test.ts`:

```ts
  it('creates new pets with unassigned personality state', () => {
    expect(createInitialPetState('cat', 1000).personality).toEqual({
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

  it('round-trips a valid v4 pet state with personality', () => {
    const state = {
      ...createInitialPetState('cat', 1000),
      personality: {
        personality: 'playful' as const,
        earlyActionCounts: {
          feed: 0,
          play: 3,
          sleep: 0,
          wash: 0,
        },
        assignedAt: 1200,
      },
    }
    const stored = toStoredPetState(state, PET_STORAGE_VERSION)

    expect(parseStoredPetState(stored, 2000)).toEqual(state)
  })

  it('migrates v3 pet state with default personality state', () => {
    const migrated = parseStoredPetState(
      {
        version: 3,
        species: 'dog',
        stats: {
          fullness: 50,
          energy: 60,
          cleanliness: 70,
        },
        growth: {
          level: 2,
          exp: 10,
          affinityExp: 20,
        },
        dailyGoal: {
          dateKey: '1970-01-01',
          goalId: 'recommended-care',
          progress: 0,
          completedAt: null,
          claimedAt: null,
        },
        lastUpdatedAt: 1000,
        lastPlayedAt: 1000,
      },
      1000,
    )

    expect(migrated?.personality).toEqual({
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

  it('normalizes invalid personality data without resetting the pet', () => {
    const parsed = parseStoredPetState(
      {
        version: PET_STORAGE_VERSION,
        species: 'cat',
        stats: {
          fullness: 50,
          energy: 60,
          cleanliness: 70,
        },
        personality: {
          personality: 'loud',
          earlyActionCounts: {
            feed: 100,
          },
          assignedAt: 'broken',
        },
        lastUpdatedAt: 1000,
        lastPlayedAt: 1000,
      },
      2000,
    )

    expect(parsed?.species).toBe('cat')
    expect(parsed?.stats).toEqual({
      fullness: 50,
      energy: 60,
      cleanliness: 70,
    })
    expect(parsed?.personality).toEqual({
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
```

Update the existing test name from `round-trips a valid v2 pet state` to `round-trips a valid current pet state`.

- [ ] **Step 2: Run storage tests to verify they fail**

Run:

```bash
npm run test -- tests/pet-storage.test.ts
```

Expected: FAIL because `PetState.personality` is not initialized or parsed.

- [ ] **Step 3: Initialize personality for new pets**

In `utils/petFactory.ts`, import:

```ts
import { createPetPersonalityState } from '~/utils/petPersonality'
```

Add to the object returned by `createInitialPetState` immediately after `dailyGoal`:

```ts
    personality: createPetPersonalityState(),
```

- [ ] **Step 4: Migrate and normalize personality in storage parsing**

In `utils/petValidation.ts`, import:

```ts
  PetPersonalityState,
```

and:

```ts
import { createPetPersonalityState, normalizePetPersonalityState } from '~/utils/petPersonality'
```

Change `parseStoredPetState` version routing:

```ts
  if (value.version === PET_STORAGE_VERSION) {
    return parseStoredPetStateV4(value, now)
  }

  if (value.version === 3) {
    return parseStoredPetStateV3(value, now)
  }
```

Add the v4 parser above `parseStoredPetStateV3`:

```ts
function parseStoredPetStateV4(value: Record<string, unknown>, now: number): PetState {
  const state = parseStoredPetStateV3(value, now)

  return {
    ...state,
    personality: normalizeStoredPersonality(value.personality, now),
  }
}
```

Add `personality: createPetPersonalityState(),` to both `parseStoredPetStateV2` and `parseStoredPetStateV1` return values.

Add `personality: createPetPersonalityState(),` to `parseStoredPetStateV3` by returning:

```ts
  return {
    ...state,
    dailyGoal: normalizeStoredDailyGoal(value.dailyGoal, now),
    personality: createPetPersonalityState(),
  }
```

In `toStoredPetState`, add:

```ts
    personality: normalizeStoredPersonality(state.personality, state.lastUpdatedAt),
```

Add near the other normalize helpers:

```ts
function normalizeStoredPersonality(value: unknown, now: number): PetPersonalityState {
  return normalizePetPersonalityState(value, now)
}
```

- [ ] **Step 5: Run storage tests to verify they pass**

Run:

```bash
npm run test -- tests/pet-storage.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run pure personality and storage tests together**

Run:

```bash
npm run test -- tests/pet-personality.test.ts tests/pet-storage.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit storage migration**

```bash
git add utils/petFactory.ts utils/petValidation.ts tests/pet-storage.test.ts
git commit -m "feat(personality): persist personality state"
```

---

### Task 3: Care Result Bonus and Store Wiring

**Files:**

- Modify: `utils/petCare.ts`
- Modify: `composables/usePetStore.ts`
- Modify: `tests/pet-model.test.ts`

- [ ] **Step 1: Write failing store tests**

Add these tests inside `describe('pet store', () => { ... })` in `tests/pet-model.test.ts`:

```ts
  it('assigns personality after the third completed early care action', () => {
    const callbacks: Array<() => void> = []
    const store = createScheduledStore(callbacks)

    store.initializePet('cat')

    store.performAction('feed')
    callbacks[0]?.()
    expect(store.petState.value?.personality.personality).toBeNull()

    vi.setSystemTime(6001)
    store.performAction('feed')
    callbacks[1]?.()
    expect(store.petState.value?.personality.personality).toBeNull()

    vi.setSystemTime(12002)
    store.performAction('play')
    callbacks[2]?.()

    expect(store.petState.value?.personality).toEqual({
      personality: 'hungry',
      earlyActionCounts: {
        feed: 2,
        play: 1,
        sleep: 0,
        wash: 0,
      },
      assignedAt: 12002,
    })
    expect(store.lastCareFeedback.value?.personalityReveal).toEqual({
      personality: 'hungry',
      reasonActionCounts: {
        feed: 2,
        play: 1,
        sleep: 0,
        wash: 0,
      },
    })
  })

  it('assigns calm when early completed care actions are mixed', () => {
    const callbacks: Array<() => void> = []
    const store = createScheduledStore(callbacks)

    store.initializePet('cat')

    store.performAction('feed')
    callbacks[0]?.()
    vi.setSystemTime(6001)
    store.performAction('play')
    callbacks[1]?.()
    vi.setSystemTime(12002)
    store.performAction('wash')
    callbacks[2]?.()

    expect(store.petState.value?.personality.personality).toBe('calm')
    expect(store.lastCareFeedback.value?.personalityBonus).toBeUndefined()
  })

  it('applies the matching personality bonus once to eligible rewards', () => {
    const callbacks: Array<() => void> = []
    const store = createScheduledStore(callbacks)

    store.initializePet('cat')
    store.performAction('play')
    callbacks[0]?.()
    vi.setSystemTime(6001)
    store.performAction('play')
    callbacks[1]?.()
    vi.setSystemTime(12002)
    store.performAction('feed')
    callbacks[2]?.()

    expect(store.petState.value?.personality.personality).toBe('playful')

    vi.setSystemTime(18003)
    store.performAction('play')
    callbacks[3]?.()

    expect(store.lastCareFeedback.value).toMatchObject({
      action: 'play',
      gainedExp: 20,
      gainedAffinityExp: 15,
      personalityBonus: {
        personality: 'playful',
        action: 'play',
        expBonus: 0,
        affinityBonus: 1,
      },
    })
  })

  it('does not count blocked care actions toward personality', () => {
    const store = usePetStore()

    store.initializePet('cat')
    store.performAction('feed')
    store.performAction('feed')

    expect(store.petState.value?.personality.earlyActionCounts.feed).toBe(0)
  })
```

- [ ] **Step 2: Run model tests to verify they fail**

Run:

```bash
npm run test -- tests/pet-model.test.ts
```

Expected: FAIL because care actions do not update personality state and `applyCareAction` has no reward bonus input.

- [ ] **Step 3: Allow `applyCareAction` to apply a precomputed reward bonus**

In `utils/petCare.ts`, update imports:

```ts
  PetPersonalityBonus,
```

Extend `CareActionInput`:

```ts
  rewardBonus?: Pick<PetPersonalityBonus, 'expBonus' | 'affinityBonus'> | null
```

Change the reward section in `applyCareAction`:

```ts
  const rewardPreview = getCareActionRewardPreview(input)
  const gainedExp = rewardPreview.gainedExp + normalizeRewardBonus(input.rewardBonus?.expBonus)
  const gainedAffinityExp =
    rewardPreview.gainedAffinityExp + normalizeRewardBonus(input.rewardBonus?.affinityBonus)
  const leveledGrowth = addLevelExp(growth, gainedExp)

  return {
    stats,
    growth: addAffinityExp(leveledGrowth, gainedAffinityExp),
    ...rewardPreview,
    gainedExp,
    gainedAffinityExp,
  }
```

Add at the bottom of `utils/petCare.ts`:

```ts
function normalizeRewardBonus(value: unknown): number {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return 0

  return Math.max(0, Math.floor(numberValue))
}
```

- [ ] **Step 4: Wire personality into `usePetStore`**

In `composables/usePetStore.ts`, import:

```ts
  getCareActionRewardPreview,
```

is already imported from `~/utils/petCare`. Add:

```ts
import {
  getPetPersonalityBonus,
  recordPersonalityCareAction,
} from '~/utils/petPersonality'
```

Inside `resolveAction`, move `const resolvedAt = Date.now()` so it appears before reward calculation, then replace the current `const result = applyCareAction({ ... })` block with:

```ts
      const resolvedAt = Date.now()
      const eligibleReward = getCareActionRewardPreview({
        stats: previousState.stats,
        growth: previousState.growth,
        action,
      })
      const nextPersonality = recordPersonalityCareAction(
        previousState.personality,
        action,
        resolvedAt,
      )
      const personalityBonus = getPetPersonalityBonus({
        personality: nextPersonality.personality,
        action,
        gainedExp: eligibleReward.gainedExp,
        gainedAffinityExp: eligibleReward.gainedAffinityExp,
      })
      const result = applyCareAction({
        stats: previousState.stats,
        growth: previousState.growth,
        action,
        rewardBonus: personalityBonus,
      })
```

Remove the later duplicate `const resolvedAt = Date.now()` line from the existing function.

In the `commitState` call for the resolved action, add:

```ts
        personality: nextPersonality,
```

In `lastCareFeedback.value`, add after `levelUnlocks`:

```ts
          personalityReveal:
            !previousState.personality.personality && nextPersonality.personality
              ? {
                  personality: nextPersonality.personality,
                  reasonActionCounts: nextPersonality.earlyActionCounts,
                }
              : undefined,
          personalityBonus: personalityBonus ?? undefined,
```

- [ ] **Step 5: Run model tests to verify they pass**

Run:

```bash
npm run test -- tests/pet-model.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run related logic tests together**

Run:

```bash
npm run test -- tests/pet-personality.test.ts tests/pet-storage.test.ts tests/pet-model.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit store wiring**

```bash
git add utils/petCare.ts composables/usePetStore.ts tests/pet-model.test.ts
git commit -m "feat(personality): apply care personality bonuses"
```

---

### Task 4: Personality Copy, App Wiring, and UI

**Files:**

- Modify: `constants/i18n.ts`
- Modify: `app.vue`
- Modify: `components/PetSidePanel.vue`
- Modify: `components/PetActions.vue`
- Modify: `assets/css/main.css`
- Create: `tests/pet-personality-ui.test.ts`

- [ ] **Step 1: Write failing UI and copy tests**

Create `tests/pet-personality-ui.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'
import { ACTION_LIMIT_AD_REWARD_USES } from '~/constants/pet'
import type { PetPersonalityState, PetSettings } from '~/types/pet'
import * as petGrowth from '~/utils/petGrowth'
import * as petLevelUnlocks from '~/utils/petLevelUnlocks'
import * as petPersonality from '~/utils/petPersonality'

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const
const requireModule = createRequire(import.meta.url)

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type PetSidePanelSetup = {
  personalityProgress: { value: ReturnType<typeof petPersonality.getPetPersonalityProgress> }
  personalityName: { value: string }
  personalityDetail: { value: string }
  personalityBonusText: { value: string }
}

type PetActionsSetup = {
  shouldShowFeedbackPersonalityReveal: { value: boolean }
  shouldShowFeedbackPersonalityBonus: { value: boolean }
  feedbackPersonalityName: { value: string }
  feedbackPersonalityBonusText: { value: string }
}

function loadScriptSetupComponent<T>(componentPath: string): SetupComponent<T> {
  const filename = resolve(componentPath)
  const source = readFileSync(filename, 'utf8')
  const descriptor = parse(source, { filename }).descriptor
  const compiled = compileScript(descriptor, { id: filename })
  const output = ts.transpileModule(compiled.content, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const module = { exports: {} }
  const localRequire = (id: string): unknown => {
    if (id === 'vue') return requireModule('vue')
    if (id === '~/constants/pet') return { ACTION_LIMIT_AD_REWARD_USES }
    if (id === '~/utils/petGrowth') return petGrowth
    if (id === '~/utils/petLevelUnlocks') return petLevelUnlocks
    if (id === '~/utils/petPersonality') return petPersonality

    return requireModule(id)
  }

  new Function('require', 'exports', 'module', output)(localRequire, module.exports, module)

  return (module.exports as { default: SetupComponent<T> }).default
}

function readComponentTemplate(componentPath: string): string {
  const filename = resolve(componentPath)
  const source = readFileSync(filename, 'utf8')
  const descriptor = parse(source, { filename }).descriptor

  return descriptor.template?.content ?? ''
}

function readSource(sourcePath: string): string {
  return readFileSync(resolve(sourcePath), 'utf8')
}

function createTestSettings(overrides: Partial<PetSettings> = {}): PetSettings {
  return {
    titleMode: 'status',
    titleVisibility: 'inactive-only',
    disguiseTitleId: 'project-dashboard',
    customDisguiseTitle: '',
    titleAnimationEnabled: false,
    themeId: 'system',
    ...overrides,
  }
}

function createPersonality(overrides: Partial<PetPersonalityState> = {}): PetPersonalityState {
  return {
    personality: null,
    earlyActionCounts: {
      feed: 0,
      play: 0,
      sleep: 0,
      wash: 0,
    },
    assignedAt: null,
    ...overrides,
  }
}

function createSidePanelProps(overrides: Record<string, unknown> = {}) {
  return {
    mode: 'status',
    name: '탭펫',
    level: 3,
    levelProgress: {
      current: 80,
      required: 135,
      percent: 59,
    },
    affinityProgress: {
      level: 2,
      current: 30,
      required: 110,
      percent: 27,
    },
    dailyGoal: {
      dateKey: '2026-05-20',
      goalId: 'recommended-care',
      progress: 0,
      completedAt: null,
      claimedAt: null,
    },
    dailyGoalRewardFeedback: null,
    personality: createPersonality(),
    settings: createTestSettings(),
    ...overrides,
  }
}

function createPetActionsProps(overrides: Record<string, unknown> = {}) {
  return {
    stats: {
      fullness: 70,
      energy: 70,
      cleanliness: 70,
    },
    lastPlayedAt: 0,
    cooldowns: {
      feed: 0,
      play: 0,
      sleep: 0,
      wash: 0,
    },
    activeReaction: null,
    actionLimitInfo: {
      used: 1,
      limit: 5,
      remaining: 4,
      resetAt: 31 * 60 * 1000,
      windowMs: 30 * 60 * 1000,
    },
    careFeedback: {
      action: 'feed',
      statChanges: {
        fullness: 28,
        energy: -3,
        cleanliness: -2,
      },
      gainedExp: 12,
      gainedAffinityExp: 3,
      didLevelUp: false,
      didAffinityLevelUp: false,
      wasReduced: false,
      createdAt: 1000,
      personalityReveal: {
        personality: 'hungry',
        reasonActionCounts: {
          feed: 2,
          play: 1,
          sleep: 0,
          wash: 0,
        },
      },
      personalityBonus: {
        personality: 'hungry',
        action: 'feed',
        expBonus: 0,
        affinityBonus: 1,
      },
    },
    actionLimitRewardFeedback: null,
    recommendedCareAction: null,
    levelProgress: {
      current: 8,
      required: 135,
      percent: 6,
    },
    ...overrides,
  }
}

describe('pet personality UI', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('passes personality state into the side panel', () => {
    const template = readComponentTemplate('app.vue')

    expect(template).toContain(':personality="currentPet.personality"')
  })

  it('renders personality sections in the side panel and care feedback', () => {
    const sideTemplate = readComponentTemplate('components/PetSidePanel.vue')
    const actionsTemplate = readComponentTemplate('components/PetActions.vue')

    expect(sideTemplate).toContain('class="pet-personality"')
    expect(sideTemplate).toContain('personalityProgress')
    expect(sideTemplate).toContain('messages.personality.heading')
    expect(actionsTemplate).toContain('class="care-feedback__personality"')
    expect(actionsTemplate).toContain('shouldShowFeedbackPersonalityReveal')
    expect(actionsTemplate).toContain('shouldShowFeedbackPersonalityBonus')
  })

  it('formats forming and assigned personality copy from localized messages', () => {
    vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
    const component = loadScriptSetupComponent<PetSidePanelSetup>('components/PetSidePanel.vue')

    const forming = component.setup(createSidePanelProps({
      personality: createPersonality({
        earlyActionCounts: {
          feed: 1,
          play: 0,
          sleep: 0,
          wash: 0,
        },
      }),
    }), {
      emit: vi.fn(),
      expose: vi.fn(),
    })

    expect(forming.personalityProgress.value).toEqual({
      current: 1,
      required: 3,
      remaining: 2,
    })
    expect(forming.personalityName.value).toBe('성향 형성 중')

    const assigned = component.setup(createSidePanelProps({
      personality: createPersonality({
        personality: 'playful',
        earlyActionCounts: {
          feed: 0,
          play: 3,
          sleep: 0,
          wash: 0,
        },
        assignedAt: 1000,
      }),
    }), {
      emit: vi.fn(),
      expose: vi.fn(),
    })

    expect(assigned.personalityName.value).toBe('활발형')
    expect(assigned.personalityBonusText.value).toContain('놀아주기')
  })

  it('formats personality reveal and bonus feedback', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

    const setup = component.setup(createPetActionsProps(), {
      emit: vi.fn(),
      expose: vi.fn(),
    })

    expect(setup.shouldShowFeedbackPersonalityReveal.value).toBe(true)
    expect(setup.shouldShowFeedbackPersonalityBonus.value).toBe(true)
    expect(setup.feedbackPersonalityName.value).toBe('푸근형')
    expect(setup.feedbackPersonalityBonusText.value).toContain('+1')
  })

  it('keeps personality copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const personality = I18N_MESSAGES[locale].personality

      expect(personality.heading.length).toBeGreaterThan(0)
      expect(personality.formingName.length).toBeGreaterThan(0)
      expect(personality.formingDetail).toContain('{remaining}')
      expect(personality.progress).toContain('{current}')
      expect(personality.progress).toContain('{required}')
      expect(personality.revealLabel.length).toBeGreaterThan(0)
      expect(personality.bonusLabel.length).toBeGreaterThan(0)
      expect(personality.bonusApplied).toContain('{bonus}')
      expect(personality.personalities.calm.name.length).toBeGreaterThan(0)
      expect(personality.personalities.hungry.bonus.length).toBeGreaterThan(0)
      expect(personality.personalities.playful.detail.length).toBeGreaterThan(0)
      expect(personality.personalities.sleepy.bonus.length).toBeGreaterThan(0)
      expect(personality.personalities.neat.name.length).toBeGreaterThan(0)
    }
  })

  it('defines compact responsive personality styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.pet-personality')
    expect(css).toContain('.care-feedback__personality')
    expect(css).toMatch(/\.pet-personality strong\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.care-feedback__personality strong\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.care-feedback__personality\s*\{[^}]*grid-template-columns: 1fr;/,
    )
  })
})
```

- [ ] **Step 2: Run UI test to verify it fails**

Run:

```bash
npm run test -- tests/pet-personality-ui.test.ts
```

Expected: FAIL because app wiring, component computed values, copy, and CSS do not exist.

- [ ] **Step 3: Add localized personality copy**

In each locale object in `constants/i18n.ts`, add a `personality` section near `levelUnlocks`.

English:

```ts
    personality: {
      heading: 'Personality',
      formingName: 'Personality forming',
      formingDetail: '{remaining} more early care actions will shape this pet.',
      progress: '{current}/{required} early care actions',
      revealLabel: 'Personality discovered',
      bonusLabel: 'Personality bonus',
      bonusApplied: '{name} bonus {bonus}',
      personalities: {
        calm: {
          name: 'Calm',
          detail: 'Balanced early care made this pet steady.',
          bonus: 'No numeric bonus. Steady care stays flexible.',
        },
        hungry: {
          name: 'Warm',
          detail: 'Food-focused early care made this pet extra cozy.',
          bonus: 'Feed grants a small affinity bonus.',
        },
        playful: {
          name: 'Playful',
          detail: 'Play-focused early care made this pet lively.',
          bonus: 'Play grants a small affinity bonus.',
        },
        sleepy: {
          name: 'Relaxed',
          detail: 'Rest-focused early care made this pet soft and settled.',
          bonus: 'Sleep grants a small EXP bonus.',
        },
        neat: {
          name: 'Neat',
          detail: 'Clean-focused early care made this pet tidy.',
          bonus: 'Wash grants a small affinity bonus.',
        },
      },
    },
```

Korean:

```ts
    personality: {
      heading: '성격',
      formingName: '성향 형성 중',
      formingDetail: '초반 돌봄 {remaining}회를 더 완료하면 성격이 정해져요.',
      progress: '초반 돌봄 {current}/{required}회',
      revealLabel: '성격 발견',
      bonusLabel: '성격 보너스',
      bonusApplied: '{name} 보너스 {bonus}',
      personalities: {
        calm: {
          name: '차분형',
          detail: '균형 잡힌 초반 돌봄으로 차분한 성향이 되었어요.',
          bonus: '숫자 보너스 없이 어떤 돌봄에도 안정적으로 반응해요.',
        },
        hungry: {
          name: '푸근형',
          detail: '먹이기 중심의 초반 돌봄으로 포근한 성향이 되었어요.',
          bonus: '먹이기 때 친밀도 보너스를 조금 받아요.',
        },
        playful: {
          name: '활발형',
          detail: '놀아주기 중심의 초반 돌봄으로 활발한 성향이 되었어요.',
          bonus: '놀아주기 때 친밀도 보너스를 조금 받아요.',
        },
        sleepy: {
          name: '느긋형',
          detail: '재우기 중심의 초반 돌봄으로 느긋한 성향이 되었어요.',
          bonus: '재우기 때 경험치 보너스를 조금 받아요.',
        },
        neat: {
          name: '단정형',
          detail: '씻기기 중심의 초반 돌봄으로 단정한 성향이 되었어요.',
          bonus: '씻기기 때 친밀도 보너스를 조금 받아요.',
        },
      },
    },
```

Japanese:

```ts
    personality: {
      heading: '性格',
      formingName: '性格が育っています',
      formingDetail: 'あと{remaining}回の序盤ケアで性格が決まります。',
      progress: '序盤ケア {current}/{required} 回',
      revealLabel: '性格を発見',
      bonusLabel: '性格ボーナス',
      bonusApplied: '{name}ボーナス {bonus}',
      personalities: {
        calm: {
          name: 'おだやか',
          detail: 'バランスのよい序盤ケアで落ち着いた性格になりました。',
          bonus: '数値ボーナスはありません。どのケアにも安定して反応します。',
        },
        hungry: {
          name: 'ぬくもり',
          detail: 'ごはん中心の序盤ケアであたたかい性格になりました。',
          bonus: 'ごはんで親密度ボーナスを少し得ます。',
        },
        playful: {
          name: 'あそび好き',
          detail: 'あそび中心の序盤ケアで元気な性格になりました。',
          bonus: 'あそびで親密度ボーナスを少し得ます。',
        },
        sleepy: {
          name: 'のんびり',
          detail: '休み中心の序盤ケアでやわらかい性格になりました。',
          bonus: '休みでEXPボーナスを少し得ます。',
        },
        neat: {
          name: 'きれい好き',
          detail: 'きれいにするケア中心で整った性格になりました。',
          bonus: 'きれいにするケアで親密度ボーナスを少し得ます。',
        },
      },
    },
```

- [ ] **Step 4: Pass personality to the side panel**

In `app.vue`, add to `<PetSidePanel>`:

```vue
          :personality="currentPet.personality"
```

- [ ] **Step 5: Add side-panel personality computed values and markup**

In `components/PetSidePanel.vue`, update imports:

```ts
  PetPersonality,
  PetPersonalityState,
```

and:

```ts
import { getPetPersonalityProgress } from '~/utils/petPersonality'
```

Add prop:

```ts
  personality: PetPersonalityState
```

Add computed helpers before `formatGoalProgress`:

```ts
const personalityProgress = computed(() => getPetPersonalityProgress(props.personality))
const assignedPersonality = computed(() => props.personality.personality)
const personalityName = computed(() => {
  const personality = assignedPersonality.value

  return personality
    ? messages.value.personality.personalities[personality].name
    : messages.value.personality.formingName
})
const personalityDetail = computed(() => {
  const personality = assignedPersonality.value

  if (personality) return messages.value.personality.personalities[personality].detail

  return messages.value.personality.formingDetail.replace(
    '{remaining}',
    String(personalityProgress.value.remaining),
  )
})
const personalityProgressText = computed(() =>
  messages.value.personality.progress
    .replace('{current}', String(personalityProgress.value.current))
    .replace('{required}', String(personalityProgress.value.required)),
)
const personalityBonusText = computed(() => {
  const personality = assignedPersonality.value

  return personality ? messages.value.personality.personalities[personality].bonus : personalityProgressText.value
})
```

Add this template block immediately after `<PetDailyGoal ... />` and before `<section class="progress-goals" ...>`:

```vue
      <section class="pet-personality" aria-labelledby="pet-personality-title">
        <div class="pet-personality__copy">
          <span>{{ messages.personality.heading }}</span>
          <strong id="pet-personality-title">{{ personalityName }}</strong>
          <small>{{ personalityDetail }}</small>
        </div>

        <p class="pet-personality__bonus">
          {{ personalityBonusText }}
        </p>
      </section>
```

- [ ] **Step 6: Add care feedback personality computed values and markup**

In `components/PetActions.vue`, import:

```ts
  PetPersonality,
```

Add computed values near `feedbackLevelUnlocks`:

```ts
const feedbackPersonalityReveal = computed(() => props.careFeedback?.personalityReveal ?? null)
const feedbackPersonalityBonus = computed(() => props.careFeedback?.personalityBonus ?? null)
const shouldShowFeedbackPersonalityReveal = computed(() => Boolean(feedbackPersonalityReveal.value))
const shouldShowFeedbackPersonalityBonus = computed(() => Boolean(feedbackPersonalityBonus.value))
const feedbackPersonality = computed<PetPersonality | null>(
  () => feedbackPersonalityReveal.value?.personality ?? feedbackPersonalityBonus.value?.personality ?? null,
)
const feedbackPersonalityName = computed(() => {
  const personality = feedbackPersonality.value

  return personality ? messages.value.personality.personalities[personality].name : ''
})
const feedbackPersonalityDetail = computed(() => {
  const reveal = feedbackPersonalityReveal.value
  if (!reveal) return ''

  return messages.value.personality.personalities[reveal.personality].detail
})
const feedbackPersonalityBonusText = computed(() => {
  const bonus = feedbackPersonalityBonus.value
  if (!bonus) return ''

  const bonusText = [
    bonus.expBonus > 0 ? `+${bonus.expBonus} ${messages.value.stats.exp}` : '',
    bonus.affinityBonus > 0 ? `+${bonus.affinityBonus} ${messages.value.stats.affinity}` : '',
  ].filter(Boolean).join(' · ')

  return messages.value.personality.bonusApplied
    .replace('{name}', feedbackPersonalityName.value)
    .replace('{bonus}', bonusText)
})
```

Inside `.care-feedback__overview`, after the level unlock block, add:

```vue
        <div
          v-if="shouldShowFeedbackPersonalityReveal || shouldShowFeedbackPersonalityBonus"
          class="care-feedback__personality"
        >
          <span>
            {{
              shouldShowFeedbackPersonalityReveal
                ? messages.personality.revealLabel
                : messages.personality.bonusLabel
            }}
          </span>
          <div>
            <strong>{{ feedbackPersonalityName }}</strong>
            <small v-if="shouldShowFeedbackPersonalityReveal">{{ feedbackPersonalityDetail }}</small>
            <small v-if="shouldShowFeedbackPersonalityBonus">{{ feedbackPersonalityBonusText }}</small>
          </div>
        </div>
```

- [ ] **Step 7: Add compact CSS**

In `assets/css/main.css`, place side-panel styles near `.level-unlocks` and feedback styles near `.care-feedback__unlock`:

```css
.pet-personality {
  background: color-mix(in srgb, var(--app-surface) 86%, var(--app-accent));
  border: 1px solid var(--app-border);
  border-radius: 8px;
  display: grid;
  gap: 10px;
  padding: 14px;
}

.pet-personality__copy {
  display: grid;
  gap: 4px;
}

.pet-personality span,
.pet-personality small {
  color: var(--app-muted);
  font-size: 0.82rem;
}

.pet-personality strong {
  color: var(--app-text);
  overflow-wrap: anywhere;
}

.pet-personality__bonus {
  color: var(--app-text);
  font-size: 0.88rem;
  margin: 0;
}

.care-feedback__personality {
  border: 1px solid var(--app-border);
  border-radius: 8px;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(96px, 0.35fr) 1fr;
  padding: 12px;
}

.care-feedback__personality > span,
.care-feedback__personality small {
  color: var(--app-muted);
  font-size: 0.82rem;
}

.care-feedback__personality strong {
  display: block;
  overflow-wrap: anywhere;
}
```

Inside the existing `@media (max-width: 720px)` block, add:

```css
  .care-feedback__personality {
    grid-template-columns: 1fr;
  }
```

- [ ] **Step 8: Run UI test to verify it passes**

Run:

```bash
npm run test -- tests/pet-personality-ui.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit UI and copy**

```bash
git add constants/i18n.ts app.vue components/PetSidePanel.vue components/PetActions.vue assets/css/main.css tests/pet-personality-ui.test.ts
git commit -m "feat(personality): show personality feedback"
```

---

### Task 5: Full Regression Verification

**Files:**

- No code files should be modified in this task unless a verification failure reveals a concrete defect.

- [ ] **Step 1: Run personality-focused tests**

Run:

```bash
npm run test -- tests/pet-personality.test.ts tests/pet-personality-ui.test.ts tests/pet-storage.test.ts tests/pet-model.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the full unit test suite**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 3: Run type checking**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Run E2E if browser verification is available**

Run:

```bash
npm run test:e2e
```

Expected: PASS with the repository's existing skipped test count.

If this fails before tests start because Nuxt cannot bind `127.0.0.1:3000`, rerun the same command in the normal local shell where port binding is available. Record the first failure as an environment issue and the second result as the E2E verification result.

- [ ] **Step 6: Inspect final diff**

Run:

```bash
git status --short --branch
git diff --stat HEAD
```

Expected: only personality implementation files are modified after the last feature commit.

- [ ] **Step 7: Commit verification fixes only if needed**

If Task 5 required code changes, commit those changes:

```bash
git add types/pet.ts constants/pet.ts utils/petPersonality.ts utils/petFactory.ts utils/petValidation.ts utils/petCare.ts composables/usePetStore.ts app.vue components/PetSidePanel.vue components/PetActions.vue assets/css/main.css constants/i18n.ts tests/pet-personality.test.ts tests/pet-personality-ui.test.ts tests/pet-storage.test.ts tests/pet-model.test.ts
git commit -m "fix(personality): stabilize personality release"
```

If no fixes were needed, do not create an empty commit.

---

## Self-Review Checklist

- [x] Spec coverage: first-three-care assignment, mixed fallback, reward bonus, reveal, side-panel display, migration, and tests are covered.
- [x] Scope control: personality selection, reroll, habitat art, title/favicon changes, decoration, and server features are excluded.
- [x] Type consistency: `PetPersonality`, `PetPersonalityState`, `PetPersonalityBonus`, `personalityReveal`, and `personalityBonus` are named consistently across tasks.
- [x] Storage consistency: version 4 preserves v1/v2/v3 migration behavior and adds only personality state.
- [x] Reward consistency: bonus is calculated from eligible care rewards and applied once per successful care action.
- [x] UI consistency: personality appears in the side panel after daily goal and before level unlocks; reveal appears inside the care feedback overview.
- [x] Verification consistency: focused tests, full tests, type check, build, and E2E path are listed.

## Execution Choice

Plan complete and saved to `docs/superpowers/plans/2026-05-20-pet-personality.md`. Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution - execute tasks in this session using executing-plans, batch execution with checkpoints.
