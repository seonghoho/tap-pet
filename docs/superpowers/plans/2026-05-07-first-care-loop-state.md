# First Care Loop State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the side panel from showing the same first-care checklist after the user has already made growth progress. Once the first care loop has started, the panel should invite repeat use instead of onboarding.

**Architecture:** Derive first-loop progress from existing growth props only. Do not add storage fields or mutate pet state. `PetSidePanel` computes whether the user has started the first loop from level, level progress, affinity level, or affinity progress, then chooses either the initial first-care copy or repeat-loop copy.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest, localized static messages.

---

### Task 1: First Care Loop State

**Files:**
- Modify: `components/PetSidePanel.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Modify: `tests/pet-first-care-goal.test.ts`
- Create: `docs/superpowers/summaries/2026-05-07-first-care-loop-state.md`

- [x] **Step 1: Write failing tests**

Add tests that verify:

```ts
expect(setup.hasStartedFirstCareLoop.value).toBe(false)
expect(setup.firstCareGoalCopy.value.title).toBe('한 번의 돌봄 흐름을 완료하세요')
expect(setup.hasStartedFirstCareLoop.value).toBe(true)
expect(setup.firstCareGoalCopy.value.title).toBe('다음 루프를 이어가세요')
expect(template).toContain(':class="{ \\'first-care-goal--repeat\\': hasStartedFirstCareLoop }"')
expect(template).toContain('firstCareGoalCopy.steps')
```

Also add locale coverage for the repeat-loop copy in en/ko/ja.

- [x] **Step 2: Run RED**

Run:

```bash
npm run test -- tests/pet-first-care-goal.test.ts tests/pet-side-panel-growth-goals.test.ts
```

Expected: FAIL because `PetSidePanel` still reads `messages.firstCareGoal` directly and does not expose derived loop state/copy.

- [x] **Step 3: Implement minimal code**

In `PetSidePanel.vue`:

```ts
const hasStartedFirstCareLoop = computed(() =>
  props.level > 1 ||
  props.levelProgress.current > 0 ||
  props.affinityProgress.level > 1 ||
  props.affinityProgress.current > 0,
)
const firstCareGoalCopy = computed(() =>
  hasStartedFirstCareLoop.value
    ? messages.value.firstCareGoal.repeat
    : messages.value.firstCareGoal,
)
```

Update the template to use `firstCareGoalCopy` for eyebrow/title/description/steps and add a repeat class.

In `constants/i18n.ts`, add `firstCareGoal.repeat` for en/ko/ja.

In `assets/css/main.css`, add a small repeat-state visual treatment that does not change layout.

- [x] **Step 4: Run focused tests**

Run:

```bash
npm run test -- tests/pet-first-care-goal.test.ts tests/pet-side-panel-growth-goals.test.ts
```

- [x] **Step 5: Add summary doc**

Create `docs/superpowers/summaries/2026-05-07-first-care-loop-state.md` with:

```md
# 2026-05-07 First Care Loop State

## 개선 방향

- 첫 돌봄 이후에도 온보딩 문구가 남는 문제를 줄이고, 반복 루프로 이어지는 문구를 보여줍니다.

## 변경 사항

- 성장/친밀도 진행값에서 첫 돌봄 루프 진행 여부를 파생했습니다.
- 첫 루프 전/후 copy를 분리했습니다.

## 검증

- 확인 필요: `npm run test`
- 확인 필요: `npm run lint`
- 확인 필요: `npm run build`
```

- [x] **Step 6: Subagent reviews**

Ask read-only reviewers for:

- spec compliance
- code quality, copy/i18n, UI regression risk

- [x] **Step 7: Full verification**

Run:

```bash
npm run test
npm run lint
npm run build
git diff --check
```

- [x] **Step 8: Commit**

Run:

```bash
git add components/PetSidePanel.vue constants/i18n.ts assets/css/main.css tests/pet-first-care-goal.test.ts docs/superpowers/plans/2026-05-07-first-care-loop-state.md docs/superpowers/summaries/2026-05-07-first-care-loop-state.md
git commit -m "feat(pet): show repeat first care loop state"
```
