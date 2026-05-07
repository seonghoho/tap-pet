# Recommendation Reward Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Help users compare the value of the recommended care action before tapping it by showing expected EXP and affinity rewards.

**Architecture:** Extract the reward calculation from `applyCareAction` into a reusable preview helper so pre-action hints and completed action results stay numerically consistent. Compute the preview in `usePetStore` from the current pet state and recommendation, then pass only the derived preview into `PetActions` for display.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest source/setup checks, responsive CSS.

---

### Task 1: Recommendation Reward Preview

**Files:**
- Modify: `utils/petCare.ts`
- Modify: `composables/usePetStore.ts`
- Modify: `app.vue`
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Test: `tests/pet-recommendation-reward-preview.test.ts`
- Document: `docs/superpowers/summaries/2026-05-07-recommendation-reward-preview.md`

- [x] **Step 1: Write failing tests**

Create `tests/pet-recommendation-reward-preview.test.ts` with checks that:
- `getCareActionRewardPreview` exists and returns the same `gainedExp`, `gainedAffinityExp`, `rewardMultiplier`, and `wasReduced` values as `applyCareAction`.
- reduced rewards are reflected before an overcare action.
- `usePetStore` exposes `recommendedCareRewardPreview` after a pet is initialized.
- `app.vue` passes `pet.recommendedCareRewardPreview.value` into `PetActions`.
- `PetActions.vue` accepts `recommendedCareRewardPreview`, computes localized reward text, and renders `.action-recommendation__reward` inside the recommendation card.
- `en`, `ko`, and `ja` messages include `careRecommendation.rewardHint` with `{exp}` and `{affinity}` plus `rewardReduced` copy.
- CSS defines responsive `.action-recommendation__support` and `.action-recommendation__reward` styles.

- [x] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-recommendation-reward-preview.test.ts`

Expected: fail before implementation because the preview helper, store computed value, prop, markup, i18n keys, and styles do not exist.

- [x] **Step 3: Extract reward preview helper**

In `utils/petCare.ts`, add:

```ts
export type CareActionRewardPreview = Pick<
  CareActionResult,
  'gainedExp' | 'gainedAffinityExp' | 'rewardMultiplier' | 'wasReduced'
>

export function getCareActionRewardPreview(input: CareActionInput): CareActionRewardPreview {
  const growth = normalizeGrowth(input.growth)
  const wasReduced = isOvercareAction(input.stats, input.action)
  const reductionMultiplier = wasReduced ? OVERCARE_REWARD_MULTIPLIER : 1
  const rewardMultiplier = getExperienceMultiplier(getAffinityLevel(growth.affinityExp))
  const gainedExp = Math.max(
    1,
    Math.round(BASE_ACTION_EXP[input.action] * rewardMultiplier * reductionMultiplier),
  )
  const gainedAffinityExp = Math.max(
    0,
    Math.round(BASE_AFFINITY_EXP[input.action] * reductionMultiplier),
  )

  return {
    gainedExp,
    gainedAffinityExp,
    rewardMultiplier,
    wasReduced,
  }
}
```

Update `applyCareAction` to call `getCareActionRewardPreview(input)` and reuse the returned values.

- [x] **Step 4: Compute and pass recommended reward preview**

In `composables/usePetStore.ts`, import `getCareActionRewardPreview`, add:

```ts
const recommendedCareRewardPreview = computed(() => {
  const recommendation = recommendedCareAction.value
  if (!petState.value || !recommendation) return null

  return getCareActionRewardPreview({
    stats: petState.value.stats,
    growth: petState.value.growth,
    action: recommendation.action,
  })
})
```

Return it from the store. In `app.vue`, pass:

```vue
:recommended-care-reward-preview="pet.recommendedCareRewardPreview.value"
```

- [x] **Step 5: Render reward hint in the recommendation card**

In `components/PetActions.vue`:
- import `CareActionRewardPreview` as a type.
- add `recommendedCareRewardPreview?: CareActionRewardPreview | null`.
- add computed values:
  - `recommendationRewardText`
  - `recommendationRewardReducedText`
  - `shouldShowRecommendationReward`
- render reward text inside `.action-recommendation`, next to the existing recommendation detail.

- [x] **Step 6: Add copy and styles**

Add localized copy:

```ts
rewardHint: '예상 보상 경험치 {exp} · 친밀도 {affinity}',
rewardReduced: '이미 충분히 돌본 상태라 예상 보상이 낮습니다.',
```

Use equivalent English and Japanese copy. Add CSS for:
- `.action-recommendation__support`
- `.action-recommendation__reward`
- `.action-recommendation__reward--muted`
- mobile left alignment under `@media (max-width: 720px)`

- [x] **Step 7: Write work summary**

Create `docs/superpowers/summaries/2026-05-07-recommendation-reward-preview.md` with:
- changed UX behavior
- files changed
- verification commands
- remaining risks
- next improvement candidate

- [x] **Step 8: Verify**

Run:
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, load a pet on mobile width and verify the recommendation card shows expected reward text without overlapping the detail text or action buttons.
