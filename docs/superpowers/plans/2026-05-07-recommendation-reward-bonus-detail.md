# Recommendation Reward Bonus Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the current affinity EXP bonus multiplier in the recommendation reward hint so users connect reward bonus progress to immediate care rewards.

**Architecture:** Reuse the existing `recommendedCareRewardPreview.rewardMultiplier` value passed from the store to `PetActions`. Do not change care reward math, recommendation logic, or store state. Extend only the localized recommendation reward copy and its rendering.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest, localized static messages.

---

### Task 1: Recommendation Reward Bonus Detail

**Files:**
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Modify: `tests/pet-recommendation-reward-preview.test.ts`
- Create: `docs/superpowers/summaries/2026-05-07-recommendation-reward-bonus-detail.md`

- [x] **Step 1: Write failing tests**

Update `tests/pet-recommendation-reward-preview.test.ts` so the reward preview includes the current EXP bonus multiplier:

```ts
expect(setup.recommendationRewardText.value).toBe(
  '예상 보상 경험치 +13 · 친밀도 +2 · 경험치 보너스 x1.1',
)
expect(reducedSetup.recommendationRewardText.value).toBe(
  '예상 보상 경험치 +5 · 친밀도 +1 · 경험치 보너스 x1.1',
)
```

Extend the localized copy guard:

```ts
expect(careRecommendation.rewardHint).toContain('{exp}')
expect(careRecommendation.rewardHint).toContain('{affinity}')
expect(careRecommendation.rewardHint).toContain('{bonus}')
```

- [x] **Step 2: Run RED**

Run:

```bash
npm run test -- tests/pet-recommendation-reward-preview.test.ts
```

Expected: FAIL because `careRecommendation.rewardHint` has no `{bonus}` placeholder and `recommendationRewardText` does not replace/display the bonus multiplier yet.

- [x] **Step 3: Implement minimal code**

In `components/PetActions.vue`, update `recommendationRewardText` to replace `{bonus}`:

```ts
return messages.value.careRecommendation.rewardHint
  .replace('{exp}', formatSigned(reward.gainedExp))
  .replace('{affinity}', formatSigned(reward.gainedAffinityExp))
  .replace('{bonus}', formatMultiplier(reward.rewardMultiplier))
```

Add:

```ts
function formatMultiplier(multiplier: number): string {
  return multiplier.toFixed(1)
}
```

Update en/ko/ja `careRecommendation.rewardHint` in `constants/i18n.ts`:

```ts
rewardHint: 'Expected reward {exp} EXP · {affinity} affinity · EXP bonus x{bonus}'
rewardHint: '예상 보상 경험치 {exp} · 친밀도 {affinity} · 경험치 보너스 x{bonus}'
rewardHint: '予想報酬 経験値 {exp} · 親密度 {affinity} · 経験値ボーナス x{bonus}'
```

- [x] **Step 4: Run focused tests**

Run:

```bash
npm run test -- tests/pet-recommendation-reward-preview.test.ts tests/pet-recommendation-evidence.test.ts
```

- [x] **Step 5: Add summary doc**

Create `docs/superpowers/summaries/2026-05-07-recommendation-reward-bonus-detail.md` with:

```md
# 2026-05-07 Recommendation Reward Bonus Detail

## 개선 방향

- 추천 카드의 예상 보상에서 현재 친밀도 EXP 보너스 배율을 바로 확인할 수 있게 했습니다.

## 변경 사항

- 예상 보상 문구에 `보너스 x1.1`을 추가했습니다.
- 기존 reward preview의 `rewardMultiplier`를 재사용했고 보상 계산식은 변경하지 않았습니다.

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
git add components/PetActions.vue constants/i18n.ts tests/pet-recommendation-reward-preview.test.ts docs/superpowers/plans/2026-05-07-recommendation-reward-bonus-detail.md docs/superpowers/summaries/2026-05-07-recommendation-reward-bonus-detail.md
git commit -m "feat(pet): show recommendation reward bonus"
```
