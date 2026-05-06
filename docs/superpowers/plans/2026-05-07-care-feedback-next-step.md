# Care Feedback Next Step Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the completed care result card explain the key impact and guide the user to the next useful action.

**Architecture:** Keep store and care calculation logic unchanged. Extend `PetActions.vue` presentation by deriving a short result summary from `careFeedback`, placing the next recommendation inside the feedback card, and hiding the standalone recommendation card while feedback is visible to avoid duplicate guidance.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest source checks, responsive CSS.

---

### Task 1: Care Feedback Summary

**Files:**
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Test: `tests/pet-care-feedback-summary.test.ts`
- Document: `docs/superpowers/summaries/2026-05-07-care-feedback-next-step.md`

- [ ] **Step 1: Write failing tests**

Create `tests/pet-care-feedback-summary.test.ts` with checks that:
- `PetActions.vue` renders `.care-feedback__summary` and `.care-feedback__next`.
- feedback summary copy is derived from `messages.careFeedback`.
- standalone recommendation is hidden while `careFeedback` exists.
- feedback next-action prompt is hidden when the care action limit is reached.
- en/ko/ja messages include summary and next-action copy.
- CSS defines compact responsive styles for the new feedback blocks.

- [ ] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-care-feedback-summary.test.ts`

Expected: fail before implementation because summary markup, i18n, and styles do not exist.

- [ ] **Step 3: Implement feedback summary values**

In `components/PetActions.vue`, add computed values for:
- `careFeedbackSummary`
- `feedbackNextActionTitle`
- `feedbackNextActionDetail`
- `shouldShowRecommendation`
- `shouldShowFeedbackNextAction`

The summary should prefer affinity gain for `play`, otherwise the largest positive stat change, otherwise EXP gain.

- [ ] **Step 4: Add markup, copy, and styles**

Add a summary block near the top of `.care-feedback` and a next-action block below the feedback chips. Add localized copy for `en`, `ko`, and `ja`, plus mobile-safe CSS.

- [ ] **Step 5: Write work summary**

Create `docs/superpowers/summaries/2026-05-07-care-feedback-next-step.md` with:
- changed UX behavior
- files changed
- verification commands
- remaining risks or next candidate

- [ ] **Step 6: Verify**

Run:
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, click a care action and verify the result card shows a key result plus next action without duplicating the standalone recommendation card.
