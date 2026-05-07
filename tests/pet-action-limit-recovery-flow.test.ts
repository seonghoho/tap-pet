import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ACTION_LIMIT_AD_REWARD_USES } from '~/constants/pet'
import { I18N_MESSAGES } from '~/constants/i18n'

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const
const requireModule = createRequire(import.meta.url)

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type PetActionsSetup = {
  actionLimitRecoveryWaitText?: { value: string }
  actionLimitRecoveryRewardText?: { value: string }
  isLimitReached: { value: boolean }
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
    if (id === '~/constants/pet') return { ACTION_LIMIT_AD_REWARD_USES }

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

function createBaseProps(overrides: Record<string, unknown> = {}) {
  return {
    stats: {
      fullness: 74,
      energy: 21,
      cleanliness: 64,
    },
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
      resetAt: 30 * 60 * 1000 + 1000,
      windowMs: 30 * 60 * 1000,
    },
    careFeedback: null,
    actionLimitRewardFeedback: null,
    recommendedCareAction: {
      action: 'sleep',
      reason: 'lowest-stat',
      status: 'sleepy',
      statKey: 'energy',
    },
    recommendedCareRewardPreview: null,
    levelProgress: null,
    ...overrides,
  }
}

function setupPetActions(props: Record<string, unknown> = {}): PetActionsSetup {
  vi.useFakeTimers()
  vi.setSystemTime(1000)
  vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

  return component.setup(createBaseProps(props), {
    emit: vi.fn(),
    expose: vi.fn(),
  })
}

describe('pet action limit recovery flow', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('summarizes wait and reward recovery choices while locked', () => {
    const setup = setupPetActions()

    expect(setup.isLimitReached.value).toBe(true)
    expect(setup.actionLimitRecoveryWaitText?.value).toBe('30m 00s 후 자동 초기화')
    expect(setup.actionLimitRecoveryRewardText?.value).toBe(
      `지금 +${ACTION_LIMIT_AD_REWARD_USES}회 추가`,
    )
  })

  it('renders recovery options inside the action limit card', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const source = readSource('components/PetActions.vue')

    expect(source).toContain("import { ACTION_LIMIT_AD_REWARD_USES } from '~/constants/pet'")
    expect(template).toContain('class="action-limit__recovery"')
    expect(template).toContain('role="group"')
    expect(template).toContain(':aria-label="messages.actionLimit.recoveryLabel"')
    expect(template).toContain('class="action-limit__option action-limit__option--wait"')
    expect(template).toContain('class="action-limit__option action-limit__option--reward"')
    expect(template).toContain('actionLimitRecoveryWaitText')
    expect(template).toContain('actionLimitRecoveryRewardText')
    expect(template).toContain('@click="emit(\'rewardAd\')"')
  })

  it('keeps recovery option copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const actionLimit = I18N_MESSAGES[locale].actionLimit

      expect(actionLimit.recoveryLabel.length).toBeGreaterThan(0)
      expect(actionLimit.waitOption.length).toBeGreaterThan(0)
      expect(actionLimit.waitDetail).toContain('{time}')
      expect(actionLimit.rewardOption.length).toBeGreaterThan(0)
      expect(actionLimit.rewardDetail).toContain('{count}')
    }
  })

  it('defines responsive locked recovery card styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toMatch(/\.action-limit--locked\s*\{[^}]*display: grid;/)
    expect(css).toMatch(/\.action-limit__recovery\s*\{[^}]*display: grid;/)
    expect(css).toMatch(/\.action-limit__recovery\s*\{[^}]*grid-template-columns:/)
    expect(css).toMatch(/\.action-limit__option\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.action-limit__option--reward\s*\{[^}]*cursor: pointer;/)
  })
})
