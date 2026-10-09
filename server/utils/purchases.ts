import { createHmac } from 'node:crypto'
import { getProductFromOrderId, type ShopProduct } from '~/constants/shop'
import type { Entitlement } from '~/utils/entitlements'

const TOSS_API = 'https://api.tosspayments.com/v1/payments'

export type TossFetch = (url: string, init: { method: string, headers: Record<string, string>, body?: string }) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
}>

export type PurchaseResult =
  | { ok: true, entitlement: Entitlement }
  | { ok: false, status: number, code: string, message: string }

type TossPayment = { status?: string, orderId?: string, totalAmount?: number, code?: string, message?: string }

export function signEntitlement(productId: string, orderId: string, issuedAt: number, secret: string): string {
  return createHmac('sha256', secret).update(`${productId}.${orderId}.${issuedAt}`).digest('base64url')
}

function issue(product: ShopProduct, orderId: string, secret: string, now: number): PurchaseResult {
  return {
    ok: true,
    entitlement: {
      productId: product.id,
      orderId,
      issuedAt: now,
      signature: signEntitlement(product.id, orderId, now, secret),
    },
  }
}

function fail(status: number, code: string, message: string): PurchaseResult {
  return { ok: false, status, code, message }
}

function authHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`
}

function isPaidInFull(payment: TossPayment, product: ShopProduct, orderId: string): boolean {
  return payment.status === 'DONE' && payment.orderId === orderId && payment.totalAmount === product.price
}

// Confirms a Toss payment after the redirect back from checkout. The price comes from our
// catalog (via the order id), never from the client, and must match the amount paid.
export async function confirmPurchase(input: {
  paymentKey: unknown
  orderId: unknown
  amount: unknown
  secretKey: string
  signingSecret: string
  fetcher: TossFetch
  now?: number
}): Promise<PurchaseResult> {
  const product = getProductFromOrderId(input.orderId)
  if (!product) return fail(400, 'UNKNOWN_PRODUCT', 'Unknown order.')
  if (typeof input.paymentKey !== 'string' || input.paymentKey.length === 0 || input.paymentKey.length > 200) {
    return fail(400, 'INVALID_PAYMENT_KEY', 'Missing payment key.')
  }
  if (Number(input.amount) !== product.price) return fail(400, 'AMOUNT_MISMATCH', 'Amount does not match the product price.')

  const orderId = input.orderId as string
  const response = await input.fetcher(`${TOSS_API}/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader(input.secretKey),
      'Content-Type': 'application/json',
      'Idempotency-Key': orderId,
    },
    body: JSON.stringify({ paymentKey: input.paymentKey, orderId, amount: product.price }),
  })
  const payment = (await response.json()) as TossPayment

  if (response.ok && isPaidInFull(payment, product, orderId)) {
    return issue(product, orderId, input.signingSecret, input.now ?? Date.now())
  }

  // A refresh on the success page confirms twice; the second call reports it was already done.
  if (payment.code === 'ALREADY_PROCESSED_PAYMENT') {
    return restorePurchase({ ...input, orderId })
  }

  return fail(response.ok ? 402 : response.status, payment.code ?? 'CONFIRM_FAILED', payment.message ?? 'Payment was not completed.')
}

// Re-issues a receipt for a paid order, e.g. after browser data was cleared.
export async function restorePurchase(input: {
  orderId: unknown
  secretKey: string
  signingSecret: string
  fetcher: TossFetch
  now?: number
}): Promise<PurchaseResult> {
  const product = getProductFromOrderId(input.orderId)
  if (!product) return fail(400, 'UNKNOWN_PRODUCT', 'Unknown order.')

  const orderId = input.orderId as string
  const response = await input.fetcher(`${TOSS_API}/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: { Authorization: authHeader(input.secretKey) },
  })
  const payment = (await response.json()) as TossPayment

  if (response.ok && isPaidInFull(payment, product, orderId)) {
    return issue(product, orderId, input.signingSecret, input.now ?? Date.now())
  }

  return fail(response.ok ? 402 : 404, payment.code ?? 'NOT_PAID', payment.message ?? 'No completed payment for this order.')
}
