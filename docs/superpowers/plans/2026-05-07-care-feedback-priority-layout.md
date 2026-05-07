# Care Feedback Priority Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the care result card easier to scan by grouping primary result, growth progress, detailed changes, and follow-up guidance in a clear order.

**Architecture:** Keep existing care feedback data and calculations unchanged. Reorganize the `PetActions` care feedback template into an overview block and a follow-up block, preserving existing class names where possible so previous behavior and tests stay meaningful. Update only local CSS for the result card layout.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest SFC source/setup checks, responsive CSS.

---

### Task 1: Care Feedback Priority Layout

**Files:**
- Modify: `components/PetActions.vue`
- Modify: `assets/css/main.css`
- Test: `tests/pet-care-feedback-priority-layout.test.ts`
- Document: `docs/superpowers/summaries/2026-05-07-care-feedback-priority-layout.md`

- [x] **Step 1: Write failing tests**

Create `tests/pet-care-feedback-priority-layout.test.ts` with checks that:
- the care feedback card contains `.care-feedback__overview`;
- `.care-feedback__summary` and `.care-feedback__growth` render inside the overview before `.care-feedback__chips`;
- `.care-feedback__follow-up` renders after `.care-feedback__chips`;
- `.care-feedback__next` and `.care-feedback__note` render inside the follow-up block;
- a computed `shouldShowFeedbackFollowup` is true when the next-action prompt or reduced reward note should show;
- CSS defines responsive `.care-feedback__overview` and `.care-feedback__follow-up` styles.

- [x] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-care-feedback-priority-layout.test.ts`

Expected: fail before implementation because the overview/follow-up wrappers and `shouldShowFeedbackFollowup` do not exist.

- [x] **Step 3: Add follow-up visibility computed**

In `components/PetActions.vue`, add:

```ts
const shouldShowFeedbackFollowup = computed(() =>
  Boolean(props.careFeedback && (shouldShowFeedbackNextAction.value || props.careFeedback.wasReduced)),
)
```

- [x] **Step 4: Reorganize care feedback template**

Inside the existing `<div v-if="careFeedback" class="care-feedback">`:
- keep `.care-feedback__header` first;
- add `<div class="care-feedback__overview">` directly after the header;
- move existing `.care-feedback__summary` into the overview;
- move existing `.care-feedback__growth` into the overview and keep its `v-if="shouldShowFeedbackGrowth"`;
- keep `.care-feedback__chips` after the overview;
- add `<div v-if="shouldShowFeedbackFollowup" class="care-feedback__follow-up">` after chips;
- move `.care-feedback__next` and `.care-feedback__note` inside the follow-up wrapper.

- [x] **Step 5: Update result card CSS**

In `assets/css/main.css`:
- add `.care-feedback__overview` as a two-column grid with a top separator;
- make `.care-feedback__summary` and `.care-feedback__growth` compact single-column blocks inside the overview;
- add `.care-feedback__follow-up` as the single bottom separator block;
- remove duplicate top separators from `.care-feedback__summary`, `.care-feedback__growth`, and `.care-feedback__next`;
- keep mobile layout at one column under `@media (max-width: 720px)`.

- [x] **Step 6: Write work summary**

Create `docs/superpowers/summaries/2026-05-07-care-feedback-priority-layout.md` with:
- changed UX behavior;
- files changed;
- verification commands;
- remaining risks;
- next improvement candidate.

- [x] **Step 7: Verify**

Run:
- `npm run test -- tests/pet-care-feedback-priority-layout.test.ts`
- `npm run test -- tests/pet-care-feedback-summary.test.ts tests/pet-care-feedback-growth-target.test.ts`
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, load the app at mobile width, perform one care action, and verify:
- the result card shows header, overview, chips, and follow-up in order;
- the card has no horizontal overflow;
- the next-action prompt and reduced reward note stay visually separated from primary result information.
