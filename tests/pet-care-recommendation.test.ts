import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'
import { getRecommendedCareAction } from '~/utils/petCare'
import type { PetStatus, PetStats } from '~/types/pet'

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

describe('pet care recommendation', () => {
  it.each([
    ['hungry', 'feed'],
    ['sleepy', 'sleep'],
    ['dirty', 'wash'],
    ['bored', 'play'],
  ] as const)('recommends %s status care as %s', (status, action) => {
    const recommendation = getRecommendedCareAction({
      stats: {
        fullness: 80,
        energy: 80,
        cleanliness: 80,
      },
      status,
    })

    expect(recommendation).toMatchObject({
      action,
      reason: 'need',
      status,
    })
  })

  it.each([
    [{ fullness: 20, energy: 70, cleanliness: 80 }, 'feed', 'fullness'],
    [{ fullness: 80, energy: 20, cleanliness: 70 }, 'sleep', 'energy'],
    [{ fullness: 80, energy: 70, cleanliness: 20 }, 'wash', 'cleanliness'],
  ] as Array<[PetStats, 'feed' | 'sleep' | 'wash', keyof PetStats]>)(
    'recommends the lowest stat for stable status',
    (stats, action, statKey) => {
      const recommendation = getRecommendedCareAction({
        stats,
        status: 'happy',
      })

      expect(recommendation).toMatchObject({
        action,
        reason: 'lowest-stat',
        statKey,
        status: 'happy',
      })
    },
  )

  it('uses a stable tie-break order when stats are equal', () => {
    expect(
      getRecommendedCareAction({
        stats: {
          fullness: 50,
          energy: 50,
          cleanliness: 50,
        },
        status: 'excited',
      }),
    ).toMatchObject({
      action: 'feed',
      reason: 'lowest-stat',
      statKey: 'fullness',
    })
  })

  it('passes recommended care from the store into action controls', () => {
    const template = readComponentTemplate('app.vue')

    expect(getComponentPropExpression(template, 'PetActions', 'recommended-care-action')).toBe(
      'pet.recommendedCareAction.value',
    )
  })

  it('renders recommendation copy and action button state in the controls', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const source = readSource('components/PetActions.vue')
    const css = readSource('assets/css/main.css')

    expect(template).toContain('action-recommendation')
    expect(template).toContain('recommendationTitle')
    expect(template).toContain("getActionButtonState(action.id) === 'recommended'")
    expect(source).toContain('recommendedCareAction: PetCareRecommendation | null')
    expect(css).toContain('.action-recommendation')
    expect(css).toContain('.action-button--recommended')
  })

  it('keeps recommendation copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const careRecommendation = I18N_MESSAGES[locale].careRecommendation

      expect(careRecommendation.heading.length).toBeGreaterThan(0)
      expect(careRecommendation.title).toContain('{action}')
      expect(careRecommendation.badge.length).toBeGreaterThan(0)

      for (const action of ['feed', 'play', 'sleep', 'wash'] as const) {
        expect(careRecommendation.details[action].length).toBeGreaterThan(0)
      }
    }
  })

  it('uses the recommendation utility from the pet store', () => {
    const source = readSource('composables/usePetStore.ts')

    expect(source).toContain('getRecommendedCareAction')
    expect(source).toContain('recommendedCareAction')
  })
})
