import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ACTION_LIMIT_AD_REWARD_USES } from '~/constants/pet'
import { I18N_MESSAGES } from '~/constants/i18n'
import type { PetAction } from '~/types/pet'

const SUPPORTED_LOCALES = ['en', 'ko', 'ja'] as const
const requireModule = createRequire(import.meta.url)

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type PetActionsSetup = {
  getActionButtonStateLabel: (action: PetAction) => string
  getActionButtonDetail: (action: PetAction) => string
  getActionButtonStateClass: (action: PetAction) => string
  getActionAriaLabel: (action: PetAction) => string
}

type ActionButtonStateMessages = {
  ready: string
  recommended: string
  cooldown: string
  active: string
  locked: string
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
    cooldowns: {
      feed: 0,
      play: 0,
      sleep: 0,
      wash: 0,
    },
    activeReaction: null,
    actionLimitInfo: {
      used: 1,
      limit: 5,
      remaining: 4,
      resetAt: 31 * 60 * 1000,
      windowMs: 30 * 60 * 1000,
    },
    careFeedback: null,
    actionLimitRewardFeedback: null,
    recommendedCareAction: {
      action: 'feed',
      reason: 'lowest-stat',
      status: 'happy',
      statKey: 'fullness',
    },
    recommendedCareRewardPreview: null,
    levelProgress: null,
    ...overrides,
  }
}

function setupPetActions(props: Record<string, unknown> = {}): PetActionsSetup {
  vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

  return component.setup(createBaseProps(props), {
    emit: vi.fn(),
    expose: vi.fn(),
  })
}

describe('pet action button status labels', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('labels recommended and ready actions with compact states', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    const setup = setupPetActions()

    expect(setup.getActionButtonStateLabel('feed')).toBe('추천')
    expect(setup.getActionButtonDetail('feed')).toBe(
      '지금은 배부름을 먼저 회복하는 흐름이 좋습니다.',
    )
    expect(setup.getActionButtonStateClass('feed')).toBe('action-button__badge--recommended')
    expect(setup.getActionButtonStateLabel('play')).toBe('가능')
    expect(setup.getActionButtonDetail('play')).toBe(I18N_MESSAGES.ko.actions.play.detail)
    expect(setup.getActionButtonStateClass('play')).toBe('action-button__badge--ready')
  })

  it('prioritizes cooldown and locked labels over recommendation labels', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    const coolingSetup = setupPetActions({
      cooldowns: {
        feed: 4500,
        play: 0,
        sleep: 0,
        wash: 0,
      },
    })
    const lockedSetup = setupPetActions({
      actionLimitInfo: {
        used: 5,
        limit: 5,
        remaining: 0,
        resetAt: 31 * 60 * 1000,
        windowMs: 30 * 60 * 1000,
      },
    })

    expect(coolingSetup.getActionButtonStateLabel('feed')).toBe('대기')
    expect(coolingSetup.getActionButtonDetail('feed')).toBe('4s 후 가능')
    expect(coolingSetup.getActionButtonStateClass('feed')).toBe('action-button__badge--cooldown')
    expect(lockedSetup.getActionButtonStateLabel('feed')).toBe('횟수 없음')
    expect(lockedSetup.getActionButtonDetail('feed')).toBe('돌봄 횟수 없음')
    expect(lockedSetup.getActionButtonStateClass('feed')).toBe('action-button__badge--locked')
  })

  it('labels the active action and includes state plus detail in aria labels', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    const setup = setupPetActions({
      activeReaction: 'feed',
    })

    expect(setup.getActionButtonStateLabel('feed')).toBe('진행 중')
    expect(setup.getActionButtonDetail('feed')).toBe('돌봄 진행 중')
    expect(setup.getActionButtonStateClass('feed')).toBe('action-button__badge--active')
    expect(setup.getActionAriaLabel('feed')).toBe('밥 주기: 진행 중 · 돌봄 진행 중')
  })

  it('renders a status badge for every action button', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const source = readSource('components/PetActions.vue')

    expect(template).toContain('getActionButtonStateLabel(action.id)')
    expect(template).toContain(':class="getActionButtonStateClass(action.id)"')
    expect(template).toContain("'action-button--recommended': getActionButtonState(action.id) === 'recommended'")
    expect(template).toContain('getActionButtonDetail(action.id)')
    expect(template).not.toContain('v-if="isRecommendedAction(action.id)" class="action-button__badge"')
    expect(source).toContain("type ActionButtonState = 'ready' | 'recommended' | 'cooldown' | 'active' | 'locked'")
    expect(source).toContain('messages.value.actionButtonState[getActionButtonState(action)]')
  })

  it('keeps action button state copy localized for every supported language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const actionButtonState = I18N_MESSAGES[locale].actionButtonState as ActionButtonStateMessages

      expect(actionButtonState.ready.length).toBeGreaterThan(0)
      expect(actionButtonState.recommended.length).toBeGreaterThan(0)
      expect(actionButtonState.cooldown.length).toBeGreaterThan(0)
      expect(actionButtonState.active.length).toBeGreaterThan(0)
      expect(actionButtonState.locked.length).toBeGreaterThan(0)
    }
  })

  it('defines overflow-safe button status styles', () => {
    const css = readSource('assets/css/main.css')

    expect(css).toContain('.action-button__badge--ready')
    expect(css).toContain('.action-button__badge--recommended')
    expect(css).toContain('.action-button__badge--cooldown')
    expect(css).toContain('.action-button__badge--active')
    expect(css).toContain('.action-button__badge--locked')
    expect(css).toMatch(/\.action-button__badge\s*\{[^}]*max-width: 100%;/)
    expect(css).toMatch(/\.action-button__badge\s*\{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.action-button small\s*\{[^}]*line-height: 1\.3;/)
    expect(css).toMatch(/\.action-button small\s*\{[^}]*overflow-wrap: anywhere;/)
  })
})
