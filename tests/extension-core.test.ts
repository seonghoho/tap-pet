import { describe, expect, it } from 'vitest'
import { ACTION_LIMIT_BASE_USES } from '~/constants/pet'
import { pickLocale } from '~/extension/src/messages'
import { adoptPet, careFor, loadPet, remainingCare, serializePet, statusOf, visibleOutfit, wearOutfit } from '~/extension/src/petCore'
import type { Entitlement } from '~/utils/entitlements'
import { decodePetBackup, decodePetBackupWithPurchases, encodePetBackup } from '~/utils/petBackup'

const HOUR = 1000 * 60 * 60
const NOW = new Date(2026, 9, 10, 14).getTime()

describe('extension pet core', () => {
  it('adopts a pet in work-tab mode and round-trips through storage', () => {
    const pet = adoptPet('penguin', '펭펭', NOW)

    expect(pet.settings.titleMode).toBe('disguise')
    expect(loadPet(serializePet(pet), NOW)).toMatchObject({ species: 'penguin', name: '펭펭' })
  })

  it('applies the time that passed while the browser was closed', () => {
    const pet = adoptPet('cat', '몽이', NOW)
    const later = loadPet(serializePet(pet), NOW + 6 * HOUR)!

    expect(later.stats.fullness).toBe(pet.stats.fullness - 30)
    expect(statusOf(later, NOW + 6 * HOUR)).toBe('bored')
  })

  it('cares with the same rules as the website, including the streak and the limit', () => {
    let pet = adoptPet('dog', '초코', NOW)

    const fed = careFor(pet, 'feed', NOW)
    expect(fed.ok).toBe(true)
    if (!fed.ok) return
    expect(fed.state.stats.fullness).toBeGreaterThan(pet.stats.fullness)
    expect(fed.state.streak.current).toBe(1)

    pet = fed.state
    for (let index = 1; index < ACTION_LIMIT_BASE_USES; index += 1) {
      const outcome = careFor(pet, 'play', NOW + index)
      if (outcome.ok) pet = outcome.state
    }
    expect(remainingCare(pet, NOW)).toBe(0)
    expect(careFor(pet, 'feed', NOW + 100)).toEqual({ ok: false, reason: 'limit' })
  })

  it('moves to and from the website with the same backup code', () => {
    const pet = adoptPet('hamster', '콩이', NOW)

    expect(decodePetBackup(encodePetBackup(pet), NOW)?.name).toBe('콩이')
  })

  it('shows the outfit only while the outfit pack is owned, like the website', () => {
    const outfitPack: Entitlement = { productId: 'outfit-pack', orderId: 'order-1', issuedAt: NOW, signature: 'sig' }
    const pet = wearOutfit(adoptPet('cat', '몽이', NOW), 'ribbon', NOW)

    expect(visibleOutfit(pet, [outfitPack])).toBe('ribbon')
    expect(visibleOutfit(pet, [])).toBeNull()
    expect(visibleOutfit(wearOutfit(pet, null, NOW), [outfitPack])).toBeNull()
    expect(loadPet(serializePet(pet), NOW)?.settings.outfit).toBe('ribbon')
  })

  it('carries purchases and the chosen outfit in the backup code', () => {
    const outfitPack: Entitlement = { productId: 'outfit-pack', orderId: 'order-1', issuedAt: NOW, signature: 'sig' }
    const pet = wearOutfit(adoptPet('dog', '초코', NOW), 'scarf', NOW)
    const backup = decodePetBackupWithPurchases(encodePetBackup(pet, [outfitPack]), NOW)!

    expect(backup.entitlements).toEqual([outfitPack])
    expect(visibleOutfit(backup.state, backup.entitlements)).toBe('scarf')
  })

  it('follows the browser language', () => {
    expect(pickLocale('ko-KR')).toBe('ko')
    expect(pickLocale('ja')).toBe('ja')
    expect(pickLocale('fr-FR')).toBe('en')
  })
})
