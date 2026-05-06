# Onboarding Tab Signals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the first screen explain Tab Pet's value quickly by showing the care loop, local-save reassurance, and a browser-tab signal preview before pet selection.

**Architecture:** Keep the change inside the existing setup surface. Add localized onboarding copy to `constants/i18n.ts`, render it from `components/PetSetup.vue`, and style it in `assets/css/main.css` without changing pet state or tab presentation logic.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest template/source checks.

---

### Task 1: Setup Onboarding Copy And Layout

**Files:**
- Modify: `constants/i18n.ts`
- Modify: `components/PetSetup.vue`
- Modify: `assets/css/main.css`
- Test: `tests/pet-setup-onboarding.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/pet-setup-onboarding.test.ts` with checks that the setup screen renders onboarding-specific message keys and structural classes:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'

function readComponentTemplate(componentPath: string): string {
  const filename = resolve(componentPath)
  const source = readFileSync(filename, 'utf8')
  const descriptor = parse(source, { filename }).descriptor

  return descriptor.template?.content ?? ''
}

function readSource(sourcePath: string): string {
  return readFileSync(resolve(sourcePath), 'utf8')
}

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const
const STEP_IDS = ['choose', 'care', 'tab'] as const

describe('pet setup onboarding', () => {
  it('explains the first-use care loop before species selection', () => {
    const template = readComponentTemplate('components/PetSetup.vue')
    const localSaveIndex = template.indexOf('messages.setup.localSave')
    const speciesGridIndex = template.indexOf('species-grid')

    expect(template).toContain('setup-flow')
    expect(template).toContain('messages.setup.steps')
    expect(template).toContain('messages.setup.localSave')
    expect(localSaveIndex).toBeGreaterThan(-1)
    expect(speciesGridIndex).toBeGreaterThan(-1)
    expect(localSaveIndex).toBeLessThan(speciesGridIndex)
  })

  it('shows a browser tab signal preview on the setup screen', () => {
    const template = readComponentTemplate('components/PetSetup.vue')
    const tabPreviewIndex = template.indexOf('setup-tab-demo')
    const speciesGridIndex = template.indexOf('species-grid')

    expect(template).toContain('setup-tab-demo')
    expect(template).toContain('messages.setup.tabPreview')
    expect(tabPreviewIndex).toBeGreaterThan(-1)
    expect(speciesGridIndex).toBeGreaterThan(-1)
    expect(tabPreviewIndex).toBeLessThan(speciesGridIndex)
  })

  it('keeps onboarding copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const setup = I18N_MESSAGES[locale].setup

      expect(setup.steps.map((step) => step.id)).toEqual(STEP_IDS)
      expect(setup.steps.every((step) => step.title.length > 0)).toBe(true)
      expect(setup.steps.every((step) => step.description.length > 0)).toBe(true)
      expect(setup.localSave.length).toBeGreaterThan(0)
      expect(setup.tabPreview.label.length).toBeGreaterThan(0)
      expect(setup.tabPreview.normal).toBe('Tab Pet')
      expect(setup.tabPreview.alert.length).toBeGreaterThan(0)
      expect(setup.tabPreview.alert).not.toContain('*')
      expect(setup.tabPreview.hint.length).toBeGreaterThan(0)
    }
  })

  it('defines responsive setup styles for the onboarding blocks', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.setup-flow')
    expect(css).toContain('.setup-tab-demo')
    expect(css).toMatch(/\.app-shell\s*\{[^}]*width: 100%;/)
    expect(css).toMatch(/\.main-panel,\n\.control-panel\s*\{[^}]*min-width: 0;/)
    expect(css).toMatch(/@media \(max-width: 720px\)[\s\S]*\.locale-button\s*\{[^}]*min-width: 0;/)
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.setup-tab-demo\s*\{\s*grid-template-columns: 1fr;/,
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/pet-setup-onboarding.test.ts`

Expected: FAIL because `tests/pet-setup-onboarding.test.ts` references classes and i18n keys that do not exist yet.

- [ ] **Step 3: Add localized setup messages**

Extend the `setup` object for `en`, `ko`, and `ja` in `constants/i18n.ts` with:

```ts
steps: [
  {
    id: 'choose',
    title: 'Choose a pet',
    description: 'Start with any companion. You can reset later from settings.',
  },
  {
    id: 'care',
    title: 'Care in seconds',
    description: 'Feed, play, sleep, or wash when one stat drops.',
  },
  {
    id: 'tab',
    title: 'Read the browser tab',
    description: 'The title and favicon become the quiet status signal.',
  },
],
localSave: 'No account needed. Your pet is saved only in this browser.',
tabPreview: {
  label: 'Tab signal preview',
  normal: 'Tab Pet',
  alert: 'I am hungry',
  hint: 'When the tab is hidden and care is needed, the title and favicon change.',
},
```

Use equivalent Korean and Japanese copy in the same shape.

- [ ] **Step 4: Render onboarding content**

Update `components/PetSetup.vue` so the setup panel renders:

```vue
<div class="setup-flow" aria-label="First-use flow">
  <div v-for="(step, index) in messages.setup.steps" :key="step.id" class="setup-flow__item">
    <span class="setup-flow__index">{{ index + 1 }}</span>
    <span>
      <strong>{{ step.title }}</strong>
      <small>{{ step.description }}</small>
    </span>
  </div>
</div>

<div class="setup-tab-demo" aria-label="Tab signal preview">
  <div>
    <strong>{{ messages.setup.tabPreview.label }}</strong>
    <small>{{ messages.setup.tabPreview.hint }}</small>
  </div>
  <div class="setup-tab-demo__tabs" aria-hidden="true">
    <span>{{ messages.setup.tabPreview.normal }}</span>
    <span>{{ messages.setup.tabPreview.alert }}</span>
  </div>
</div>

<p class="setup-save-note">{{ messages.setup.localSave }}</p>
```

Keep the existing species buttons and emit behavior unchanged.

- [ ] **Step 5: Add responsive CSS**

Add setup-specific styles in `assets/css/main.css` near the existing setup/species styles:

```css
.setup-flow {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.setup-flow__item {
  background: var(--app-surface-strong);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  display: grid;
  gap: 8px;
  grid-template-columns: 28px minmax(0, 1fr);
  min-height: 104px;
  padding: 12px;
}

.setup-flow__index {
  align-items: center;
  background: var(--app-accent);
  border-radius: 999px;
  color: var(--app-accent-text);
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 900;
  height: 28px;
  justify-content: center;
  width: 28px;
}

.setup-flow__item strong,
.setup-tab-demo strong {
  display: block;
  line-height: 1.25;
}

.setup-flow__item small,
.setup-tab-demo small,
.setup-save-note {
  color: var(--app-muted);
  display: block;
  line-height: 1.4;
  margin-top: 4px;
}

.setup-tab-demo {
  align-items: center;
  background: color-mix(in srgb, var(--app-accent) 8%, var(--app-surface-strong));
  border: 1px solid color-mix(in srgb, var(--app-accent) 38%, var(--app-border));
  border-radius: 8px;
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 300px);
  padding: 14px;
}

.setup-tab-demo__tabs {
  display: grid;
  gap: 8px;
}

.setup-tab-demo__tabs span {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  color: var(--app-text);
  overflow: hidden;
  padding: 8px 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.setup-save-note {
  margin: -2px 0 0;
}
```

Inside the existing `@media (max-width: 720px)` block add:

```css
.setup-flow,
.setup-tab-demo {
  grid-template-columns: 1fr;
}
```

- [ ] **Step 6: Run targeted test to verify it passes**

Run: `npm run test -- tests/pet-setup-onboarding.test.ts`

Expected: PASS.

- [ ] **Step 7: Run project verification**

Run:

```bash
npm run test
npm run lint
npm run build
```

Expected: all commands exit 0.
