# Action Progress Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the care action wait state obvious after a user clicks an action, so users understand that the app is processing and a result will appear shortly.

**Architecture:** Keep action scheduling unchanged in `usePetStore`. Render a transient progress status inside `PetActions.vue` whenever `activeReaction` is set, and hide recommendation hints while progress is active to avoid competing guidance.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest source checks, responsive CSS.

---

### Task 1: Care Action Progress Status

**Files:**
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Test: `tests/pet-action-progress.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/pet-action-progress.test.ts` with checks that:
- `PetActions.vue` renders a `care-progress` status block when `activeReaction` exists.
- progress title uses the active action label.
- recommendation is hidden while `activeReaction` is set.
- en/ko/ja copy includes `careProgress.title` and `careProgress.detail`.
- CSS defines `.care-progress` and mobile-safe text behavior.

- [ ] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-action-progress.test.ts`

Expected: fail before implementation because progress markup, i18n, and styles do not exist.

- [ ] **Step 3: Implement progress computed values and markup**

In `components/PetActions.vue`, add:
- `activeReactionTitle` computed from `messages.careProgress.title`.
- `activeReactionDetail` computed from `messages.careProgress.detail`.
- `<div v-if="activeReaction" class="care-progress" role="status">...</div>` before recommendations.
- Change recommendation condition to `recommendedCareAction && !isLimitReached && !activeReaction`.

- [ ] **Step 4: Add copy and styles**

Add `careProgress` copy for `en`, `ko`, and `ja`. Add `.care-progress`, `.care-progress__bar`, and mobile-safe text rules near existing action section styles.

- [ ] **Step 5: Verify**

Run:
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, verify after clicking an action that progress status appears before the result feedback and does not overlap mobile action controls.
