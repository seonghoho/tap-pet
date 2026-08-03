# Tab Pet Living Canvas Redesign

Date: 2026-08-03

## 1. Product decision

Tab Pet will become a quiet, single-screen digital companion centered on an expressive 2D Canvas habitat. The browser tab title and favicon remain the product's differentiator, while the page itself becomes a warm place users want to revisit rather than a dashboard of game systems.

The redesign deliberately removes feature pressure. The default screen exposes only the pet, its present mood, the tab signal, and four care actions. Progression, daily goals, personality, monetization previews, ads, guides, and reward recovery no longer compete for attention.

## 2. Why Living Canvas

Three approaches were compared:

1. Living Canvas: programmatic 2D illustration, ambient lighting, and reaction animation.
2. Editorial Companion: high-resolution raster art with campaign-like typography.
3. Pocket 3D World: Three.js room, camera, lighting, and a rigged pet.

Living Canvas is selected because it offers the best balance of visual character, fast loading, mobile reliability, reduced-motion support, and maintainability. Three.js would add a significant model, rigging, bundle, GPU, and accessibility burden before the core pet art direction is proven. Raster art would require a large state-by-species asset matrix and make future reactions expensive to add.

## 3. Experience principles

- One screen, one companion, one obvious next action.
- The pet is the largest and most emotionally expressive object.
- State is communicated through posture, face, room lighting, and a short sentence before numbers.
- Controls float around the habitat instead of splitting the page into dashboard panels.
- Progress mechanics continue internally for storage compatibility, but they do not drive the main interface.
- Motion is soft and interruptible, and is disabled or simplified for reduced-motion users.
- The experience remains fully local with no account requirement.

## 4. User flow

### First visit

1. The user sees one live Canvas pet preview, not six equal cards.
2. A compact species rail changes the preview among cat, dog, hedgehog, rabbit, penguin, and hamster.
3. The user confirms the selected companion with one primary button.
4. The main habitat appears immediately and the browser tab signal becomes active.

### Returning visit

1. The saved pet restores with offline decay as before.
2. The room and pet expression reflect the current status.
3. A compact return message appears and then dismisses without blocking care.
4. The recommended care action is visually emphasized in the bottom dock.

### Care interaction

1. The user chooses feed, play, sleep, or wash.
2. The selected action enters a short cooldown and the Canvas plays a distinct reaction.
3. A brief feedback toast summarizes the visible effect.
4. No global care-use cap or rewarded-ad recovery interrupts the loop.

## 5. Information architecture

### Persistent top bar

- Tab Pet wordmark and one-line positioning.
- Live tab-title preview with a subtle status indicator.
- Language selector.
- Settings button.

### Main habitat

- Full-width responsive Canvas scene.
- Pet name, species, mood label, and one mood sentence.
- Three compact need indicators for fullness, energy, and cleanliness.
- Ambient decorative details that respond to theme and state without becoming controls.

### Care dock

- Four icon-first actions: feed, play, sleep, and wash.
- Recommended action receives the accent treatment.
- Active and cooldown states remain visible and accessible.
- Feedback is concise; EXP, affinity, personality, unlocks, and reward previews are not shown.

### Settings drawer

- Pet name.
- Tab title mode and disguise title.
- Theme and language.
- Reset action behind a deliberate confirmation affordance.

The drawer does not include progression, daily goals, personality, premium packs, ads, or guides.

## 6. Canvas architecture

`components/PetCanvas.vue` owns rendering only. It receives stable presentation props and emits no domain mutations.

Inputs:

- species
- status
- active reaction
- theme mode
- reduced-motion preference

Rendering layers:

1. Background gradient and ambient light.
2. Window, floor, rug, and a small number of habitat objects.
3. Pet shadow and body.
4. Species-specific silhouette details.
5. Status-specific face and posture.
6. Action particles and foreground accents.

The renderer uses `requestAnimationFrame`, device-pixel-ratio scaling, `ResizeObserver`, and deterministic easing. It pauses when the document is hidden and cleans up every observer and animation frame on unmount. Decorative animation is skipped when reduced motion is requested.

The Canvas is accompanied by semantic HTML text describing species and status. Care controls remain native buttons; Canvas is not the only source of information.

## 7. State and compatibility

The existing localStorage schema remains readable. Pet species, name, stats, settings, growth, personality, daily goal, and action-limit fields are not removed from stored records in this release.

Behavior changes:

- Global care-use consumption no longer blocks `performAction`.
- Rewarded-ad recharge is removed from the active product flow.
- Cooldowns remain to prevent repeated animation collisions.
- Growth, personality, and daily-goal calculations continue internally to avoid risky migration work, but their UI is removed.
- Existing pets and all six species remain valid.

This approach avoids destructive storage migration while simplifying the experience immediately.

## 8. Component changes

### New

- `components/PetCanvas.vue`: high-DPI Canvas renderer and animation lifecycle.
- `components/PetCareDock.vue`: four concise care actions and cooldown/feedback state.
- `components/PetNeeds.vue`: semantic compact need indicators.

### Reworked

- `app.vue`: single-screen composition, settings drawer, tab preview, and simplified data flow.
- `components/PetSetup.vue`: live preview plus compact species rail and confirm action.
- `assets/css/main.css`: new responsive visual system, ambient surfaces, typography, motion, and drawer behavior.
- `composables/usePetStore.ts`: remove global care-use blocking while retaining stored compatibility fields.
- `nuxt.config.ts`: correct title and product description metadata.

### Retained but no longer mounted on the main screen

- PetStatusPanel
- PetHabitat
- PetAvatar
- PetActions
- PetSidePanel
- PetDailyGoal
- GuidePanel
- MonetizationMock
- AdSenseDisplay

Keeping these files during the first redesign pass limits the blast radius. They can be deleted in a later cleanup after the new interface is proven.

## 9. Visual system

- Palette: warm parchment, apricot, moss, muted teal, and dark cocoa rather than generic SaaS blue.
- Typography: system-first with rounded display treatment and strong Korean legibility; no runtime font dependency.
- Surfaces: translucent warm glass only where it supports legibility over Canvas.
- Shape language: large organic radii, circular actions, fine borders, soft layered shadows.
- Motion: breathing, blinking, floating dust, soft light drift, and action-specific reactions.
- Desktop: centered cinematic habitat with controls overlaid at its edges.
- Mobile: habitat occupies the upper viewport, care dock remains reachable near the bottom, and settings becomes a full-height sheet.

## 10. Error and fallback behavior

- If Canvas is unavailable, semantic status content and care buttons still render.
- Canvas resize failures keep the previous frame instead of throwing into the app.
- localStorage errors continue to surface as a compact non-blocking warning.
- Cooldown buttons expose disabled state and remain labelled for assistive technology.
- The settings drawer traps no navigation; Escape and the close button dismiss it.

## 11. Verification

Automated checks:

- Existing domain tests for storage, decay, title, favicon, care, and validation.
- New component tests for simplified setup and care-dock state.
- Canvas renderer tests for draw lifecycle, resize, reduced motion, document visibility, and cleanup where practical.
- Type checking and production build.
- Playwright smoke coverage for first visit, species selection, care action, settings, persistence, desktop, and mobile.

Visual checks:

- Desktop widths around 1440 and 1280.
- Mobile widths around 390 and 430.
- Light and dark system themes.
- All six species in happy, hungry, sleepy, dirty, bored, and excited states.
- Feed, play, sleep, and wash reaction states.
- Reduced motion and keyboard-only navigation.

## 12. Success criteria

- A first-time user can choose a pet and understand the product in under 15 seconds.
- The pet occupies the visual center and no secondary panel competes with it.
- The default screen exposes no ad, premium, daily-goal, personality, level-unlock, or reward-recovery UI.
- A care action produces an immediate visible Canvas reaction and tab update.
- Existing local pets restore without reset.
- Type check, unit tests, production build, and focused end-to-end smoke tests pass.
- The main client bundle remains materially lighter than a comparable Three.js implementation and the page stays responsive on mobile-sized viewports.
