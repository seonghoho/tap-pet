import { computed, ref } from 'vue'
import { useState } from '#app'
import { createOrderId, getProductFromOrderId, SHOP_PRODUCTS, type ShopProductId } from '~/constants/shop'
import type { Entitlement } from '~/utils/entitlements'

export type PurchaseNotice = {
  kind: 'success' | 'error'
  productId?: ShopProductId
  message?: string
}

type EntitlementResponse = { entitlement: Entitlement }

// Toss Payments checkout (redirect flow) + our server confirming it.
// Without NUXT_PUBLIC_TOSS_CLIENT_KEY the shop renders as "coming soon".
export function usePurchases() {
  const config = useRuntimeConfig().public
  const { addEntitlements } = useEntitlements()
  const notice = useState<PurchaseNotice | null>('tab-pet:purchase-notice', () => null)
  const pendingProduct = ref<ShopProductId | null>(null)
  const isEnabled = computed(() => Boolean(config.tossClientKey))

  async function buy(productId: ShopProductId, orderName: string): Promise<void> {
    if (!isEnabled.value || pendingProduct.value) return

    pendingProduct.value = productId
    notice.value = null

    try {
      const { ANONYMOUS, loadTossPayments } = await import('@tosspayments/tosspayments-sdk')
      const toss = await loadTossPayments(String(config.tossClientKey))
      const payment = toss.payment({ customerKey: ANONYMOUS })
      const returnUrl = `${window.location.origin}${window.location.pathname}`

      trackEvent('checkout_started', { product: productId })
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: SHOP_PRODUCTS[productId].price },
        orderId: createOrderId(productId, crypto.randomUUID()),
        orderName,
        successUrl: `${returnUrl}?purchase=success`,
        failUrl: `${returnUrl}?purchase=fail`,
      })
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code !== 'USER_CANCEL') {
        notice.value = { kind: 'error', productId, message: (error as Error).message }
        trackEvent('purchase_failed', { code: code ?? 'SDK_ERROR' })
      }
    } finally {
      pendingProduct.value = null
    }
  }

  // Runs once on load: finishes a checkout that just redirected back to us.
  async function handleCheckoutReturn(): Promise<void> {
    if (!import.meta.client) return

    const params = new URLSearchParams(window.location.search)
    const result = params.get('purchase')
    if (!result) return

    const orderId = params.get('orderId') ?? ''
    const product = getProductFromOrderId(orderId)
    window.history.replaceState(null, '', window.location.pathname)

    if (result === 'fail') {
      notice.value = { kind: 'error', productId: product?.id, message: params.get('message') ?? undefined }
      trackEvent('purchase_failed', { code: params.get('code') ?? 'UNKNOWN' })
      return
    }

    try {
      const response = await $fetch<EntitlementResponse>('/api/purchases/confirm', {
        method: 'POST',
        body: {
          paymentKey: params.get('paymentKey'),
          orderId,
          amount: Number(params.get('amount')),
        },
      })
      addEntitlements([response.entitlement])
      notice.value = { kind: 'success', productId: response.entitlement.productId }
      trackEvent('purchase_completed', { product: response.entitlement.productId, amount: product?.price ?? 0 })
    } catch (error) {
      const data = (error as { data?: { statusMessage?: string, data?: { message?: string } } }).data
      notice.value = { kind: 'error', productId: product?.id, message: data?.data?.message }
      trackEvent('purchase_failed', { code: data?.statusMessage ?? 'CONFIRM_FAILED' })
    }
  }

  async function restore(orderId: string): Promise<boolean> {
    try {
      const response = await $fetch<EntitlementResponse>('/api/purchases/restore', {
        method: 'POST',
        body: { orderId: orderId.trim() },
      })
      addEntitlements([response.entitlement])
      trackEvent('purchase_restored', { ok: true })

      return true
    } catch {
      trackEvent('purchase_restored', { ok: false })

      return false
    }
  }

  return {
    isEnabled,
    pendingProduct,
    notice,
    buy,
    handleCheckoutReturn,
    restore,
    dismissNotice: () => {
      notice.value = null
    },
  }
}
