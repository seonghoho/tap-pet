import { describe, expect, it } from 'vitest'
import { buildShareUrl, readInviteSpecies, shareHost } from '~/utils/shareLink'

describe('share link', () => {
  it('builds an invite url that round-trips the species', () => {
    const url = buildShareUrl('https://tap-pet.seonghoho.com', 'hamster')

    expect(url.startsWith('https://tap-pet.seonghoho.com/?')).toBe(true)
    expect(url).toContain('utm_source=friend_card')
    expect(readInviteSpecies(new URL(url).search)).toBe('hamster')
  })

  it('ignores visits that are not invites or name an unknown pet', () => {
    expect(readInviteSpecies('')).toBeNull()
    expect(readInviteSpecies('?pet=cat')).toBeNull()
    expect(readInviteSpecies('?ref=share&pet=dragon')).toBeNull()
  })

  it('shows only the host on the card', () => {
    expect(shareHost('https://tap-pet.seonghoho.com')).toBe('tap-pet.seonghoho.com')
    expect(shareHost('not a url')).toBe('')
  })
})
