import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'
import type { PetSettings } from '~/types/pet'

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const
const requireModule = createRequire(import.meta.url)

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type PetSidePanelSetup = {
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

  it('renders growth goals before the existing progress gauges', () => {
    const template = readComponentTemplate('components/PetSidePanel.vue')
    const goalIndex = template.indexOf('class="progress-goals"')
    const progressIndex = template.indexOf('class="progress-list"')

    expect(goalIndex).toBeGreaterThan(-1)
    expect(progressIndex).toBeGreaterThan(goalIndex)
    expect(template).toContain('messages.sidePanelProgress.progressGoalHeading')
    expect(template).toContain('progressGoalRows')
    expect(template).toContain('class="progress-goal"')
  })

  it('summarizes remaining level and affinity goals', () => {
    const setup = setupSidePanel()

    expect(setup.levelGoalText?.value).toBe('레벨 3까지 55 경험치')
    expect(setup.affinityGoalText?.value).toBe('보상 보너스 4까지 110')
    expect(setup.progressGoalRows?.value).toEqual([
      {
        id: 'level',
        label: '레벨 목표',
        text: '레벨 3까지 55 경험치',
        detail: '현재 80/135',
      },
      {
        id: 'affinity',
        label: '보상 보너스',
        text: '보상 보너스 4까지 110',
        detail: '현재 30/140',
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

    expect(setup.levelGoalText?.value).toBe('다음 목표 준비 완료')
    expect(setup.affinityGoalText?.value).toBe('다음 목표 준비 완료')
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
      expect(sidePanelProgress.goalComplete.length).toBeGreaterThan(0)
      expect(sidePanelProgress.goalProgressDetail).toContain('{current}')
      expect(sidePanelProgress.goalProgressDetail).toContain('{required}')
    }
  })

  it('defines compact responsive growth goal styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.progress-goals')
    expect(css).toContain('.progress-goal')
    expect(css).toMatch(/\.progress-goals__list\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/)
    expect(css).toMatch(/\.progress-goal strong\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.progress-goals__list\s*\{[^}]*grid-template-columns: 1fr;/,
    )
  })
})
