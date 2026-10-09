import { computed } from 'vue'
import { useState } from '#app'
import type { ShopProductId } from '~/constants/shop'
import { type Entitlement, mergeEntitlements, normalizeEntitlements, ownsProduct } from '~/utils/entitlements'

export const ENTITLEMENTS_STORAGE_KEY = 'tab-pet:entitlements'

// Purchases live apart from the pet so "start over" never takes away what was bought.
export function useEntitlements() {
  const entitlements = useState<Entitlement[]>('tab-pet:entitlements', () => [])
  const hasRestored = useState<boolean>('tab-pet:entitlements-restored', () => false)

  function restoreEntitlements(): void {
    if (!import.meta.client || hasRestored.value) return

    try {
      entitlements.value = normalizeEntitlements(JSON.parse(localStorage.getItem(ENTITLEMENTS_STORAGE_KEY) ?? '[]'))
    } catch {
      entitlements.value = []
    }
    hasRestored.value = true
  }

  function addEntitlements(incoming: Entitlement[]): void {
    entitlements.value = mergeEntitlements(entitlements.value, incoming)

    try {
      localStorage.setItem(ENTITLEMENTS_STORAGE_KEY, JSON.stringify(entitlements.value))
    } catch {
      // Storage blocked: purchases still apply this session and can be restored by order number.
    }
  }

  const owns = (productId: ShopProductId) => ownsProduct(entitlements.value, productId)

  return {
    entitlements: computed(() => entitlements.value),
    owns,
    restoreEntitlements,
    addEntitlements,
  }
}
