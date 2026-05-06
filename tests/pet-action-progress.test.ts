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

describe('pet action progress status', () => {
  it('renders a dedicated progress status while an action is active', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const source = readSource('components/PetActions.vue')

    expect(template).toContain('care-progress')
    expect(template).toContain('v-if="activeReaction"')
    expect(template).toContain('activeReactionTitle')
    expect(template).toContain('activeReactionDetail')
    expect(source).toContain('messages.value.careProgress.title')
    expect(source).toContain('messages.value.careProgress.detail')
  })

  it('hides recommendations while a care action is in progress', () => {
    const template = readComponentTemplate('components/PetActions.vue')

    expect(template).toContain('recommendedCareAction && !isLimitReached && !activeReaction')
  })

  it('keeps progress copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const careProgress = I18N_MESSAGES[locale].careProgress

      expect(careProgress.title).toContain('{action}')
      expect(careProgress.detail.length).toBeGreaterThan(0)
    }
  })

  it('defines progress styles that are safe for mobile text wrapping', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.care-progress')
    expect(css).toContain('.care-progress__bar')
    expect(css).toMatch(/\.care-progress strong\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.care-progress\s*\{[^}]*align-items: flex-start;/,
    )
  })
})
