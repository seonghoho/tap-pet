# Care Feedback Retention Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strengthen the post-care loop by showing when to check back and what change to expect inside the care result card.

**Architecture:** Keep store, decay, action limit, and recommendation logic unchanged. Extend `PetActions.vue` care feedback follow-up copy with a structured retention title and expected-change detail derived from the existing next recommendation, cooldown, and action-limit state.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest SFC source/setup checks, responsive CSS.

---

### Task 1: Care Feedback Retention Hint

**Files:**
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Test: `tests/pet-care-retention-hint.test.ts`
- Update: `tests/pet-care-checkback-hint.test.ts`
- Document: `docs/superpowers/summaries/2026-05-07-care-feedback-retention.md`

- [x] **Step 1: Write failing tests**

Create `tests/pet-care-retention-hint.test.ts` with checks that:
- feedback with an immediate next recommendation shows a title like `지금 다시 확인`;
- feedback with a nearest cooldown shows a title like `2s 후 다시 확인`;
- feedback with no remaining care uses shows a title like `31m 00s 후 다시 확인`;
- the detail copy explains the expected next change, not only the timing;
- `.care-feedback__checkback` renders the title in a `strong` and the detail in a `small`;
- en/ko/ja i18n includes the new retention title/detail copy and required placeholders;
- CSS styles the structured retention hint compactly and wraps safely.

Update `tests/pet-care-checkback-hint.test.ts` expected strings where the old detail copy is intentionally replaced by expected-change copy.

- [x] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-care-retention-hint.test.ts`

Expected: fail before implementation because `careFeedbackRetentionTitle`, new markup, new i18n keys, and CSS do not exist.

- [x] **Step 3: Add retention computed values**

In `components/PetActions.vue`, add:

```ts
const careFeedbackRetentionTitle = computed(() => {
  if (!props.careFeedback) return ''

  if (hasActionLimitWindowExpired.value) return messages.value.careFeedback.retentionReadyTitle

  if (isLimitReached.value) {
    return messages.value.careFeedback.retentionInTitle.replace(
      '{time}',
      formatRemainingTime(props.actionLimitInfo.resetAt - now.value),
    )
  }

  if (shouldShowFeedbackNextAction.value) return messages.value.careFeedback.retentionNowTitle

  const coolingAction = nextCoolingAction.value
  if (coolingAction) {
    return messages.value.careFeedback.retentionInTitle.replace(
      '{time}',
      formatRemainingTime(coolingAction.remaining),
    )
  }

  return messages.value.careFeedback.retentionLaterTitle
})
```

Update `careFeedbackCheckbackText` detail copy to use expected-change messages:
- immediate next recommendation: `careFeedback.retentionNowDetail`;
- action-limit locked: `careFeedback.retentionLimitDetail`;
- cooldown: `careFeedback.retentionCooldownDetail` with `{action}` and `{time}`;
- no immediate timing: `careFeedback.retentionLaterDetail`;
- reset ready: `careFeedback.retentionReadyDetail`.

- [x] **Step 4: Render structured hint**

Inside `.care-feedback__checkback`, replace the single `small` with:

```vue
<div>
  <strong>{{ careFeedbackRetentionTitle }}</strong>
  <small>{{ careFeedbackCheckbackText }}</small>
</div>
```

Keep the outer `.care-feedback__checkback` class and `shouldShowFeedbackCheckback` behavior so existing follow-up visibility remains stable.

- [x] **Step 5: Add localized copy and CSS**

Add `careFeedback` messages for en/ko/ja:
- `retentionNowTitle`
- `retentionInTitle`
- `retentionReadyTitle`
- `retentionLaterTitle`
- `retentionNowDetail`
- `retentionCooldownDetail`
- `retentionLimitDetail`
- `retentionReadyDetail`
- `retentionLaterDetail`

Add CSS for `.care-feedback__checkback strong` and `.care-feedback__checkback div` so the title/detail stack wraps safely on desktop and mobile.

- [x] **Step 6: Write work summary**

Create `docs/superpowers/summaries/2026-05-07-care-feedback-retention.md` with:
- changed UX behavior;
- files changed;
- verification commands;
- subagent review notes;
- remaining risks;
- next improvement candidate.

- [x] **Step 7: Verify**

Run:
- `npm run test -- tests/pet-care-retention-hint.test.ts`
- `npm run test -- tests/pet-care-checkback-hint.test.ts tests/pet-care-feedback-summary.test.ts tests/pet-care-feedback-priority-layout.test.ts`
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, load the app at mobile width after completing a care action and verify:
- the result card shows a clear next-check title;
- the detail explains the expected follow-up change;
- no text overflow or card overlap occurs.
