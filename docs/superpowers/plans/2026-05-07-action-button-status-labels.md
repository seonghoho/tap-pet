# Action Button Status Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Help users scan each care button faster by showing compact status labels for recommended, ready, cooldown, active, and locked states.

**Architecture:** Keep the existing care action flow unchanged. Add small presentation helpers inside `PetActions` that derive a button state from current props, use localized short labels from `constants/i18n.ts`, and reuse existing action/recommendation detail copy for the second line. Update CSS only within the existing action button block.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest SFC setup checks, responsive CSS.

---

### Task 1: Action Button Status Labels

**Files:**
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Test: `tests/pet-action-button-status.test.ts`
- Document: `docs/superpowers/summaries/2026-05-07-action-button-status-labels.md`

- [x] **Step 1: Write failing tests**

Create `tests/pet-action-button-status.test.ts` with checks that:
- `PetActions` exposes `getActionButtonStateLabel`, `getActionButtonDetail`, `getActionButtonStateClass`, and updated aria label behavior.
- A recommended available action shows the Korean short label `추천` and uses the recommendation detail as its button detail.
- A normal available action shows `가능` and keeps the existing action detail.
- A cooling action shows `대기` and keeps the remaining time detail.
- A locked action shows `횟수 없음` and keeps the locked detail.
- The template renders a state badge for every action button, not only the recommended button.
- `en`, `ko`, and `ja` include `actionButtonState.ready`, `recommended`, `cooldown`, `active`, and `locked`.
- CSS defines state badge variants and overflow-safe button detail styling.

- [x] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-action-button-status.test.ts`

Expected: fail before implementation because the status helper functions, i18n group, template calls, and CSS variants do not exist.

- [x] **Step 3: Add localized short labels**

In `constants/i18n.ts`, add `actionButtonState` near the existing `actionState` group for every locale:

```ts
actionButtonState: {
  ready: '가능',
  recommended: '추천',
  cooldown: '대기',
  active: '진행 중',
  locked: '횟수 없음',
},
```

Use equivalent English and Japanese labels:
- English: `Ready`, `Recommended`, `Cooldown`, `In progress`, `Locked`
- Japanese: `可能`, `おすすめ`, `待機`, `進行中`, `回数なし`

- [x] **Step 4: Derive button states in `PetActions`**

Add a local state type and helper functions:

```ts
type ActionButtonState = 'ready' | 'recommended' | 'cooldown' | 'active' | 'locked'

function getActionButtonState(action: PetAction): ActionButtonState {
  if (isLimitReached.value) return 'locked'
  if (props.activeReaction === action) return 'active'
  if (props.cooldowns[action] > now.value) return 'cooldown'
  if (isRecommendedAction(action)) return 'recommended'

  return 'ready'
}

function getActionButtonStateLabel(action: PetAction): string {
  return messages.value.actionButtonState[getActionButtonState(action)]
}

function getActionButtonStateClass(action: PetAction): string {
  return `action-button__badge--${getActionButtonState(action)}`
}
```

- [x] **Step 5: Improve button detail and aria text**

Keep `getActionDetail` for disabled/cooldown state copy. Add `getActionButtonDetail`:

```ts
function getActionButtonDetail(action: PetAction): string {
  if (getActionButtonState(action) === 'recommended') return recommendationDetail.value

  return getActionDetail(action)
}
```

Update `getActionAriaLabel` to include both the compact state label and detail:

```ts
function getActionAriaLabel(action: PetAction): string {
  return messages.value.actionState.ariaLabel
    .replace('{action}', messages.value.actions[action].label)
    .replace('{state}', `${getActionButtonStateLabel(action)} · ${getActionButtonDetail(action)}`)
}
```

- [x] **Step 6: Render a state badge for every button**

Replace the recommendation-only badge with:

```vue
<em class="action-button__badge" :class="getActionButtonStateClass(action.id)">
  {{ getActionButtonStateLabel(action.id) }}
</em>
```

Update the button detail line to:

```vue
<small>{{ getActionButtonDetail(action.id) }}</small>
```

- [x] **Step 7: Add overflow-safe badge styles**

In `assets/css/main.css`, keep the existing `.action-button__badge` base style and add variants:

```css
.action-button__badge--ready,
.action-button__badge--recommended,
.action-button__badge--cooldown,
.action-button__badge--active,
.action-button__badge--locked {
  max-width: 100%;
  overflow-wrap: anywhere;
}
```

Add small visual differences for recommended, cooldown/active, and locked states without changing layout dimensions. Ensure `.action-button small` has `line-height: 1.3` and `overflow-wrap: anywhere`.

- [x] **Step 8: Write work summary**

Create `docs/superpowers/summaries/2026-05-07-action-button-status-labels.md` with:
- changed UX behavior
- files changed
- verification commands
- remaining risks
- next improvement candidate

- [x] **Step 9: Verify**

Run:
- `npm run test -- tests/pet-action-button-status.test.ts`
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, load the app at mobile width and verify:
- the recommended button shows `추천`
- non-recommended available buttons show `가능`
- after starting an action, the active button shows `진행 중`
- action buttons do not overflow horizontally.
