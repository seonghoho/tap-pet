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
  it('puts pet choices before the tab signal preview', () => {
    const template = readComponentTemplate('components/PetSetup.vue')
    const speciesGridIndex = template.indexOf('species-grid')
    const tabPreviewIndex = template.indexOf('setup-tab-demo')

    expect(speciesGridIndex).toBeGreaterThan(-1)
    expect(tabPreviewIndex).toBeGreaterThan(speciesGridIndex)
    expect(template).toContain('messages.setup.tabPreview.hint')
  })

  it('offers rabbit, penguin, and hamster as selectable tab pets', () => {
    const source = readSource('components/PetSetup.vue')

    expect(source).toContain("species: 'rabbit'")
    expect(source).toContain("species: 'penguin'")
    expect(source).toContain("species: 'hamster'")
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

})
