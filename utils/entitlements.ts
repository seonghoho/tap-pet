import { isShopProductId, type ShopProductId } from '~/constants/shop'

// A signed receipt issued by our server after Toss confirms a payment.
export type Entitlement = {
  productId: ShopProductId
  orderId: string
  issuedAt: number
  signature: string
}

export function normalizeEntitlements(value: unknown): Entitlement[] {
  if (!Array.isArray(value)) return []

  const byProduct = new Map<ShopProductId, Entitlement>()
  for (const item of value) {
    const entitlement = normalizeEntitlement(item)
    if (entitlement && !byProduct.has(entitlement.productId)) byProduct.set(entitlement.productId, entitlement)
  }

  return [...byProduct.values()]
}

export function normalizeEntitlement(value: unknown): Entitlement | null {
  if (typeof value !== 'object' || value === null) return null

  const record = value as Record<string, unknown>
  if (!isShopProductId(record.productId)) return null
  if (typeof record.orderId !== 'string' || typeof record.signature !== 'string') return null

  const issuedAt = Number(record.issuedAt)

  return {
    productId: record.productId,
    orderId: record.orderId,
    issuedAt: Number.isFinite(issuedAt) ? issuedAt : 0,
    signature: record.signature,
  }
}

export function mergeEntitlements(current: Entitlement[], incoming: Entitlement[]): Entitlement[] {
  return normalizeEntitlements([...current, ...incoming])
}

export function ownsProduct(entitlements: readonly Entitlement[], productId: ShopProductId): boolean {
  return entitlements.some((entitlement) => entitlement.productId === productId)
}
