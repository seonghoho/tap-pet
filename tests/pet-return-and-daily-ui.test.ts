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

describe('return report and daily goal UI', () => {
  it('renders the return report above care actions in the main pet flow', () => {
    const template = readComponentTemplate('app.vue')
    const statusIndex = template.indexOf('<PetStatusPanel')
    const reportIndex = template.indexOf('<PetReturnReport')
    const actionsIndex = template.indexOf('<PetActions')

    expect(statusIndex).toBeGreaterThan(-1)
    expect(reportIndex).toBeGreaterThan(statusIndex)
    expect(actionsIndex).toBeGreaterThan(reportIndex)
    expect(template).toContain(':report="pet.returnReport.value"')
  })

  it('passes daily goal state into the side panel', () => {
    const template = readComponentTemplate('app.vue')

    expect(template).toContain(':daily-goal="pet.dailyGoal.value"')
    expect(template).toContain(':daily-goal-reward-feedback="pet.dailyGoalRewardFeedback.value"')
    expect(template).toContain('@claim-daily-goal="pet.claimDailyGoalReward"')
  })

  it('renders the daily goal inside the side panel status body', () => {
    const template = readComponentTemplate('components/PetSidePanel.vue')

    expect(template).toContain('<PetDailyGoal')
    expect(template).toContain(':daily-goal="dailyGoal"')
    expect(template).toContain('@claim="emit(\'claimDailyGoal\')"')
  })

  it('keeps return report and daily goal copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const messages = I18N_MESSAGES[locale]

      expect(messages.returnReport.heading.length).toBeGreaterThan(0)
      expect(messages.returnReport.actions.feed).toContain('{action}')
      expect(messages.dailyGoal.heading.length).toBeGreaterThan(0)
      expect(messages.dailyGoal.rewards).toContain('{exp}')
      expect(messages.dailyGoal.claim.length).toBeGreaterThan(0)
    }
  })

  it('defines compact responsive styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.return-report')
    expect(css).toContain('.daily-goal')
    expect(css).toMatch(/\.return-report__title\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.daily-goal__title\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/@media \(max-width: 720px\)[\s\S]*\.daily-goal\s*\{/)
  })
})
