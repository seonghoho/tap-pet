import type { PetSpecies } from '~/types/pet'
import { PET_ART_PALETTES, renderPetArtSvg } from '~/utils/petArt'
import { svgToDataUrl } from '~/utils/tabPresentation'

export const SHARE_CARD_WIDTH = 1080
export const SHARE_CARD_HEIGHT = 1350

export type ShareCardInput = {
  species: PetSpecies
  name: string
  subtitle: string
  highlight: string
  footer: string
}

const INK = '#2a2420'
const MUTED = '#7a7068'
const FONT = '"Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", sans-serif'

// Draws a portrait card (feed/story friendly) with the pet in its excited pose.
export async function renderShareCard(input: ShareCardInput): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = SHARE_CARD_WIDTH
  canvas.height = SHARE_CARD_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not available.')

  await document.fonts?.ready
  const palette = PET_ART_PALETTES[input.species]

  context.fillStyle = palette.tile
  context.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT)

  context.fillStyle = '#fffdf9'
  roundRect(context, 60, 60, SHARE_CARD_WIDTH - 120, SHARE_CARD_HEIGHT - 120, 64)
  context.fill()

  const pet = await loadImage(
    svgToDataUrl(renderPetArtSvg({ species: input.species, status: 'excited', idPrefix: 'share-card' })),
  )
  context.drawImage(pet, (SHARE_CARD_WIDTH - 640) / 2, 120, 640, 640)

  context.textAlign = 'center'
  context.fillStyle = INK
  context.font = `800 104px ${FONT}`
  context.fillText(input.name, SHARE_CARD_WIDTH / 2, 880, SHARE_CARD_WIDTH - 200)

  context.fillStyle = MUTED
  context.font = `500 40px ${FONT}`
  context.fillText(input.subtitle, SHARE_CARD_WIDTH / 2, 952, SHARE_CARD_WIDTH - 200)

  context.font = `700 44px ${FONT}`
  const pillWidth = Math.min(SHARE_CARD_WIDTH - 200, context.measureText(input.highlight).width + 96)
  context.fillStyle = '#ff6b4a'
  roundRect(context, (SHARE_CARD_WIDTH - pillWidth) / 2, 1010, pillWidth, 92, 46)
  context.fill()
  context.fillStyle = '#ffffff'
  context.fillText(input.highlight, SHARE_CARD_WIDTH / 2, 1072, SHARE_CARD_WIDTH - 240)

  context.fillStyle = MUTED
  context.font = `500 34px ${FONT}`
  context.fillText(input.footer, SHARE_CARD_WIDTH / 2, 1200, SHARE_CARD_WIDTH - 200)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create image.'))), 'image/png')
  })
}

// Uses the system share sheet when it can take files, otherwise saves the PNG.
export async function shareOrDownloadCard(blob: Blob, fileName: string, text: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], fileName, { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text })

      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'shared'
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  return 'downloaded'
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load pet image.'))
    image.src = src
  })
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
}
