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

  it('keeps premium tab-pack UI out of the focused settings panel', () => {
    const settingsTemplate = readComponentTemplate('components/PetSettingsPanel.vue')

    expect(settingsTemplate).not.toContain('premium-tab-pack')
    expect(settingsTemplate).not.toContain('PREMIUM_WORK_TITLE_PACKS')
    expect(settingsTemplate).not.toContain('PREMIUM_QUIET_SIGNAL_PACKS')
    expect(settingsTemplate).not.toContain('PREMIUM_THEME_PACKS')
  })

  it('keeps settings focused on pet and tab controls', () => {
    const settingsTemplate = readComponentTemplate('components/PetSettingsPanel.vue')

    expect(settingsTemplate).toContain('messages.settings.petName')
    expect(settingsTemplate).toContain('messages.settings.titleMode')
    expect(settingsTemplate).toContain('messages.settings.themeMode')
    expect(settingsTemplate).not.toContain('messages.premium.lockedLabel')
  })

  it('shows premium tab-pack preview from the side panel status mode', () => {
    const sideTemplate = readComponentTemplate('components/PetSidePanel.vue')

    expect(sideTemplate).toContain('premium-tab-pack premium-tab-pack--compact')
    expect(sideTemplate).toContain('messages.premium.heading')
    expect(sideTemplate).toContain('messages.premium.workTitlePack')
  })
})
