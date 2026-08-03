# Living Canvas Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Tab Pet's crowded dashboard with a single-screen, high-quality Canvas companion while preserving existing local pet data and tab title/favicon behavior.

**Architecture:** A presentation-only `PetCanvas` renders the habitat and pet from stable props. Small semantic Vue components own needs and care controls, while `app.vue` composes the immersive screen and reuses the existing store and settings panel. Existing progression data stays compatible but is no longer mounted in the primary interface.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Canvas 2D, Vitest, Vue Test Utils, Playwright, CSS.

**Repository rule:** Do not create commits, branches, or pull requests unless the user explicitly requests them.

---

## File map

- Create `components/PetCanvas.vue`: Canvas lifecycle, high-DPI resize, layered room and pet rendering, action reactions.
- Create `components/PetNeeds.vue`: accessible fullness, energy, and cleanliness indicators.
- Create `components/PetCareDock.vue`: four actions, recommendation, cooldown countdown, concise feedback.
- Modify `components/PetSetup.vue`: one live preview, compact species selector, explicit confirmation.
- Modify `app.vue`: immersive main layout, tab preview, settings drawer, keyboard dismissal.
- Modify `composables/usePetStore.ts`: stop the global action-use limit from blocking normal care.
- Modify `assets/css/main.css`: replace the dashboard visual hierarchy with the Living Canvas system while leaving unused legacy selectors harmless.
- Modify `nuxt.config.ts`: correct product metadata.
- Create `tests/pet-canvas.test.ts`: Canvas lifecycle and accessibility contract.
- Create `tests/pet-care-dock.test.ts`: action, recommendation, disabled, and feedback states.
- Modify `tests/pet-setup-onboarding.test.ts`: preview-before-confirm behavior.
- Create `tests/living-canvas-app.test.ts`: assert removed dashboard modules are not mounted by the main app.
- Modify `e2e/smoke.spec.ts`: first-use and returning-care smoke path against the new structure.

### Task 1: Canvas rendering lifecycle

**Files:**
- Create: `components/PetCanvas.vue`
- Create: `tests/pet-canvas.test.ts`

- [ ] **Step 1: Write failing lifecycle tests**

Test a semantic canvas label, device-pixel resize, a queued animation frame, and cleanup. Stub `HTMLCanvasElement.prototype.getContext`, `ResizeObserver`, `requestAnimationFrame`, and `cancelAnimationFrame` with deterministic spies.

```ts
const wrapper = mount(PetCanvas, {
  props: {
    species: 'cat',
    status: 'happy',
    activeReaction: null,
    ariaLabel: '고양이 행복함',
  },
})

expect(wrapper.get('canvas').attributes('aria-label')).toBe('고양이 행복함')
expect(requestAnimationFrame).toHaveBeenCalled()
wrapper.unmount()
expect(cancelAnimationFrame).toHaveBeenCalled()
```

- [ ] **Step 2: Verify the test fails**

Run: `npm run test -- tests/pet-canvas.test.ts`

Expected: FAIL because `components/PetCanvas.vue` does not exist.

- [ ] **Step 3: Implement the rendering component**

Use the public contract below and keep all mutation inside the animation lifecycle.

```ts
const props = withDefaults(defineProps<{
  species: PetSpecies
  status: PetStatus
  activeReaction?: PetAction | null
  ariaLabel: string
}>(), { activeReaction: null })

const canvas = ref<HTMLCanvasElement | null>(null)
let context: CanvasRenderingContext2D | null = null
let frameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let startedAt = 0
let isReducedMotion = false
let isVisible = true
```

Implement focused drawing functions named `drawRoom`, `drawPet`, `drawFace`, and `drawReaction`. Draw room light, window, floor, rug, shadow, and a rounded pet body. Branch on all six `PetSpecies` values for ears, spikes, long ears, penguin wings, and hamster cheeks. Branch on `PetStatus` for eyes, mouth, posture, and palette. Branch on `PetAction` for food, ball, sleep marks, and bubbles.

Resize using `Math.min(window.devicePixelRatio || 1, 2)` and the element's `getBoundingClientRect`. Pause frames on `document.visibilitychange`. Respect `(prefers-reduced-motion: reduce)` by drawing a static frame. Remove observers, media listeners, document listeners, and animation frames on unmount.

- [ ] **Step 4: Run the focused tests**

Run: `npm run test -- tests/pet-canvas.test.ts`

Expected: PASS.

### Task 2: Semantic needs and care dock

**Files:**
- Create: `components/PetNeeds.vue`
- Create: `components/PetCareDock.vue`
- Create: `tests/pet-care-dock.test.ts`

- [ ] **Step 1: Write failing care-dock tests**

Mount the dock with four zero cooldowns, `feed` as the recommendation, and a null reaction. Assert four native buttons, `data-recommended="true"` on feed, and an emitted `action` event after click. Rerender with an active reaction and a future cooldown, then assert the matching button is disabled.

```ts
expect(wrapper.findAll('button[data-action]')).toHaveLength(4)
expect(wrapper.get('[data-action="feed"]').attributes('data-recommended')).toBe('true')
await wrapper.get('[data-action="feed"]').trigger('click')
expect(wrapper.emitted('action')).toEqual([['feed']])
```

- [ ] **Step 2: Verify the test fails**

Run: `npm run test -- tests/pet-care-dock.test.ts`

Expected: FAIL because the new components do not exist.

- [ ] **Step 3: Implement `PetNeeds.vue`**

Accept `stats: PetStats`. Use existing localized stat labels and render three meter-like rows with textual values and CSS custom property `--need-value`.

```vue
<li v-for="need in needs" :key="need.id" class="pet-need">
  <span>{{ need.label }}</span>
  <span class="pet-need__track" aria-hidden="true">
    <span class="pet-need__fill" :style="{ '--need-value': `${need.value}%` }" />
  </span>
  <strong>{{ need.value }}</strong>
</li>
```

- [ ] **Step 4: Implement `PetCareDock.vue`**

Accept `cooldowns`, `activeReaction`, `recommendedCareAction`, and `careFeedback`. Emit only `action`. Keep a one-second local clock while mounted. A button is disabled only when its own reaction is active or its cooldown is in the future. Use existing localized action labels and details. Render a compact feedback sentence without EXP, affinity, personality, unlock, action-limit, or rewarded-ad content.

```ts
const actions: readonly PetAction[] = ['feed', 'play', 'sleep', 'wash']
const isDisabled = (action: PetAction) =>
  props.activeReaction === action || props.cooldowns[action] > now.value
```

- [ ] **Step 5: Run focused tests**

Run: `npm run test -- tests/pet-care-dock.test.ts`

Expected: PASS.

### Task 3: First-use species selection

**Files:**
- Modify: `components/PetSetup.vue`
- Modify: `tests/pet-setup-onboarding.test.ts`

- [ ] **Step 1: Change the onboarding test first**

Assert that setup mounts one `PetCanvas`, six compact species buttons, and one confirm button. Clicking a species changes the preview but does not emit. Clicking confirm emits the selected species.

```ts
await wrapper.get('[data-species="rabbit"]').trigger('click')
expect(wrapper.emitted('select')).toBeUndefined()
await wrapper.get('[data-testid="confirm-pet"]').trigger('click')
expect(wrapper.emitted('select')).toEqual([['rabbit']])
```

- [ ] **Step 2: Verify the changed test fails**

Run: `npm run test -- tests/pet-setup-onboarding.test.ts`

Expected: FAIL because species currently emit immediately and no confirm control exists.

- [ ] **Step 3: Rework the setup component**

Store `selectedSpecies` in a ref defaulting to `cat`. Render a single `PetCanvas` with happy status, a six-button species rail with `aria-pressed`, the existing tab preview in compact form, the local-save note, and a primary confirm button. Remove the three-step explainer and six large equal cards.

```ts
const selectedSpecies = ref<PetSpecies>('cat')
const confirmSelection = () => emit('select', selectedSpecies.value)
```

- [ ] **Step 4: Run focused tests**

Run: `npm run test -- tests/pet-setup-onboarding.test.ts tests/pet-canvas.test.ts`

Expected: PASS.

### Task 4: Simplified care behavior

**Files:**
- Modify: `composables/usePetStore.ts`
- Modify: `tests/pet-model.test.ts`

- [ ] **Step 1: Add a regression test for unlimited normal care**

Initialize a pet whose `actionLimit.used` is at the base limit. Trigger a care action after cooldown and advance fake timers. Assert the stat change and feedback still occur.

```ts
store.petState.value!.actionLimit.used = ACTION_LIMIT_BASE_USES
store.performAction('feed')
vi.advanceTimersByTime(ACTION_REACTION_HOLD_MS)
expect(store.lastCareFeedback.value?.action).toBe('feed')
```

- [ ] **Step 2: Verify the regression test fails**

Run: `npm run test -- tests/pet-model.test.ts`

Expected: FAIL because `consumeActionLimitUse` returns null and blocks `performAction`.

- [ ] **Step 3: Remove action-limit gating from `performAction`**

Delete the `consumeActionLimitUse` call, its null guard, and the intermediate `commitState` that only stores the consumed limit. Keep cooldown, reactions, care calculations, storage, growth, daily goal, and personality logic intact. Leave action-limit helpers and stored fields available for backwards compatibility with legacy tests and state.

- [ ] **Step 4: Run store tests**

Run: `npm run test -- tests/pet-model.test.ts tests/pet-storage.test.ts tests/pet-action-limit-reward.test.ts`

Expected: PASS after updating only assertions that explicitly expected normal care to be blocked by the obsolete cap.

### Task 5: Immersive application shell

**Files:**
- Modify: `app.vue`
- Create: `tests/living-canvas-app.test.ts`

- [ ] **Step 1: Write failing composition tests**

Shallow mount the app with a ready pet. Stub the store and assert `PetCanvas`, `PetNeeds`, and `PetCareDock` render. Assert `PetSidePanel`, `GuidePanel`, `AdSenseDisplay`, `PetDailyGoal`, and `MonetizationMock` do not render. Assert the settings drawer starts closed, opens from its labelled button, and closes on Escape.

- [ ] **Step 2: Verify the composition test fails**

Run: `npm run test -- tests/living-canvas-app.test.ts`

Expected: FAIL because the app still mounts dashboard panels.

- [ ] **Step 3: Recompose `app.vue`**

Keep locale restoration, pet restoration, tab title, favicon, system theme, and visibility handling. Remove AdSense runtime calculations and side-panel mode code from the root. Add `isSettingsOpen`, `openSettings`, `closeSettings`, and a window keydown handler for Escape.

For a ready pet, render:

```vue
<main class="living-stage">
  <section class="living-habitat">
    <PetCanvas :species="currentPet.species" :status="effectiveStatus"
      :active-reaction="pet.activeReaction.value" :aria-label="avatarLabel" />
    <div class="living-habitat__identity">...</div>
    <PetNeeds :stats="currentPet.stats" />
    <PetCareDock :cooldowns="pet.actionCooldowns.value"
      :active-reaction="pet.activeReaction.value"
      :recommended-care-action="pet.recommendedCareAction.value"
      :care-feedback="pet.lastCareFeedback.value" @action="handleAction" />
  </section>
</main>
```

Render `PetSettingsPanel` inside a modal-like drawer only while open. Pass name, settings, update, reset, and close behaviors using its existing public props and events. Keep the storage warning.

- [ ] **Step 4: Run focused app tests**

Run: `npm run test -- tests/living-canvas-app.test.ts tests/tab-presentation.test.ts tests/use-favicon.test.ts tests/use-tab-title.test.ts`

Expected: PASS, with the pre-existing lifecycle warnings in `use-favicon.test.ts` permitted but no test failures.

### Task 6: Living Canvas visual system and metadata

**Files:**
- Modify: `assets/css/main.css`
- Modify: `nuxt.config.ts`

- [ ] **Step 1: Implement the page-level design tokens and layout**

Add a Living Canvas token layer using existing theme variables plus fixed warm accents:

```css
.app-shell {
  --living-ink: #2d261f;
  --living-paper: #f5efe5;
  --living-apricot: #ec9a62;
  --living-moss: #66735a;
  min-height: 100svh;
  overflow-x: hidden;
  background: var(--app-bg);
  color: var(--app-text);
}

.living-habitat {
  position: relative;
  min-height: clamp(620px, calc(100svh - 136px), 860px);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--app-border), transparent 24%);
  border-radius: clamp(28px, 4vw, 52px);
  box-shadow: 0 32px 90px rgba(55, 39, 24, .14);
}
```

Style the top bar, tab preview, identity glass panel, need indicators, circular care dock, recommended action, feedback toast, setup species rail, drawer backdrop, settings sheet, focus-visible states, and reduced-motion mode. At `max-width: 720px`, make the scene edge-to-edge with smaller radii, wrap the care dock into a reachable bottom row, and make the drawer full height.

- [ ] **Step 2: Correct metadata**

Set the static title to `Tab Pet — your quiet browser companion` and description to `A tiny local pet that lives in your browser tab and reacts when it needs care.` Keep the existing conditional AdSense script behavior untouched even though the main screen no longer mounts an ad unit.

- [ ] **Step 3: Run type check and build**

Run: `npm run lint && npm run build`

Expected: both commands exit 0.

### Task 7: End-to-end and visual verification

**Files:**
- Modify: `e2e/smoke.spec.ts`

- [ ] **Step 1: Update the smoke path**

Clear localStorage, open `/`, select rabbit through `[data-species="rabbit"]`, confirm through `[data-testid="confirm-pet"]`, assert the living habitat and four care buttons, trigger the recommended care action, and assert a feedback toast. Reload and assert the rabbit habitat restores. Open and close settings. Repeat the main assertions at a 390×844 viewport.

- [ ] **Step 2: Run all automated checks**

Run: `npm run test && npm run lint && npm run build && npm run test:e2e`

Expected: all commands exit 0.

- [ ] **Step 3: Capture and inspect desktop and mobile screenshots**

Run the development server, then capture full-page screenshots at 1440×1000 and 390×844 after pet selection. Verify that the Canvas pet is the dominant object, no legacy side panel is visible, the care dock is reachable without horizontal scroll, text stays legible over the scene, and focus states are visible.

- [ ] **Step 4: Inspect the working tree**

Run: `git status --short && git diff --check && git diff --stat`

Expected: only the redesign source, tests, and design/plan documents are changed; `git diff --check` reports no whitespace errors.
