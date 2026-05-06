import { describe, expect, it } from 'vitest'
import { PET_THEMES } from '~/constants/themes'
import type { PetSpecies, PetStatus } from '~/types/pet'
import { getFaviconSvg } from '~/utils/tabPresentation'
import { getPetPixelSpriteCells, renderPetPixelSpriteSvg } from '~/utils/petPixelSprite'

const SPECIES: PetSpecies[] = ['cat', 'dog', 'hedgehog']
const STATUSES: PetStatus[] = ['fine', 'hungry', 'sleepy', 'dirty', 'bored', 'happy', 'excited']

describe('pet pixel sprite', () => {
  it('uses a warm brown-yellow pet palette across themes', () => {
    for (const theme of PET_THEMES) {
      expect(theme.colors.petBase).toBe('#f3b15f')
      expect(theme.statusColors.fine).toBe('#f3b15f')
      expect(theme.statusColors.happy).toBe('#f3b15f')
      expect(getRelativeLuminance(theme.statusColors.hungry)).toBeLessThan(
        getRelativeLuminance(theme.statusColors.happy),
      )
      expect(getRelativeLuminance(theme.statusColors.sleepy)).toBeGreaterThan(
        getRelativeLuminance(theme.statusColors.happy),
      )
      expect(theme.statusColors.bored).not.toMatch(/^#(60a5fa|94a3b8|64748b|c084fc|22c55e|2dd4bf|38bdf8)$/i)
    }
  })

  it('uses face-first chibi anatomy while keeping a small full body', () => {
    for (const species of SPECIES) {
      const cells = getPetPixelSpriteCells({ species, status: 'happy' })
      const headCells = cells.filter((cell) => cell.role === 'head')
      const bodyCells = cells.filter((cell) => cell.role === 'body')
      const footCells = cells.filter((cell) => cell.role === 'foot')
      const tailCells = cells.filter((cell) => cell.role === 'tail')
      const headTop = Math.min(...headCells.map((cell) => cell.y))
      const headBottom = Math.max(...headCells.map((cell) => cell.y + cell.height))
      const bodyTop = Math.min(...bodyCells.map((cell) => cell.y))
      const bodyBottom = Math.max(...bodyCells.map((cell) => cell.y + cell.height))

      expect(headCells.length).toBeGreaterThan(0)
      expect(headTop).toBeLessThanOrEqual(8)
      expect(headBottom - headTop).toBeGreaterThanOrEqual(9)
      expect(bodyTop).toBeGreaterThanOrEqual(15)
      expect(bodyBottom - bodyTop).toBeLessThanOrEqual(5)
      expect(footCells.length).toBeGreaterThan(0)
      expect(tailCells.length).toBeGreaterThan(0)
    }
  })

  it('keeps cat and dog identity readable at favicon size', () => {
    const catCells = getPetPixelSpriteCells({ species: 'cat', status: 'happy' })
    const dogCells = getPetPixelSpriteCells({ species: 'dog', status: 'happy' })
    const catEarCells = catCells.filter((cell) => cell.role === 'ear')
    const catTailCells = catCells.filter((cell) => cell.role === 'tail')
    const dogEarCells = dogCells.filter((cell) => cell.role === 'ear')
    const dogMuzzleCells = dogCells.filter((cell) => cell.role === 'muzzle')

    expect(Math.min(...catEarCells.map((cell) => cell.y))).toBeLessThanOrEqual(4)
    expect(Math.max(...catTailCells.map((cell) => cell.x + cell.width))).toBeGreaterThanOrEqual(21)
    expect(Math.max(...dogEarCells.map((cell) => cell.y + cell.height))).toBeGreaterThanOrEqual(15)
    expect(dogMuzzleCells.length).toBeGreaterThan(0)
  })

  it('keeps hedgehog identity cute with a rounded curled silhouette', () => {
    const hedgehogCells = getPetPixelSpriteCells({
      species: 'hedgehog',
      status: 'happy',
    })
    const spineCells = hedgehogCells.filter(
      (cell) => cell.role === 'spine' && cell.color === 'outline',
    )
    const headCells = hedgehogCells.filter((cell) => cell.role === 'head')
    const muzzleCells = hedgehogCells.filter((cell) => cell.role === 'muzzle')
    const cheekCells = hedgehogCells.filter((cell) => cell.role === 'cheek')
    const tailCells = hedgehogCells.filter((cell) => cell.role === 'tail')

    expect(spineCells.length).toBeGreaterThanOrEqual(3)
    expect(Math.min(...spineCells.map((cell) => cell.y))).toBeGreaterThanOrEqual(6)
    expect(Math.min(...headCells.map((cell) => cell.x))).toBeLessThanOrEqual(11)
    expect(Math.max(...headCells.map((cell) => cell.x + cell.width))).toBeLessThanOrEqual(19)
    expect(muzzleCells.length).toBeGreaterThan(0)
    expect(Math.max(...muzzleCells.map((cell) => cell.x + cell.width))).toBeLessThanOrEqual(18)
    expect(cheekCells.length).toBeGreaterThan(0)
    expect(tailCells.length).toBeGreaterThan(0)
  })

  it('gives the cat a softer cat-specific silhouette instead of a dog-like face', () => {
    const catCells = getPetPixelSpriteCells({ species: 'cat', status: 'happy' })
    const catHeadCells = catCells.filter((cell) => cell.role === 'head')
    const catTailCells = catCells.filter((cell) => cell.role === 'tail')
    const catInnerEarCells = catCells.filter(
      (cell) => cell.role === 'ear' && cell.color === 'cheek',
    )
    const catFaceCells = catCells.filter(
      (cell) => cell.role === 'face' && cell.color === 'contrast',
    )
    const headLeft = Math.min(...catHeadCells.map((cell) => cell.x))
    const headRight = Math.max(...catHeadCells.map((cell) => cell.x + cell.width))

    expect(headRight - headLeft).toBeGreaterThanOrEqual(18)
    expect(catInnerEarCells.length).toBeGreaterThan(0)
    expect(Math.min(...catTailCells.map((cell) => cell.y))).toBeGreaterThanOrEqual(13)
    expect(catFaceCells).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ x: 10, y: 14, width: 1 }),
        expect.objectContaining({ x: 11, y: 15, width: 1 }),
        expect.objectContaining({ x: 12, y: 14, width: 1 }),
        expect.objectContaining({ x: 13, y: 15, width: 1 }),
        expect.objectContaining({ x: 14, y: 14, width: 1 }),
      ]),
    )
    expect(catFaceCells.some((cell) => cell.y === 15 && cell.width > 1)).toBe(false)
  })

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

  it('keeps generated favicon sprite accents in the warm pet palette', () => {
    const excitedSvg = getFaviconSvg('dog', 'excited', 'light')
    const sleepySvg = getFaviconSvg('cat', 'sleepy', 'dark')

    expect(excitedSvg).toContain('fill="#facc15"')
    expect(sleepySvg).toContain('fill="#f8d99d"')
    expect(`${excitedSvg}${sleepySvg}`).not.toMatch(/#(246bfe|38bdf8|c084fc|2dd4bf)/i)
  })
})

function getRelativeLuminance(color: string): number {
  const normalized = color.replace('#', '')
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}
