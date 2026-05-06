# Care Feedback Growth Target Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each care result feel connected to long-term progression by showing the next level target inside the result card.

**Architecture:** Reuse the existing `levelProgress` computed value from `usePetStore` and pass it into `PetActions`. Keep pet state, growth math, storage, and action resolution unchanged; the new UI is a derived presentation section inside the existing care feedback card.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest source/setup checks, responsive CSS.

---

### Task 1: Result Card Growth Target

**Files:**
- Modify: `app.vue`
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Test: `tests/pet-care-feedback-growth-target.test.ts`
- Document: `docs/superpowers/summaries/2026-05-07-care-feedback-growth-target.md`

- [ ] **Step 1: Write failing tests**

Create `tests/pet-care-feedback-growth-target.test.ts` with checks that:
- `app.vue` passes `pet.levelProgress.value` into `PetActions`.
- `PetActions.vue` accepts `levelProgress`, renders `.care-feedback__growth` only inside the care feedback card, and uses computed title/detail/progress values.
- setup computation reports “다음 레벨까지 58 경험치” when level progress is `42 / 100`.
- setup computation reports level-up copy when `careFeedback.didLevelUp` is true.
- `en`, `ko`, and `ja` messages include growth label, remaining, complete, detail, and complete detail copy with required placeholders.
- CSS defines responsive `.care-feedback__growth`, `.care-feedback__growth-track`, and `.care-feedback__growth-fill` styles.

- [ ] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-care-feedback-growth-target.test.ts`

Expected: fail before implementation because the prop, computed values, markup, i18n keys, and styles do not exist.

- [ ] **Step 3: Pass level progress into actions**

In `app.vue`, add the prop to the existing `PetActions` mount:

```vue
<PetActions
  :cooldowns="pet.actionCooldowns.value"
  :active-reaction="pet.activeReaction.value"
  :action-limit-info="pet.actionLimitInfo.value"
  :care-feedback="pet.lastCareFeedback.value"
  :action-limit-reward-feedback="pet.actionLimitRewardFeedback.value"
  :recommended-care-action="pet.recommendedCareAction.value"
  :level-progress="pet.levelProgress.value"
  @action="handleAction"
  @reward-ad="pet.grantRewardedAdActions"
/>
```

- [ ] **Step 4: Add derived growth target UI**

In `components/PetActions.vue`:
- import `ProgressInfo` as a type.
- add `levelProgress?: ProgressInfo | null` to props.
- add computed values:
  - `shouldShowFeedbackGrowth`
  - `feedbackGrowthCurrent`
  - `feedbackGrowthRequired`
  - `feedbackGrowthRemaining`
  - `feedbackGrowthPercent`
  - `feedbackGrowthTitle`
  - `feedbackGrowthDetail`
- render `.care-feedback__growth` after `.care-feedback__summary` and before the feedback chips.
- use a semantic `role="progressbar"` track with current/required values.

- [ ] **Step 5: Add copy and styles**

Add localized `careFeedback.growthLabel`, `growthRemaining`, `growthComplete`, `growthDetail`, and `growthCompleteDetail` copy for `en`, `ko`, and `ja`.

Add compact CSS near existing `.care-feedback__summary` styles:
- `.care-feedback__growth`
- `.care-feedback__growth span`
- `.care-feedback__growth strong`
- `.care-feedback__growth small`
- `.care-feedback__growth-track`
- `.care-feedback__growth-fill`
- mobile `grid-template-columns: 1fr`

- [ ] **Step 6: Write work summary**

Create `docs/superpowers/summaries/2026-05-07-care-feedback-growth-target.md` with:
- changed UX behavior
- files changed
- verification commands
- remaining risks
- next improvement candidate

- [ ] **Step 7: Verify**

Run:
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, complete a care action on desktop or mobile and verify the result card shows the growth target without overlapping feedback chips or the next-action prompt.
