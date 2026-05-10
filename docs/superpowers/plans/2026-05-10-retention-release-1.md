# Retention Release 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first retention layer: a one-time return report after meaningful absence and one daily goal that rewards completing the recommended care action.

**Architecture:** Keep game rules in pure `utils/` modules, store durable state in `PetState`, and keep browser lifecycle behavior inside `usePetStore` and `useLocalPetStorage`. The return report is computed at restore time and kept as transient UI state; the daily goal is durable and migrates existing stored pets to storage version 3.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest, Playwright, localStorage.

---

## Scope

This plan implements only Release 1 from `docs/superpowers/specs/2026-05-10-retention-growth-design.md`:

- Return report
- One daily goal: complete recommended care
- EXP and affinity reward for daily completion
- Compact UI surfaces
- Unit, component, and E2E coverage

Visible level rewards, personality, decoration, and seasonal events remain outside this plan.

## File Structure

Create:

- `utils/petReturnReport.ts`: Pure return-report bucket, stat, and report selection logic.
- `utils/petDailyGoal.ts`: Pure daily-goal creation, reset, progress, reward-claim, and normalization logic.
- `components/PetReturnReport.vue`: Compact card rendered above care actions when a restore report exists.
- `components/PetDailyGoal.vue`: Compact side-panel daily goal with progress, completion, and claim states.
- `tests/pet-return-report.test.ts`: Unit tests for return report logic and localized copy keys.
- `tests/pet-daily-goal.test.ts`: Unit tests for daily goal logic, storage migration, and store reward behavior.
- `tests/pet-return-and-daily-ui.test.ts`: Static/component tests for app wiring, UI markup, i18n, and responsive CSS.

Modify:

- `types/pet.ts`: Add return report, daily goal, and reward feedback types; add `dailyGoal` to `PetState`.
- `constants/pet.ts`: Bump storage version to 3 and add return-report and daily-goal constants.
- `constants/i18n.ts`: Add return report and daily goal copy for `en`, `ko`, and `ja`.
- `utils/petFactory.ts`: Initialize `dailyGoal`.
- `utils/petValidation.ts`: Parse v3 state, migrate v2/v1 states to include `dailyGoal`, and normalize daily goal data.
- `composables/useLocalPetStorage.ts`: Add a metadata-loading function that preserves the previous `lastUpdatedAt` for return reports.
- `composables/usePetStore.ts`: Create return report on restore, progress daily goal when the recommended action completes, and expose reward claim state.
- `components/PetSidePanel.vue`: Render `PetDailyGoal` in the status panel.
- `app.vue`: Render `PetReturnReport`, pass daily goal props, and wire reward claim.
- `assets/css/main.css`: Add compact responsive styles.
- `e2e/smoke.spec.ts`: Add browser checks for return report and daily goal completion.

---

### Task 1: Return Report Pure Model

**Files:**

- Modify: `types/pet.ts`
- Modify: `constants/pet.ts`
- Create: `utils/petReturnReport.ts`
- Create: `tests/pet-return-report.test.ts`

- [ ] **Step 1: Write the failing return report tests**

Add `tests/pet-return-report.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  PET_RETURN_REPORT_MIN_ELAPSED_MS,
  PET_RETURN_REPORT_SHORT_MAX_MS,
  PET_RETURN_REPORT_MEDIUM_MAX_MS,
  PET_RETURN_REPORT_LONG_MAX_MS,
} from '~/constants/pet'
import type { PetState } from '~/types/pet'
import { createInitialPetState } from '~/utils/petFactory'
import {
  createPetReturnReport,
  getPetReturnReportBucket,
  getPrimaryReturnReportStat,
} from '~/utils/petReturnReport'

function createState(overrides: Partial<PetState> = {}): PetState {
  return {
    ...createInitialPetState('cat', 1000, { name: '몽이' }),
    ...overrides,
  }
}

describe('pet return report', () => {
  it('does not create a report for short absence', () => {
    const now = 1000 + PET_RETURN_REPORT_MIN_ELAPSED_MS - 1
    const state = createState({ lastUpdatedAt: now })

    expect(
      createPetReturnReport({
        state,
        previousLastUpdatedAt: 1000,
        now,
        recommendedCareAction: null,
      }),
    ).toBeNull()
  })

  it.each([
    [PET_RETURN_REPORT_MIN_ELAPSED_MS, 'short'],
    [PET_RETURN_REPORT_SHORT_MAX_MS + 1, 'medium'],
    [PET_RETURN_REPORT_MEDIUM_MAX_MS + 1, 'long'],
    [PET_RETURN_REPORT_LONG_MAX_MS + 1, 'capped'],
  ] as const)('maps %s elapsed ms to %s bucket', (elapsedMs, bucket) => {
    expect(getPetReturnReportBucket(elapsedMs)).toBe(bucket)
  })

  it('selects the lowest stat as primary report evidence', () => {
    expect(getPrimaryReturnReportStat({ fullness: 20, energy: 70, cleanliness: 80 })).toBe(
      'fullness',
    )
    expect(getPrimaryReturnReportStat({ fullness: 80, energy: 20, cleanliness: 70 })).toBe(
      'energy',
    )
    expect(getPrimaryReturnReportStat({ fullness: 80, energy: 70, cleanliness: 20 })).toBe(
      'cleanliness',
    )
  })

  it('creates a deterministic report from restored state and recommendation', () => {
    const now = 1000 + PET_RETURN_REPORT_MEDIUM_MAX_MS + 1000
    const state = createState({
      stats: {
        fullness: 18,
        energy: 60,
        cleanliness: 70,
      },
      lastUpdatedAt: now,
    })

    expect(
      createPetReturnReport({
        state,
        previousLastUpdatedAt: 1000,
        now,
        recommendedCareAction: {
          action: 'feed',
          reason: 'need',
          status: 'hungry',
          statKey: 'fullness',
        },
      }),
    ).toEqual({
      id: `return-${1000}-${now}`,
      elapsedMs: now - 1000,
      bucket: 'long',
      status: 'hungry',
      primaryStat: 'fullness',
      recommendedAction: 'feed',
      createdAt: now,
    })
  })
})
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
npm run -s test -- tests/pet-return-report.test.ts
```

Expected: FAIL because `utils/petReturnReport.ts`, return report types, and constants do not exist.

- [ ] **Step 3: Add return report types and constants**

In `types/pet.ts`, add after `PetCareFeedback`:

```ts
export type PetReturnReportBucket = 'short' | 'medium' | 'long' | 'capped'

export type PetReturnReport = {
  id: string
  elapsedMs: number
  bucket: PetReturnReportBucket
  status: PetStatus
  primaryStat: PetStatKey
  recommendedAction?: PetAction
  createdAt: number
}
```

In `constants/pet.ts`, add near the other time constants:

```ts
export const PET_RETURN_REPORT_MIN_ELAPSED_MS = 1000 * 60 * 30
export const PET_RETURN_REPORT_SHORT_MAX_MS = 1000 * 60 * 60 * 2
export const PET_RETURN_REPORT_MEDIUM_MAX_MS = 1000 * 60 * 60 * 8
export const PET_RETURN_REPORT_LONG_MAX_MS = 1000 * 60 * 60 * 24
```

- [ ] **Step 4: Implement `utils/petReturnReport.ts`**

Create `utils/petReturnReport.ts`:

```ts
import {
  PET_RETURN_REPORT_LONG_MAX_MS,
  PET_RETURN_REPORT_MEDIUM_MAX_MS,
  PET_RETURN_REPORT_MIN_ELAPSED_MS,
  PET_RETURN_REPORT_SHORT_MAX_MS,
} from '~/constants/pet'
import type {
  PetCareRecommendation,
  PetReturnReport,
  PetReturnReportBucket,
  PetStatKey,
  PetState,
  PetStats,
} from '~/types/pet'
import { getPetStatus } from '~/utils/petStatus'

export function getPetReturnReportBucket(elapsedMs: number): PetReturnReportBucket | null {
  if (!Number.isFinite(elapsedMs) || elapsedMs < PET_RETURN_REPORT_MIN_ELAPSED_MS) return null
  if (elapsedMs <= PET_RETURN_REPORT_SHORT_MAX_MS) return 'short'
  if (elapsedMs <= PET_RETURN_REPORT_MEDIUM_MAX_MS) return 'medium'
  if (elapsedMs <= PET_RETURN_REPORT_LONG_MAX_MS) return 'long'

  return 'capped'
}

export function getPrimaryReturnReportStat(stats: PetStats): PetStatKey {
  const statKeys: PetStatKey[] = ['fullness', 'energy', 'cleanliness']

  return statKeys.reduce((lowest, current) =>
    stats[current] < stats[lowest] ? current : lowest,
  )
}

export function createPetReturnReport(input: {
  state: PetState
  previousLastUpdatedAt: number
  now?: number
  recommendedCareAction?: PetCareRecommendation | null
}): PetReturnReport | null {
  const now = input.now ?? Date.now()
  const elapsedMs = Math.max(0, now - input.previousLastUpdatedAt)
  const bucket = getPetReturnReportBucket(elapsedMs)

  if (!bucket) return null

  const status = getPetStatus(input.state.stats, input.state.lastPlayedAt, now)
  const recommendedAction = input.recommendedCareAction?.action

  return {
    id: `return-${input.previousLastUpdatedAt}-${now}`,
    elapsedMs,
    bucket,
    status,
    primaryStat: getPrimaryReturnReportStat(input.state.stats),
    ...(recommendedAction ? { recommendedAction } : {}),
    createdAt: now,
  }
}
```

- [ ] **Step 5: Run the return report tests**

Run:

```bash
npm run -s test -- tests/pet-return-report.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add types/pet.ts constants/pet.ts utils/petReturnReport.ts tests/pet-return-report.test.ts
git commit -m "feat: add return report model"
```

---

### Task 2: Daily Goal Model and Storage Migration

**Files:**

- Modify: `types/pet.ts`
- Modify: `constants/pet.ts`
- Create: `utils/petDailyGoal.ts`
- Modify: `utils/petFactory.ts`
- Modify: `utils/petValidation.ts`
- Create: `tests/pet-daily-goal.test.ts`
- Modify: `tests/pet-model.test.ts`

- [ ] **Step 1: Write the failing daily goal utility tests**

Create `tests/pet-daily-goal.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  DAILY_GOAL_REWARD_AFFINITY_EXP,
  DAILY_GOAL_REWARD_EXP,
  PET_STORAGE_VERSION,
} from '~/constants/pet'
import { createInitialPetState } from '~/utils/petFactory'
import {
  claimDailyGoalReward,
  createDailyGoal,
  getLocalDateKey,
  progressDailyGoal,
  resolveDailyGoalForToday,
} from '~/utils/petDailyGoal'
import { parseStoredPetState, toStoredPetState } from '~/utils/petValidation'

describe('pet daily goal model', () => {
  it('creates a recommended-care daily goal for the local day', () => {
    const now = new Date('2026-05-10T09:00:00+09:00').getTime()

    expect(createDailyGoal(now)).toEqual({
      dateKey: getLocalDateKey(now),
      goalId: 'recommended-care',
      progress: 0,
      completedAt: null,
      claimedAt: null,
    })
  })

  it('resets stale goal state on a new local date', () => {
    const today = new Date('2026-05-10T09:00:00+09:00').getTime()
    const yesterday = new Date('2026-05-09T09:00:00+09:00').getTime()

    expect(resolveDailyGoalForToday(createDailyGoal(yesterday), today)).toEqual(createDailyGoal(today))
  })

  it('completes the goal only when the recommended care goal advances', () => {
    const now = 1000
    const goal = createDailyGoal(now)

    expect(progressDailyGoal(goal, { goalId: 'recommended-care', now })).toEqual({
      ...goal,
      progress: 1,
      completedAt: now,
    })
  })

  it('claims the daily reward once', () => {
    const completedGoal = progressDailyGoal(createDailyGoal(1000), {
      goalId: 'recommended-care',
      now: 2000,
    })
    const result = claimDailyGoalReward({
      goal: completedGoal,
      growth: {
        level: 1,
        exp: 0,
        affinityExp: 0,
      },
      now: 3000,
    })

    expect(result).toEqual({
      goal: {
        ...completedGoal,
        claimedAt: 3000,
      },
      growth: {
        level: 1,
        exp: DAILY_GOAL_REWARD_EXP,
        affinityExp: DAILY_GOAL_REWARD_AFFINITY_EXP,
      },
      feedback: {
        gainedExp: DAILY_GOAL_REWARD_EXP,
        gainedAffinityExp: DAILY_GOAL_REWARD_AFFINITY_EXP,
        createdAt: 3000,
      },
    })

    expect(
      claimDailyGoalReward({
        goal: result.goal,
        growth: result.growth,
        now: 4000,
      }),
    ).toBeNull()
  })
})

describe('pet daily goal storage migration', () => {
  it('stores version 3 state with a daily goal', () => {
    const state = createInitialPetState('cat', 1000)
    const stored = toStoredPetState(state, PET_STORAGE_VERSION)

    expect(stored.version).toBe(3)
    expect(stored.dailyGoal).toEqual(createDailyGoal(1000))
  })

  it('migrates version 2 stored state to include a daily goal', () => {
    const state = createInitialPetState('cat', 1000)
    const storedV2 = {
      ...toStoredPetState(state, 2),
      version: 2,
    }
    const parsed = parseStoredPetState(storedV2, 2000)

    expect(parsed?.dailyGoal).toEqual(createDailyGoal(2000))
  })
})
```

- [ ] **Step 2: Run the daily goal test to verify it fails**

Run:

```bash
npm run -s test -- tests/pet-daily-goal.test.ts
```

Expected: FAIL because daily goal types, constants, utility functions, and storage migration do not exist.

- [ ] **Step 3: Add daily goal types and constants**

In `types/pet.ts`, add after `PetReturnReport`:

```ts
export type PetDailyGoalId = 'recommended-care'

export type PetDailyGoalState = {
  dateKey: string
  goalId: PetDailyGoalId
  progress: number
  completedAt: number | null
  claimedAt: number | null
}

export type PetDailyGoalRewardFeedback = {
  gainedExp: number
  gainedAffinityExp: number
  createdAt: number
}
```

Then update `PetState`:

```ts
export type PetState = {
  species: PetSpecies
  name: string
  stats: PetStats
  growth: PetGrowth
  settings: PetSettings
  actionLimit: PetActionLimit
  dailyGoal: PetDailyGoalState
  lastUpdatedAt: number
  lastPlayedAt: number
}
```

In `constants/pet.ts`, update and add:

```ts
export const PET_STORAGE_VERSION = 3

export const DAILY_GOAL_REWARD_EXP = 20
export const DAILY_GOAL_REWARD_AFFINITY_EXP = 4
```

- [ ] **Step 4: Implement `utils/petDailyGoal.ts`**

Create `utils/petDailyGoal.ts`:

```ts
import {
  DAILY_GOAL_REWARD_AFFINITY_EXP,
  DAILY_GOAL_REWARD_EXP,
} from '~/constants/pet'
import type {
  PetDailyGoalId,
  PetDailyGoalRewardFeedback,
  PetDailyGoalState,
  PetGrowth,
} from '~/types/pet'
import { addAffinityExp, addLevelExp, normalizeGrowth } from '~/utils/petGrowth'

const DAILY_GOAL_ID: PetDailyGoalId = 'recommended-care'

export function getLocalDateKey(now = Date.now()): string {
  const date = new Date(now)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function createDailyGoal(now = Date.now()): PetDailyGoalState {
  return {
    dateKey: getLocalDateKey(now),
    goalId: DAILY_GOAL_ID,
    progress: 0,
    completedAt: null,
    claimedAt: null,
  }
}

export function normalizeDailyGoalState(value: unknown, now = Date.now()): PetDailyGoalState {
  if (!isRecord(value)) return createDailyGoal(now)

  const goal: PetDailyGoalState = {
    dateKey: typeof value.dateKey === 'string' ? value.dateKey : getLocalDateKey(now),
    goalId: value.goalId === DAILY_GOAL_ID ? DAILY_GOAL_ID : DAILY_GOAL_ID,
    progress: normalizeProgress(value.progress),
    completedAt: normalizeNullableTimestamp(value.completedAt),
    claimedAt: normalizeNullableTimestamp(value.claimedAt),
  }

  return resolveDailyGoalForToday(goal, now)
}

export function resolveDailyGoalForToday(
  goal: PetDailyGoalState | null | undefined,
  now = Date.now(),
): PetDailyGoalState {
  if (!goal) return createDailyGoal(now)

  return goal.dateKey === getLocalDateKey(now) ? goal : createDailyGoal(now)
}

export function progressDailyGoal(
  goal: PetDailyGoalState,
  input: {
    goalId: PetDailyGoalId
    now?: number
  },
): PetDailyGoalState {
  const now = input.now ?? Date.now()
  const currentGoal = resolveDailyGoalForToday(goal, now)

  if (currentGoal.goalId !== input.goalId || currentGoal.completedAt !== null) {
    return currentGoal
  }

  return {
    ...currentGoal,
    progress: 1,
    completedAt: now,
  }
}

export function claimDailyGoalReward(input: {
  goal: PetDailyGoalState
  growth: PetGrowth
  now?: number
}): {
  goal: PetDailyGoalState
  growth: PetGrowth
  feedback: PetDailyGoalRewardFeedback
} | null {
  const now = input.now ?? Date.now()
  const goal = resolveDailyGoalForToday(input.goal, now)

  if (goal.completedAt === null || goal.claimedAt !== null) return null

  const growth = addAffinityExp(
    addLevelExp(normalizeGrowth(input.growth), DAILY_GOAL_REWARD_EXP),
    DAILY_GOAL_REWARD_AFFINITY_EXP,
  )

  return {
    goal: {
      ...goal,
      claimedAt: now,
    },
    growth,
    feedback: {
      gainedExp: DAILY_GOAL_REWARD_EXP,
      gainedAffinityExp: DAILY_GOAL_REWARD_AFFINITY_EXP,
      createdAt: now,
    },
  }
}

function normalizeProgress(value: unknown): number {
  const progress = Number(value)

  if (!Number.isFinite(progress)) return 0

  return Math.max(0, Math.min(1, Math.floor(progress)))
}

function normalizeNullableTimestamp(value: unknown): number | null {
  if (value === null || value === undefined) return null

  const timestamp = Number(value)

  return Number.isFinite(timestamp) ? timestamp : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
```

- [ ] **Step 5: Initialize daily goal in pet factory**

Modify `utils/petFactory.ts` imports:

```ts
import { createPetActionLimit } from '~/utils/petActionLimit'
import { createDailyGoal } from '~/utils/petDailyGoal'
```

Add `dailyGoal` to the returned state:

```ts
    actionLimit: createPetActionLimit(now),
    dailyGoal: createDailyGoal(now),
    lastUpdatedAt: now,
```

- [ ] **Step 6: Migrate storage parsing to version 3**

Modify `utils/petValidation.ts` imports:

```ts
import type {
  DisguiseTitleId,
  PetActionLimit,
  PetDailyGoalState,
  PetGrowth,
  PetSettings,
  PetSpecies,
  PetState,
  PetStats,
  StoredPetState,
  ThemeId,
} from '~/types/pet'
import { createDailyGoal, normalizeDailyGoalState } from '~/utils/petDailyGoal'
```

Update `parseStoredPetState`:

```ts
  if (value.version === PET_STORAGE_VERSION) {
    return parseStoredPetStateV3(value, now)
  }

  if (value.version === 2) {
    return parseStoredPetStateV2(value, now)
  }
```

Add `parseStoredPetStateV3` above `parseStoredPetStateV2`:

```ts
function parseStoredPetStateV3(value: Record<string, unknown>, now: number): PetState {
  const state = parseStoredPetStateV2(value, now)

  return {
    ...state,
    dailyGoal: normalizeStoredDailyGoal(value.dailyGoal, now),
  }
}
```

Add `dailyGoal` to `toStoredPetState`:

```ts
    actionLimit: normalizeStoredActionLimit(state.actionLimit, state.lastUpdatedAt),
    dailyGoal: normalizeStoredDailyGoal(state.dailyGoal, state.lastUpdatedAt),
    version,
```

Add `dailyGoal` to both legacy parsers:

```ts
    actionLimit: normalizeStoredActionLimit(value.actionLimit, now),
    dailyGoal: createDailyGoal(now),
    lastUpdatedAt,
```

Add helper:

```ts
function normalizeStoredDailyGoal(value: unknown, now: number): PetDailyGoalState {
  return normalizeDailyGoalState(value, now)
}
```

- [ ] **Step 7: Run daily goal model tests**

Run:

```bash
npm run -s test -- tests/pet-daily-goal.test.ts tests/pet-model.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit daily goal model and migration**

Run:

```bash
git add types/pet.ts constants/pet.ts utils/petDailyGoal.ts utils/petFactory.ts utils/petValidation.ts tests/pet-daily-goal.test.ts tests/pet-model.test.ts
git commit -m "feat: add daily goal model"
```

---

### Task 3: Store Integration

**Files:**

- Modify: `composables/useLocalPetStorage.ts`
- Modify: `composables/usePetStore.ts`
- Modify: `tests/use-local-pet-storage.test.ts`
- Modify: `tests/pet-daily-goal.test.ts`

- [ ] **Step 1: Add failing storage metadata test**

Append to `tests/use-local-pet-storage.test.ts`:

```ts
  it('exposes the previous update timestamp when loading with metadata', () => {
    storage.setItem(
      PET_STORAGE_KEY,
      JSON.stringify({
        version: PET_STORAGE_VERSION,
        species: 'cat',
        stats: { fullness: 80, energy: 80, cleanliness: 80 },
        lastUpdatedAt: 1000,
        lastPlayedAt: 1000,
      }),
    )

    const { loadPetStateWithMeta } = useLocalPetStorage()
    const loaded = loadPetStateWithMeta(1000 + 1000 * 60 * 60)

    expect(loaded.state?.lastUpdatedAt).toBe(1000 + 1000 * 60 * 60)
    expect(loaded.previousLastUpdatedAt).toBe(1000)
  })
```

- [ ] **Step 2: Run storage test to verify it fails**

Run:

```bash
npm run -s test -- tests/use-local-pet-storage.test.ts
```

Expected: FAIL because `loadPetStateWithMeta` does not exist.

- [ ] **Step 3: Add storage metadata loading**

Modify `composables/useLocalPetStorage.ts`:

```ts
type LoadedPetState = {
  state: PetState | null
  previousLastUpdatedAt: number | null
}

export function useLocalPetStorage() {
  const storageError = ref<string | null>(null)

  function loadPetState(now = Date.now()): PetState | null {
    return loadPetStateWithMeta(now).state
  }

  function loadPetStateWithMeta(now = Date.now()): LoadedPetState {
    if (!import.meta.client) {
      return {
        state: null,
        previousLastUpdatedAt: null,
      }
    }

    try {
      storageError.value = null
      const raw = localStorage.getItem(PET_STORAGE_KEY)
      if (!raw) {
        return {
          state: null,
          previousLastUpdatedAt: null,
        }
      }

      const parsed = parseStoredPetState(JSON.parse(raw), now)
      if (!parsed) {
        return {
          state: null,
          previousLastUpdatedAt: null,
        }
      }

      const previousLastUpdatedAt = parsed.lastUpdatedAt
      const restored: PetState = {
        ...parsed,
        stats: applyOfflineDecay(parsed.stats, parsed.lastUpdatedAt, now),
        lastUpdatedAt: now,
      }

      savePetState(restored, now)

      return {
        state: restored,
        previousLastUpdatedAt,
      }
    } catch (error) {
      storageError.value = getErrorMessage(error)

      return {
        state: null,
        previousLastUpdatedAt: null,
      }
    }
  }
```

Return `loadPetStateWithMeta`:

```ts
  return {
    storageError,
    loadPetState,
    loadPetStateWithMeta,
    savePetState,
    clearPetState,
  }
```

- [ ] **Step 4: Add failing store behavior test**

Append to `tests/pet-daily-goal.test.ts`:

```ts
import type { Ref } from 'vue'
import { beforeEach, vi } from 'vitest'
import { usePetStore } from '~/composables/usePetStore'
import type { PetState } from '~/types/pet'

const nuxtState = vi.hoisted(() => new Map<string, Ref<unknown>>())

vi.mock('#app', async () => {
  const { ref } = await vi.importActual<typeof import('vue')>('vue')

  return {
    useState: <T>(key: string, init: () => T): Ref<T> => {
      if (!nuxtState.has(key)) {
        nuxtState.set(key, ref(init()) as Ref<unknown>)
      }

      return nuxtState.get(key) as Ref<T>
    },
  }
})

describe('pet daily goal store behavior', () => {
  const savedStates: PetState[] = []

  beforeEach(() => {
    nuxtState.clear()
    savedStates.length = 0
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocalPetStorage', () => ({
      storageError: { value: null },
      loadPetState: () => null,
      loadPetStateWithMeta: () => ({
        state: null,
        previousLastUpdatedAt: null,
      }),
      savePetState: (state: PetState) => {
        savedStates.push(state)
      },
      clearPetState: vi.fn(),
    }))
  })

  it('completes and claims the daily goal after recommended care resolves', () => {
    const callbacks: Array<() => void> = []
    const store = usePetStore({
      scheduleAction: (callback) => {
        callbacks.push(callback)
      },
    })

    store.initializePet('cat')
    expect(store.petState.value?.dailyGoal.completedAt).toBeNull()

    store.performAction(store.recommendedCareAction.value!.action)
    callbacks[0]?.()

    expect(store.petState.value?.dailyGoal.completedAt).toBe(1000)

    store.claimDailyGoalReward()

    expect(store.petState.value?.dailyGoal.claimedAt).toBe(1000)
    expect(store.dailyGoalRewardFeedback.value).toMatchObject({
      gainedExp: DAILY_GOAL_REWARD_EXP,
      gainedAffinityExp: DAILY_GOAL_REWARD_AFFINITY_EXP,
    })
    expect(savedStates.at(-1)?.growth.exp).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 5: Run store behavior test to verify it fails**

Run:

```bash
npm run -s test -- tests/pet-daily-goal.test.ts
```

Expected: FAIL because `claimDailyGoalReward` and `dailyGoalRewardFeedback` are not exposed by `usePetStore`.

- [ ] **Step 6: Wire return report and daily goal into `usePetStore`**

Modify `composables/usePetStore.ts` imports:

```ts
import type {
  DisguiseTitleId,
  PetAction,
  PetActionLimitRewardFeedback,
  PetCareFeedback,
  PetDailyGoalRewardFeedback,
  PetReturnReport,
  PetSettings,
  PetSpecies,
  PetStats,
  PetState,
  ThemeId,
} from '~/types/pet'
import {
  claimDailyGoalReward as claimDailyGoalRewardResult,
  progressDailyGoal,
  resolveDailyGoalForToday,
} from '~/utils/petDailyGoal'
import { createPetReturnReport } from '~/utils/petReturnReport'
```

Add state near `lastCareFeedback`:

```ts
  const returnReport = useState<PetReturnReport | null>('tab-pet:return-report', () => null)
  const dailyGoalRewardFeedbackState = useState<PetDailyGoalRewardFeedback | null>(
    'tab-pet:daily-goal-reward-feedback',
    () => null,
  )
```

Update `restorePet`:

```ts
  function restorePet(): void {
    if (!import.meta.client || hasRestored.value) return

    const restoredAt = Date.now()
    now.value = restoredAt
    const restored = storage.loadPetStateWithMeta(restoredAt)
    petState.value = restored.state
    if (restored.state && restored.previousLastUpdatedAt !== null) {
      const restoredStatus = getPetStatus(
        restored.state.stats,
        restored.state.lastPlayedAt,
        restoredAt,
      )
      returnReport.value = createPetReturnReport({
        state: restored.state,
        previousLastUpdatedAt: restored.previousLastUpdatedAt,
        now: restoredAt,
        recommendedCareAction: getRecommendedCareAction({
          stats: restored.state.stats,
          status: restoredStatus,
        }),
      })
    } else {
      returnReport.value = null
    }
    hasRestored.value = true
    isReady.value = true
  }
```

In `initializePet` and `resetPet`, clear `returnReport` and `dailyGoalRewardFeedbackState`:

```ts
    returnReport.value = null
    dailyGoalRewardFeedbackState.value = null
```

At the start of `performAction`, clear stale daily reward feedback and capture whether the started action was recommended:

```ts
    dailyGoalRewardFeedbackState.value = null
    const wasRecommendedCareAction = recommendedCareAction.value?.action === action
```

In the delayed `resolveAction`, include the daily goal update before `commitState`:

```ts
      const resolvedDailyGoal = wasRecommendedCareAction
        ? progressDailyGoal(previousState.dailyGoal, {
            goalId: 'recommended-care',
            now: resolvedAt,
          })
        : resolveDailyGoalForToday(previousState.dailyGoal, resolvedAt)

      commitState({
        ...previousState,
        stats: result.stats,
        growth: result.growth,
        dailyGoal: resolvedDailyGoal,
        lastPlayedAt: action === 'play' ? resolvedAt : previousState.lastPlayedAt,
      })
```

Add the reward claim method:

```ts
  function claimDailyGoalReward(): void {
    if (!petState.value) return

    const claimedAt = Date.now()
    const result = claimDailyGoalRewardResult({
      goal: petState.value.dailyGoal,
      growth: petState.value.growth,
      now: claimedAt,
    })
    if (!result) return

    commitState({
      ...petState.value,
      growth: result.growth,
      dailyGoal: result.goal,
    })
    dailyGoalRewardFeedbackState.value = result.feedback
  }
```

Return the new values and method:

```ts
    returnReport: readonly(returnReport),
    dailyGoalRewardFeedback: readonly(dailyGoalRewardFeedbackState),
    claimDailyGoalReward,
```

- [ ] **Step 7: Run store and storage tests**

Run:

```bash
npm run -s test -- tests/use-local-pet-storage.test.ts tests/pet-daily-goal.test.ts tests/pet-model.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit store integration**

Run:

```bash
git add composables/useLocalPetStorage.ts composables/usePetStore.ts tests/use-local-pet-storage.test.ts tests/pet-daily-goal.test.ts tests/pet-model.test.ts
git commit -m "feat: wire return report and daily goal store"
```

---

### Task 4: UI Components and Localization

**Files:**

- Create: `components/PetReturnReport.vue`
- Create: `components/PetDailyGoal.vue`
- Modify: `constants/i18n.ts`
- Modify: `components/PetSidePanel.vue`
- Modify: `app.vue`
- Modify: `assets/css/main.css`
- Create: `tests/pet-return-and-daily-ui.test.ts`

- [ ] **Step 1: Write failing UI and i18n tests**

Create `tests/pet-return-and-daily-ui.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const

function readComponentTemplate(componentPath: string): string {
  const filename = resolve(componentPath)
  const source = readFileSync(filename, 'utf8')
  const descriptor = parse(source, { filename }).descriptor

  return descriptor.template?.content ?? ''
}

function readSource(sourcePath: string): string {
  return readFileSync(resolve(sourcePath), 'utf8')
}

describe('return report and daily goal UI', () => {
  it('renders the return report above care actions in the main pet flow', () => {
    const template = readComponentTemplate('app.vue')
    const statusIndex = template.indexOf('<PetStatusPanel')
    const reportIndex = template.indexOf('<PetReturnReport')
    const actionsIndex = template.indexOf('<PetActions')

    expect(statusIndex).toBeGreaterThan(-1)
    expect(reportIndex).toBeGreaterThan(statusIndex)
    expect(actionsIndex).toBeGreaterThan(reportIndex)
    expect(template).toContain(':report="pet.returnReport.value"')
  })

  it('passes daily goal state into the side panel', () => {
    const template = readComponentTemplate('app.vue')

    expect(template).toContain(':daily-goal="currentPet.dailyGoal"')
    expect(template).toContain(':daily-goal-reward-feedback="pet.dailyGoalRewardFeedback.value"')
    expect(template).toContain('@claim-daily-goal="pet.claimDailyGoalReward"')
  })

  it('renders the daily goal inside the side panel status body', () => {
    const template = readComponentTemplate('components/PetSidePanel.vue')

    expect(template).toContain('<PetDailyGoal')
    expect(template).toContain(':daily-goal="dailyGoal"')
    expect(template).toContain('@claim="emit(\'claimDailyGoal\')"')
  })

  it('keeps return report and daily goal copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const messages = I18N_MESSAGES[locale]

      expect(messages.returnReport.heading.length).toBeGreaterThan(0)
      expect(messages.returnReport.actions.feed).toContain('{action}')
      expect(messages.dailyGoal.heading.length).toBeGreaterThan(0)
      expect(messages.dailyGoal.rewards).toContain('{exp}')
      expect(messages.dailyGoal.claim.length).toBeGreaterThan(0)
    }
  })

  it('defines compact responsive styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.return-report')
    expect(css).toContain('.daily-goal')
    expect(css).toMatch(/\.return-report__title\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.daily-goal__title\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/@media \(max-width: 720px\)[\s\S]*\.daily-goal\s*\{/)
  })
})
```

- [ ] **Step 2: Run the UI test to verify it fails**

Run:

```bash
npm run -s test -- tests/pet-return-and-daily-ui.test.ts
```

Expected: FAIL because the components, i18n messages, and app wiring do not exist.

- [ ] **Step 3: Add localized copy**

In `constants/i18n.ts`, add these keys to each locale object. For Korean:

```ts
    returnReport: {
      heading: '다시 만난 탭 펫',
      elapsed: {
        short: '잠깐 자리를 비운 사이',
        medium: '몇 시간 동안',
        long: '오랫동안',
        capped: '하루 넘게',
      },
      status: {
        happy: '{name}가 조용히 기다렸어요.',
        fine: '{name}가 조용히 기다렸어요.',
        excited: '{name}가 다시 만나서 들떠 보여요.',
        hungry: '{name}가 배고파 보여요.',
        sleepy: '{name}가 꾸벅꾸벅 졸고 있었어요.',
        dirty: '{name}가 조금 지저분해졌어요.',
        bored: '{name}가 심심해하고 있었어요.',
      },
      actions: {
        feed: '{action}로 바로 돌봐주세요.',
        play: '{action}로 다시 연결해주세요.',
        sleep: '{action}로 쉬게 해주세요.',
        wash: '{action}로 상쾌하게 해주세요.',
      },
      stable: '탭을 열어둔 덕분에 상태를 바로 확인할 수 있어요.',
    },
    dailyGoal: {
      heading: '오늘의 목표',
      title: '추천 돌봄 1회 완료',
      description: '추천된 돌봄을 한 번 완료하면 오늘 보상을 받을 수 있어요.',
      progress: '{current}/{required} 완료',
      completed: '오늘 목표를 완료했어요.',
      rewards: '+{exp} EXP · +{affinity} 친밀도',
      claim: '보상 받기',
      claimed: '오늘 보상을 받았어요.',
      rewardFeedback: '+{exp} EXP · +{affinity} 친밀도 획득',
    },
```

For English:

```ts
    returnReport: {
      heading: 'Welcome back',
      elapsed: {
        short: 'While you were away',
        medium: 'For a few hours',
        long: 'For a long while',
        capped: 'For more than a day',
      },
      status: {
        happy: '{name} waited quietly.',
        fine: '{name} waited quietly.',
        excited: '{name} looks glad you came back.',
        hungry: '{name} looks hungry.',
        sleepy: '{name} was dozing in the tab.',
        dirty: '{name} got a little messy.',
        bored: '{name} was getting bored.',
      },
      actions: {
        feed: 'Use {action} to help now.',
        play: 'Use {action} to reconnect.',
        sleep: 'Use {action} to let them rest.',
        wash: 'Use {action} to refresh them.',
      },
      stable: 'The tab stayed ready so you could check in quickly.',
    },
    dailyGoal: {
      heading: 'Daily goal',
      title: 'Complete one recommended care',
      description: 'Finish the recommended care once to claim today’s reward.',
      progress: '{current}/{required} complete',
      completed: 'Today’s goal is complete.',
      rewards: '+{exp} EXP · +{affinity} affinity',
      claim: 'Claim reward',
      claimed: 'Today’s reward is claimed.',
      rewardFeedback: '+{exp} EXP · +{affinity} affinity gained',
    },
```

For Japanese:

```ts
    returnReport: {
      heading: 'おかえりなさい',
      elapsed: {
        short: '少し離れている間',
        medium: '数時間の間',
        long: '長い間',
        capped: '一日以上',
      },
      status: {
        happy: '{name}は静かに待っていました。',
        fine: '{name}は静かに待っていました。',
        excited: '{name}はまた会えてうれしそうです。',
        hungry: '{name}はお腹が空いているようです。',
        sleepy: '{name}はタブの中でうとうとしていました。',
        dirty: '{name}は少し汚れてしまいました。',
        bored: '{name}は退屈そうにしていました。',
      },
      actions: {
        feed: '{action}で今すぐお世話しましょう。',
        play: '{action}でもう一度つながりましょう。',
        sleep: '{action}で休ませましょう。',
        wash: '{action}ですっきりさせましょう。',
      },
      stable: 'タブを開いていたので、すぐに様子を確認できます。',
    },
    dailyGoal: {
      heading: '今日の目標',
      title: 'おすすめのお世話を1回完了',
      description: 'おすすめのお世話を一度完了すると、今日の報酬を受け取れます。',
      progress: '{current}/{required} 完了',
      completed: '今日の目標を完了しました。',
      rewards: '+{exp} EXP · +{affinity} 親密度',
      claim: '報酬を受け取る',
      claimed: '今日の報酬を受け取りました。',
      rewardFeedback: '+{exp} EXP · +{affinity} 親密度を獲得',
    },
```

- [ ] **Step 4: Create `PetReturnReport.vue`**

Create `components/PetReturnReport.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { PetAction, PetReturnReport } from '~/types/pet'

const props = defineProps<{
  report: PetReturnReport | null
  petName: string
}>()

const { messages } = useLocale()

const shouldShowReport = computed(() => Boolean(props.report))
const reportTitle = computed(() => {
  const report = props.report
  if (!report) return ''

  return `${messages.value.returnReport.elapsed[report.bucket]} · ${messages.value.returnReport.heading}`
})
const reportDetail = computed(() => {
  const report = props.report
  if (!report) return ''

  return messages.value.returnReport.status[report.status].replace('{name}', props.petName)
})
const reportAction = computed(() => {
  const action = props.report?.recommendedAction
  if (!action) return messages.value.returnReport.stable

  return messages.value.returnReport.actions[action].replace(
    '{action}',
    messages.value.actions[action as PetAction].label,
  )
})
</script>

<template>
  <section v-if="shouldShowReport" class="return-report" aria-live="polite">
    <div>
      <span>{{ messages.returnReport.heading }}</span>
      <strong class="return-report__title">{{ reportTitle }}</strong>
    </div>
    <p>{{ reportDetail }}</p>
    <small>{{ reportAction }}</small>
  </section>
</template>
```

- [ ] **Step 5: Create `PetDailyGoal.vue`**

Create `components/PetDailyGoal.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import {
  DAILY_GOAL_REWARD_AFFINITY_EXP,
  DAILY_GOAL_REWARD_EXP,
} from '~/constants/pet'
import type { PetDailyGoalRewardFeedback, PetDailyGoalState } from '~/types/pet'

const props = defineProps<{
  dailyGoal: PetDailyGoalState
  rewardFeedback: PetDailyGoalRewardFeedback | null
}>()

const emit = defineEmits<{
  claim: []
}>()

const { messages } = useLocale()

const isComplete = computed(() => props.dailyGoal.completedAt !== null)
const isClaimed = computed(() => props.dailyGoal.claimedAt !== null)
const progressText = computed(() =>
  messages.value.dailyGoal.progress
    .replace('{current}', String(props.dailyGoal.progress))
    .replace('{required}', '1'),
)
const rewardText = computed(() =>
  messages.value.dailyGoal.rewards
    .replace('{exp}', String(DAILY_GOAL_REWARD_EXP))
    .replace('{affinity}', String(DAILY_GOAL_REWARD_AFFINITY_EXP)),
)
const rewardFeedbackText = computed(() => {
  const feedback = props.rewardFeedback
  if (!feedback) return ''

  return messages.value.dailyGoal.rewardFeedback
    .replace('{exp}', String(feedback.gainedExp))
    .replace('{affinity}', String(feedback.gainedAffinityExp))
})
</script>

<template>
  <section class="daily-goal" aria-labelledby="daily-goal-title">
    <div class="daily-goal__copy">
      <span>{{ messages.dailyGoal.heading }}</span>
      <strong id="daily-goal-title" class="daily-goal__title">
        {{ messages.dailyGoal.title }}
      </strong>
      <small>{{ messages.dailyGoal.description }}</small>
    </div>

    <div class="daily-goal__meta">
      <span>{{ isComplete ? messages.dailyGoal.completed : progressText }}</span>
      <strong>{{ rewardText }}</strong>
    </div>

    <button
      v-if="isComplete && !isClaimed"
      class="daily-goal__claim"
      type="button"
      @click="emit('claim')"
    >
      {{ messages.dailyGoal.claim }}
    </button>
    <span v-else-if="isClaimed" class="daily-goal__claimed">
      {{ messages.dailyGoal.claimed }}
    </span>

    <p v-if="rewardFeedbackText" class="daily-goal__feedback" role="status">
      {{ rewardFeedbackText }}
    </p>
  </section>
</template>
```

- [ ] **Step 6: Wire UI in `PetSidePanel.vue` and `app.vue`**

In `components/PetSidePanel.vue`, import types:

```ts
import type { PetDailyGoalRewardFeedback, PetDailyGoalState, PetSettings } from '~/types/pet'
```

Add props:

```ts
  dailyGoal: PetDailyGoalState
  dailyGoalRewardFeedback: PetDailyGoalRewardFeedback | null
```

Add emit:

```ts
  claimDailyGoal: []
```

Render after the first-care-goal section:

```vue
      <PetDailyGoal
        :daily-goal="dailyGoal"
        :reward-feedback="dailyGoalRewardFeedback"
        @claim="emit('claimDailyGoal')"
      />
```

In `app.vue`, render the return report between `PetStatusPanel` and `PetActions`:

```vue
          <PetReturnReport
            :report="pet.returnReport.value"
            :pet-name="currentPet.name"
          />
```

Update the side panel props:

```vue
          :daily-goal="currentPet.dailyGoal"
          :daily-goal-reward-feedback="pet.dailyGoalRewardFeedback.value"
          @claim-daily-goal="pet.claimDailyGoalReward"
```

- [ ] **Step 7: Add CSS**

Append compact styles to `assets/css/main.css` near existing care/side-panel styles:

```css
.return-report,
.daily-goal {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
}

.return-report span,
.daily-goal span {
  color: var(--app-muted);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.return-report__title,
.daily-goal__title {
  display: block;
  margin-top: 4px;
  color: var(--app-text);
  overflow-wrap: anywhere;
}

.return-report p,
.return-report small,
.daily-goal small,
.daily-goal__meta {
  color: var(--app-muted);
}

.daily-goal__meta {
  display: grid;
  gap: 4px;
}

.daily-goal__meta strong,
.daily-goal__feedback {
  color: var(--app-success);
}

.daily-goal__claim {
  min-height: 38px;
  border: 0;
  border-radius: 8px;
  background: var(--app-accent);
  color: var(--app-accent-text);
  font-weight: 800;
  cursor: pointer;
}

.daily-goal__claimed {
  color: var(--app-success);
}

@media (max-width: 720px) {
  .return-report,
  .daily-goal {
    padding: 12px;
  }
}
```

- [ ] **Step 8: Run UI tests**

Run:

```bash
npm run -s test -- tests/pet-return-and-daily-ui.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit UI components**

Run:

```bash
git add components/PetReturnReport.vue components/PetDailyGoal.vue constants/i18n.ts components/PetSidePanel.vue app.vue assets/css/main.css tests/pet-return-and-daily-ui.test.ts
git commit -m "feat: show return report and daily goal"
```

---

### Task 5: Browser Flow and Full Verification

**Files:**

- Modify: `e2e/smoke.spec.ts`

- [ ] **Step 1: Add failing E2E coverage**

Append to `e2e/smoke.spec.ts`:

```ts
test('returning after absence shows a return report', async ({ page }) => {
  const staleTimestamp = Date.now() - 1000 * 60 * 60 * 3

  await page.addInitScript(
    ({ storageKey, localeKey, staleTimestamp }) => {
      const date = new Date()
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      window.localStorage.setItem(localeKey, 'ko')
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          version: 3,
          species: 'cat',
          name: '몽이',
          stats: {
            fullness: 35,
            energy: 70,
            cleanliness: 70,
          },
          growth: {
            level: 1,
            exp: 0,
            affinityExp: 0,
          },
          settings: {
            titleMode: 'status',
            titleVisibility: 'inactive-only',
            disguiseTitleId: 'project-dashboard',
            customDisguiseTitle: '',
            titleAnimationEnabled: false,
            themeId: 'system',
          },
          actionLimit: {
            windowStartedAt: staleTimestamp,
            used: 0,
            bonusUses: 0,
          },
          dailyGoal: {
            dateKey,
            goalId: 'recommended-care',
            progress: 0,
            completedAt: null,
            claimedAt: null,
          },
          lastUpdatedAt: staleTimestamp,
          lastPlayedAt: staleTimestamp,
        }),
      )
    },
    { storageKey: STORAGE_KEY, localeKey: LOCALE_KEY, staleTimestamp },
  )

  await page.goto('/')

  await expect(page.getByText('다시 만난 탭 펫')).toBeVisible()
})

test('completing recommended care completes the daily goal and claims reward', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /고양이/ }).first().click()

  await expect(page.getByText('오늘의 목표')).toBeVisible()

  const recommendedCard = page.locator('.action-recommendation')
  const recommendedText = await recommendedCard.textContent()
  const actionName = recommendedText?.includes('놀이')
    ? /놀이/
    : recommendedText?.includes('잠')
      ? /잠/
      : recommendedText?.includes('목욕')
        ? /목욕/
        : /먹이|밥/

  await page.getByRole('button', { name: actionName }).first().click()
  await expect(page.getByText('오늘 목표를 완료했어요.')).toBeVisible({ timeout: 6000 })

  await page.getByRole('button', { name: '보상 받기' }).click()
  await expect(page.getByText('오늘 보상을 받았어요.')).toBeVisible()
})
```

- [ ] **Step 2: Run E2E to verify initial failure or pass after UI wiring**

Run:

```bash
npm run -s test:e2e
```

Expected after Task 4 is complete: PASS for desktop and mobile projects.

- [ ] **Step 3: Run focused unit test suite**

Run:

```bash
npm run -s test -- tests/pet-return-report.test.ts tests/pet-daily-goal.test.ts tests/pet-return-and-daily-ui.test.ts tests/use-local-pet-storage.test.ts tests/pet-model.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run full verification**

Run:

```bash
npm run -s test
npm run -s lint
npm run -s build
```

Expected: all commands PASS.

- [ ] **Step 5: Commit E2E and verification changes**

Run:

```bash
git add e2e/smoke.spec.ts
git commit -m "test: cover retention release one flow"
```

---

## Self-Review Checklist

- [x] Spec coverage: Release 1 covers return report, one daily goal, EXP and affinity reward, compact UI, and unit/E2E tests.
- [x] Scope check: visible level rewards, personality, decoration, and seasonal events are excluded from this plan and remain in the product design doc.
- [x] Type consistency: `PetReturnReport`, `PetDailyGoalState`, and `PetDailyGoalRewardFeedback` are defined before store and component usage.
- [x] Storage consistency: `PET_STORAGE_VERSION` moves to 3 and v1/v2 migrations create a safe daily goal.
- [x] Browser consistency: return report uses metadata from `loadPetStateWithMeta`, so offline decay does not erase the previous timestamp needed for the report.
- [x] UX consistency: return report is transient; daily goal is durable; reward claim is manual and one-time per day.
- [x] Test consistency: each feature has a failing test before implementation and exact verification commands.
