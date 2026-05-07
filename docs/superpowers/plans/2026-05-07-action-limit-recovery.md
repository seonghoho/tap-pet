# Action Limit Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the care limit reached state clearer by comparing the reset wait time and rewarded-ad recharge option in one recovery card.

**Architecture:** Keep the action limit store and reward grant behavior unchanged. Extend `PetActions.vue` locked-state presentation with computed recovery option text, localized copy, and responsive styles that reuse the existing action-limit card.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest SFC source/setup checks, responsive CSS.

---

### Task 1: Locked Recovery Card

**Files:**
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Test: `tests/pet-action-limit-recovery-flow.test.ts`
- Document: `docs/superpowers/summaries/2026-05-07-action-limit-recovery.md`

- [x] **Step 1: Write failing tests**

Create `tests/pet-action-limit-recovery-flow.test.ts` with checks that:
- `PetActions.vue` derives a wait option from `actionLimitInfo.resetAt`;
- `PetActions.vue` derives a reward option from `ACTION_LIMIT_AD_REWARD_USES`;
- locked action-limit markup contains `.action-limit__recovery` with wait and reward options;
- the reward option still emits `rewardAd`;
- en/ko/ja action-limit messages include option labels and `{time}` / `{count}` placeholders;
- CSS defines compact, wrapping, responsive recovery option styles.

- [x] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-action-limit-recovery-flow.test.ts`

Expected: fail before implementation because the recovery computed text, markup, i18n keys, and CSS do not exist.

- [x] **Step 3: Add recovery computed text**

In `components/PetActions.vue`, import:

```ts
import { ACTION_LIMIT_AD_REWARD_USES } from '~/constants/pet'
```

Add:

```ts
const actionLimitRecoveryWaitText = computed(() =>
  messages.value.actionLimit.waitDetail.replace(
    '{time}',
    formatRemainingTime(props.actionLimitInfo.resetAt - now.value),
  ),
)
const actionLimitRecoveryRewardText = computed(() =>
  messages.value.actionLimit.rewardDetail.replace(
    '{count}',
    String(ACTION_LIMIT_AD_REWARD_USES),
  ),
)
```

- [x] **Step 4: Replace locked button with recovery options**

Inside `.action-limit`, keep the existing copy block. Replace the single locked `small-button` with:

```vue
<div
  v-if="isLimitReached"
  class="action-limit__recovery"
  :aria-label="messages.actionLimit.recoveryLabel"
>
  <span class="action-limit__option action-limit__option--wait">
    <strong>{{ messages.actionLimit.waitOption }}</strong>
    <small>{{ actionLimitRecoveryWaitText }}</small>
  </span>
  <button
    class="action-limit__option action-limit__option--reward"
    type="button"
    @click="emit('rewardAd')"
  >
    <strong>{{ messages.actionLimit.rewardOption }}</strong>
    <small>{{ actionLimitRecoveryRewardText }}</small>
  </button>
</div>
```

- [x] **Step 5: Add localized copy and styles**

Add action-limit messages for `en`, `ko`, and `ja`:
- `recoveryLabel`
- `waitOption`
- `waitDetail`
- `rewardOption`
- `rewardDetail`

Update the locked and reward hint copy so the card points users to the option comparison instead of repeating the old inline ad sentence.

Add CSS:
- `.action-limit--locked` uses a grid layout;
- `.action-limit__recovery` is a responsive grid;
- `.action-limit__option` uses stable padding, border, and wrapping;
- `.action-limit__option--reward` looks clickable and uses accent color;
- mobile keeps the options readable without overflow.

- [x] **Step 6: Write work summary**

Create `docs/superpowers/summaries/2026-05-07-action-limit-recovery.md` with:
- changed UX behavior;
- files changed;
- verification commands;
- subagent review notes;
- remaining risks;
- next improvement candidate.

- [x] **Step 7: Verify**

Run:
- `npm run test -- tests/pet-action-limit-recovery-flow.test.ts`
- `npm run test -- tests/pet-action-limit-reward.test.ts tests/pet-action-availability.test.ts tests/pet-side-panel-controls.test.ts`
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, load the app at mobile width with a locked action limit and verify:
- the recovery card shows wait and ad recharge options;
- the reward option remains clickable;
- no horizontal overflow or action button overlap occurs.
