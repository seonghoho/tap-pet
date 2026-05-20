# Tab Pet UX Monetization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve Tab Pet's first-use UX and add mock premium tab-pack monetization without blocking the free care loop.

**Architecture:** Keep the existing Nuxt/Vue component boundaries. Add static premium mock data and localized copy, then update onboarding, action recommendation, side panel, settings panel, display-ad mounting, and responsive styles. No persisted pet state or storage migration is required.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest, vue-tsc, Playwright for manual visual verification.

**Repository Rule:** Do not commit during execution unless the user explicitly asks. The task steps below intentionally omit `git commit`.

---

## File Map

- Create: `constants/premium.ts`
  - Owns static mock data for premium work title packs, quiet signal packs, and premium theme packs.
- Create: `tests/ux-monetization-ui.test.ts`
  - Adds focused template and constant tests for premium UI, ad gating, and first-use information hierarchy.
- Modify: `constants/i18n.ts`
  - Adds localized `premium` copy under every locale.
  - Refines onboarding and action-limit copy only where needed.
- Modify: `components/PetSetup.vue`
  - Moves pet selection earlier and reduces setup-step visual dominance.
- Modify: `components/PetActions.vue`
  - Removes the extra recommendation CTA chip from the recommendation card while keeping evidence and reward preview.
- Modify: `components/PetSidePanel.vue`
  - Adds compact first-loop status behavior and premium tab-pack preview.
- Modify: `components/PetSettingsPanel.vue`
  - Shows locked premium tab-pack rows in settings.
- Modify: `app.vue`
  - Mounts the side display ad only when AdSense is actually enabled and configured.
- Modify: `assets/css/main.css`
  - Adds styles for compact setup, premium locked rows, compact first-loop panel, and mobile-safe premium/ad behavior.
- Modify existing tests as needed:
  - `tests/pet-setup-onboarding.test.ts`
  - `tests/pet-recommendation-evidence.test.ts`
  - `tests/adsense-display.test.ts`
  - `tests/pet-side-panel-controls.test.ts`

---

### Task 1: Add Premium Mock Data And Localized Copy

**Files:**
- Create: `constants/premium.ts`
- Modify: `constants/i18n.ts`
- Create: `tests/ux-monetization-ui.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/ux-monetization-ui.test.ts` with this initial content:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'
import {
  PREMIUM_QUIET_SIGNAL_PACKS,
  PREMIUM_THEME_PACKS,
  PREMIUM_WORK_TITLE_PACKS,
} from '~/constants/premium'

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const

function readComponentTemplate(componentPath: string): string {
  const filename = resolve(componentPath)
  const source = readFileSync(filename, 'utf8')
  const descriptor = parse(source, { filename }).descriptor

  return descriptor.template?.content ?? ''
}

function readSource(sourcePath: string): string {
  return readFileSync(resolve(sourcePath), 'utf8')
}

describe('premium tab-pack mock data', () => {
  it('defines non-empty premium work title, quiet signal, and theme packs', () => {
    expect(PREMIUM_WORK_TITLE_PACKS.map((item) => item.id)).toEqual([
      'roadmap',
      'kpi-review',
      'sprint-board',
      'client-notes',
    ])
    expect(PREMIUM_QUIET_SIGNAL_PACKS.map((item) => item.id)).toEqual([
      'review-needed',
      'draft-updated',
      'focus-return',
    ])
    expect(PREMIUM_THEME_PACKS.map((item) => item.id)).toEqual([
      'focus',
      'mono',
      'soft-night',
    ])
  })

  it('localizes premium section copy for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const premium = I18N_MESSAGES[locale].premium

      expect(premium.heading.length).toBeGreaterThan(0)
      expect(premium.description.length).toBeGreaterThan(0)
      expect(premium.lockedLabel.length).toBeGreaterThan(0)
      expect(premium.workTitlePack.length).toBeGreaterThan(0)
      expect(premium.quietSignalPack.length).toBeGreaterThan(0)
      expect(premium.themePack.length).toBeGreaterThan(0)
      expect(premium.unavailable.length).toBeGreaterThan(0)
    }
  })
})

describe('ux monetization component wiring', () => {
  it('keeps premium mock data out of persisted pet settings types', () => {
    const petTypes = readSource('types/pet.ts')

    expect(petTypes).not.toContain('premiumEntitlement')
    expect(petTypes).not.toContain('premiumUnlocked')
    expect(petTypes).not.toContain('premiumTitlePackId')
  })

  it('does not expose premium controls before implementation', () => {
    const settingsTemplate = readComponentTemplate('components/PetSettingsPanel.vue')

    expect(settingsTemplate).not.toContain('premium-tab-pack')
  })
})
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
npm run test -- tests/ux-monetization-ui.test.ts
```

Expected: FAIL because `~/constants/premium` does not exist and `I18N_MESSAGES[locale].premium` is missing.

- [ ] **Step 3: Add static premium constants**

Create `constants/premium.ts`:

```ts
import type { AppLocale } from '~/types/i18n'

export type PremiumMockItem = {
  id: string
  values: Record<AppLocale, string>
  detail: Record<AppLocale, string>
}

export const PREMIUM_WORK_TITLE_PACKS: PremiumMockItem[] = [
  {
    id: 'roadmap',
    values: {
      en: 'Roadmap',
      ko: '로드맵',
      ja: 'ロードマップ',
    },
    detail: {
      en: 'Work-safe product planning title.',
      ko: '업무용 제품 계획 탭처럼 보이는 제목입니다.',
      ja: '仕事用の計画タブのように見えるタイトルです。',
    },
  },
  {
    id: 'kpi-review',
    values: {
      en: 'KPI Review',
      ko: 'KPI 리뷰',
      ja: 'KPIレビュー',
    },
    detail: {
      en: 'Quiet performance-review disguise.',
      ko: '성과 검토 화면처럼 보이는 조용한 위장 제목입니다.',
      ja: '成果レビュー画面のように見える静かな偽装タイトルです。',
    },
  },
  {
    id: 'sprint-board',
    values: {
      en: 'Sprint Board',
      ko: '스프린트 보드',
      ja: 'スプリントボード',
    },
    detail: {
      en: 'Looks like a delivery board while the pet stays hidden.',
      ko: '펫을 숨기면서 업무 보드처럼 보이게 합니다.',
      ja: 'ペットを隠しながら作業ボードのように見せます。',
    },
  },
  {
    id: 'client-notes',
    values: {
      en: 'Client Notes',
      ko: '클라이언트 노트',
      ja: 'クライアントメモ',
    },
    detail: {
      en: 'A calm notes-style disguise for shared spaces.',
      ko: '공유 공간에서도 부담 없는 노트형 위장 제목입니다.',
      ja: '共有スペースでも使いやすいメモ型の偽装タイトルです。',
    },
  },
]

export const PREMIUM_QUIET_SIGNAL_PACKS: PremiumMockItem[] = [
  {
    id: 'review-needed',
    values: {
      en: 'Review Needed',
      ko: '검토 필요',
      ja: '確認が必要',
    },
    detail: {
      en: 'Care-needed signal written like a work queue.',
      ko: '돌봄 필요 상태를 업무 대기열처럼 보여줍니다.',
      ja: 'お世話が必要な状態を仕事のキューのように表示します。',
    },
  },
  {
    id: 'draft-updated',
    values: {
      en: 'Draft Updated',
      ko: '초안 업데이트',
      ja: '下書き更新',
    },
    detail: {
      en: 'A softer status change that avoids pet wording.',
      ko: '펫 표현 없이 더 조용하게 상태 변화를 알립니다.',
      ja: 'ペット表現を避けて静かに状態変化を知らせます。',
    },
  },
  {
    id: 'focus-return',
    values: {
      en: 'Focus Return',
      ko: '포커스 복귀',
      ja: 'フォーカス復帰',
    },
    detail: {
      en: 'A subtle reminder to check the tab when returning.',
      ko: '돌아왔을 때 탭 확인을 조용히 유도합니다.',
      ja: '戻ったときにタブ確認を静かに促します。',
    },
  },
]

export const PREMIUM_THEME_PACKS: PremiumMockItem[] = [
  {
    id: 'focus',
    values: {
      en: 'Focus',
      ko: '포커스',
      ja: 'フォーカス',
    },
    detail: {
      en: 'Low-noise workspace palette for the page and favicon.',
      ko: '본문과 파비콘에 쓰는 저소음 업무 팔레트입니다.',
      ja: '本文とファビコンに使う控えめな作業用パレットです。',
    },
  },
  {
    id: 'mono',
    values: {
      en: 'Mono',
      ko: '모노',
      ja: 'モノ',
    },
    detail: {
      en: 'Reduced color for a more discreet tab companion.',
      ko: '더 눈에 띄지 않는 탭 펫을 위한 절제된 색상입니다.',
      ja: 'より目立たないタブペットのための抑えた配色です。',
    },
  },
  {
    id: 'soft-night',
    values: {
      en: 'Soft Night',
      ko: '소프트 나이트',
      ja: 'ソフトナイト',
    },
    detail: {
      en: 'Soft dark palette for late work sessions.',
      ko: '늦은 작업 시간에 맞춘 부드러운 다크 팔레트입니다.',
      ja: '夜の作業に合うやわらかいダークパレットです。',
    },
  },
]
```

- [ ] **Step 4: Add localized premium copy**

Add this `premium` object beside each locale's `monetization` object in `constants/i18n.ts`.

English:

```ts
premium: {
  heading: 'Premium tab pack',
  description: 'Locked mock options for better disguise and quieter tab signals.',
  lockedLabel: 'Premium',
  workTitlePack: 'Work title pack',
  workTitlePackDetail: 'More browser titles that look like normal work tabs.',
  quietSignalPack: 'Quiet signal pack',
  quietSignalPackDetail: 'Status signals written like subtle work updates.',
  themePack: 'Premium theme pack',
  themePackDetail: 'Page and favicon palettes for quieter work sessions.',
  unavailable: 'Preview only. Payment is not available in this MVP.',
},
```

Korean:

```ts
premium: {
  heading: '프리미엄 탭 팩',
  description: '더 잘 숨기고 더 조용하게 알리는 잠금 목업입니다.',
  lockedLabel: 'Premium',
  workTitlePack: '업무용 위장 타이틀 팩',
  workTitlePackDetail: '일반 업무 탭처럼 보이는 브라우저 제목을 더 제공합니다.',
  quietSignalPack: '조용한 탭 신호 팩',
  quietSignalPackDetail: '펫 표현 대신 업무 업데이트처럼 보이는 상태 신호입니다.',
  themePack: '프리미엄 테마 팩',
  themePackDetail: '본문과 파비콘을 더 조용한 업무 팔레트로 바꿉니다.',
  unavailable: '미리보기 전용입니다. 이 MVP에서는 결제를 제공하지 않습니다.',
},
```

Japanese:

```ts
premium: {
  heading: 'プレミアムタブパック',
  description: 'より自然に隠し、静かに知らせるロック中のモックです。',
  lockedLabel: 'Premium',
  workTitlePack: '仕事用偽装タイトルパック',
  workTitlePackDetail: '通常の作業タブのように見えるタイトルを追加します。',
  quietSignalPack: '静かなタブ合図パック',
  quietSignalPackDetail: 'ペット表現ではなく作業更新のように見える状態合図です。',
  themePack: 'プレミアムテーマパック',
  themePackDetail: '本文とファビコンを控えめな作業用パレットに変えます。',
  unavailable: 'プレビュー専用です。このMVPでは決済できません。',
},
```

- [ ] **Step 5: Update the temporary wiring test expectation**

In `tests/ux-monetization-ui.test.ts`, replace the second test in `describe('ux monetization component wiring')` with:

```ts
it('exposes premium tab-pack UI in the settings panel', () => {
  const settingsTemplate = readComponentTemplate('components/PetSettingsPanel.vue')

  expect(settingsTemplate).toContain('premium-tab-pack')
  expect(settingsTemplate).toContain('PREMIUM_WORK_TITLE_PACKS')
  expect(settingsTemplate).toContain('PREMIUM_QUIET_SIGNAL_PACKS')
  expect(settingsTemplate).toContain('PREMIUM_THEME_PACKS')
})
```

This should still fail until Task 4 implements the settings panel.

- [ ] **Step 6: Run the focused test**

Run:

```bash
npm run test -- tests/ux-monetization-ui.test.ts
```

Expected: FAIL only on the settings panel premium UI expectation.

---

### Task 2: Hide Unconfigured Side Display Ads In The App

**Files:**
- Modify: `app.vue`
- Modify: `tests/adsense-display.test.ts`
- Test: `tests/adsense-display.test.ts`

- [ ] **Step 1: Write the failing test**

In `tests/adsense-display.test.ts`, change the display-ad placement test to assert that the app uses `adsenseEnabled` directly:

```ts
it('places the display ad only when AdSense is enabled and configured', () => {
  const appTemplate = readComponentTemplate('app.vue')
  const appSource = readSource('app.vue')

  expect(appTemplate).not.toContain('<MonetizationMock')
  expect(appTemplate).toContain('<AdSenseDisplay')
  expect(appTemplate.indexOf('<GuidePanel')).toBeLessThan(appTemplate.indexOf('<AdSenseDisplay'))
  expect(appTemplate).toContain('v-if="currentPet && adsenseEnabled"')
  expect(appTemplate).toContain(':client="adsenseClient"')
  expect(appTemplate).toContain(':slot="adsenseSidebarSlot"')
  expect(appTemplate).toContain(':enabled="adsenseEnabled"')
  expect(appSource).not.toContain('shouldShowAdPlacement')
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm run test -- tests/adsense-display.test.ts
```

Expected: FAIL because `app.vue` still has `shouldShowAdPlacement` and mounts ads in dev.

- [ ] **Step 3: Implement minimal app gating**

In `app.vue`, delete:

```ts
const shouldShowAdPlacement = computed(() => adsenseEnabled.value || import.meta.dev)
```

Then change the ad mount from:

```vue
<AdSenseDisplay
  v-if="currentPet && shouldShowAdPlacement"
  :client="adsenseClient"
  :slot="adsenseSidebarSlot"
  :enabled="adsenseEnabled"
/>
```

to:

```vue
<AdSenseDisplay
  v-if="currentPet && adsenseEnabled"
  :client="adsenseClient"
  :slot="adsenseSidebarSlot"
  :enabled="adsenseEnabled"
/>
```

- [ ] **Step 4: Run test to verify GREEN**

Run:

```bash
npm run test -- tests/adsense-display.test.ts
```

Expected: PASS.

---

### Task 3: Make Onboarding Choice-First

**Files:**
- Modify: `components/PetSetup.vue`
- Modify: `assets/css/main.css`
- Modify: `tests/pet-setup-onboarding.test.ts`

- [ ] **Step 1: Write failing tests for the new order**

In `tests/pet-setup-onboarding.test.ts`, replace the first two tests with:

```ts
it('puts tab signal preview and pet choices before setup explanation details', () => {
  const template = readComponentTemplate('components/PetSetup.vue')
  const tabPreviewIndex = template.indexOf('setup-tab-demo')
  const speciesGridIndex = template.indexOf('species-grid')
  const setupFlowIndex = template.indexOf('setup-flow')
  const localSaveIndex = template.indexOf('messages.setup.localSave')

  expect(tabPreviewIndex).toBeGreaterThan(-1)
  expect(speciesGridIndex).toBeGreaterThan(-1)
  expect(setupFlowIndex).toBeGreaterThan(-1)
  expect(localSaveIndex).toBeGreaterThan(-1)
  expect(tabPreviewIndex).toBeLessThan(speciesGridIndex)
  expect(speciesGridIndex).toBeLessThan(localSaveIndex)
  expect(localSaveIndex).toBeLessThan(setupFlowIndex)
})

it('keeps setup explanation as supporting content instead of the primary action', () => {
  const template = readComponentTemplate('components/PetSetup.vue')

  expect(template).toContain('setup-flow setup-flow--compact')
  expect(template).toContain('messages.setup.steps')
  expect(template).toContain('messages.setup.localSave')
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm run test -- tests/pet-setup-onboarding.test.ts
```

Expected: FAIL because the current template renders the setup flow before species selection and does not use `setup-flow--compact`.

- [ ] **Step 3: Reorder the setup template**

In `components/PetSetup.vue`, change the template body order to:

```vue
<template>
  <div class="setup-panel">
    <div class="section-heading">
      <p class="eyebrow">{{ messages.setup.eyebrow }}</p>
      <h2>{{ messages.setup.title }}</h2>
      <p>
        {{ messages.setup.description }}
      </p>
    </div>

    <div class="setup-tab-demo" :aria-label="messages.setup.tabPreview.label">
      <div>
        <strong>{{ messages.setup.tabPreview.label }}</strong>
        <small>{{ messages.setup.tabPreview.hint }}</small>
      </div>
      <div class="setup-tab-demo__tabs" aria-hidden="true">
        <span>{{ messages.setup.tabPreview.normal }}</span>
        <span>{{ messages.setup.tabPreview.alert }}</span>
      </div>
    </div>

    <div class="species-grid">
      <button
        v-for="option in options"
        :key="option.species"
        class="species-option"
        type="button"
        @click="emit('select', option.species)"
      >
        <PetAvatar
          :species="option.species"
          status="happy"
          theme-id="system"
          :aria-label="`${messages.species[option.species].label} ${messages.status.aria.happy}`"
          compact
        />
        <span>
          <strong>{{ messages.species[option.species].label }}</strong>
          <small>{{ messages.species[option.species].description }}</small>
        </span>
      </button>
    </div>

    <p class="setup-save-note">{{ messages.setup.localSave }}</p>

    <div class="setup-flow setup-flow--compact" :aria-label="messages.setup.title">
      <div
        v-for="(step, index) in messages.setup.steps"
        :key="step.id"
        class="setup-flow__item"
      >
        <span class="setup-flow__index">{{ index + 1 }}</span>
        <span>
          <strong>{{ step.title }}</strong>
          <small>{{ step.description }}</small>
        </span>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Add compact setup styles**

In `assets/css/main.css`, add this block after the existing `.setup-flow__item` styles:

```css
.setup-flow--compact .setup-flow__item {
  min-height: auto;
  padding: 10px;
}

.setup-flow--compact .setup-flow__item small {
  font-size: 0.82rem;
}
```

- [ ] **Step 5: Run focused test**

Run:

```bash
npm run test -- tests/pet-setup-onboarding.test.ts
```

Expected: PASS.

---

### Task 4: Add Premium Tab-Pack UI To Settings And Side Panel

**Files:**
- Modify: `components/PetSettingsPanel.vue`
- Modify: `components/PetSidePanel.vue`
- Modify: `assets/css/main.css`
- Modify: `tests/ux-monetization-ui.test.ts`
- Modify: `tests/pet-side-panel-controls.test.ts`

- [ ] **Step 1: Extend tests for locked premium UI**

Append these tests to `tests/ux-monetization-ui.test.ts`:

```ts
it('renders premium locked rows as disabled controls in settings', () => {
  const settingsTemplate = readComponentTemplate('components/PetSettingsPanel.vue')

  expect(settingsTemplate).toContain('class="premium-tab-pack"')
  expect(settingsTemplate).toContain('class="premium-lock-row"')
  expect(settingsTemplate).toContain(':disabled="true"')
  expect(settingsTemplate).toContain('messages.premium.lockedLabel')
  expect(settingsTemplate).not.toContain('@click="setPremium')
})

it('shows premium tab-pack preview from the side panel status mode', () => {
  const sideTemplate = readComponentTemplate('components/PetSidePanel.vue')

  expect(sideTemplate).toContain('premium-tab-pack premium-tab-pack--compact')
  expect(sideTemplate).toContain('messages.premium.heading')
  expect(sideTemplate).toContain('messages.premium.workTitlePack')
})
```

In `tests/pet-side-panel-controls.test.ts`, add this test inside `describe('pet side panel progress summary', ...)`:

```ts
it('keeps first-loop side panel focused by gating detailed progression sections', () => {
  const template = readComponentTemplate('components/PetSidePanel.vue')

  expect(template).toContain('v-if="hasStartedFirstCareLoop"')
  expect(template).toContain('v-else')
  expect(template).toContain('premium-tab-pack--compact')
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -- tests/ux-monetization-ui.test.ts tests/pet-side-panel-controls.test.ts
```

Expected: FAIL because neither premium UI nor detailed progression gating exists yet.

- [ ] **Step 3: Import premium constants in settings**

At the top of `components/PetSettingsPanel.vue`, add:

```ts
import {
  PREMIUM_QUIET_SIGNAL_PACKS,
  PREMIUM_THEME_PACKS,
  PREMIUM_WORK_TITLE_PACKS,
} from '~/constants/premium'
```

Add helper functions in the script block:

```ts
function getPremiumValue(item: { values: Record<typeof locale.value, string> }): string {
  return item.values[locale.value]
}

function getPremiumDetail(item: { detail: Record<typeof locale.value, string> }): string {
  return item.detail[locale.value]
}
```

If TypeScript does not accept `typeof locale.value` inside the helper type, replace both helper signatures with:

```ts
function getPremiumValue(item: { values: Record<string, string> }): string {
  return item.values[locale.value] ?? item.values.en ?? ''
}

function getPremiumDetail(item: { detail: Record<string, string> }): string {
  return item.detail[locale.value] ?? item.detail.en ?? ''
}
```

- [ ] **Step 4: Render locked premium settings rows**

In `components/PetSettingsPanel.vue`, insert this section after the custom title input and before title animation:

```vue
<section class="premium-tab-pack" aria-labelledby="premium-tab-pack-heading">
  <div class="premium-tab-pack__header">
    <span>{{ messages.premium.lockedLabel }}</span>
    <strong id="premium-tab-pack-heading">{{ messages.premium.heading }}</strong>
    <small>{{ messages.premium.description }}</small>
  </div>

  <div class="premium-lock-group">
    <strong>{{ messages.premium.workTitlePack }}</strong>
    <button
      v-for="item in PREMIUM_WORK_TITLE_PACKS"
      :key="item.id"
      class="premium-lock-row"
      type="button"
      :disabled="true"
    >
      <span>{{ getPremiumValue(item) }}</span>
      <small>{{ getPremiumDetail(item) }}</small>
      <em>{{ messages.premium.lockedLabel }}</em>
    </button>
  </div>

  <div class="premium-lock-group">
    <strong>{{ messages.premium.quietSignalPack }}</strong>
    <button
      v-for="item in PREMIUM_QUIET_SIGNAL_PACKS"
      :key="item.id"
      class="premium-lock-row"
      type="button"
      :disabled="true"
    >
      <span>{{ getPremiumValue(item) }}</span>
      <small>{{ getPremiumDetail(item) }}</small>
      <em>{{ messages.premium.lockedLabel }}</em>
    </button>
  </div>

  <div class="premium-lock-group">
    <strong>{{ messages.premium.themePack }}</strong>
    <button
      v-for="item in PREMIUM_THEME_PACKS"
      :key="item.id"
      class="premium-lock-row"
      type="button"
      :disabled="true"
    >
      <span>{{ getPremiumValue(item) }}</span>
      <small>{{ getPremiumDetail(item) }}</small>
      <em>{{ messages.premium.lockedLabel }}</em>
    </button>
  </div>

  <p>{{ messages.premium.unavailable }}</p>
</section>
```

- [ ] **Step 5: Add compact premium preview to side panel**

In `components/PetSidePanel.vue`, insert this section after `<PetDailyGoal ... />`:

```vue
<section class="premium-tab-pack premium-tab-pack--compact" aria-labelledby="premium-tab-pack-preview-title">
  <div class="premium-tab-pack__header">
    <span>{{ messages.premium.lockedLabel }}</span>
    <strong id="premium-tab-pack-preview-title">{{ messages.premium.heading }}</strong>
    <small>{{ messages.premium.description }}</small>
  </div>

  <div class="premium-lock-group">
    <div class="premium-lock-row premium-lock-row--static">
      <span>{{ messages.premium.workTitlePack }}</span>
      <small>{{ messages.premium.workTitlePackDetail }}</small>
      <em>{{ messages.premium.lockedLabel }}</em>
    </div>
    <div class="premium-lock-row premium-lock-row--static">
      <span>{{ messages.premium.quietSignalPack }}</span>
      <small>{{ messages.premium.quietSignalPackDetail }}</small>
      <em>{{ messages.premium.lockedLabel }}</em>
    </div>
  </div>
</section>
```

Then gate detailed progression sections by wrapping the personality/progress/unlock/progress-list area:

```vue
<template v-if="hasStartedFirstCareLoop">
  <!-- existing pet-personality, progress-goals, level-unlocks, progress-list blocks -->
</template>
<section v-else class="level-unlocks level-unlocks--compact" aria-labelledby="level-unlocks-title">
  <div class="level-unlocks__copy">
    <strong id="level-unlocks-title">{{ messages.levelUnlocks.heading }}</strong>
    <small>{{ messages.levelUnlocks.description }}</small>
  </div>

  <div
    v-if="nextLevelUnlock"
    class="level-unlock level-unlock--next"
  >
    <span>{{ messages.levelUnlocks.nextLabel }} · {{ getLevelUnlockRequirement(nextLevelUnlock) }}</span>
    <strong>{{ getLevelUnlockName(nextLevelUnlock) }}</strong>
    <small>{{ getLevelUnlockDetail(nextLevelUnlock) }}</small>
  </div>
</section>
```

Keep the existing `PetDailyGoal` outside this gate so daily goal remains visible.

- [ ] **Step 6: Add premium styles**

In `assets/css/main.css`, add near the settings styles:

```css
.premium-tab-pack {
  border-top: 1px solid var(--app-border);
  display: grid;
  gap: 12px;
  padding-top: 14px;
}

.premium-tab-pack--compact {
  background: color-mix(in srgb, var(--app-accent) 6%, var(--app-surface));
  border: 1px solid color-mix(in srgb, var(--app-accent) 22%, var(--app-border));
  border-radius: 8px;
  padding: 14px;
}

.premium-tab-pack__header {
  display: grid;
  gap: 4px;
}

.premium-tab-pack__header span {
  color: var(--app-accent);
  font-size: 0.74rem;
  font-weight: 900;
  line-height: 1.2;
  text-transform: uppercase;
}

.premium-tab-pack__header strong {
  line-height: 1.25;
}

.premium-tab-pack__header small,
.premium-tab-pack p {
  color: var(--app-muted);
  line-height: 1.35;
  margin: 0;
  overflow-wrap: anywhere;
}

.premium-lock-group {
  display: grid;
  gap: 8px;
}

.premium-lock-group > strong {
  font-size: 0.9rem;
  line-height: 1.25;
}

.premium-lock-row {
  align-items: center;
  background: var(--app-surface-strong);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  color: var(--app-text);
  display: grid;
  gap: 4px 8px;
  grid-template-columns: minmax(0, 1fr) auto;
  min-height: 48px;
  padding: 9px 10px;
  text-align: left;
}

.premium-lock-row:disabled {
  cursor: not-allowed;
  opacity: 0.82;
}

.premium-lock-row--static {
  opacity: 1;
}

.premium-lock-row span {
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.premium-lock-row small {
  color: var(--app-muted);
  grid-column: 1 / -1;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.premium-lock-row em {
  background: color-mix(in srgb, var(--app-accent) 12%, var(--app-surface));
  border: 1px solid color-mix(in srgb, var(--app-accent) 30%, var(--app-border));
  border-radius: 999px;
  color: var(--app-accent);
  font-size: 0.72rem;
  font-style: normal;
  font-weight: 900;
  line-height: 1.2;
  padding: 4px 7px;
}
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
npm run test -- tests/ux-monetization-ui.test.ts tests/pet-side-panel-controls.test.ts
```

Expected: PASS.

---

### Task 5: Reduce Recommendation Card CTA Duplication

**Files:**
- Modify: `components/PetActions.vue`
- Modify: `assets/css/main.css`
- Modify: `tests/pet-recommendation-evidence.test.ts`

- [ ] **Step 1: Update tests to express new behavior**

In `tests/pet-recommendation-evidence.test.ts`:

1. Remove `recommendationCtaStatusText` and `recommendationCtaStatusClass` from the local setup type.
2. Remove tests that assert:
   - `setup.recommendationCtaStatusText`
   - `setup.recommendationCtaStatusClass`
   - `class="action-recommendation__cta"`
   - `.action-recommendation__cta` styles
3. Add this template test:

```ts
it('keeps the recommendation card explanatory while the action button remains the CTA', () => {
  const template = readComponentTemplate('components/PetActions.vue')
  const source = readSource('components/PetActions.vue')

  expect(template).toContain('class="action-recommendation"')
  expect(template).toContain('recommendationDetail')
  expect(template).toContain('recommendationEvidenceText')
  expect(template).toContain('recommendationRewardText')
  expect(template).not.toContain('action-recommendation__cta')
  expect(source).not.toContain('recommendationCtaStatusText')
  expect(source).not.toContain('recommendationCtaStatusClass')
  expect(template).toContain('action-button--recommended')
  expect(template).toContain('getActionButtonDetail(action.id)')
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm run test -- tests/pet-recommendation-evidence.test.ts
```

Expected: FAIL because `PetActions.vue` still renders `action-recommendation__cta`.

- [ ] **Step 3: Remove visual CTA chip from recommendation card**

In `components/PetActions.vue`, delete these computed values:

```ts
const recommendationCtaStatus = computed(() =>
  recommendedActionCooldownRemaining.value > 0 ? 'cooldown' : 'ready',
)
const recommendationCtaStatusText = computed(() => {
  if (!shouldShowRecommendation.value) return ''

  if (recommendationCtaStatus.value === 'cooldown') {
    return messages.value.careRecommendation.ctaCooldown.replace(
      '{time}',
      formatRemainingTime(recommendedActionCooldownRemaining.value),
    )
  }

  return messages.value.careRecommendation.ctaReady
})
const recommendationCtaStatusClass = computed(() =>
  `action-recommendation__cta--${recommendationCtaStatus.value}`,
)
```

Update `nextAvailabilityCoolingAction` so it no longer depends on `recommendationCtaStatus`:

```ts
const nextAvailabilityCoolingAction = computed(() => {
  const coolingAction = nextCoolingAction.value
  if (!coolingAction) return null

  const recommendation = props.recommendedCareAction
  if (
    shouldShowRecommendation.value &&
    recommendation &&
    coolingAction.id === recommendation.action &&
    recommendedActionCooldownRemaining.value > 0
  ) {
    return null
  }

  return coolingAction
})
```

Delete this template block from the recommendation support area:

```vue
<span
  v-if="recommendationCtaStatusText"
  class="action-recommendation__cta"
  :class="recommendationCtaStatusClass"
>
  {{ recommendationCtaStatusText }}
</span>
```

- [ ] **Step 4: Remove unused CTA styles**

In `assets/css/main.css`, remove:

```css
.action-recommendation__cta { ... }
.action-recommendation__cta--ready { ... }
.action-recommendation__cta--cooldown { ... }
```

Also remove the mobile media block for `.action-recommendation__cta`.

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm run test -- tests/pet-recommendation-evidence.test.ts tests/pet-recommendation-reward-preview.test.ts
```

Expected: PASS.

---

### Task 6: Final Responsive Verification And Full Checks

**Files:**
- Modify if needed: `assets/css/main.css`
- Verify with: app screenshots and test commands

- [ ] **Step 1: Run full unit suite**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 2: Run type check**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Run the dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1 --port 3000
```

Expected: Nuxt prints `Local: http://127.0.0.1:3000/`.

- [ ] **Step 5: Manually verify with Playwright or browser**

Check these screens:

- Desktop 1440px onboarding:
  - Tab signal preview appears before species choices.
  - Species choices are visible without scrolling.
  - Setup steps are visually supporting content.
- Desktop 1440px main after selecting a pet:
  - No large sponsored block appears when AdSense is not configured.
  - Recommended action is clear.
  - Side panel shows compact premium tab-pack preview.
- Desktop settings:
  - Premium locked work title, quiet signal, and theme rows are visible.
  - Locked rows are disabled and do not change settings.
- Mobile 390px onboarding:
  - Pet selection appears quickly.
  - No horizontal overflow.
- Mobile 390px main:
  - Care actions remain readable.
  - Premium and progress sections do not overwhelm the first screen.
- Mobile care-limit state:
  - Wait option and rewarded recharge are still visible.

- [ ] **Step 6: Check git diff**

Run:

```bash
git status --porcelain
git diff --stat
```

Expected:

- Changed files match this plan.
- No package, lockfile, build config, secret, or environment file changes.
- `.superpowers/` remains ignored and unstaged.

---

## Execution Notes

- Use TDD order per task: write or update the failing test first, run it, implement the smallest change, rerun the focused test.
- Keep all premium behavior mock-only and static.
- Do not add premium state to `PetState`.
- Do not add storage migration.
- Do not commit unless the user explicitly asks after verification.
- If implementation reveals that a single component becomes too dense, prefer a small local child component only when it reduces actual duplication. Do not introduce a broad design-system refactor in this work.
