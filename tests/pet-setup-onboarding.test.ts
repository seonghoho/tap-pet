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
