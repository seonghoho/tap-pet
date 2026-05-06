import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const
const requireModule = createRequire(import.meta.url)

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type PetActionsSetup = {
  actionLimitText: { value: string }
  actionLimitMetaText: { value: string }
  isLimitReached: { value: boolean }
  actionAvailabilityText: { value: string }
  shouldShowActionAvailability: { value: boolean }
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

function createBaseProps() {
  return {
    cooldowns: {
      feed: 0,
      play: 0,
      sleep: 0,
      wash: 0,
    },
    activeReaction: null,
    actionLimitInfo: {
      used: 2,
      limit: 5,
      remaining: 3,
      resetAt: 31 * 60 * 1000,
      windowMs: 30 * 60 * 1000,
    },
    careFeedback: null,
    actionLimitRewardFeedback: null,
    recommendedCareAction: null,
  }
}

describe('pet action availability forecast', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('renders action limit timing and cooldown availability helpers', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const source = readSource('components/PetActions.vue')

    expect(template).toContain('action-limit__copy')
    expect(template).toContain('actionLimitMetaText')
    expect(template).toContain('action-availability')
    expect(template).toContain('actionAvailabilityText')
    expect(template).toContain('v-if="shouldShowActionAvailability"')
    expect(source).toContain('messages.value.actionLimit.resetHint')
    expect(source).toContain('messages.value.actionAvailability.cooldown')
  })

  it('describes the next cooling action while actions remain available', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

    const setup = component.setup(
      {
        ...createBaseProps(),
        cooldowns: {
          feed: 4500,
          play: 0,
          sleep: 2100,
          wash: 0,
        },
      },
      {
        emit: vi.fn(),
        expose: vi.fn(),
      },
    )

    expect(setup.shouldShowActionAvailability.value).toBe(true)
    expect(setup.actionAvailabilityText.value).toBe('재우기 2s 후 다시 가능')
  })

  it('hides the cooldown helper during active reactions and action limit locks', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

    const activeSetup = component.setup(
      {
        ...createBaseProps(),
        activeReaction: 'feed',
        cooldowns: {
          feed: 4500,
          play: 0,
          sleep: 2100,
          wash: 0,
        },
      },
      {
        emit: vi.fn(),
        expose: vi.fn(),
      },
    )

    expect(activeSetup.shouldShowActionAvailability.value).toBe(false)

    const lockedSetup = component.setup(
      {
        ...createBaseProps(),
        actionLimitInfo: {
          used: 5,
          limit: 5,
          remaining: 0,
          resetAt: 31 * 60 * 1000,
          windowMs: 30 * 60 * 1000,
        },
        cooldowns: {
          feed: 4500,
          play: 0,
          sleep: 2100,
          wash: 0,
        },
      },
      {
        emit: vi.fn(),
        expose: vi.fn(),
      },
    )

    expect(lockedSetup.shouldShowActionAvailability.value).toBe(false)
  })

  it('treats an expired limit window as ready even before parent props refresh', () => {
    vi.useFakeTimers()
    vi.setSystemTime(32 * 60 * 1000)
    vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

    const setup = component.setup(
      {
        ...createBaseProps(),
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

    expect(setup.isLimitReached.value).toBe(false)
    expect(setup.actionLimitText.value).toBe('새 돌봄 윈도우가 시작됐습니다.')
    expect(setup.actionLimitMetaText.value).toBe('행동을 선택하면 새 횟수로 이어갈 수 있습니다.')
  })

  it('keeps limit reset and availability copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const messages = I18N_MESSAGES[locale]

      expect(messages.actionLimit.resetHint).toContain('{time}')
      expect(messages.actionLimit.resetReady.length).toBeGreaterThan(0)
      expect(messages.actionLimit.resetReadyHint.length).toBeGreaterThan(0)
      expect(messages.actionLimit.rewardHint.length).toBeGreaterThan(0)
      expect(messages.actionAvailability.cooldown).toContain('{action}')
      expect(messages.actionAvailability.cooldown).toContain('{time}')
    }
  })

  it('defines responsive availability styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.action-limit__copy')
    expect(css).toContain('.action-limit small')
    expect(css).toContain('.action-availability')
    expect(css).toMatch(/\.action-availability\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.action-limit\s*\{[^}]*align-items: flex-start;/,
    )
  })
})
