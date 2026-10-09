import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ACTION_LIMIT_AD_REWARD_USES } from '~/constants/pet'
import { I18N_MESSAGES } from '~/constants/i18n'

const requireModule = createRequire(import.meta.url)

type SetupComponent<T> = {
  setup: (props: unknown, context: { emit: (...args: unknown[]) => void; expose: () => void }) => T
}

type PetActionsSetup = {
  shouldShowFeedbackCheckback: { value: boolean }
  shouldShowFeedbackFollowup: { value: boolean }
  shouldShowFeedbackNextAction: { value: boolean }
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

function extractElementBlock(template: string, className: string): string {
  const openPattern = new RegExp(`<([A-Za-z][\\w-]*)(?=[^>]*class="${className}")[^>]*>`)
  const openMatch = openPattern.exec(template)

  expect(openMatch).not.toBeNull()

  const start = openMatch?.index ?? 0
  const tagName = openMatch?.[1] ?? ''
  const tagPattern = /<\/?([A-Za-z][\w-]*)(?:\s[^>]*)?>/g
  let depth = 0

  for (const match of template.slice(start).matchAll(tagPattern)) {
    const tag = match[1]
    if (tag !== tagName) continue

    const tagText = match[0]
    if (tagText.endsWith('/>')) continue

    if (tagText.startsWith('</')) {
      depth -= 1
    } else {
      depth += 1
    }

    if (depth === 0) {
      const end = start + match.index + tagText.length

      return template.slice(start, end)
    }
  }

  throw new Error(`Unable to find closing tag for ${className}.`)
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
      used: 4,
      limit: 5,
      remaining: 1,
      resetAt: 31 * 60 * 1000,
      windowMs: 30 * 60 * 1000,
    },
    careFeedback: {
      action: 'feed',
      statChanges: {
        fullness: 28,
        energy: -3,
        cleanliness: -2,
      },
      gainedExp: 12,
      gainedAffinityExp: 2,
      didLevelUp: false,
      didAffinityLevelUp: false,
      wasReduced: false,
      createdAt: 1000,
    },
    actionLimitRewardFeedback: null,
    recommendedCareAction: {
      action: 'sleep',
      reason: 'lowest-stat',
      status: 'happy',
      statKey: 'energy',
    },
    recommendedCareRewardPreview: null,
    levelProgress: {
      current: 42,
      required: 100,
      percent: 42,
    },
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

describe('care feedback priority layout', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('orders primary result, chips, growth, and follow-up lines', () => {
    const template = readComponentTemplate('components/PetActions.vue')
    const feedbackIndex = template.indexOf('class="care-feedback"')
    const headerIndex = template.indexOf('class="care-feedback__header"')
    const chipsIndex = template.indexOf('class="care-feedback__chips"')
    const growthIndex = template.indexOf('class="care-feedback__growth"')
    const noteIndex = template.indexOf('class="care-feedback__note"')
    const nextIndex = template.indexOf('class="care-feedback__next"')
    const checkbackIndex = template.indexOf('class="care-feedback__checkback"')

    expect(feedbackIndex).toBeGreaterThan(-1)
    expect(headerIndex).toBeGreaterThan(feedbackIndex)
    expect(chipsIndex).toBeGreaterThan(headerIndex)
    expect(growthIndex).toBeGreaterThan(chipsIndex)
    expect(noteIndex).toBeGreaterThan(growthIndex)
    expect(nextIndex).toBeGreaterThan(noteIndex)
    expect(checkbackIndex).toBeGreaterThan(nextIndex)

    const feedbackBlock = extractElementBlock(template, 'care-feedback')

    expect(feedbackBlock).toContain('class="care-feedback__next"')
    expect(feedbackBlock).toContain('class="care-feedback__checkback"')
    expect(feedbackBlock).toContain('class="care-feedback__note"')
  })

  it('shows follow-up when next action, reduced reward note, or checkback hint is available', () => {
    const setup = setupPetActions()
    const reducedSetup = setupPetActions({
      actionLimitInfo: {
        used: 5,
        limit: 5,
        remaining: 0,
        resetAt: 31 * 60 * 1000,
        windowMs: 30 * 60 * 1000,
      },
      careFeedback: {
        action: 'feed',
        statChanges: {
          fullness: 5,
          energy: -3,
          cleanliness: -2,
        },
        gainedExp: 5,
        gainedAffinityExp: 1,
        didLevelUp: false,
        didAffinityLevelUp: false,
        wasReduced: true,
        createdAt: 1000,
      },
    })
    const quietSetup = setupPetActions({
      actionLimitInfo: {
        used: 5,
        limit: 5,
        remaining: 0,
        resetAt: 31 * 60 * 1000,
        windowMs: 30 * 60 * 1000,
      },
      recommendedCareAction: null,
      careFeedback: {
        action: 'feed',
        statChanges: {
          fullness: 28,
          energy: -3,
          cleanliness: -2,
        },
        gainedExp: 12,
        gainedAffinityExp: 2,
        didLevelUp: false,
        didAffinityLevelUp: false,
        wasReduced: false,
        createdAt: 1000,
      },
    })

    expect(setup.shouldShowFeedbackNextAction.value).toBe(true)
    expect(setup.shouldShowFeedbackCheckback.value).toBe(true)
    expect(setup.shouldShowFeedbackFollowup.value).toBe(true)
    expect(reducedSetup.shouldShowFeedbackNextAction.value).toBe(false)
    expect(reducedSetup.shouldShowFeedbackCheckback.value).toBe(true)
    expect(reducedSetup.shouldShowFeedbackFollowup.value).toBe(true)
    expect(quietSetup.shouldShowFeedbackNextAction.value).toBe(false)
    expect(quietSetup.shouldShowFeedbackCheckback.value).toBe(true)
    expect(quietSetup.shouldShowFeedbackFollowup.value).toBe(true)
  })

})
