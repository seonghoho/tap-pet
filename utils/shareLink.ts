import type { PetSpecies } from '~/types/pet'
import { isPetSpecies } from '~/utils/petValidation'

// Every shared friend card carries a link back here, so whoever sees the card can
// adopt the same kind of friend. The UTM tags let PostHog pageviews attribute visits.
export const SHARE_REF = 'share'

export function buildShareUrl(origin: string, species: PetSpecies): string {
  const url = new URL('/', origin)
  url.searchParams.set('ref', SHARE_REF)
  url.searchParams.set('pet', species)
  url.searchParams.set('utm_source', 'friend_card')
  url.searchParams.set('utm_medium', 'share')

  return url.toString()
}

// Host shown on the card image, e.g. "tap-pet.seonghoho.com".
export function shareHost(origin: string): string {
  try {
    return new URL(origin).host
  } catch {
    return ''
  }
}

// The species a friend invited us with, or null when this is not an invite visit.
export function readInviteSpecies(search: string): PetSpecies | null {
  const params = new URLSearchParams(search)
  if (params.get('ref') !== SHARE_REF) return null

  const species = params.get('pet')

  return isPetSpecies(species) ? species : null
}
