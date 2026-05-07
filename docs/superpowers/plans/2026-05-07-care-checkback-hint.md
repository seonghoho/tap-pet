# Care Checkback Hint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Help users understand when to return after a care action by adding a concise next-check hint to the completed care result card.

**Architecture:** Keep store, cooldown, action-limit, and recommendation calculations unchanged. Extend `PetActions.vue` presentation with computed text derived from existing `careFeedback`, `recommendedCareAction`, `nextCoolingAction`, `isLimitReached`, and `actionLimitInfo.resetAt`, then render the hint inside the existing feedback follow-up section.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest SFC source/setup checks, responsive CSS.

---

### Task 1: Care Checkback Hint

**Files:**
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Test: `tests/pet-care-checkback-hint.test.ts`
- Document: `docs/superpowers/summaries/2026-05-07-care-checkback-hint.md`

- [x] **Step 1: Write failing tests**

Create `tests/pet-care-checkback-hint.test.ts` with checks that:
- `PetActions.vue` renders `.care-feedback__checkback` inside `.care-feedback__follow-up`;
- the follow-up wrapper remains visible when only the checkback hint is available;
- `careFeedbackCheckbackText` says the user can continue now when a next recommendation is available;
- `careFeedbackCheckbackText` points to the action-limit reset time when no care uses remain;
- `careFeedbackCheckbackText` points to the nearest cooldown when no immediate recommendation exists;
- en/ko/ja messages include checkback copy and required placeholders;
- CSS defines compact, mobile-safe styles for the checkback hint.

- [x] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-care-checkback-hint.test.ts`

Expected: fail before implementation because checkback computed values, copy, markup, and styles do not exist.

- [x] **Step 3: Implement checkback computed values**

In `components/PetActions.vue`, add:
- `careFeedbackCheckbackText`
- `shouldShowFeedbackCheckback`

The text priority should be:
1. no `careFeedback`: empty string;
2. expired limit window: ready-now copy;
3. action limit reached: reset-time copy using `formatRemainingTime(props.actionLimitInfo.resetAt - now.value)`;
4. feedback next action is available: continue-now copy;
5. nearest cooldown exists: cooldown copy using `nextCoolingAction`;
6. fallback: tab-signal copy.

Update `shouldShowFeedbackFollowup` so the follow-up area is visible when a next action, reduced reward note, or checkback hint exists.

- [x] **Step 4: Add markup, copy, and styles**

Inside `.care-feedback__follow-up`, render:

```vue
<div v-if="shouldShowFeedbackCheckback" class="care-feedback__checkback">
  <span>{{ messages.careFeedback.checkbackLabel }}</span>
  <small>{{ careFeedbackCheckbackText }}</small>
</div>
```

Add localized `careFeedback` copy for `en`, `ko`, and `ja`:
- `checkbackLabel`
- `checkbackNow`
- `checkbackCooldown`
- `checkbackLimit`
- `checkbackReady`
- `checkbackLater`

Add `.care-feedback__checkback` CSS with a compact label/text grid, muted support text, `overflow-wrap: anywhere`, and one-column mobile behavior.

- [x] **Step 5: Write work summary**

Create `docs/superpowers/summaries/2026-05-07-care-checkback-hint.md` with:
- changed UX behavior;
- files changed;
- verification commands;
- subagent review notes;
- remaining risks;
- next improvement candidate.

- [x] **Step 6: Verify**

Run:
- `npm run test -- tests/pet-care-checkback-hint.test.ts`
- `npm run test -- tests/pet-care-feedback-priority-layout.test.ts tests/pet-care-feedback-summary.test.ts tests/pet-action-availability.test.ts`
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, load the app at mobile width, perform one care action, and verify:
- the result card follow-up includes a “next check” hint;
- the hint does not duplicate the existing action-limit line awkwardly;
- long Korean copy wraps without horizontal overflow.
