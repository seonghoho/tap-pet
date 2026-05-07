# Side Panel Growth Goals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the side-panel growth section easier to scan by showing how much remains until the next level and affinity reward bonus.

**Architecture:** Keep growth math and store state unchanged. Derive goal copy inside `PetSidePanel.vue` from existing `level`, `levelProgress`, and `affinityProgress` props, then render a compact goal summary above the existing progress gauges.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest SFC source/setup checks, responsive CSS.

---

### Task 1: Side Panel Growth Goals

**Files:**
- Modify: `components/PetSidePanel.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Test: `tests/pet-side-panel-growth-goals.test.ts`
- Document: `docs/superpowers/summaries/2026-05-07-side-panel-growth-goals.md`

- [x] **Step 1: Write failing tests**

Create `tests/pet-side-panel-growth-goals.test.ts` with checks that:
- `PetSidePanel.vue` renders a `.progress-goals` section before `.progress-list`;
- the section uses localized `messages.sidePanelProgress.progressGoalHeading`;
- setup exposes level and affinity goal text derived from `levelProgress` and `affinityProgress`;
- level goal text says how much EXP remains until the next level;
- affinity goal text says how much affinity remains until the next reward bonus level;
- en/ko/ja messages include all required placeholders;
- CSS defines compact responsive styles for `.progress-goals` and `.progress-goal`.

- [x] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-side-panel-growth-goals.test.ts`

Expected: fail before implementation because goal computed values, markup, copy, and styles do not exist.

- [x] **Step 3: Implement goal computed values**

In `components/PetSidePanel.vue`:
- import `computed`;
- store props in `const props = defineProps<...>()`;
- add `levelGoalRemaining`, `affinityGoalRemaining`, `levelGoalText`, and `affinityGoalText`;
- add `progressGoalRows` with two rows: `level` and `affinity`.

Use `Math.max(0, required - current)` for remaining values. The next level target is `props.level + 1`; the next affinity target is `props.affinityProgress.level + 1`.

- [x] **Step 4: Add markup, copy, and styles**

Render a named `.progress-goals` section after `.first-care-goal` and before `.progress-list`. Each row should show a label, primary target text, and current/required detail.

Add localized `sidePanelProgress` copy for `en`, `ko`, and `ja`:
- `progressGoalHeading`
- `levelGoalLabel`
- `affinityGoalLabel`
- `levelGoalRemaining`
- `affinityGoalRemaining`
- `goalComplete`
- `goalProgressDetail`

Add CSS for `.progress-goals`, `.progress-goals__copy`, `.progress-goals__list`, and `.progress-goal` with safe wrapping.

- [x] **Step 5: Write work summary**

Create `docs/superpowers/summaries/2026-05-07-side-panel-growth-goals.md` with:
- changed UX behavior;
- files changed;
- verification commands;
- subagent review notes;
- remaining risks;
- next improvement candidate.

- [x] **Step 6: Verify**

Run:
- `npm run test -- tests/pet-side-panel-growth-goals.test.ts`
- `npm run test -- tests/pet-side-panel-controls.test.ts tests/pet-growth.test.ts`
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, load the app at mobile width and verify:
- the growth goals section appears before the gauges;
- long Korean goal text wraps without horizontal overflow;
- the existing first-care goal and settings tabs still read clearly.
