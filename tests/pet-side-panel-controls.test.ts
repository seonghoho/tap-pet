import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ACTION_LIMIT_AD_REWARD_USES } from '~/constants/pet'
import type { PetAction, PetSettings } from '~/types/pet'

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type PetSettingsPanelSetup = {
  draftName: { value: string }
  draftCustomTitle: { value: string }
  isResetConfirming: { value: boolean }
  commitName: () => void
  setCustomTitle: (event: Event) => void
  setDisguiseTitle: (disguiseTitleId: PetSettings['disguiseTitleId']) => void
  requestReset: () => void
  confirmReset: () => void
  cancelReset: () => void
}

type PetActionsSetup = {
  isActionDisabled: (action: PetAction) => boolean
  isLimitReached: { value: boolean }
  getActionDetail: (action: PetAction) => string
  getActionAriaLabel: (action: PetAction) => string
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
    if (id === '~/constants/premium') {
      return {
        PREMIUM_QUIET_SIGNAL_PACKS: [],
        PREMIUM_THEME_PACKS: [],
        PREMIUM_WORK_TITLE_PACKS: [],
      }
    }
    if (id === '~/constants/pet') return { ACTION_LIMIT_AD_REWARD_USES }

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

function createActionMessages() {
  return {
    actions: {
      feed: {
        label: 'Feed',
        detail: 'Restores fullness',
      },
      play: {
        label: 'Play',
        detail: 'Increases affinity and EXP',
      },
      sleep: {
        label: 'Sleep',
        detail: 'Restores energy',
      },
      wash: {
        label: 'Wash',
        detail: 'Restores cleanliness',
      },
    },
    actionState: {
      cooldown: 'Ready in {time}',
      inProgress: 'Finishing action',
      limitReached: 'Care limit reached',
      ariaLabel: '{action}: {state}',
    },
    actionButtonState: {
      ready: 'Ready',
      recommended: 'Recommended',
      cooldown: 'Cooldown',
      active: 'In progress',
      locked: 'Locked',
    },
  }
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

function getComponentPropExpression(template: string, componentName: string, propName: string): string | undefined {
  const match = template.match(new RegExp(`<${componentName}[\\s\\S]*?/>`))

  return match?.[0].match(new RegExp(`:${propName}="([^"]+)"`))?.[1]
}

describe('pet side panel progress summary', () => {
  it('does not duplicate the main pet status panel', () => {
    const template = readComponentTemplate('components/PetSidePanel.vue')

    expect(template).not.toContain('<PetStatusPanel')
  })

  it('keeps duplicated status props out of the side panel mount', () => {
    const template = readComponentTemplate('app.vue')

    expect(getComponentPropExpression(template, 'PetSidePanel', 'species')).toBeUndefined()
    expect(getComponentPropExpression(template, 'PetSidePanel', 'status')).toBeUndefined()
    expect(getComponentPropExpression(template, 'PetSidePanel', 'stats')).toBeUndefined()
    expect(getComponentPropExpression(template, 'PetSidePanel', 'status-theme-id')).toBeUndefined()
    expect(getComponentPropExpression(template, 'PetSidePanel', 'level-progress')).toBe('pet.levelProgress.value')
  })

  it('passes recent care feedback into the action controls', () => {
    const template = readComponentTemplate('app.vue')

    expect(getComponentPropExpression(template, 'PetActions', 'care-feedback')).toBe('pet.lastCareFeedback.value')
  })

  it('uses softer dedicated gauge colors instead of the primary action colors', () => {
    const appSource = readSource('app.vue')
    const css = readSource('assets/css/main.css')

    expect(appSource).toContain("'--app-stat-fill-start': colors.statFillStart")
    expect(appSource).toContain("'--app-stat-fill-end': colors.statFillEnd")
    expect(css).toContain('var(--app-stat-fill-start)')
    expect(css).toContain('var(--app-stat-fill-end)')
    expect(css).not.toContain('linear-gradient(90deg, var(--app-accent), var(--app-success))')
  })

  it('keeps mobile action controls in a two-column grid', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.action-panel\s*\{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
    )
  })

  it('keeps first-loop side panel focused by gating detailed progression sections', () => {
    const template = readComponentTemplate('components/PetSidePanel.vue')

    expect(template).toContain('v-if="hasStartedFirstCareLoop"')
    expect(template).toContain('v-else')
    expect(template).toContain('premium-tab-pack--compact')
  })
})

describe('pet reset placement', () => {
  it('moves reset out of the topbar and into the settings panel flow', () => {
    const appTemplate = readComponentTemplate('app.vue')
    const sidePanelTemplate = readComponentTemplate('components/PetSidePanel.vue')
    const settingsPanelTemplate = readComponentTemplate('components/PetSettingsPanel.vue')

    expect(appTemplate).not.toContain('@click="pet.resetPet"')
    expect(appTemplate).toContain('@reset="pet.resetPet"')
    expect(sidePanelTemplate).toContain('@reset="emit(\'reset\')"')
    expect(settingsPanelTemplate).toContain('settings-danger-zone')
  })
})

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

  it('emits custom disguise title changes as the user types', () => {
    vi.stubGlobal('useLocale', () => ({ locale: 'en', messages: {} }))
    const component = loadScriptSetupComponent<PetSettingsPanelSetup>('components/PetSettingsPanel.vue')
    const emitted: unknown[][] = []
    const setup = component.setup(
      {
        name: 'Momo',
        settings: createTestSettings({
          titleMode: 'disguise',
          disguiseTitleId: 'inbox',
          customDisguiseTitle: '',
        }),
      },
      {
        emit: (...args) => {
          emitted.push(args)
        },
        expose: vi.fn(),
      },
    )

    setup.setCustomTitle({ target: { value: 'Focus mode' } } as unknown as Event)

    expect(emitted).toEqual([['updateSettings', { customDisguiseTitle: 'Focus mode' }]])
    expect(setup.draftCustomTitle.value).toBe('Focus mode')
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

  it('requires confirmation before emitting reset', () => {
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

    setup.requestReset()

    expect(setup.isResetConfirming.value).toBe(true)
    expect(emitted).toEqual([])

    setup.cancelReset()

    expect(setup.isResetConfirming.value).toBe(false)
    expect(emitted).toEqual([])

    setup.requestReset()
    setup.confirmReset()

    expect(setup.isResetConfirming.value).toBe(false)
    expect(emitted).toEqual([['reset']])
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
        actionLimitInfo: {
          used: 4,
          limit: 5,
          remaining: 1,
          resetAt: 31 * 60 * 1000,
          windowMs: 30 * 60 * 1000,
        },
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

  it('disables care actions and emits ad reward requests when the action limit is reached', () => {
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
          sleep: 0,
          wash: 0,
        },
        activeReaction: null,
        actionLimitInfo: {
          used: 5,
          limit: 5,
          remaining: 0,
          resetAt: 31 * 60 * 1000,
          windowMs: 30 * 60 * 1000,
        },
      },
      {
        emit: vi.fn(),
        expose: vi.fn(),
      },
    )

    expect(setup.isLimitReached.value).toBe(true)
    expect(setup.isActionDisabled('feed')).toBe(true)
    expect(setup.isActionDisabled('play')).toBe(true)
  })

  it('describes cooldown remaining time in the action detail', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocale', () => ({ messages: { value: createActionMessages() } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

    const setup = component.setup(
      {
        cooldowns: {
          feed: 0,
          play: 0,
          sleep: 3100,
          wash: 0,
        },
        activeReaction: null,
        actionLimitInfo: {
          used: 4,
          limit: 5,
          remaining: 1,
          resetAt: 31 * 60 * 1000,
          windowMs: 30 * 60 * 1000,
        },
        careFeedback: null,
      },
      {
        emit: vi.fn(),
        expose: vi.fn(),
      },
    )

    expect(setup.getActionDetail('sleep')).toBe('Ready in 3s')
    expect(setup.getActionAriaLabel('sleep')).toBe('Sleep: Cooldown · Ready in 3s')
  })

  it('describes active and limit-locked action states', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocale', () => ({ messages: { value: createActionMessages() } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

    const activeSetup = component.setup(
      {
        cooldowns: {
          feed: 0,
          play: 0,
          sleep: 0,
          wash: 0,
        },
        activeReaction: 'feed',
        actionLimitInfo: {
          used: 4,
          limit: 5,
          remaining: 1,
          resetAt: 31 * 60 * 1000,
          windowMs: 30 * 60 * 1000,
        },
        careFeedback: null,
      },
      {
        emit: vi.fn(),
        expose: vi.fn(),
      },
    )

    expect(activeSetup.getActionDetail('feed')).toBe('Finishing action')

    const lockedSetup = component.setup(
      {
        cooldowns: {
          feed: 0,
          play: 0,
          sleep: 0,
          wash: 0,
        },
        activeReaction: null,
        actionLimitInfo: {
          used: 5,
          limit: 5,
          remaining: 0,
          resetAt: 31 * 60 * 1000,
          windowMs: 30 * 60 * 1000,
        },
        careFeedback: null,
      },
      {
        emit: vi.fn(),
        expose: vi.fn(),
      },
    )

    expect(lockedSetup.getActionDetail('play')).toBe('Care limit reached')
  })
})
