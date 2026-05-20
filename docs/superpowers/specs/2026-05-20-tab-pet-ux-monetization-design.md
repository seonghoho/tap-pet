# Tab Pet UX Monetization Design

Date: 2026-05-20

## 1. Summary

This design improves Tab Pet's first-use flow, main care surface, mobile information hierarchy, and monetization mock placement.

The product direction is:

- Keep Tab Pet's core identity as a browser tab title and favicon-first pet companion.
- Move first-time users toward the first recommended care action faster.
- Reduce early visual noise from growth, personality, unlock, and ad areas.
- Treat monetization as an extension of disguise, tab signaling, and taste, not as a blocker for core pet care.

Recommended implementation direction: use a care-focused main flow, then add premium tab-pack cues from the disguise/title settings experience.

## 2. Product Goal

The goal is to make the user understand and feel the core loop faster:

1. Pick a pet.
2. See that the browser tab is the real status surface.
3. Complete one recommended care action.
4. See the result and a small next reason to return.
5. Notice that premium value means better disguise, quieter signals, and nicer tab/theme presentation.

This should support the PRD success criterion that users can select a pet and verify tab changes within 30 seconds.

## 3. Scope

Included:

- Onboarding information hierarchy cleanup.
- Main screen focus on current pet status, tab signal preview, recommended care, and action buttons.
- Side panel information hierarchy cleanup before the first care loop has started.
- Mobile reduction of long default content exposure.
- Premium locked UI for work-safe title packs, quiet tab signal packs, and premium themes.
- Ad display cleanup so empty or development display-ad blocks do not dominate the page.
- Rewarded ad recharge remains the primary ad monetization moment when care uses are exhausted.
- Unit/template tests for the new UI expectations.

Excluded:

- Real payment integration.
- Real premium entitlement state.
- Real ad SDK changes beyond display visibility behavior.
- New account, login, cloud save, or backend state.
- New storage schema or localStorage migration.
- Room item inventory, decoration collection, or seasonal event systems.
- Redesigning the whole visual system.

## 4. UX Direction

### 4.1 Onboarding

The current onboarding explains the concept, but the pet choices appear after several explanatory blocks.

The new onboarding should:

- Keep the short product framing: the browser tab carries the main pet reaction.
- Keep the tab signal preview, but make it shorter and easier to scan.
- Reduce the visual weight of the three setup steps.
- Move the pet selection area earlier or make it visually dominant enough that choosing a pet is the obvious next action.
- Preserve the no-account local-save note.

The user should not need to study the setup flow before selecting a pet.

### 4.2 Main Care Surface

After pet creation, the primary screen should prioritize:

1. Pet visual state and stats.
2. Current tab signal preview.
3. Recommended care action.
4. Care action buttons.

The recommendation card should explain why one action is recommended, but should not compete with the action button as a second CTA. The recommended action button remains the execution point.

The main care surface should avoid making early users parse level goals, personality, unlocks, daily goals, ads, and settings all at once.

### 4.3 Side Panel

Before the first care loop starts, the side panel should read like a compact next-step panel:

- Pet name and level summary.
- First care loop goal.
- Daily goal.
- One visible next reward.
- Premium tab pack preview.

Detailed sections such as personality, multiple growth goals, full unlock lists, and long progress stacks should be less dominant before the first care loop is underway. Existing growth information can remain available after the user has completed care or has meaningful progress.

### 4.4 Mobile

The current mobile page becomes very long because the full side panel and empty display-ad block follow the main care controls.

Mobile should prioritize:

1. Pet status.
2. Tab signal preview.
3. Recommended care.
4. Action buttons.
5. Compact or collapsible goal/progress/premium areas.

The user should not encounter a large empty ad block while still learning the core loop.

## 5. Monetization Design

### 5.1 Rewarded Ad Recharge

Rewarded ad recharge is the best ad moment because it appears when the user's care flow is blocked by the care-use limit.

When the user exhausts care uses:

- Show the wait option and reset timer.
- Show the rewarded option with the concrete reward count.
- Keep the comparison in the action-limit card.
- Make the rewarded option read as a recovery choice, not a random ad.

The current behavior of granting additional care uses can remain as a mock. No real ad SDK work is included in this design.

### 5.2 Display Ads

Display ads should not be the main monetization proof for this product.

Display ad rules:

- Show the side display ad only when AdSense is explicitly enabled and configured.
- Do not show a large development ad block in normal local development UX.
- Do not let an empty sponsored block push core progress or settings content down on mobile.

This preserves room for real AdSense later without damaging early product clarity.

### 5.3 Premium Tab Pack

Premium value should extend the product's unique tab-first positioning.

Premium locked mock groups:

1. Work title pack
   - Examples: `Roadmap`, `KPI Review`, `Sprint Board`, `Client Notes`.
   - Purpose: gives users more work-safe disguise options.

2. Quiet tab signal pack
   - Examples: status copy that reads like work signals instead of pet requests.
   - Purpose: lets the pet communicate while remaining subtle in work or school contexts.

3. Premium theme pack
   - Examples: focus, mono, soft night.
   - Purpose: changes body UI and favicon palette as a taste upgrade.

Premium controls are mock-only:

- Locked items are visible but not selectable.
- Locked items show a clear premium label.
- Disabled controls should not emit selection events.
- Copy should not imply payment is currently available.

## 6. Component Plan

### `components/PetSetup.vue`

Responsibilities:

- Present the quick onboarding.
- Keep pet species selection obvious.
- Keep the tab-signal concept visible without over-explaining it.

Expected changes:

- Adjust template order or visual hierarchy so pet selection becomes the primary action.
- Shorten setup preview copy if needed through `constants/i18n.ts`.
- Preserve existing species options and select event behavior.

### `components/PetActions.vue`

Responsibilities:

- Render the care limit card.
- Render the recommended care explanation.
- Render action buttons as the execution surface.
- Render care feedback after a completed action.

Expected changes:

- Reduce recommendation card CTA duplication.
- Keep recommendation evidence and reward preview scannable.
- Keep rewarded recharge in the limit-reached state.
- Update copy if needed through `constants/i18n.ts`.

### `components/PetSidePanel.vue`

Responsibilities:

- Render side-panel status and settings tabs.
- Render compact progression context.
- Render the premium tab-pack preview in status mode.

Expected changes:

- Use existing `hasStartedFirstCareLoop` logic to decide whether to show compact first-use context or fuller progression context.
- Add a compact premium tab-pack preview section.
- Avoid hiding essential daily goal or reset/settings controls.

### `components/PetSettingsPanel.vue`

Responsibilities:

- Render title, visibility, disguise title, animation, theme, and reset controls.
- Render premium locked mock controls related to tab presentation.

Expected changes:

- Add locked premium title pack rows.
- Add locked quiet signal pack rows.
- Add locked premium theme rows or a compact premium theme section.
- Keep free title and theme controls unchanged.
- Ensure locked controls do not emit updates.

### `components/AdSenseDisplay.vue` and `app.vue`

Responsibilities:

- Keep real display ad placement available.
- Avoid development ad block clutter.

Expected changes:

- `app.vue` should mount `AdSenseDisplay` only when display ads are truly enabled and configured.
- `AdSenseDisplay` can keep its empty-slot rendering for direct component tests or explicit local usage, but the main app should not show it by default.

### `constants/titles.ts`

Responsibilities:

- Store free disguise title presets.
- Store premium title pack mock data if the implementation keeps title data close to title constants.

Expected changes:

- Add premium title examples as non-selectable mock data, or create a separate premium constant if cleaner.

### `constants/themes.ts`

Responsibilities:

- Store actual selectable free themes.
- Store premium theme mock data if using the same type shape is useful.

Expected changes:

- Add premium theme metadata without making premium themes selectable as active settings.

### `constants/i18n.ts`

Responsibilities:

- Store Korean, English, and Japanese UI copy.

Expected changes:

- Add premium tab-pack labels and descriptions.
- Refine recommendation, ad recharge, and onboarding copy only where needed.
- Do not introduce untranslated UI strings.

## 7. Data Model

No persisted data model changes are needed.

Rationale:

- Premium state is mock-only.
- Locked items are not selectable.
- Ad recharge already exists as a local mock behavior.
- The feature is presentation and information hierarchy work.

If implementation needs structured premium mock data, it should use static constants only. It should not add new `PetState` fields or bump storage version.

## 8. Testing Plan

Use existing Vitest patterns and focused template/setup tests.

Test coverage should include:

- `PetSetup.vue` still emits species selection and presents pet choices prominently.
- `PetActions.vue` keeps rewarded recharge in the limit-reached state and avoids duplicate primary CTA copy in the recommendation card.
- `PetSidePanel.vue` uses first-care-loop state to keep early progress context compact.
- `PetSettingsPanel.vue` renders premium locked tab-pack items and does not wire them to selectable settings.
- `app.vue` does not mount the side display ad unless AdSense is enabled and configured.
- `constants/i18n.ts` includes Korean, English, and Japanese copy for new premium labels.

Manual visual verification:

- Desktop onboarding.
- Desktop main screen after pet selection.
- Desktop settings panel.
- Mobile onboarding.
- Mobile main screen after pet selection.
- Mobile care-limit state.

Validation commands:

- `npm run test`
- `npm run lint`
- `npm run build`

## 9. Acceptance Criteria

- A new user can identify the pet selection action immediately on onboarding.
- After pet creation, the main screen emphasizes pet status, tab signal, and recommended care before progression details.
- Mobile no longer shows a large empty sponsored block in normal development or unconfigured ad states.
- Rewarded recharge remains available when care uses are exhausted.
- Premium locked UI clearly communicates tab-first value: work titles, quiet signals, and premium themes.
- Locked premium controls are visibly disabled and do not alter pet settings.
- No new storage migration is required.
- Existing care actions, daily goal, growth, personality, tab title, favicon, and reset behavior remain intact.
