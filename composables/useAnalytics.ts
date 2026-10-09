import { isAnalyticsOptedOut } from '~/composables/useAnalyticsConsent'
import type { ShopProductId } from '~/constants/shop'
import type { PetAction, PetOutfitId, PetReturnReportBucket, PetSpecies, PetStatus, TitleMode } from '~/types/pet'

// Every product event in one typed map, so dashboards and code agree on names.
// See docs/06-analytics-events.md for what each one is for.
export type AnalyticsEvents = {
  pet_created: { species: PetSpecies, title_mode: TitleMode, custom_name: boolean }
  care_performed: { action: PetAction, recommended: boolean, level: number }
  care_limit_reached: { level: number }
  care_recharge_used: Record<string, never>
  daily_goal_claimed: { streak: number }
  streak_extended: { days: number }
  return_visit: { bucket: PetReturnReportBucket, status: PetStatus }
  title_mode_changed: { mode: TitleMode }
  notifications_toggled: { enabled: boolean }
  notification_shown: { status: PetStatus }
  share_card_created: { result: 'shared' | 'downloaded' }
  backup_exported: Record<string, never>
  backup_imported: { ok: boolean }
  pin_tip_dismissed: Record<string, never>
  pet_patted: Record<string, never>
  shop_viewed: { source: 'growth' | 'settings' }
  checkout_started: { product: ShopProductId }
  purchase_completed: { product: ShopProductId, amount: number }
  purchase_failed: { code: string }
  purchase_restored: { ok: boolean }
  outfit_changed: { outfit: PetOutfitId | 'none' }
}

export type AnalyticsEventName = keyof AnalyticsEvents

type AnalyticsWindow = Window & { dataLayer?: unknown[] }

// No vendor is wired in: events go to a GTM-style dataLayer when one exists and are
// always re-emitted as a DOM event, so any analytics SDK can subscribe later.
export function trackEvent<Name extends AnalyticsEventName>(name: Name, properties: AnalyticsEvents[Name]): void {
  if (!import.meta.client || typeof window === 'undefined') return
  if (isAnalyticsOptedOut()) return

  const payload = { event: `tab_pet_${name}`, ...properties }
  const analyticsWindow = window as AnalyticsWindow

  analyticsWindow.dataLayer?.push(payload)
  window.dispatchEvent(new CustomEvent('tabpet:analytics', { detail: payload }))

  if (import.meta.dev) {
    console.debug('[analytics]', payload)
  }
}
