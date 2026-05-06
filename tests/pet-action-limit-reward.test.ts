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

function getComponentPropExpression(template: string, componentName: string, propName: string): string | undefined {
  const match = template.match(new RegExp(`<${componentName}[\\s\\S]*?/>`))

  return match?.[0].match(new RegExp(`:${propName}="([^"]+)"`))?.[1]
}

describe('pet action limit reward feedback', () => {
  it('passes action limit reward feedback into action controls', () => {
    const template = readComponentTemplate('app.vue')

    expect(getComponentPropExpression(template, 'PetActions', 'action-limit-reward-feedback')).toBe(
      'pet.actionLimitRewardFeedback.value',
    )
  })

  it('renders a reward grant confirmation near the action limit controls', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const source = readSource('components/PetActions.vue')
    const css = readSource('assets/css/main.css')

    expect(template).toContain('action-limit-reward')
    expect(template).toContain('actionLimitRewardText')
    expect(source).toContain('actionLimitRewardFeedback: PetActionLimitRewardFeedback | null')
    expect(css).toContain('.action-limit-reward')
  })

  it('prioritizes action limit recovery over recommendations while locked', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const source = readSource('components/PetActions.vue')

    expect(template).toContain('recommendedCareAction && !isLimitReached')
    expect(source).toContain('return !isLimitReached.value && props.recommendedCareAction?.action === action')
  })

  it('keeps reward grant copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const actionLimit = I18N_MESSAGES[locale].actionLimit

      expect(actionLimit.rewardAd.length).toBeGreaterThan(0)
      expect(actionLimit.rewardGranted).toContain('{count}')
    }
  })

  it('uses rewarded action grant feedback from the pet store', () => {
    const source = readSource('composables/usePetStore.ts')

    expect(source).toContain('actionLimitRewardFeedback')
    expect(source).toContain('ACTION_LIMIT_AD_REWARD_USES')
  })
})
