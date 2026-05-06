# Action Availability Forecast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make care action availability easier to predict by showing limit reset timing and the next cooldown recovery.

**Architecture:** Keep store timing and cooldown logic unchanged. Extend `PetActions.vue` presentation with computed text derived from existing `actionLimitInfo`, `cooldowns`, and `activeReaction`, then render lightweight helper text near the existing action controls.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest source/setup checks, responsive CSS.

---

### Task 1: Availability Forecast

**Files:**
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Test: `tests/pet-action-availability.test.ts`
- Document: `docs/superpowers/summaries/2026-05-07-action-availability-forecast.md`

- [ ] **Step 1: Write failing tests**

Create `tests/pet-action-availability.test.ts` with checks that:
- `PetActions.vue` renders action limit meta text and an `.action-availability` helper.
- the helper reports the next cooling action while actions remain available.
- the helper hides during active reactions and when the action limit is reached.
- expired limit windows show a ready state instead of a stale `0s` countdown.
- en/ko/ja messages include limit reset and cooldown copy.
- CSS defines mobile-safe styles for the new helper text.

- [ ] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-action-availability.test.ts`

Expected: fail before implementation because markup, computed values, i18n, and styles do not exist.

- [ ] **Step 3: Implement computed values and markup**

In `components/PetActions.vue`, add:
- `actionLimitMetaText`
- `hasActionLimitWindowExpired`
- `nextCoolingAction`
- `actionAvailabilityText`
- `shouldShowActionAvailability`

Render `actionLimitMetaText` under the existing limit text, and render `.action-availability` before the action button grid when a cooldown forecast exists.

- [ ] **Step 4: Add copy and styles**

Add localized `actionLimit.resetHint`, `actionLimit.rewardHint`, and `actionAvailability.cooldown` copy for `en`, `ko`, and `ja`. Add compact, responsive CSS for `.action-limit__copy` and `.action-availability`.

- [ ] **Step 5: Write work summary**

Create `docs/superpowers/summaries/2026-05-07-action-availability-forecast.md` with:
- changed UX behavior
- files changed
- verification commands
- remaining risks or next candidate

- [ ] **Step 6: Verify**

Run:
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, click a longer-cooldown action and verify the cooldown helper appears without duplicating or overlapping other action states.
