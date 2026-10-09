import { restorePurchase } from '../../utils/purchases'
import { getPurchaseConfig, sendPurchaseResult } from '../../utils/purchaseHandler'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)

  return sendPurchaseResult(await restorePurchase({
    orderId: typeof body?.orderId === 'string' ? body.orderId.trim() : body?.orderId,
    ...getPurchaseConfig(event),
  }))
})
