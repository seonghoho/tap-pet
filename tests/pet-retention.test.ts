import { nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CARE_NOTIFICATION_COOLDOWN_MS, DEFAULT_SETTINGS } from '~/constants/pet'
import { trackEvent } from '~/composables/useAnalytics'
import { useCareNotifications } from '~/composables/useCareNotifications'
import type { PetSettings, PetStatus } from '~/types/pet'
import { decodePetBackup, encodePetBackup } from '~/utils/petBackup'
import { createInitialPetState } from '~/utils/petFactory'
import { getActiveStreak, hasCaredToday, normalizePetStreak, recordStreakCare } from '~/utils/petStreak'
import { createPetStreak } from '~/utils/petStreak'

const DAY = 1000 * 60 * 60 * 24
const MON = new Date(2026, 9, 5, 10).getTime()

describe('care streak', () => {
  it('starts at one on the first care and ignores repeat care the same day', () => {
    const first = recordStreakCare(createPetStreak(), MON)

    expect(first.current).toBe(1)
    expect(recordStreakCare(first, MON + 1000 * 60 * 60)).toBe(first)
    expect(hasCaredToday(first, MON)).toBe(true)
  })

  it('grows on consecutive days and keeps the best run', () => {
    let streak = createPetStreak()
    for (let day = 0; day < 4; day += 1) streak = recordStreakCare(streak, MON + day * DAY)

    expect(streak.current).toBe(4)
    expect(streak.best).toBe(4)

    const restarted = recordStreakCare(streak, MON + 6 * DAY)
    expect(restarted.current).toBe(1)
    expect(restarted.best).toBe(4)
  })

  it('stays visible through the next day, then drops to zero', () => {
    const streak = recordStreakCare(recordStreakCare(createPetStreak(), MON), MON + DAY)

    expect(getActiveStreak(streak, MON + DAY)).toBe(2)
    expect(getActiveStreak(streak, MON + 2 * DAY)).toBe(2)
    expect(hasCaredToday(streak, MON + 2 * DAY)).toBe(false)
    expect(getActiveStreak(streak, MON + 3 * DAY)).toBe(0)
  })

  it('normalizes missing or broken stored streaks', () => {
    expect(normalizePetStreak(undefined)).toEqual(createPetStreak())
    expect(normalizePetStreak({ current: '3', best: 1, lastCareDateKey: 7 })).toEqual({
      current: 3,
      best: 3,
      lastCareDateKey: null,
    })
  })
})

describe('pet backup code', () => {
  it('round-trips a pet, including non-ASCII names', () => {
    const state = { ...createInitialPetState('hamster', MON), name: '솜뭉치 🍡' }
    const restored = decodePetBackup(encodePetBackup(state), MON)

    expect(restored?.name).toBe('솜뭉치 🍡')
    expect(restored?.species).toBe('hamster')
    expect(restored?.streak).toEqual(state.streak)
  })

  it('rejects codes that are not Tab Pet backups', () => {
    expect(decodePetBackup('hello', MON)).toBeNull()
    expect(decodePetBackup('TABPET1.not-base64!!', MON)).toBeNull()
    expect(decodePetBackup(`TABPET1.${btoa('{"species":"bird"}')}`, MON)).toBeNull()
  })
})

describe('care notifications', () => {
  const shown: Array<{ title: string, body?: string }> = []
  const storage = new Map<string, string>()

  beforeEach(() => {
    shown.length = 0
    storage.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    })
    vi.stubGlobal('Notification', class {
      static permission = 'granted'
      onclick: (() => void) | null = null
      constructor(title: string, options?: { body?: string }) {
        shown.push({ title, body: options?.body })
      }

      close(): void {}
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function setup(overrides: Partial<PetSettings> = {}, visible = false) {
    const status = ref<PetStatus | null>('happy')
    useCareNotifications({
      status,
      settings: ref({ ...DEFAULT_SETTINGS, careNotifications: true, ...overrides }),
      isDocumentVisible: ref(visible),
      iconUrl: ref('data:image/svg+xml,'),
      getContent: (next) => ({ title: 'Inbox', body: next }),
    })

    return status
  }

  it('notifies once when the pet starts needing care in a background tab', async () => {
    const status = setup()

    status.value = 'hungry'
    await nextTick()
    status.value = 'sleepy'
    await nextTick()

    expect(shown).toEqual([{ title: 'Inbox', body: 'hungry' }])
  })

  it('stays quiet when turned off or while the tab is in view', async () => {
    const off = setup({ careNotifications: false })
    off.value = 'hungry'
    const visible = setup({}, true)
    visible.value = 'dirty'
    await nextTick()

    expect(shown).toHaveLength(0)
  })

  it('waits out the cooldown between notifications', async () => {
    storage.set('tab-pet:last-notified-at', String(Date.now() - CARE_NOTIFICATION_COOLDOWN_MS + 60_000))
    const status = setup()

    status.value = 'bored'
    await nextTick()

    expect(shown).toHaveLength(0)
  })
})

describe('analytics events', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('pushes to dataLayer and re-emits a DOM event without extra fields', () => {
    const dataLayer: unknown[] = []
    const dispatched: unknown[] = []
    vi.stubGlobal('dataLayer', dataLayer)
    vi.stubGlobal('dispatchEvent', (event: CustomEvent) => dispatched.push(event.detail))
    vi.stubGlobal('CustomEvent', class {
      constructor(public type: string, public init: { detail: unknown }) {}
      get detail() {
        return this.init.detail
      }
    })

    trackEvent('care_performed', { action: 'feed', recommended: true, level: 2 })

    const payload = { event: 'tab_pet_care_performed', action: 'feed', recommended: true, level: 2 }
    expect(dataLayer).toEqual([payload])
    expect(dispatched).toEqual([payload])
  })
})
