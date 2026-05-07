# Recommendation Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the recommended care card more trustworthy by showing the current stat value that caused the recommendation.

**Architecture:** Keep recommendation selection logic unchanged. Pass the current pet stats into `PetActions.vue`, derive a compact evidence string from `recommendedCareAction.statKey`, and render it inside the existing recommendation card support area.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest SFC source/setup checks, responsive CSS.

---

### Task 1: Recommendation Evidence

**Files:**
- Modify: `app.vue`
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Test: `tests/pet-recommendation-evidence.test.ts`
- Document: `docs/superpowers/summaries/2026-05-07-recommendation-evidence.md`

- [x] **Step 1: Write failing tests**

Create `tests/pet-recommendation-evidence.test.ts` with checks that:
- `app.vue` passes `currentPet.stats` into `PetActions`;
- `PetActions.vue` accepts a `stats` prop;
- `recommendationEvidenceText` renders the recommended stat and current value when `recommendedCareAction.statKey` exists;
- evidence is hidden when no `statKey` exists;
- evidence markup is inside `.action-recommendation__support`;
- en/ko/ja messages include the evidence copy and placeholders;
- CSS defines compact responsive `.action-recommendation__evidence` styles.

- [x] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-recommendation-evidence.test.ts`

Expected: fail before implementation because the stats prop, evidence computed text, markup, i18n, and CSS do not exist.

- [x] **Step 3: Pass stats into action controls**

In `app.vue`, add:

```vue
:stats="currentPet.stats"
```

to the `PetActions` component.

In `components/PetActions.vue`, add:

```ts
stats: PetStats
```

to props and import `PetStats`.

- [x] **Step 4: Implement evidence computed values**

In `components/PetActions.vue`, add:
- `recommendationEvidenceText`
- `shouldShowRecommendationEvidence`

Return an empty string when there is no recommendation or no `statKey`. When `statKey` exists, use `props.stats[statKey]`, `messages.stats[statKey]`, and `messages.careRecommendation.statEvidence`.

- [x] **Step 5: Add markup, copy, and styles**

Inside `.action-recommendation__support`, render:

```vue
<span v-if="shouldShowRecommendationEvidence" class="action-recommendation__evidence">
  {{ recommendationEvidenceText }}
</span>
```

Add localized `careRecommendation.statEvidence` for `en`, `ko`, and `ja` with `{stat}` and `{value}` placeholders.

Add `.action-recommendation__evidence` CSS that visually matches the existing reward chip, wraps safely, and remains left-aligned on mobile.

- [x] **Step 6: Write work summary**

Create `docs/superpowers/summaries/2026-05-07-recommendation-evidence.md` with:
- changed UX behavior;
- files changed;
- verification commands;
- subagent review notes;
- remaining risks;
- next improvement candidate.

- [x] **Step 7: Verify**

Run:
- `npm run test -- tests/pet-recommendation-evidence.test.ts`
- `npm run test -- tests/pet-care-recommendation.test.ts tests/pet-recommendation-reward-preview.test.ts tests/pet-action-button-status.test.ts`
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, load the app at mobile width and verify:
- the recommendation card shows a compact evidence chip when the recommendation has a stat key;
- the evidence chip does not overlap reward copy or button grid;
- no horizontal overflow occurs.
