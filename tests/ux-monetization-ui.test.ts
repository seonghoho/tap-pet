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

  it('exposes premium tab-pack UI in the settings panel', () => {
    const settingsTemplate = readComponentTemplate('components/PetSettingsPanel.vue')

    expect(settingsTemplate).toContain('premium-tab-pack')
    expect(settingsTemplate).toContain('PREMIUM_WORK_TITLE_PACKS')
    expect(settingsTemplate).toContain('PREMIUM_QUIET_SIGNAL_PACKS')
    expect(settingsTemplate).toContain('PREMIUM_THEME_PACKS')
  })

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
})
