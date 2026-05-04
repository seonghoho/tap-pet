import type { PetSpecies, PetStatus } from '~/types/pet'

export type PetPixelRole =
  | 'accent'
  | 'body'
  | 'bubble'
  | 'cheek'
  | 'dirt'
  | 'ear'
  | 'face'
  | 'foot'
  | 'outline'
  | 'shade'
  | 'tail'

export type PetPixelColor = keyof PetPixelPalette

export type PetPixelCell = {
  x: number
  y: number
  width: number
  height: number
  color: PetPixelColor
  role: PetPixelRole
}

export type PetPixelPalette = {
  body: string
  shade: string
  outline: string
  contrast: string
  cheek: string
  accent: string
  dirt: string
  bubble: string
}

export function getPetPixelPalette(input: {
  body: string
  contrast: string
  accent?: string
  dirt?: string
  bubble?: string
}): PetPixelPalette {
  return {
    body: input.body,
    shade: mixHexColor(input.body, input.contrast, 0.18),
    outline: input.contrast,
    contrast: input.contrast,
    cheek: '#fb7185',
    accent: input.accent ?? '#fde047',
    dirt: input.dirt ?? '#92400e',
    bubble: input.bubble ?? '#93c5fd',
  }
}

export function getPetPixelSpriteCells(input: {
  species: PetSpecies
  status: PetStatus
}): PetPixelCell[] {
  const baseCells = input.species === 'cat' ? getCatSpriteBase() : getDogSpriteBase()

  return [
    ...baseCells,
    ...getFaceCells(input.status),
    ...getStatusAccentCells(input.status),
  ]
}

export function renderPetPixelSpriteSvg(input: {
  species: PetSpecies
  status: PetStatus
  palette: PetPixelPalette
  backgroundColor?: string
}): string {
  const background = input.backgroundColor
    ? `<rect width="24" height="24" fill="${input.backgroundColor}"/>`
    : ''
  const cells = getPetPixelSpriteCells({
    species: input.species,
    status: input.status,
  })
    .map(
      (cell) =>
        `<rect x="${cell.x}" y="${cell.y}" width="${cell.width}" height="${cell.height}" fill="${input.palette[cell.color]}"/>`,
    )
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">${background}${cells}</svg>`
}

function getCatSpriteBase(): PetPixelCell[] {
  return [
    cell(20, 11, 2, 4, 'outline', 'tail'),
    cell(18, 14, 4, 2, 'outline', 'tail'),
    cell(19, 10, 2, 2, 'outline', 'tail'),
    cell(20, 12, 1, 3, 'body', 'tail'),
    cell(18, 14, 3, 1, 'body', 'tail'),
    cell(19, 10, 1, 1, 'shade', 'tail'),

    cell(6, 12, 12, 8, 'outline', 'body'),
    cell(5, 14, 14, 5, 'outline', 'body'),
    cell(7, 13, 10, 6, 'body', 'body'),
    cell(6, 15, 12, 3, 'body', 'body'),
    cell(7, 18, 10, 1, 'shade', 'shade'),

    cell(6, 20, 5, 2, 'outline', 'foot'),
    cell(13, 20, 5, 2, 'outline', 'foot'),
    cell(7, 20, 3, 1, 'body', 'foot'),
    cell(14, 20, 3, 1, 'body', 'foot'),

    cell(6, 3, 3, 5, 'outline', 'ear'),
    cell(15, 3, 3, 5, 'outline', 'ear'),
    cell(7, 4, 1, 3, 'body', 'ear'),
    cell(16, 4, 1, 3, 'body', 'ear'),
    cell(8, 5, 1, 2, 'shade', 'ear'),
    cell(15, 5, 1, 2, 'shade', 'ear'),

    cell(5, 7, 14, 8, 'outline', 'outline'),
    cell(6, 5, 12, 4, 'outline', 'outline'),
    cell(6, 8, 12, 7, 'body', 'body'),
    cell(7, 6, 10, 3, 'body', 'body'),
    cell(6, 13, 12, 2, 'shade', 'shade'),
  ]
}

function getDogSpriteBase(): PetPixelCell[] {
  return [
    cell(19, 14, 3, 2, 'outline', 'tail'),
    cell(19, 14, 2, 1, 'body', 'tail'),

    cell(6, 12, 12, 8, 'outline', 'body'),
    cell(5, 14, 14, 5, 'outline', 'body'),
    cell(7, 13, 10, 6, 'body', 'body'),
    cell(6, 15, 12, 3, 'body', 'body'),
    cell(7, 18, 10, 1, 'shade', 'shade'),

    cell(6, 20, 5, 2, 'outline', 'foot'),
    cell(13, 20, 5, 2, 'outline', 'foot'),
    cell(7, 20, 3, 1, 'body', 'foot'),
    cell(14, 20, 3, 1, 'body', 'foot'),

    cell(4, 7, 4, 8, 'outline', 'ear'),
    cell(16, 7, 4, 8, 'outline', 'ear'),
    cell(5, 8, 2, 6, 'shade', 'ear'),
    cell(17, 8, 2, 6, 'shade', 'ear'),

    cell(6, 6, 12, 9, 'outline', 'outline'),
    cell(7, 5, 10, 3, 'outline', 'outline'),
    cell(7, 7, 10, 8, 'body', 'body'),
    cell(8, 6, 8, 3, 'body', 'body'),
    cell(8, 12, 8, 3, 'shade', 'shade'),
  ]
}

function getFaceCells(status: PetStatus): PetPixelCell[] {
  if (status === 'sleepy') {
    return [
      cell(8, 10, 3, 1, 'contrast', 'face'),
      cell(14, 10, 3, 1, 'contrast', 'face'),
      cell(11, 13, 2, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'dirty') {
    return [
      cell(9, 10, 1, 1, 'contrast', 'face'),
      cell(15, 10, 1, 1, 'contrast', 'face'),
      cell(11, 13, 2, 1, 'contrast', 'face'),
      cell(10, 14, 1, 1, 'contrast', 'face'),
      cell(13, 14, 1, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'bored') {
    return [
      cell(8, 10, 3, 1, 'contrast', 'face'),
      cell(14, 10, 3, 1, 'contrast', 'face'),
      cell(10, 14, 5, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'hungry') {
    return [
      cell(9, 10, 1, 1, 'contrast', 'face'),
      cell(15, 10, 1, 1, 'contrast', 'face'),
      cell(11, 13, 3, 3, 'contrast', 'face'),
      cell(12, 14, 1, 1, 'cheek', 'face'),
    ]
  }

  if (status === 'excited') {
    return [
      cell(8, 9, 2, 2, 'contrast', 'face'),
      cell(14, 9, 2, 2, 'contrast', 'face'),
      cell(9, 14, 1, 1, 'contrast', 'face'),
      cell(10, 15, 5, 1, 'contrast', 'face'),
      cell(15, 14, 1, 1, 'contrast', 'face'),
      cell(7, 12, 1, 1, 'cheek', 'cheek'),
      cell(16, 12, 1, 1, 'cheek', 'cheek'),
    ]
  }

  return [
    cell(9, 10, 1, 1, 'contrast', 'face'),
    cell(15, 10, 1, 1, 'contrast', 'face'),
    cell(10, 14, 1, 1, 'contrast', 'face'),
    cell(11, 15, 3, 1, 'contrast', 'face'),
    cell(14, 14, 1, 1, 'contrast', 'face'),
    cell(7, 12, 1, 1, 'cheek', 'cheek'),
    cell(16, 12, 1, 1, 'cheek', 'cheek'),
  ]
}

function getStatusAccentCells(status: PetStatus): PetPixelCell[] {
  if (status === 'sleepy') {
    return [
      cell(17, 4, 2, 2, 'bubble', 'bubble'),
      cell(20, 2, 1, 1, 'bubble', 'bubble'),
    ]
  }

  if (status === 'dirty') {
    return [
      cell(6, 9, 1, 1, 'dirt', 'dirt'),
      cell(17, 13, 1, 1, 'dirt', 'dirt'),
      cell(8, 17, 2, 1, 'dirt', 'dirt'),
      cell(14, 18, 1, 1, 'dirt', 'dirt'),
    ]
  }

  if (status === 'hungry') {
    return [
      cell(5, 18, 1, 1, 'accent', 'accent'),
      cell(4, 19, 1, 1, 'accent', 'accent'),
    ]
  }

  if (status === 'excited') {
    return [
      cell(20, 4, 1, 1, 'accent', 'accent'),
      cell(19, 5, 3, 1, 'accent', 'accent'),
      cell(20, 6, 1, 1, 'accent', 'accent'),
      cell(2, 8, 1, 1, 'accent', 'accent'),
      cell(3, 7, 1, 1, 'accent', 'accent'),
    ]
  }

  return []
}

function cell(
  x: number,
  y: number,
  width: number,
  height: number,
  color: PetPixelColor,
  role: PetPixelRole,
): PetPixelCell {
  return { x, y, width, height, color, role }
}

function mixHexColor(base: string, mix: string, amount: number): string {
  const baseRgb = parseHexColor(base)
  const mixRgb = parseHexColor(mix)

  if (!baseRgb || !mixRgb) return base

  const nextRgb = baseRgb.map((channel, index) =>
    Math.round(channel * (1 - amount) + mixRgb[index] * amount),
  )

  return `#${nextRgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function parseHexColor(color: string): [number, number, number] | null {
  const normalized = color.trim().replace(/^#/, '')

  if (!/^[\dA-Fa-f]{6}$/.test(normalized)) return null

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ]
}
