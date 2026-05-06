# Action Limit Reward Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce drop-off when care actions run out by making the bonus-use recovery path explicit and confirming that additional care actions were granted.

**Architecture:** Keep action-limit grant behavior in `usePetStore`, add a transient reward feedback object, pass it to `PetActions.vue`, and render a compact status message near the action-limit banner. Do not introduce a real ad SDK.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest source and store tests.

---

### Task 1: Reward Grant Feedback

**Files:**
- Modify: `types/pet.ts`
- Modify: `composables/usePetStore.ts`
- Modify: `app.vue`
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Modify: `tests/pet-model.test.ts`
- Test: `tests/pet-action-limit-reward.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that verify:
- rewarded action grants expose a transient feedback object with the added count.
- the feedback clears after the next care action, reset, or reinitialization.
- `app.vue` passes reward feedback into `PetActions`.
- `PetActions.vue` renders the reward feedback message and hides recommendation while the limit is reached.
- en/ko/ja copy includes a reward granted message.

- [ ] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-action-limit-reward.test.ts tests/pet-model.test.ts`

Expected: fail before implementation because the feedback state and UI props do not exist.

- [ ] **Step 3: Implement store feedback state**

Add `PetActionLimitRewardFeedback`, create `actionLimitRewardFeedback` state in `usePetStore`, set it in `grantRewardedAdActions`, and clear it on care actions, reset, and initialization.

- [ ] **Step 4: Connect UI and copy**

Pass `action-limit-reward-feedback` from `app.vue` into `PetActions.vue`, render a compact `role="status"` message, and add localized copy. Use neutral CTA copy because this app currently grants mock bonus uses without a real ad SDK.

- [ ] **Step 5: Verify**

Run:
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, verify a locked action state and the post-grant message on mobile width.
