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
describe('pet setup onboarding', () => {
  it('uses one living preview and a compact species rail', () => {
    const template = readComponentTemplate('components/PetSetup.vue')
    const source = readSource('components/PetSetup.vue')

    expect(template).toContain('<PetCanvas')
    expect(template).toContain('class="species-rail"')
    expect(template).toContain(':data-species="species"')
    expect(template).toContain(':aria-pressed="selectedSpecies === species"')
    expect(source).toContain("const selectedSpecies = ref<PetSpecies>('cat')")
  })

  it('previews a species before emitting one explicit confirmation', () => {
    const template = readComponentTemplate('components/PetSetup.vue')
    const source = readSource('components/PetSetup.vue')

    expect(template).toContain('data-testid="confirm-pet"')
    expect(template).toContain("@click=\"emit('select', selectedSpecies)\"")
    expect(template).toContain('messages.setup.localSave')
    expect(source).not.toContain("@click=\"emit('select', option.species)\"")
  })

  it('offers rabbit, penguin, and hamster as selectable tab pets', () => {
    const source = readSource('components/PetSetup.vue')

    expect(source).toContain("'rabbit'")
    expect(source).toContain("'penguin'")
    expect(source).toContain("'hamster'")
  })

  it('keeps onboarding copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const setup = I18N_MESSAGES[locale].setup

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

    expect(css).toContain('.setup-stage')
    expect(css).toContain('.species-rail')
    expect(css).toMatch(/@media \(max-width: 720px\)[\s\S]*\.species-rail/)
  })
})
