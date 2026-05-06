# Care Recommendation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Help users understand the next best care action immediately after pet setup by showing a lightweight recommendation in the action controls.

**Architecture:** Keep recommendation logic pure and deterministic in the care utility layer, expose it from `usePetStore`, pass it through `app.vue`, and render it in `PetActions.vue`. Do not auto-run actions or change existing stat effects.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest source and utility tests.

---

### Task 1: Recommended Care Action

**Files:**
- Modify: `types/pet.ts`
- Modify: `utils/petCare.ts`
- Modify: `composables/usePetStore.ts`
- Modify: `app.vue`
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Test: `tests/pet-care-recommendation.test.ts`
- Test: `tests/pet-side-panel-controls.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests for deterministic recommendation behavior:
- alert status maps to the matching action: hungry/feed, sleepy/sleep, dirty/wash, bored/play.
- stable status picks the lowest stat with tie order fullness, energy, cleanliness.
- `app.vue` passes the store recommendation into `PetActions`.
- `PetActions.vue` renders recommendation copy and marks the recommended button.
- every locale has recommendation messages.

- [ ] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-care-recommendation.test.ts`

Expected: fail before implementation because the recommendation utility and UI hooks do not exist.

- [ ] **Step 3: Implement pure recommendation logic**

Add `PetStatKey`, `PetCareRecommendationReason`, and `PetCareRecommendation` types. Add `getRecommendedCareAction` in `utils/petCare.ts` with deterministic tie-break behavior.

- [ ] **Step 4: Connect store and UI**

Expose `recommendedCareAction` from `usePetStore`, pass it from `app.vue`, and show a compact recommendation block plus a small recommended badge on the matching action button.

- [ ] **Step 5: Add localized copy and styles**

Add Korean, English, and Japanese recommendation messages. Style the recommendation as a quiet hint inside the action section without increasing the action grid complexity.

- [ ] **Step 6: Verify**

Run:
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, verify desktop and mobile layout after creating a pet.
