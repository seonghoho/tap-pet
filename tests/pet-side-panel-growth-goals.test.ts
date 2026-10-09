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
const requireModule = createRequire(import.meta.url)

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type PetSidePanelSetup = {
  affinityGoalDetail?: { value: string }
  affinityGoalText?: { value: string }
  levelGoalText?: { value: string }
  progressGoalRows?: {
    value: Array<{
      id: 'level' | 'affinity'
      label: string
      text: string
      detail: string
    }>
  }
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
    level: 2,
    levelProgress: {
      current: 80,
      required: 135,
      percent: 59,
    },
    affinityProgress: {
      level: 3,
      current: 30,
      required: 140,
      percent: 21,
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

describe('pet side panel growth goals', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders growth goals with inline progress gauges', () => {
    const template = readComponentTemplate('components/PetSidePanel.vue')
    const goalIndex = template.indexOf('class="progress-goals"')
    const goalRowIndex = template.indexOf('class="progress-goal"')
    const trackIndex = template.indexOf('class="stat-track"', goalRowIndex)

    expect(goalIndex).toBeGreaterThan(-1)
    expect(goalRowIndex).toBeGreaterThan(goalIndex)
    expect(trackIndex).toBeGreaterThan(goalRowIndex)
    expect(template).not.toContain('class="progress-list"')
    expect(template).toContain('messages.sidePanelProgress.progressGoalHeading')
    expect(template).toContain('progressGoalRows')
    expect(template).toContain(':style="{ width: `${goal.percent}%` }"')
  })

  it('summarizes remaining level and affinity goals', () => {
    const setup = setupSidePanel()
    const sidePanelProgress = I18N_MESSAGES.ko.sidePanelProgress
    const levelText = sidePanelProgress.levelGoalRemaining
      .replace('{level}', '3')
      .replace('{remaining}', '55')
      .replace('{exp}', I18N_MESSAGES.ko.stats.exp)
    const affinityText = sidePanelProgress.affinityGoalRemaining
      .replace('{level}', '4')
      .replace('{remaining}', '110')
    const affinityDetail = sidePanelProgress.affinityGoalDetail
      .replace('{current}', '30')
      .replace('{required}', '140')
      .replace('{currentBonus}', '1.3')
      .replace('{nextBonus}', '1.4')

    expect(setup.levelGoalText?.value).toBe(levelText)
    expect(setup.affinityGoalText?.value).toBe(affinityText)
    expect(setup.affinityGoalDetail?.value).toBe(affinityDetail)
    expect(setup.progressGoalRows?.value).toEqual([
      {
        id: 'level',
        label: sidePanelProgress.levelGoalLabel,
        text: levelText,
        detail: sidePanelProgress.goalProgressDetail.replace('{current}', '80').replace('{required}', '135'),
        percent: 59,
      },
      {
        id: 'affinity',
        label: sidePanelProgress.affinityGoalLabel,
        text: affinityText,
        detail: affinityDetail,
        percent: 21,
      },
    ])
  })

  it('uses complete copy when a progress value reaches its requirement', () => {
    const setup = setupSidePanel({
      levelProgress: {
        current: 135,
        required: 135,
        percent: 100,
      },
      affinityProgress: {
        level: 3,
        current: 140,
        required: 140,
        percent: 100,
      },
    })

    expect(setup.levelGoalText?.value).toBe(I18N_MESSAGES.ko.sidePanelProgress.goalComplete)
    expect(setup.affinityGoalText?.value).toBe(I18N_MESSAGES.ko.sidePanelProgress.goalComplete)
  })

  it('uses max bonus copy when the next affinity multiplier is capped', () => {
    const setup = setupSidePanel({
      affinityProgress: {
        level: 5,
        current: 10,
        required: 220,
        percent: 5,
      },
    })
    const sidePanelProgress = I18N_MESSAGES.ko.sidePanelProgress

    expect(setup.affinityGoalText?.value).toBe(
      sidePanelProgress.affinityGoalRemaining.replace('{level}', '6').replace('{remaining}', '210'),
    )
    expect(setup.affinityGoalDetail?.value).toBe(
      sidePanelProgress.affinityGoalMaxDetail
        .replace('{current}', '10')
        .replace('{required}', '220')
        .replace('{currentBonus}', '1.5'),
    )
  })

  it('keeps growth goal copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const sidePanelProgress = I18N_MESSAGES[locale].sidePanelProgress

      expect(sidePanelProgress.progressGoalHeading.length).toBeGreaterThan(0)
      expect(sidePanelProgress.levelGoalLabel.length).toBeGreaterThan(0)
      expect(sidePanelProgress.affinityGoalLabel.length).toBeGreaterThan(0)
      expect(sidePanelProgress.levelGoalRemaining).toContain('{level}')
      expect(sidePanelProgress.levelGoalRemaining).toContain('{remaining}')
      expect(sidePanelProgress.levelGoalRemaining).toContain('{exp}')
      expect(sidePanelProgress.affinityGoalRemaining).toContain('{level}')
      expect(sidePanelProgress.affinityGoalRemaining).toContain('{remaining}')
      expect(sidePanelProgress.affinityGoalDetail).toContain('{current}')
      expect(sidePanelProgress.affinityGoalDetail).toContain('{required}')
      expect(sidePanelProgress.affinityGoalDetail).toContain('{currentBonus}')
      expect(sidePanelProgress.affinityGoalDetail).toContain('{nextBonus}')
      expect(sidePanelProgress.affinityGoalMaxDetail).toContain('{current}')
      expect(sidePanelProgress.affinityGoalMaxDetail).toContain('{required}')
      expect(sidePanelProgress.affinityGoalMaxDetail).toContain('{currentBonus}')
      expect(sidePanelProgress.goalComplete.length).toBeGreaterThan(0)
      expect(sidePanelProgress.goalProgressDetail).toContain('{current}')
      expect(sidePanelProgress.goalProgressDetail).toContain('{required}')
    }
  })

})
