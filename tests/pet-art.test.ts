import { describe, expect, it } from 'vitest'
import type { PetSpecies, PetStatus } from '~/types/pet'
import { PET_ART_PALETTES, petNeedsCare, renderPetArtSvg } from '~/utils/petArt'
import { getFaviconSvg } from '~/utils/tabPresentation'

const SPECIES: PetSpecies[] = ['cat', 'dog', 'hedgehog', 'rabbit', 'penguin', 'hamster']
const STATUSES: PetStatus[] = ['fine', 'hungry', 'sleepy', 'dirty', 'bored', 'happy', 'excited']

describe('pet art', () => {
  it('renders a self-contained svg for every species and status', () => {
    for (const species of SPECIES) {
      for (const status of STATUSES) {
        const svg = renderPetArtSvg({ species, status })

        expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"[\s\S]*<\/svg>$/)
        expect(svg).toContain(`data-species="${species}"`)
        expect(svg).toContain(`data-status="${status}"`)
        expect(svg).toContain(PET_ART_PALETTES[species].body)
      }
    }
  })

  it('shows status through expression instead of recoloring the body', () => {
    const happy = renderPetArtSvg({ species: 'cat', status: 'happy' })
    const hungry = renderPetArtSvg({ species: 'cat', status: 'hungry' })

    expect(happy).not.toBe(hungry)
    expect(happy).toContain(PET_ART_PALETTES.cat.body)
    expect(hungry).toContain(PET_ART_PALETTES.cat.body)
  })

  it('scopes clip path ids so several pets can share one page', () => {
    const first = renderPetArtSvg({ species: 'hamster', status: 'happy', idPrefix: 'a:1' })
    const second = renderPetArtSvg({ species: 'hamster', status: 'happy', idPrefix: 'b:2' })

    expect(first).toContain('id="a1-clip"')
    expect(second).toContain('id="b2-clip"')
    expect(first).not.toContain('b2-clip')
  })

  it('badges the favicon only when the pet needs care', () => {
    for (const status of STATUSES) {
      const icon = renderPetArtSvg({ species: 'dog', status, variant: 'icon' })

      expect(icon.includes('fill="#ff6b4a"')).toBe(petNeedsCare(status))
      expect(icon).toContain(PET_ART_PALETTES.dog.tile)
    }
  })

  it('keeps room-only props out of the favicon', () => {
    const room = renderPetArtSvg({ species: 'penguin', status: 'sleepy' })
    const icon = renderPetArtSvg({ species: 'penguin', status: 'sleepy', variant: 'icon' })

    expect(room).toContain('#7d93bd')
    expect(icon).not.toContain('#7d93bd')
  })

  it('escapes accessible labels', () => {
    const svg = renderPetArtSvg({ species: 'cat', status: 'happy', label: 'Mong "<3"' })

    expect(svg).toContain('aria-label="Mong &quot;&lt;3&quot;"')
  })

  it('uses the shared art for favicons', () => {
    expect(getFaviconSvg('rabbit', 'hungry', 'light')).toBe(
      renderPetArtSvg({ species: 'rabbit', status: 'hungry', variant: 'icon', idPrefix: 'tab-pet-favicon', accentBoost: false }),
    )
  })
})
