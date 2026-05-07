# Affinity Bonus Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the side-panel reward bonus goal explain what the bonus affects, so repeat users understand that affinity increases care EXP rewards.

**Architecture:** Reuse existing `affinityProgress.level` and `getExperienceMultiplier()`. Do not add store/model state. Only the affinity goal detail changes from raw progress (`현재 30/140`) to progress plus current/next care EXP multiplier. At the multiplier cap, use max-bonus copy instead of a no-op arrow.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest, localized static messages.

---

### Task 1: Affinity Bonus Detail

**Files:**
- Modify: `components/PetSidePanel.vue`
- Modify: `constants/i18n.ts`
- Modify: `tests/pet-side-panel-growth-goals.test.ts`
- Create: `docs/superpowers/summaries/2026-05-07-affinity-bonus-detail.md`

- [x] **Step 1: Write failing tests**

Add expectations:

```ts
expect(setup.affinityGoalDetail?.value).toBe('현재 30/140 · 돌봄 경험치 x1.3 → x1.4')
expect(setup.progressGoalRows?.value[1]?.detail).toBe('현재 30/140 · 돌봄 경험치 x1.3 → x1.4')
expect(sidePanelProgress.affinityGoalDetail).toContain('{current}')
expect(sidePanelProgress.affinityGoalDetail).toContain('{required}')
expect(sidePanelProgress.affinityGoalDetail).toContain('{currentBonus}')
expect(sidePanelProgress.affinityGoalDetail).toContain('{nextBonus}')
expect(sidePanelProgress.affinityGoalMaxDetail).toContain('{currentBonus}')
```

- [x] **Step 2: Run RED**

Run:

```bash
npm run test -- tests/pet-side-panel-growth-goals.test.ts
```

Expected: FAIL because `affinityGoalDetail` does not exist and the affinity row still uses the generic progress detail.

- [x] **Step 3: Implement minimal code**

In `PetSidePanel.vue`, import `getExperienceMultiplier` and add:

```ts
const affinityGoalDetail = computed(() =>
  messages.value.sidePanelProgress.affinityGoalDetail
    .replace('{current}', String(props.affinityProgress.current))
    .replace('{required}', String(props.affinityProgress.required))
    .replace('{currentBonus}', formatMultiplier(getExperienceMultiplier(props.affinityProgress.level)))
    .replace('{nextBonus}', formatMultiplier(getExperienceMultiplier(props.affinityProgress.level + 1)))
)
```

Use `affinityGoalDetail.value` for the affinity progress goal row detail. When current and next multipliers are equal, use `affinityGoalMaxDetail`.

Add `sidePanelProgress.affinityGoalDetail` in en/ko/ja.

- [x] **Step 4: Run focused tests**

Run:

```bash
npm run test -- tests/pet-side-panel-growth-goals.test.ts
```

- [x] **Step 5: Add summary doc**

Create `docs/superpowers/summaries/2026-05-07-affinity-bonus-detail.md` with:

```md
# 2026-05-07 Affinity Bonus Detail

## 개선 방향

- 보상 보너스 목표가 돌봄 경험치 배율을 올린다는 점을 바로 이해할 수 있게 했습니다.

## 변경 사항

- 친밀도 목표 detail에 현재/다음 돌봄 경험치 배율을 표시했습니다.

## 검증

- 확인 필요: `npm run test`
- 확인 필요: `npm run lint`
- 확인 필요: `npm run build`
```

- [x] **Step 6: Subagent reviews**

Ask read-only reviewers for:

- spec compliance
- code quality, i18n consistency, and regression risk

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
git add components/PetSidePanel.vue constants/i18n.ts tests/pet-side-panel-growth-goals.test.ts tests/pet-first-care-goal.test.ts docs/superpowers/plans/2026-05-07-affinity-bonus-detail.md docs/superpowers/summaries/2026-05-07-affinity-bonus-detail.md
git commit -m "feat(pet): explain affinity bonus detail"
```
