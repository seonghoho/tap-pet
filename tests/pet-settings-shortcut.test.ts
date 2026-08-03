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

    expect(template).toContain('living-settings-button')
    expect(template).toContain('v-if="currentPet"')
    expect(template).toContain('@click="openSettings"')
  })

  it('opens an accessible settings drawer and restores focus on close', () => {
    const source = readSource('app.vue')
    const template = readComponentTemplate('app.vue')

    expect(source).toContain('const isSettingsOpen = ref(false)')
    expect(source).toContain('previouslyFocusedElement?.focus()')
    expect(template).toContain('class="settings-drawer"')
    expect(template).toContain('aria-modal="true"')
  })

  it('keeps shortcut copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(I18N_MESSAGES[locale].settings.openTabSettings.length).toBeGreaterThan(0)
    }
  })

  it('defines responsive drawer shortcut styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.living-settings-button')
    expect(css).toMatch(/@media \(max-width: 720px\)[\s\S]*\.living-settings-button/)
    expect(css).toMatch(/@media \(max-width: 720px\)[\s\S]*\.settings-drawer\s*\{[^}]*width: 100%;/)
  })
})
