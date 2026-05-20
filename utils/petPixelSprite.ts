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
  | 'head'
  | 'muzzle'
  | 'outline'
  | 'shade'
  | 'spine'
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
  const baseCells = getSpriteBase(input.species)

  return [
    ...baseCells,
    ...getFaceCells(input.status, input.species),
    ...getStatusAccentCells(input.status),
  ]
}

function getSpriteBase(species: PetSpecies): PetPixelCell[] {
  if (species === 'cat') return getCatSpriteBase()
  if (species === 'dog') return getDogSpriteBase()
  if (species === 'rabbit') return getRabbitSpriteBase()
  if (species === 'penguin') return getPenguinSpriteBase()
  if (species === 'hamster') return getHamsterSpriteBase()

  return getHedgehogSpriteBase()
}

export function renderPetPixelSpriteSvg(input: {
  species: PetSpecies
  status: PetStatus
  palette: PetPixelPalette
  backgroundColor?: string
  accentBoost?: boolean
}): string {
  const background = input.backgroundColor
    ? `<rect width="24" height="24" fill="${input.backgroundColor}"/>`
    : ''
  const cells = [
    ...getPetPixelSpriteCells({
      species: input.species,
      status: input.status,
    }),
    ...(input.accentBoost ? getFaviconAccentBoostCells() : []),
  ]
    .map(
      (cell) =>
        `<rect x="${cell.x}" y="${cell.y}" width="${cell.width}" height="${cell.height}" fill="${input.palette[cell.color]}"/>`,
    )
    .join('')
  const unlockAttr = input.accentBoost ? ' data-unlock="favicon-bright-accent"' : ''

  return `<svg xmlns="http://www.w3.org/2000/svg"${unlockAttr} viewBox="0 0 24 24" shape-rendering="crispEdges">${background}${cells}</svg>`
}

function getCatSpriteBase(): PetPixelCell[] {
  return [
    cell(18, 16, 5, 2, 'outline', 'tail'),
    cell(19, 16, 3, 1, 'body', 'tail'),
    cell(21, 14, 2, 3, 'outline', 'tail'),
    cell(21, 15, 1, 1, 'body', 'tail'),

    cell(8, 17, 8, 3, 'outline', 'body'),
    cell(9, 17, 6, 2, 'body', 'body'),
    cell(9, 18, 6, 1, 'shade', 'shade'),

    cell(6, 20, 5, 2, 'outline', 'foot'),
    cell(14, 20, 5, 2, 'outline', 'foot'),
    cell(7, 20, 3, 1, 'body', 'foot'),
    cell(15, 20, 3, 1, 'body', 'foot'),

    cell(5, 5, 5, 4, 'outline', 'ear'),
    cell(6, 3, 3, 3, 'outline', 'ear'),
    cell(7, 2, 1, 2, 'outline', 'ear'),
    cell(6, 5, 2, 2, 'cheek', 'ear'),
    cell(7, 4, 1, 1, 'cheek', 'ear'),
    cell(14, 5, 5, 4, 'outline', 'ear'),
    cell(15, 3, 3, 3, 'outline', 'ear'),
    cell(16, 2, 1, 2, 'outline', 'ear'),
    cell(16, 4, 1, 1, 'cheek', 'ear'),
    cell(16, 5, 2, 2, 'cheek', 'ear'),

    cell(3, 10, 18, 5, 'outline', 'head'),
    cell(4, 8, 16, 8, 'outline', 'head'),
    cell(5, 7, 14, 2, 'outline', 'head'),
    cell(4, 10, 16, 5, 'body', 'head'),
    cell(5, 8, 14, 7, 'body', 'head'),
    cell(6, 7, 12, 2, 'body', 'head'),
    cell(5, 15, 14, 1, 'shade', 'head'),
    cell(11, 7, 2, 2, 'shade', 'head'),
    cell(8, 8, 1, 2, 'shade', 'head'),
    cell(15, 8, 1, 2, 'shade', 'head'),
  ]
}

function getDogSpriteBase(): PetPixelCell[] {
  return [
    cell(18, 15, 4, 2, 'outline', 'tail'),
    cell(19, 15, 2, 1, 'body', 'tail'),

    cell(8, 17, 8, 3, 'outline', 'body'),
    cell(9, 17, 6, 2, 'body', 'body'),
    cell(9, 18, 6, 1, 'shade', 'shade'),

    cell(6, 20, 5, 2, 'outline', 'foot'),
    cell(14, 20, 5, 2, 'outline', 'foot'),
    cell(7, 20, 3, 1, 'body', 'foot'),
    cell(15, 20, 3, 1, 'body', 'foot'),

    cell(3, 7, 5, 9, 'outline', 'ear'),
    cell(16, 7, 5, 9, 'outline', 'ear'),
    cell(4, 8, 3, 7, 'shade', 'ear'),
    cell(17, 8, 3, 7, 'shade', 'ear'),

    cell(5, 6, 14, 11, 'outline', 'head'),
    cell(6, 7, 12, 10, 'body', 'head'),
    cell(8, 12, 8, 4, 'shade', 'muzzle'),
  ]
}

function getHedgehogSpriteBase(): PetPixelCell[] {
  return [
    cell(5, 15, 4, 3, 'outline', 'tail'),
    cell(6, 16, 1, 1, 'body', 'tail'),

    cell(5, 9, 13, 9, 'outline', 'spine'),
    cell(4, 11, 15, 6, 'outline', 'spine'),
    cell(7, 7, 2, 2, 'outline', 'spine'),
    cell(10, 6, 2, 2, 'outline', 'spine'),
    cell(13, 7, 2, 2, 'outline', 'spine'),
    cell(6, 11, 10, 6, 'shade', 'spine'),
    cell(7, 10, 8, 2, 'body', 'spine'),

    cell(8, 17, 9, 3, 'outline', 'body'),
    cell(9, 17, 7, 2, 'body', 'body'),
    cell(9, 18, 7, 1, 'shade', 'shade'),

    cell(6, 20, 5, 2, 'outline', 'foot'),
    cell(14, 20, 5, 2, 'outline', 'foot'),
    cell(7, 20, 3, 1, 'body', 'foot'),
    cell(15, 20, 3, 1, 'body', 'foot'),

    cell(10, 8, 9, 10, 'outline', 'head'),
    cell(11, 9, 7, 8, 'body', 'head'),
    cell(16, 11, 4, 5, 'outline', 'muzzle'),
    cell(17, 12, 3, 3, 'body', 'muzzle'),
    cell(19, 13, 1, 1, 'contrast', 'muzzle'),
  ]
}

function getRabbitSpriteBase(): PetPixelCell[] {
  return [
    cell(7, 2, 4, 9, 'outline', 'ear'),
    cell(8, 3, 2, 7, 'body', 'ear'),
    cell(14, 2, 4, 9, 'outline', 'ear'),
    cell(15, 3, 2, 7, 'body', 'ear'),
    cell(8, 4, 1, 5, 'cheek', 'ear'),
    cell(16, 4, 1, 5, 'cheek', 'ear'),

    cell(5, 8, 15, 10, 'outline', 'head'),
    cell(6, 9, 13, 8, 'body', 'head'),
    cell(7, 15, 11, 2, 'shade', 'head'),

    cell(9, 17, 7, 3, 'outline', 'body'),
    cell(10, 17, 5, 2, 'body', 'body'),
    cell(10, 18, 5, 1, 'shade', 'shade'),

    cell(3, 15, 3, 3, 'outline', 'tail'),
    cell(4, 16, 1, 1, 'body', 'tail'),

    cell(6, 20, 5, 2, 'outline', 'foot'),
    cell(14, 20, 5, 2, 'outline', 'foot'),
    cell(7, 20, 3, 1, 'body', 'foot'),
    cell(15, 20, 3, 1, 'body', 'foot'),
  ]
}

function getPenguinSpriteBase(): PetPixelCell[] {
  return [
    cell(7, 5, 10, 14, 'outline', 'head'),
    cell(6, 9, 12, 8, 'outline', 'head'),
    cell(8, 6, 8, 12, 'shade', 'head'),
    cell(9, 8, 6, 10, 'body', 'muzzle'),

    cell(5, 12, 2, 5, 'outline', 'ear'),
    cell(17, 12, 2, 5, 'outline', 'ear'),
    cell(6, 13, 1, 3, 'shade', 'ear'),
    cell(17, 13, 1, 3, 'shade', 'ear'),

    cell(9, 17, 6, 3, 'outline', 'body'),
    cell(10, 17, 4, 2, 'body', 'body'),
    cell(10, 18, 4, 1, 'shade', 'shade'),

    cell(6, 17, 3, 2, 'outline', 'tail'),
    cell(15, 17, 3, 2, 'outline', 'tail'),

    cell(7, 20, 5, 2, 'accent', 'foot'),
    cell(14, 20, 5, 2, 'accent', 'foot'),
    cell(8, 21, 3, 1, 'outline', 'foot'),
    cell(15, 21, 3, 1, 'outline', 'foot'),
  ]
}

function getHamsterSpriteBase(): PetPixelCell[] {
  return [
    cell(5, 6, 5, 5, 'outline', 'ear'),
    cell(15, 6, 5, 5, 'outline', 'ear'),
    cell(6, 7, 3, 3, 'shade', 'ear'),
    cell(16, 7, 3, 3, 'shade', 'ear'),

    cell(4, 8, 16, 11, 'outline', 'head'),
    cell(5, 9, 14, 9, 'body', 'head'),
    cell(7, 13, 4, 3, 'shade', 'cheek'),
    cell(14, 13, 4, 3, 'shade', 'cheek'),

    cell(8, 17, 8, 3, 'outline', 'body'),
    cell(9, 17, 6, 2, 'body', 'body'),
    cell(9, 18, 6, 1, 'shade', 'shade'),

    cell(3, 16, 3, 2, 'outline', 'tail'),
    cell(4, 16, 1, 1, 'body', 'tail'),

    cell(6, 20, 5, 2, 'outline', 'foot'),
    cell(14, 20, 5, 2, 'outline', 'foot'),
    cell(7, 20, 3, 1, 'body', 'foot'),
    cell(15, 20, 3, 1, 'body', 'foot'),
  ]
}

function getFaceCells(status: PetStatus, species: PetSpecies): PetPixelCell[] {
  if (species === 'cat') return getCatFaceCells(status)
  if (species === 'dog') return getDogFaceCells(status)
  if (species === 'rabbit') return getRabbitFaceCells(status)
  if (species === 'penguin') return getPenguinFaceCells(status)
  if (species === 'hamster') return getHamsterFaceCells(status)

  return getHedgehogFaceCells(status)
}

function getCatFaceCells(status: PetStatus): PetPixelCell[] {
  if (status === 'sleepy') {
    return [
      cell(8, 11, 3, 1, 'contrast', 'face'),
      cell(14, 11, 3, 1, 'contrast', 'face'),
      cell(12, 13, 1, 1, 'cheek', 'face'),
      cell(11, 14, 1, 1, 'contrast', 'face'),
      cell(13, 14, 1, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'dirty') {
    return [
      cell(8, 11, 1, 1, 'contrast', 'face'),
      cell(16, 11, 1, 1, 'contrast', 'face'),
      cell(12, 13, 1, 1, 'cheek', 'face'),
      cell(10, 14, 1, 1, 'contrast', 'face'),
      cell(12, 15, 2, 1, 'contrast', 'face'),
      cell(14, 14, 1, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'bored') {
    return [
      cell(8, 11, 3, 1, 'contrast', 'face'),
      cell(14, 11, 3, 1, 'contrast', 'face'),
      cell(12, 13, 1, 1, 'cheek', 'face'),
      cell(10, 15, 5, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'hungry') {
    return [
      cell(8, 11, 1, 1, 'contrast', 'face'),
      cell(16, 11, 1, 1, 'contrast', 'face'),
      cell(12, 13, 1, 1, 'cheek', 'face'),
      cell(11, 14, 3, 2, 'contrast', 'face'),
      cell(12, 15, 1, 1, 'cheek', 'face'),
    ]
  }

  if (status === 'excited') {
    return [
      cell(8, 10, 2, 2, 'contrast', 'face'),
      cell(15, 10, 2, 2, 'contrast', 'face'),
      cell(12, 13, 1, 1, 'cheek', 'face'),
      cell(10, 14, 1, 1, 'contrast', 'face'),
      cell(11, 15, 1, 1, 'contrast', 'face'),
      cell(12, 14, 1, 1, 'contrast', 'face'),
      cell(13, 15, 1, 1, 'contrast', 'face'),
      cell(14, 14, 1, 1, 'contrast', 'face'),
      cell(6, 12, 1, 1, 'cheek', 'cheek'),
      cell(17, 12, 1, 1, 'cheek', 'cheek'),
    ]
  }

  return [
    cell(8, 11, 1, 1, 'contrast', 'face'),
    cell(16, 11, 1, 1, 'contrast', 'face'),
    cell(12, 13, 1, 1, 'cheek', 'face'),
    cell(10, 14, 1, 1, 'contrast', 'face'),
    cell(11, 15, 1, 1, 'contrast', 'face'),
    cell(12, 14, 1, 1, 'contrast', 'face'),
    cell(13, 15, 1, 1, 'contrast', 'face'),
    cell(14, 14, 1, 1, 'contrast', 'face'),
    cell(6, 12, 1, 1, 'cheek', 'cheek'),
    cell(17, 12, 1, 1, 'cheek', 'cheek'),
  ]
}

function getDogFaceCells(status: PetStatus): PetPixelCell[] {
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

function getRabbitFaceCells(status: PetStatus): PetPixelCell[] {
  if (status === 'sleepy') {
    return [
      cell(8, 12, 3, 1, 'contrast', 'face'),
      cell(14, 12, 3, 1, 'contrast', 'face'),
      cell(12, 14, 1, 1, 'cheek', 'face'),
      cell(11, 16, 3, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'dirty') {
    return [
      cell(9, 12, 1, 1, 'contrast', 'face'),
      cell(15, 12, 1, 1, 'contrast', 'face'),
      cell(12, 14, 1, 1, 'cheek', 'face'),
      cell(10, 16, 1, 1, 'contrast', 'face'),
      cell(12, 17, 2, 1, 'contrast', 'face'),
      cell(14, 16, 1, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'bored') {
    return [
      cell(8, 12, 3, 1, 'contrast', 'face'),
      cell(14, 12, 3, 1, 'contrast', 'face'),
      cell(12, 14, 1, 1, 'cheek', 'face'),
      cell(10, 16, 5, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'hungry') {
    return [
      cell(9, 12, 1, 1, 'contrast', 'face'),
      cell(15, 12, 1, 1, 'contrast', 'face'),
      cell(12, 14, 1, 1, 'cheek', 'face'),
      cell(11, 16, 3, 2, 'contrast', 'face'),
    ]
  }

  if (status === 'excited') {
    return [
      cell(8, 11, 2, 2, 'contrast', 'face'),
      cell(15, 11, 2, 2, 'contrast', 'face'),
      cell(12, 14, 1, 1, 'cheek', 'face'),
      cell(10, 16, 1, 1, 'contrast', 'face'),
      cell(11, 17, 1, 1, 'contrast', 'face'),
      cell(12, 16, 1, 1, 'contrast', 'face'),
      cell(13, 17, 1, 1, 'contrast', 'face'),
      cell(14, 16, 1, 1, 'contrast', 'face'),
      cell(7, 14, 1, 1, 'cheek', 'cheek'),
      cell(17, 14, 1, 1, 'cheek', 'cheek'),
    ]
  }

  return [
    cell(9, 12, 1, 1, 'contrast', 'face'),
    cell(15, 12, 1, 1, 'contrast', 'face'),
    cell(12, 14, 1, 1, 'cheek', 'face'),
    cell(10, 16, 1, 1, 'contrast', 'face'),
    cell(11, 17, 1, 1, 'contrast', 'face'),
    cell(12, 16, 1, 1, 'contrast', 'face'),
    cell(13, 17, 1, 1, 'contrast', 'face'),
    cell(14, 16, 1, 1, 'contrast', 'face'),
    cell(7, 14, 1, 1, 'cheek', 'cheek'),
    cell(17, 14, 1, 1, 'cheek', 'cheek'),
  ]
}

function getPenguinFaceCells(status: PetStatus): PetPixelCell[] {
  if (status === 'sleepy') {
    return [
      cell(8, 10, 3, 1, 'contrast', 'face'),
      cell(14, 10, 3, 1, 'contrast', 'face'),
      cell(11, 12, 3, 2, 'accent', 'muzzle'),
      cell(11, 15, 3, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'dirty') {
    return [
      cell(9, 10, 1, 1, 'contrast', 'face'),
      cell(15, 10, 1, 1, 'contrast', 'face'),
      cell(11, 12, 3, 2, 'accent', 'muzzle'),
      cell(11, 15, 3, 1, 'contrast', 'face'),
      cell(8, 14, 1, 1, 'dirt', 'dirt'),
    ]
  }

  if (status === 'bored') {
    return [
      cell(8, 10, 3, 1, 'contrast', 'face'),
      cell(14, 10, 3, 1, 'contrast', 'face'),
      cell(11, 12, 3, 2, 'accent', 'muzzle'),
      cell(10, 15, 5, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'hungry') {
    return [
      cell(9, 10, 1, 1, 'contrast', 'face'),
      cell(15, 10, 1, 1, 'contrast', 'face'),
      cell(11, 12, 4, 3, 'accent', 'muzzle'),
      cell(12, 14, 1, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'excited') {
    return [
      cell(8, 9, 2, 2, 'contrast', 'face'),
      cell(15, 9, 2, 2, 'contrast', 'face'),
      cell(11, 12, 3, 2, 'accent', 'muzzle'),
      cell(10, 15, 1, 1, 'contrast', 'face'),
      cell(11, 16, 3, 1, 'contrast', 'face'),
      cell(14, 15, 1, 1, 'contrast', 'face'),
    ]
  }

  return [
    cell(9, 10, 1, 1, 'contrast', 'face'),
    cell(15, 10, 1, 1, 'contrast', 'face'),
    cell(11, 12, 3, 2, 'accent', 'muzzle'),
    cell(10, 15, 1, 1, 'contrast', 'face'),
    cell(11, 16, 3, 1, 'contrast', 'face'),
    cell(14, 15, 1, 1, 'contrast', 'face'),
  ]
}

function getHamsterFaceCells(status: PetStatus): PetPixelCell[] {
  if (status === 'sleepy') {
    return [
      cell(8, 12, 3, 1, 'contrast', 'face'),
      cell(14, 12, 3, 1, 'contrast', 'face'),
      cell(12, 14, 1, 1, 'cheek', 'face'),
      cell(11, 16, 3, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'dirty') {
    return [
      cell(9, 12, 1, 1, 'contrast', 'face'),
      cell(15, 12, 1, 1, 'contrast', 'face'),
      cell(12, 14, 1, 1, 'cheek', 'face'),
      cell(10, 16, 1, 1, 'contrast', 'face'),
      cell(12, 17, 2, 1, 'contrast', 'face'),
      cell(14, 16, 1, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'bored') {
    return [
      cell(8, 12, 3, 1, 'contrast', 'face'),
      cell(14, 12, 3, 1, 'contrast', 'face'),
      cell(12, 14, 1, 1, 'cheek', 'face'),
      cell(10, 16, 5, 1, 'contrast', 'face'),
    ]
  }

  if (status === 'hungry') {
    return [
      cell(9, 12, 1, 1, 'contrast', 'face'),
      cell(15, 12, 1, 1, 'contrast', 'face'),
      cell(12, 14, 1, 1, 'cheek', 'face'),
      cell(11, 16, 3, 2, 'contrast', 'face'),
    ]
  }

  if (status === 'excited') {
    return [
      cell(8, 11, 2, 2, 'contrast', 'face'),
      cell(15, 11, 2, 2, 'contrast', 'face'),
      cell(12, 14, 1, 1, 'cheek', 'face'),
      cell(10, 16, 1, 1, 'contrast', 'face'),
      cell(11, 17, 1, 1, 'contrast', 'face'),
      cell(12, 16, 1, 1, 'contrast', 'face'),
      cell(13, 17, 1, 1, 'contrast', 'face'),
      cell(14, 16, 1, 1, 'contrast', 'face'),
      cell(7, 14, 1, 1, 'cheek', 'cheek'),
      cell(17, 14, 1, 1, 'cheek', 'cheek'),
    ]
  }

  return [
    cell(9, 12, 1, 1, 'contrast', 'face'),
    cell(15, 12, 1, 1, 'contrast', 'face'),
    cell(12, 14, 1, 1, 'cheek', 'face'),
    cell(10, 16, 1, 1, 'contrast', 'face'),
    cell(11, 17, 1, 1, 'contrast', 'face'),
    cell(12, 16, 1, 1, 'contrast', 'face'),
    cell(13, 17, 1, 1, 'contrast', 'face'),
    cell(14, 16, 1, 1, 'contrast', 'face'),
    cell(7, 14, 1, 1, 'cheek', 'cheek'),
    cell(17, 14, 1, 1, 'cheek', 'cheek'),
  ]
}

function getHedgehogFaceCells(status: PetStatus): PetPixelCell[] {
  if (status === 'sleepy') {
    return [
      cell(12, 11, 3, 1, 'contrast', 'face'),
      cell(16, 13, 2, 1, 'contrast', 'face'),
      cell(14, 16, 1, 1, 'contrast', 'face'),
      cell(16, 16, 1, 1, 'contrast', 'face'),
      cell(17, 15, 1, 1, 'cheek', 'cheek'),
      cell(12, 14, 1, 1, 'cheek', 'cheek'),
    ]
  }

  if (status === 'dirty') {
    return [
      cell(12, 11, 1, 1, 'contrast', 'face'),
      cell(16, 13, 1, 1, 'contrast', 'face'),
      cell(14, 16, 2, 1, 'contrast', 'face'),
      cell(17, 15, 1, 1, 'cheek', 'cheek'),
      cell(12, 14, 1, 1, 'cheek', 'cheek'),
      cell(11, 13, 1, 1, 'dirt', 'dirt'),
    ]
  }

  if (status === 'bored') {
    return [
      cell(12, 11, 3, 1, 'contrast', 'face'),
      cell(16, 13, 2, 1, 'contrast', 'face'),
      cell(13, 16, 4, 1, 'contrast', 'face'),
      cell(17, 15, 1, 1, 'cheek', 'cheek'),
      cell(12, 14, 1, 1, 'cheek', 'cheek'),
    ]
  }

  if (status === 'hungry') {
    return [
      cell(12, 11, 1, 1, 'contrast', 'face'),
      cell(16, 13, 1, 1, 'contrast', 'face'),
      cell(15, 15, 3, 2, 'contrast', 'face'),
      cell(17, 15, 1, 1, 'cheek', 'cheek'),
      cell(12, 14, 1, 1, 'cheek', 'cheek'),
    ]
  }

  if (status === 'excited') {
    return [
      cell(12, 10, 2, 2, 'contrast', 'face'),
      cell(16, 12, 2, 2, 'contrast', 'face'),
      cell(13, 15, 1, 1, 'contrast', 'face'),
      cell(14, 16, 1, 1, 'contrast', 'face'),
      cell(15, 15, 1, 1, 'contrast', 'face'),
      cell(16, 16, 1, 1, 'contrast', 'face'),
      cell(17, 15, 1, 1, 'contrast', 'face'),
      cell(11, 13, 1, 1, 'cheek', 'cheek'),
      cell(18, 14, 1, 1, 'cheek', 'cheek'),
    ]
  }

  return [
    cell(12, 11, 1, 1, 'contrast', 'face'),
    cell(16, 13, 1, 1, 'contrast', 'face'),
    cell(13, 15, 1, 1, 'contrast', 'face'),
    cell(14, 16, 1, 1, 'contrast', 'face'),
    cell(15, 15, 1, 1, 'contrast', 'face'),
    cell(16, 16, 1, 1, 'contrast', 'face'),
    cell(17, 15, 1, 1, 'contrast', 'face'),
    cell(11, 13, 1, 1, 'cheek', 'cheek'),
    cell(18, 14, 1, 1, 'cheek', 'cheek'),
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

function getFaviconAccentBoostCells(): PetPixelCell[] {
  return [
    cell(20, 3, 1, 1, 'accent', 'accent'),
    cell(19, 4, 3, 1, 'accent', 'accent'),
    cell(20, 5, 1, 1, 'accent', 'accent'),
  ]
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
