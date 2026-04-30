import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PetAction, PetSettings } from '~/types/pet'

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type PetSettingsPanelSetup = {
  draftName: { value: string }
  commitName: () => void
  setDisguiseTitle: (disguiseTitleId: PetSettings['disguiseTitleId']) => void
}

type PetActionsSetup = {
  isActionDisabled: (action: PetAction) => boolean
}

const requireModule = createRequire(import.meta.url)

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
    if (id === '~/constants/themes') return { PET_THEMES: [] }
    if (id === '~/constants/titles') return { DISGUISE_TITLES: [], getDisguiseTitleLabel: () => '' }

    return requireModule(id)
  }

  new Function('require', 'exports', 'module', output)(localRequire, module.exports, module)

  return (module.exports as { default: SetupComponent<T> }).default
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

describe('pet settings panel controls', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('clears a custom disguise title when selecting a preset title', () => {
    vi.stubGlobal('useLocale', () => ({ locale: 'en', messages: {} }))
    const component = loadScriptSetupComponent<PetSettingsPanelSetup>('components/PetSettingsPanel.vue')
    const emitted: unknown[][] = []
    const setup = component.setup(
      {
        name: 'Momo',
        settings: createTestSettings({
          titleMode: 'disguise',
          disguiseTitleId: 'inbox',
          customDisguiseTitle: 'Focus mode',
        }),
      },
      {
        emit: (...args) => {
          emitted.push(args)
        },
        expose: vi.fn(),
      },
    )

    setup.setDisguiseTitle('analytics')

    expect(emitted).toEqual([
      ['updateSettings', { disguiseTitleId: 'analytics', customDisguiseTitle: '' }],
    ])
  })

  it('resets an empty draft name without emitting', () => {
    vi.stubGlobal('useLocale', () => ({ locale: 'en', messages: {} }))
    const component = loadScriptSetupComponent<PetSettingsPanelSetup>('components/PetSettingsPanel.vue')
    const emitted: unknown[][] = []
    const setup = component.setup(
      {
        name: 'Momo',
        settings: createTestSettings(),
      },
      {
        emit: (...args) => {
          emitted.push(args)
        },
        expose: vi.fn(),
      },
    )

    setup.draftName.value = '   '
    setup.commitName()

    expect(emitted).toEqual([])
    expect(setup.draftName.value).toBe('Momo')
  })

  it('trims a non-empty draft name before emitting', () => {
    vi.stubGlobal('useLocale', () => ({ locale: 'en', messages: {} }))
    const component = loadScriptSetupComponent<PetSettingsPanelSetup>('components/PetSettingsPanel.vue')
    const emitted: unknown[][] = []
    const setup = component.setup(
      {
        name: 'Momo',
        settings: createTestSettings(),
      },
      {
        emit: (...args) => {
          emitted.push(args)
        },
        expose: vi.fn(),
      },
    )

    setup.draftName.value = '  Berry  '
    setup.commitName()

    expect(emitted).toEqual([['updateName', 'Berry']])
    expect(setup.draftName.value).toBe('Berry')
  })
})

describe('pet action controls', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('only disables the active reaction action while other actions remain available', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocale', () => ({ messages: {} }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

    const setup = component.setup(
      {
        cooldowns: {
          feed: 0,
          play: 0,
          sleep: 3000,
          wash: 0,
        },
        activeReaction: 'feed',
      },
      {
        emit: vi.fn(),
        expose: vi.fn(),
      },
    )

    expect(setup.isActionDisabled('feed')).toBe(true)
    expect(setup.isActionDisabled('play')).toBe(false)
    expect(setup.isActionDisabled('sleep')).toBe(true)
  })
})
