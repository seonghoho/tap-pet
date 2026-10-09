import type { ComputedRef, Ref } from 'vue'
import { watch } from 'vue'
import { CARE_NOTIFICATION_COOLDOWN_MS } from '~/constants/pet'
import type { PetSettings, PetStatus } from '~/types/pet'
import { petNeedsCare } from '~/utils/petArt'

type Source<T> = Ref<T> | ComputedRef<T>

const LAST_NOTIFIED_KEY = 'tab-pet:last-notified-at'

export type CareNotificationContent = {
  title: string
  body: string
}

// Fires one browser notification when the pet starts needing care while the tab is hidden.
// No service worker: the tab has to stay open, which is how Tab Pet is meant to be used.
export function useCareNotifications(input: {
  status: Source<PetStatus | null>
  settings: Source<PetSettings>
  isDocumentVisible: Source<boolean>
  iconUrl: Source<string>
  getContent: (status: PetStatus) => CareNotificationContent
  onShown?: (status: PetStatus) => void
}): void {
  watch(input.status, (next, previous) => {
    if (!import.meta.client || !next || !previous) return
    if (!petNeedsCare(next) || petNeedsCare(previous)) return
    if (!input.settings.value.careNotifications || input.isDocumentVisible.value) return
    if (!canNotify() || isCoolingDown(Date.now())) return

    const content = input.getContent(next)
    const notification = new Notification(content.title, {
      body: content.body,
      icon: input.iconUrl.value,
      tag: 'tab-pet-care',
    })
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
    markNotified(Date.now())
    input.onShown?.(next)
  })
}

export function isNotificationSupported(): boolean {
  return Boolean(import.meta.client) && typeof window !== 'undefined' && 'Notification' in window
}

function canNotify(): boolean {
  return isNotificationSupported() && Notification.permission === 'granted'
}

function isCoolingDown(now: number): boolean {
  try {
    const last = Number(localStorage.getItem(LAST_NOTIFIED_KEY))

    return Number.isFinite(last) && now - last < CARE_NOTIFICATION_COOLDOWN_MS
  } catch {
    return false
  }
}

function markNotified(now: number): void {
  try {
    localStorage.setItem(LAST_NOTIFIED_KEY, String(now))
  } catch {
    // Without storage we may notify again sooner; acceptable.
  }
}
