import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const
const FIRST_CARE_STEP_IDS = ['recommend', 'result', 'growth'] as const
const FIRST_CARE_STEP_LABELS = {
  en: ['Pick the recommended care', 'Check the result card', 'Watch growth and affinity'],
  ko: ['추천 돌봄 선택', '결과 카드 확인', '성장/친밀도 변화 보기'],
  ja: ['おすすめのお世話を選択', '結果カードを確認', '成長と親密度を見る'],
} as const

type FirstCareGoalMessages = {
  eyebrow: string
  title: string
  description: string
  steps: Array<{
    id: string
    label: string
  }>
}

function readComponentTemplate(componentPath: string): string {
  const filename = resolve(componentPath)
  const source = readFileSync(filename, 'utf8')
  const descriptor = parse(source, { filename }).descriptor

  return descriptor.template?.content ?? ''
}

function readSource(sourcePath: string): string {
  return readFileSync(resolve(sourcePath), 'utf8')
}

describe('first care goal guidance', () => {
  it('renders the first care loop goal before the growth gauges', () => {
    const template = readComponentTemplate('components/PetSidePanel.vue')
    const statusBodyIndex = template.indexOf('v-if="mode === \'status\'" class="pet-side-panel__body"')
    const settingsPanelIndex = template.indexOf('<PetSettingsPanel')
    const statusTemplate = template.slice(statusBodyIndex, settingsPanelIndex)
    const settingsTemplate = template.slice(settingsPanelIndex)
    const goalIndex = statusTemplate.indexOf('class="first-care-goal"')
    const progressIndex = statusTemplate.indexOf('class="progress-list"')

    expect(statusBodyIndex).toBeGreaterThan(-1)
    expect(settingsPanelIndex).toBeGreaterThan(statusBodyIndex)
    expect(goalIndex).toBeGreaterThan(-1)
    expect(progressIndex).toBeGreaterThan(goalIndex)
    expect(statusTemplate).toContain('<section class="first-care-goal" aria-labelledby="first-care-goal-title">')
    expect(statusTemplate).toContain('<strong id="first-care-goal-title">{{ messages.firstCareGoal.title }}</strong>')
    expect(statusTemplate).toContain('messages.firstCareGoal.eyebrow')
    expect(statusTemplate).toContain('messages.firstCareGoal.description')
    expect(statusTemplate).toContain('<ol class="first-care-goal__list" role="list">')
    expect(statusTemplate).toContain('v-for="step in messages.firstCareGoal.steps"')
    expect(statusTemplate).toContain(':key="step.id"')
    expect(settingsTemplate).not.toContain('first-care-goal')
  })

  it('keeps first care goal copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const firstCareGoal = (I18N_MESSAGES[locale] as unknown as { firstCareGoal?: FirstCareGoalMessages })
        .firstCareGoal

      expect(firstCareGoal).toBeDefined()
      if (!firstCareGoal) continue
      expect(firstCareGoal.eyebrow.length).toBeGreaterThan(0)
      expect(firstCareGoal.title.length).toBeGreaterThan(0)
      expect(firstCareGoal.description.length).toBeGreaterThan(0)
      expect(firstCareGoal.steps.map((step) => step.id)).toEqual([...FIRST_CARE_STEP_IDS])
      expect(firstCareGoal.steps.map((step) => step.label)).toEqual([...FIRST_CARE_STEP_LABELS[locale]])
      for (const step of firstCareGoal.steps) {
        expect(step.label.length).toBeGreaterThan(0)
      }
    }
  })

  it('defines compact responsive styles for the first care goal', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.first-care-goal')
    expect(css).toContain('.first-care-goal__copy')
    expect(css).toContain('.first-care-goal__list')
    expect(css).toContain('.first-care-goal__step')
    expect(css).toMatch(/\.first-care-goal__copy strong\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.first-care-goal__step span\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.first-care-goal__step\s*\{[^}]*grid-template-columns: 22px minmax\(0, 1fr\);/,
    )
  })
})
