import type { DisguiseTitleId, PetOutfitId } from '~/types/pet'

// One-time cosmetic packs. Prices are in KRW and checked again on the server
// before a payment is confirmed, so the client cannot change what it pays.
export type ShopProductId = 'outfit-pack' | 'work-title-pack'

export type ShopProduct = {
  id: ShopProductId
  price: number
}

export const SHOP_PRODUCTS: Record<ShopProductId, ShopProduct> = {
  'outfit-pack': { id: 'outfit-pack', price: 2900 },
  'work-title-pack': { id: 'work-title-pack', price: 1900 },
}

export const SHOP_PRODUCT_IDS = Object.keys(SHOP_PRODUCTS) as ShopProductId[]

export const PET_OUTFITS: PetOutfitId[] = ['party-hat', 'ribbon', 'scarf', 'glasses']

export const PREMIUM_TITLE_IDS: DisguiseTitleId[] = ['roadmap', 'kpi-review', 'sprint-board', 'client-notes']

const ORDER_SEPARATOR = '_'

export function isShopProductId(value: unknown): value is ShopProductId {
  return typeof value === 'string' && value in SHOP_PRODUCTS
}

// Toss order ids allow [A-Za-z0-9_-], 6–64 chars. The product rides in the id so the
// server can recover it (and its price) without trusting anything else from the client.
export function createOrderId(productId: ShopProductId, nonce: string): string {
  return `${productId}${ORDER_SEPARATOR}${nonce.replace(/[^A-Za-z0-9-]/g, '').slice(0, 40)}`
}

export function getProductFromOrderId(orderId: unknown): ShopProduct | null {
  if (typeof orderId !== 'string' || !/^[A-Za-z0-9_-]{6,64}$/.test(orderId)) return null

  const productId = orderId.split(ORDER_SEPARATOR)[0]

  return isShopProductId(productId) ? SHOP_PRODUCTS[productId] : null
}
