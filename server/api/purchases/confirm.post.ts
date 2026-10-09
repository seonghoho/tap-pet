import { confirmPurchase } from '../../utils/purchases'
import { getPurchaseConfig, sendPurchaseResult } from '../../utils/purchaseHandler'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)

  return sendPurchaseResult(await confirmPurchase({
    paymentKey: body?.paymentKey,
    orderId: body?.orderId,
    amount: body?.amount,
    ...getPurchaseConfig(event),
  }))
})
