import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'

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

describe('pet settings shortcut', () => {
  it('shows a topbar shortcut only after a pet exists', () => {
    const template = readComponentTemplate('app.vue')

    expect(template).toContain('tab-settings-shortcut')
    expect(template).toContain('v-if="currentPet"')
    expect(template).toContain('@click="openTabSettings"')
  })

  it('opens the settings side panel and scrolls it into view', () => {
    const source = readSource('app.vue')
    const template = readComponentTemplate('app.vue')

    expect(source).toContain('const sidePanelElement = ref<HTMLElement | null>(null)')
    expect(source).toContain("pet.setSidePanelMode('settings')")
    expect(source).toContain('sidePanelElement.value?.scrollIntoView')
    expect(template).toContain('ref="sidePanelElement"')
    expect(template).toContain('id="tab-settings"')
  })

  it('keeps shortcut copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(I18N_MESSAGES[locale].settings.openTabSettings.length).toBeGreaterThan(0)
    }
  })

  it('defines responsive shortcut styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.tab-settings-shortcut')
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.tab-settings-shortcut\s*\{[^}]*flex: 1;/,
    )
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.tab-settings-shortcut\s*\{[^}]*min-width: 0;/,
    )
  })
})
