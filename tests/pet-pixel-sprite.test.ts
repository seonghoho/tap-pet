import { describe, expect, it } from 'vitest'
import type { PetSpecies, PetStatus } from '~/types/pet'
import { getFaviconSvg } from '~/utils/tabPresentation'
import { getPetPixelSpriteCells, renderPetPixelSpriteSvg } from '~/utils/petPixelSprite'

const SPECIES: PetSpecies[] = ['cat', 'dog']
const STATUSES: PetStatus[] = ['fine', 'hungry', 'sleepy', 'dirty', 'bored', 'happy', 'excited']

describe('pet pixel sprite', () => {
  it('keeps every sprite inside a readable 24px full-body silhouette', () => {
    for (const species of SPECIES) {
      for (const status of STATUSES) {
        const cells = getPetPixelSpriteCells({ species, status })

        expect(cells.some((cell) => cell.role === 'body')).toBe(true)
        expect(cells.some((cell) => cell.role === 'foot')).toBe(true)
        expect(cells.some((cell) => cell.role === 'tail')).toBe(true)
        expect(cells.every((cell) => cell.x >= 0 && cell.y >= 0)).toBe(true)
        expect(
          cells.every(
            (cell) => cell.x + cell.width <= 24 && cell.y + cell.height <= 24,
          ),
        ).toBe(true)
      }
    }
  })

  it('renders crisp pixel art with the provided palette', () => {
    const svg = renderPetPixelSpriteSvg({
      species: 'cat',
      status: 'excited',
      palette: {
        body: '#f59e0b',
        shade: '#d97706',
        outline: '#111827',
        contrast: '#111827',
        cheek: '#fda4af',
        accent: '#fde68a',
        dirt: '#92400e',
        bubble: '#bae6fd',
      },
    })

    expect(svg).toContain('viewBox="0 0 24 24"')
    expect(svg).toContain('shape-rendering="crispEdges"')
    expect(svg).toContain('fill="#f59e0b"')
    expect(svg).toContain('fill="#111827"')
  })

  it('uses the shared 24px pixel sprite for favicons', () => {
    const svg = getFaviconSvg('cat', 'happy', 'light')

    expect(svg).toContain('viewBox="0 0 24 24"')
    expect(svg).toContain('shape-rendering="crispEdges"')
  })
})
