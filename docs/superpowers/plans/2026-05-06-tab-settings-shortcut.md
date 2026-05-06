# Tab Settings Shortcut Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make tab settings easier to discover after pet setup, especially on mobile where the side panel sits below the main care panel.

**Architecture:** Add a topbar shortcut that appears only after a pet exists. The shortcut switches `sidePanelMode` to `settings` and scrolls the side panel into view, without changing settings state shape or side panel internals.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest source checks, responsive CSS.

---

### Task 1: Tab Settings Shortcut

**Files:**
- Modify: `app.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Test: `tests/pet-settings-shortcut.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/pet-settings-shortcut.test.ts` with checks that:
- `app.vue` renders a `tab-settings-shortcut` button only when `currentPet` exists.
- the button calls `openTabSettings`.
- `openTabSettings` calls `pet.setSidePanelMode('settings')`.
- the side panel area has `ref="sidePanelElement"` and the handler scrolls it into view.
- every locale exposes `messages.settings.openTabSettings`.
- CSS defines desktop and mobile shortcut sizing.

- [ ] **Step 2: Verify RED**

Run: `npm run test -- tests/pet-settings-shortcut.test.ts`

Expected: fail before implementation because the shortcut, handler, i18n key, and styles do not exist.

- [ ] **Step 3: Implement app handler and markup**

In `app.vue`, add:
- `const sidePanelElement = ref<HTMLElement | null>(null)`
- `function openTabSettings(): void { pet.setSidePanelMode('settings'); ...scrollIntoView... }`
- a `button.tab-settings-shortcut` in `.topbar-actions`, after `.tab-preview`, guarded by `v-if="currentPet"`.
- `ref="sidePanelElement"` on the side stack `<aside>`.

- [ ] **Step 4: Add copy and styles**

Add `settings.openTabSettings` for `en`, `ko`, and `ja`. Add `.tab-settings-shortcut` styles near topbar controls and mobile width rules inside the existing `@media (max-width: 720px)` block.

- [ ] **Step 5: Verify**

Run:
- `npm run test`
- `npm run lint`
- `npm run build`

For UI, verify after pet creation that the shortcut is visible at desktop and mobile widths, and that clicking it reveals the settings tab.
