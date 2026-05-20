import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'
import type { PetSettings } from '~/types/pet'
import * as petGrowth from '~/utils/petGrowth'
import * as petLevelUnlocks from '~/utils/petLevelUnlocks'
import * as petPersonality from '~/utils/petPersonality'

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const
const FIRST_CARE_STEP_IDS = ['recommend', 'result', 'growth'] as const
const FIRST_CARE_STEP_LABELS = {
  en: ['Pick the recommended care', 'Check the result card', 'Watch growth and affinity'],
  ko: ['추천 돌봄 선택', '결과 카드 확인', '성장/친밀도 변화 보기'],
  ja: ['おすすめのお世話を選択', '結果カードを確認', '成長と親密度を見る'],
} as const
const FIRST_CARE_REPEAT_STEP_LABELS = {
  en: ['Start the next recommended care', 'Check the next result', 'Track the next growth goal'],
  ko: ['다음 추천 돌봄 시작', '다음 결과 확인', '다음 성장 목표 확인'],
  ja: ['次のおすすめのお世話を始める', '次の結果を確認', '次の成長目標を確認'],
} as const
const requireModule = createRequire(import.meta.url)

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type FirstCareGoalCopy = {
  eyebrow: string
  title: string
  description: string
  steps: Array<{
    id: string
    label: string
  }>
}

type FirstCareGoalMessages = FirstCareGoalCopy & {
  repeat: FirstCareGoalCopy
}

type PetSidePanelSetup = {
  hasStartedFirstCareLoop: { value: boolean }
  firstCareGoalCopy: { value: FirstCareGoalCopy }
}

function loadScriptSetupComponent<T>(componentPath: string): SetupComponent<T> {
  const filename = resolve(componentPath)
  const source = readFileSync(filename, 'utf8')
  const descriptor = parse(source, { filename }).descriptor
  const compiled = compileScript(descriptor, { id: filename })
  const output = ts.transpileModule(compiled.content, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const module = { exports: {} }
  const localRequire = (id: string): unknown => {
    if (id === 'vue') return requireModule('vue')
    if (id === '~/utils/petGrowth') return petGrowth
    if (id === '~/utils/petLevelUnlocks') return petLevelUnlocks
    if (id === '~/utils/petPersonality') return petPersonality

    return requireModule(id)
  }

  new Function('require', 'exports', 'module', output)(localRequire, module.exports, module)

  return (module.exports as { default: SetupComponent<T> }).default
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

function createTestSettings(overrides: Partial<PetSettings> = {}): PetSettings {
  return {
    titleMode: 'status',
    titleVisibility: 'inactive-only',
    disguiseTitleId: 'project-dashboard',
    customDisguiseTitle: '',
    titleAnimationEnabled: false,
    themeId: 'system',
    ...overrides,
  }
}

function createBaseProps(overrides: Record<string, unknown> = {}) {
  return {
    mode: 'status',
    name: '탭펫',
    level: 1,
    levelProgress: {
      current: 0,
      required: 100,
      percent: 0,
    },
    affinityProgress: {
      level: 1,
      current: 0,
      required: 60,
      percent: 0,
    },
    settings: createTestSettings(),
    ...overrides,
  }
}

function setupSidePanel(props: Record<string, unknown> = {}): PetSidePanelSetup {
  vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
  const component = loadScriptSetupComponent<PetSidePanelSetup>('components/PetSidePanel.vue')

  return component.setup(createBaseProps(props), {
    emit: vi.fn(),
    expose: vi.fn(),
  })
}

describe('first care goal guidance', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

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
    expect(statusTemplate).toContain('class="first-care-goal"')
    expect(statusTemplate).toContain('aria-labelledby="first-care-goal-title"')
    expect(statusTemplate).toContain(':class="{ \'first-care-goal--repeat\': hasStartedFirstCareLoop }"')
    expect(statusTemplate).toContain('<strong id="first-care-goal-title">{{ firstCareGoalCopy.title }}</strong>')
    expect(statusTemplate).toContain('firstCareGoalCopy.eyebrow')
    expect(statusTemplate).toContain('firstCareGoalCopy.description')
    expect(statusTemplate).toContain('<ol class="first-care-goal__list" role="list">')
    expect(statusTemplate).toContain('v-for="step in firstCareGoalCopy.steps"')
    expect(statusTemplate).toContain(':key="step.id"')
    expect(settingsTemplate).not.toContain('first-care-goal')
  })

  it('keeps the initial first care copy before any growth progress exists', () => {
    const setup = setupSidePanel()

    expect(setup.hasStartedFirstCareLoop.value).toBe(false)
    expect(setup.firstCareGoalCopy.value.title).toBe('한 번의 돌봄 흐름을 완료하세요')
    expect(setup.firstCareGoalCopy.value.steps.map((step) => step.label)).toEqual([
      '추천 돌봄 선택',
      '결과 카드 확인',
      '성장/친밀도 변화 보기',
    ])
  })

  it('switches to repeat-loop copy after level or affinity progress exists', () => {
    const progressedSetups = [
      setupSidePanel({
        levelProgress: {
          current: 1,
          required: 100,
          percent: 1,
        },
      }),
      setupSidePanel({
        level: 2,
        levelProgress: {
          current: 0,
          required: 135,
          percent: 0,
        },
      }),
      setupSidePanel({
        affinityProgress: {
          level: 1,
          current: 1,
          required: 60,
          percent: 2,
        },
      }),
      setupSidePanel({
        affinityProgress: {
          level: 2,
          current: 0,
          required: 100,
          percent: 0,
        },
      }),
    ]

    for (const setup of progressedSetups) {
      expect(setup.hasStartedFirstCareLoop.value).toBe(true)
      expect(setup.firstCareGoalCopy.value.title).toBe('다음 루프를 이어가세요')
      expect(setup.firstCareGoalCopy.value.steps.map((step) => step.label)).toEqual([
        '다음 추천 돌봄 시작',
        '다음 결과 확인',
        '다음 성장 목표 확인',
      ])
    }
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
      expect(firstCareGoal.repeat.eyebrow.length).toBeGreaterThan(0)
      expect(firstCareGoal.repeat.title.length).toBeGreaterThan(0)
      expect(firstCareGoal.repeat.description.length).toBeGreaterThan(0)
      expect(firstCareGoal.repeat.steps.map((step) => step.id)).toEqual([...FIRST_CARE_STEP_IDS])
      expect(firstCareGoal.repeat.steps.map((step) => step.label)).toEqual([
        ...FIRST_CARE_REPEAT_STEP_LABELS[locale],
      ])
      for (const step of firstCareGoal.steps) {
        expect(step.label.length).toBeGreaterThan(0)
      }
      for (const step of firstCareGoal.repeat.steps) {
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
    expect(css).toContain('.first-care-goal--repeat .first-care-goal__step::before')
    expect(css).toMatch(/\.first-care-goal__copy strong\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.first-care-goal__step span\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.first-care-goal__step\s*\{[^}]*grid-template-columns: 22px minmax\(0, 1fr\);/,
    )
  })
})
