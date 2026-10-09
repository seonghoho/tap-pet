import { describe, expect, it, vi } from 'vitest'
import { createOrderId, getProductFromOrderId, SHOP_PRODUCTS } from '~/constants/shop'
import { DISGUISE_TITLES } from '~/constants/titles'
import { confirmPurchase, restorePurchase, signEntitlement, type TossFetch } from '~/server/utils/purchases'
import { decodePetBackupWithPurchases, encodePetBackup } from '~/utils/petBackup'
import { mergeEntitlements, normalizeEntitlements, ownsProduct } from '~/utils/entitlements'
import { createInitialPetState } from '~/utils/petFactory'
import { renderPetArtSvg } from '~/utils/petArt'

const SECRETS = { secretKey: 'test_sk_dummy', signingSecret: 'signing-secret' }

function tossReturning(status: number, body: Record<string, unknown>) {
  return vi.fn<TossFetch>(async () => ({ ok: status < 400, status, json: async () => body }))
}

describe('shop catalog', () => {
  it('carries the product in a Toss-safe order id', () => {
    const orderId = createOrderId('outfit-pack', 'a1b2c3d4-e5f6/../??')

    expect(orderId).toMatch(/^[A-Za-z0-9_-]{6,64}$/)
    expect(getProductFromOrderId(orderId)).toEqual(SHOP_PRODUCTS['outfit-pack'])
    expect(getProductFromOrderId('free-stuff_123456')).toBeNull()
    expect(getProductFromOrderId('outfit-pack_<script>')).toBeNull()
  })

  it('marks exactly the work-title pack titles as premium', () => {
    expect(DISGUISE_TITLES.filter((title) => title.premium).map((title) => title.id)).toEqual([
      'roadmap',
      'kpi-review',
      'sprint-board',
      'client-notes',
    ])
  })

  it('draws every outfit on the pet', () => {
    for (const outfit of ['party-hat', 'ribbon', 'scarf', 'glasses'] as const) {
      expect(renderPetArtSvg({ species: 'cat', status: 'happy', outfit })).not.toBe(
        renderPetArtSvg({ species: 'cat', status: 'happy' }),
      )
    }
  })
})

describe('purchase confirmation (server)', () => {
  const orderId = createOrderId('outfit-pack', 'order123')
  const paid = { status: 'DONE', orderId, totalAmount: SHOP_PRODUCTS['outfit-pack'].price }

  it('confirms with Toss using the catalog price and issues a signed receipt', async () => {
    const fetcher = tossReturning(200, paid)
    const result = await confirmPurchase({ paymentKey: 'pk_1', orderId, amount: 2900, ...SECRETS, fetcher, now: 1000 })

    expect(result).toEqual({
      ok: true,
      entitlement: {
        productId: 'outfit-pack',
        orderId,
        issuedAt: 1000,
        signature: signEntitlement('outfit-pack', orderId, 1000, SECRETS.signingSecret),
      },
    })
    const [url, init] = fetcher.mock.calls[0]
    expect(url).toBe('https://api.tosspayments.com/v1/payments/confirm')
    expect(JSON.parse(init.body!)).toEqual({ paymentKey: 'pk_1', orderId, amount: 2900 })
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from('test_sk_dummy:').toString('base64')}`)
  })

  it('rejects a tampered amount before calling Toss', async () => {
    const fetcher = tossReturning(200, paid)
    const result = await confirmPurchase({ paymentKey: 'pk_1', orderId, amount: 100, ...SECRETS, fetcher })

    expect(result).toMatchObject({ ok: false, code: 'AMOUNT_MISMATCH' })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('does not issue a receipt when Toss reports a different total', async () => {
    const fetcher = tossReturning(200, { ...paid, totalAmount: 100 })

    expect(await confirmPurchase({ paymentKey: 'pk_1', orderId, amount: 2900, ...SECRETS, fetcher })).toMatchObject({ ok: false })
  })

  it('recovers when the success page is reloaded and Toss says it was already confirmed', async () => {
    const fetcher = vi.fn<TossFetch>()
      .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ code: 'ALREADY_PROCESSED_PAYMENT', message: 'done' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => paid })

    const result = await confirmPurchase({ paymentKey: 'pk_1', orderId, amount: 2900, ...SECRETS, fetcher })

    expect(result.ok).toBe(true)
    expect(fetcher.mock.calls[1][0]).toBe(`https://api.tosspayments.com/v1/payments/orders/${orderId}`)
  })

  it('passes Toss failures through without a receipt', async () => {
    const fetcher = tossReturning(400, { code: 'REJECT_CARD_COMPANY', message: 'declined' })

    expect(await confirmPurchase({ paymentKey: 'pk_1', orderId, amount: 2900, ...SECRETS, fetcher })).toEqual({
      ok: false,
      status: 400,
      code: 'REJECT_CARD_COMPANY',
      message: 'declined',
    })
  })

  it('restores only paid orders', async () => {
    expect((await restorePurchase({ orderId, ...SECRETS, fetcher: tossReturning(200, paid) })).ok).toBe(true)
    expect((await restorePurchase({ orderId, ...SECRETS, fetcher: tossReturning(200, { ...paid, status: 'CANCELED' }) })).ok).toBe(false)
    expect((await restorePurchase({ orderId: 'nope', ...SECRETS, fetcher: tossReturning(200, paid) })).ok).toBe(false)
  })
})

describe('entitlements', () => {
  const receipt = { productId: 'outfit-pack', orderId: 'outfit-pack_x1y2z3', issuedAt: 1, signature: 'sig' }

  it('keeps one valid receipt per product and drops junk', () => {
    const list = normalizeEntitlements([receipt, { ...receipt, orderId: 'dup' }, { productId: 'nope' }, 'x'])

    expect(list).toHaveLength(1)
    expect(ownsProduct(list, 'outfit-pack')).toBe(true)
    expect(ownsProduct(list, 'work-title-pack')).toBe(false)
    expect(mergeEntitlements(list, [{ ...receipt, productId: 'work-title-pack' as const }])).toHaveLength(2)
  })

  it('travels inside the backup code', () => {
    const state = createInitialPetState('dog', 1000)
    const backup = decodePetBackupWithPurchases(encodePetBackup(state, normalizeEntitlements([receipt])), 1000)

    expect(backup?.entitlements).toEqual(normalizeEntitlements([receipt]))
  })
})
