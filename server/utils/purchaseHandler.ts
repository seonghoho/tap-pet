import type { H3Event } from 'h3'
import type { PurchaseResult, TossFetch } from './purchases'

export function getPurchaseConfig(event: H3Event): { secretKey: string, signingSecret: string, fetcher: TossFetch } {
  const config = useRuntimeConfig(event)
  const secretKey = String(config.tossSecretKey || '')
  const signingSecret = String(config.purchaseSigningSecret || '')

  if (!secretKey || !signingSecret) {
    throw createError({ statusCode: 503, statusMessage: 'Payments are not configured.' })
  }

  return { secretKey, signingSecret, fetcher: fetch as unknown as TossFetch }
}

export function sendPurchaseResult(result: PurchaseResult) {
  if (result.ok) return { entitlement: result.entitlement }

  throw createError({ statusCode: result.status, statusMessage: result.code, data: { message: result.message } })
}
