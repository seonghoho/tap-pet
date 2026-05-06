# First Care Goal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Help first-time users understand the first repeatable care loop from the status side panel.

**Architecture:** Keep pet state and action logic unchanged. Add a static, localized goal block to the existing status side panel so users can connect the recommended action, result card, and growth gauges without adding persistence or new flows.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest source checks, responsive CSS.

---

### Task 1: First Care Loop Goal

**Files:**
- Modify: `components/PetSidePanel.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Test: `tests/pet-first-care-goal.test.ts`
- Document: `docs/superpowers/summaries/2026-05-07-first-care-goal.md`

- [ ] **Step 1: Write failing tests**

Create `tests/pet-first-care-goal.test.ts` with checks that:
- `PetSidePanel.vue` renders a `.first-care-goal` block in status mode.
- the block uses `messages.firstCareGoal.title`, `description`, and `steps`.
- the block appears before `.progress-list` so the goal explains the growth gauges.
- `en`, `ko`, and `ja` messages include non-empty `eyebrow`, `title`, `description`, and exactly three steps with ids `recommend`, `result`, and `growth`.
- `assets/css/main.css` defines compact, mobile-safe styles for `.first-care-goal` and `.first-care-goal__step`.

- [ ] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-first-care-goal.test.ts`

Expected: fail before implementation because the test file references markup, i18n keys, and styles that do not exist.

- [ ] **Step 3: Add side panel markup**

In `components/PetSidePanel.vue`, insert a lightweight named goal section inside the `mode === 'status'` body, after `.section-heading` and before `.progress-list`:

```vue
<section class="first-care-goal" aria-labelledby="first-care-goal-title">
  <div class="first-care-goal__copy">
    <span>{{ messages.firstCareGoal.eyebrow }}</span>
    <strong id="first-care-goal-title">{{ messages.firstCareGoal.title }}</strong>
    <small>{{ messages.firstCareGoal.description }}</small>
  </div>
  <ol class="first-care-goal__list" role="list">
    <li
      v-for="step in messages.firstCareGoal.steps"
      :key="step.id"
      class="first-care-goal__step"
    >
      <span>{{ step.label }}</span>
    </li>
  </ol>
</section>
```

- [ ] **Step 4: Add localized copy and styles**

Add `firstCareGoal` to each locale in `constants/i18n.ts`:

```ts
firstCareGoal: {
  eyebrow: '첫 돌봄 루프',
  title: '한 번의 돌봄 흐름을 완료하세요',
  description: '추천 행동을 누르고 결과 카드를 확인한 뒤 성장 변화를 보세요.',
  steps: [
    { id: 'recommend', label: '추천 돌봄 선택' },
    { id: 'result', label: '결과 카드 확인' },
    { id: 'growth', label: '성장/친밀도 변화 보기' },
  ],
},
```

Use equivalent English and Japanese copy. Add CSS near the side panel styles with border separators, compact typography, numbered step markers, and `overflow-wrap: anywhere` for narrow mobile widths.

- [ ] **Step 5: Write work summary**

Create `docs/superpowers/summaries/2026-05-07-first-care-goal.md` with:
- changed UX behavior
- files changed
- verification commands
- remaining risks
- next improvement candidate

- [ ] **Step 6: Verify**

Run:
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, check the status side panel on desktop and mobile widths and verify the goal block does not overlap the existing progress gauges or settings tabs.
