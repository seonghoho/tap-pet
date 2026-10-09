import type { PetOutfitId, PetSpecies, PetStatus } from '~/types/pet'

// Hand-drawn emoticon style pets: thick warm outline, flat fills, tiny low-set dot eyes,
// hatched blush and stubby limbs. One renderer draws both the room character and the
// favicon so the tab icon always matches what the user sees on the page.

export type PetArtVariant = 'full' | 'icon'

export type PetArtPalette = {
  body: string
  belly: string
  mark: string
  inner: string
  tile: string
}

const INK = '#4a3934'
const BLUSH = '#ffb3b3'
const BLUSH_LINE = '#f27f8a'
const BADGE = '#ff6b4a'

export const PET_ART_PALETTES: Record<PetSpecies, PetArtPalette> = {
  cat: { body: '#ffe6c2', belly: '#fff6e8', mark: '#f3b97c', inner: '#ffc4c4', tile: '#fff0d9' },
  dog: { body: '#fffaf2', belly: '#fffaf2', mark: '#e8c096', inner: '#e8c096', tile: '#fdeedd' },
  hedgehog: { body: '#ffecd6', belly: '#fff6ea', mark: '#a98a70', inner: '#c4a68b', tile: '#f3e7da' },
  rabbit: { body: '#ffffff', belly: '#ffffff', mark: '#ffd1d6', inner: '#ffc4cb', tile: '#fde6ea' },
  penguin: { body: '#7487a8', belly: '#fffdf8', mark: '#ffb85c', inner: '#5f7192', tile: '#dfe9f6' },
  hamster: { body: '#ffd7a3', belly: '#fffaf1', mark: '#f2b56e', inner: '#ffc4c4', tile: '#ffedd6' },
}

const OPEN_EYE_STATUSES: ReadonlySet<PetStatus> = new Set(['fine', 'happy', 'hungry'])
const NEEDS_CARE: ReadonlySet<PetStatus> = new Set(['hungry', 'sleepy', 'dirty', 'bored'])

export function petNeedsCare(status: PetStatus): boolean {
  return NEEDS_CARE.has(status)
}

type Ctx = {
  species: PetSpecies
  status: PetStatus
  p: PetArtPalette
  id: string
  icon: boolean
  sw: number
}

export function renderPetArtSvg(input: {
  species: PetSpecies
  status: PetStatus
  variant?: PetArtVariant
  idPrefix?: string
  accentBoost?: boolean
  label?: string
  outfit?: PetOutfitId | null
}): string {
  const icon = (input.variant ?? 'full') === 'icon'
  const ctx: Ctx = {
    species: input.species,
    status: input.status,
    p: PET_ART_PALETTES[input.species],
    id: sanitizeId(input.idPrefix ?? `pet-${input.species}-${input.status}-${icon ? 'icon' : 'full'}`),
    icon,
    sw: icon ? 5 : 3.4,
  }
  const parts = [
    `<defs><clipPath id="${ctx.id}-clip"><path d="${bodyPath(ctx.species)}"/></clipPath></defs>`,
    icon ? `<rect x="2" y="2" width="116" height="116" rx="30" fill="${ctx.p.tile}"/>` : '',
    icon ? '' : `<ellipse cx="60" cy="106" rx="32" ry="4.5" fill="${INK}" opacity="0.1"/>`,
    icon ? '<g transform="translate(60 66) scale(1.16) translate(-60 -66)">' : '',
    renderBehind(ctx),
    renderLimbs(ctx),
    renderBody(ctx),
    renderFace(ctx),
    input.outfit ? renderOutfit(ctx, input.outfit) : '',
    icon ? '</g>' : '',
    icon ? '' : renderStatusProps(ctx),
    input.accentBoost ? (icon ? sparkle(20, 20, 11) : sparkle(14, 58, 6)) : '',
    icon && petNeedsCare(input.status)
      ? `<circle cx="100" cy="20" r="15" fill="${BADGE}" stroke="#ffffff" stroke-width="5"/>`
      : '',
  ]
  const unlockAttr = input.accentBoost ? ' data-unlock="favicon-bright-accent"' : ''
  const a11y = input.label ? ` role="img" aria-label="${escapeAttr(input.label)}"` : ' aria-hidden="true"'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"${unlockAttr}${a11y} data-species="${input.species}" data-status="${input.status}">${parts.join('')}</svg>`
}

// ---------- silhouettes ----------

// Slightly lopsided mochi: wide, soft bottom so it reads as "sitting".
const MOCHI = 'M61 37C84 37 99 53 100 75C101 93 87 102 60 102C33 102 19 94 20 75C21 52 37 37 61 37Z'
const EGG = 'M61 30C83 30 97 50 98 74C99 94 85 103 60 103C35 103 21 94 22 74C23 49 38 30 61 30Z'
const HEDGEHOG_FACE = 'M61 46C80 46 94 58 95 76C96 93 83 102 60 102C37 102 24 93 25 76C26 58 41 46 61 46Z'

function bodyPath(species: PetSpecies): string {
  if (species === 'penguin') return EGG
  if (species === 'hedgehog') return HEDGEHOG_FACE

  return MOCHI
}

function inked(d: string, fill: string, ctx: Ctx, extra = ''): string {
  return `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${ctx.sw}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`
}

function renderBehind(ctx: Ctx): string {
  const { p } = ctx

  switch (ctx.species) {
    case 'cat':
      return [
        `<path d="M95 92C109 91 112 76 104 66" fill="none" stroke="${INK}" stroke-width="${ctx.sw + 7}" stroke-linecap="round"/>`,
        `<path d="M95 92C109 91 112 76 104 66" fill="none" stroke="${p.body}" stroke-width="7" stroke-linecap="round"/>`,
        inked('M26 58C23 45 25 31 31 24C39 27 47 35 52 43Z', p.body, ctx),
        inked('M96 58C99 45 97 31 91 24C83 27 75 35 70 43Z', p.body, ctx),
        `<path d="M31 49C30 42 31 36 33 32C37 35 40 38 42 42Z" fill="${p.inner}"/>`,
        `<path d="M91 49C92 42 91 36 89 32C85 35 82 38 80 42Z" fill="${p.inner}"/>`,
      ].join('')
    case 'dog':
      return `<path d="M97 86C106 86 108 77 102 74" fill="none" stroke="${INK}" stroke-width="${ctx.sw}" stroke-linecap="round"/>`
    case 'rabbit':
      return [
        `<g transform="rotate(-8 45 40)">`,
        inked('M45 6C54 6 57 20 56 36C55 47 51 51 45 51C39 51 35 47 34 36C33 20 36 6 45 6Z', p.body, ctx),
        `<path d="M45 15C49 15 50 24 50 33C50 40 48 43 45 43C42 43 40 40 40 33C40 24 41 15 45 15Z" fill="${p.inner}"/></g>`,
        `<g transform="rotate(8 77 40)">`,
        inked('M77 6C86 6 89 20 88 36C87 47 83 51 77 51C71 51 67 47 66 36C65 20 68 6 77 6Z', p.body, ctx),
        `<path d="M77 15C81 15 82 24 82 33C82 40 80 43 77 43C74 43 72 40 72 33C72 24 73 15 77 15Z" fill="${p.inner}"/></g>`,
        `<circle cx="99" cy="93" r="7.5" fill="${p.body}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
      ].join('')
    case 'hedgehog':
      return [
        inked(hedgehogSpikes(), p.mark, ctx),
        `<circle cx="38" cy="53" r="6" fill="${p.body}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
        `<circle cx="84" cy="53" r="6" fill="${p.body}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
      ].join('')
    case 'hamster':
      return [
        `<circle cx="35" cy="44" r="9.5" fill="${p.body}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
        `<circle cx="87" cy="44" r="9.5" fill="${p.body}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
        `<circle cx="35" cy="44" r="4.5" fill="${p.inner}"/>`,
        `<circle cx="87" cy="44" r="4.5" fill="${p.inner}"/>`,
      ].join('')
    case 'penguin':
      return `<path d="M58 31C56 23 62 19 67 22" fill="none" stroke="${INK}" stroke-width="${ctx.sw}" stroke-linecap="round"/>`
  }
}

function renderLimbs(ctx: Ctx): string {
  const { p } = ctx
  const footFill = ctx.species === 'penguin' ? p.mark : p.body
  const armFill = ctx.species === 'penguin' ? p.inner : ctx.species === 'hedgehog' ? p.body : p.body
  // Arms go up when the pet is excited, droop when it's sleepy.
  const armTilt = ctx.status === 'excited' ? -38 : ctx.status === 'sleepy' ? 22 : 8
  const armY = ctx.status === 'excited' ? 70 : 83

  return [
    `<ellipse cx="45" cy="101" rx="8.5" ry="5.5" fill="${footFill}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
    `<ellipse cx="76" cy="101" rx="8.5" ry="5.5" fill="${footFill}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
    `<ellipse cx="23" cy="${armY}" rx="6.5" ry="9" transform="rotate(${-armTilt} 23 ${armY})" fill="${armFill}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
    `<ellipse cx="97" cy="${armY}" rx="6.5" ry="9" transform="rotate(${armTilt} 97 ${armY})" fill="${armFill}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
  ].join('')
}

function renderBody(ctx: Ctx): string {
  const { p, id } = ctx
  const path = bodyPath(ctx.species)
  const clip = `clip-path="url(#${id}-clip)"`
  const markings: string[] = []

  switch (ctx.species) {
    case 'cat':
      markings.push(`<path d="M54 44L55.5 50M61 42V49M68 44L66.5 50" stroke="${p.mark}" stroke-width="3.2" stroke-linecap="round"/>`)
      break
    case 'dog':
      markings.push(
        `<g ${clip}><ellipse cx="86" cy="52" rx="12" ry="10" fill="${p.mark}" opacity="0.55"/></g>`,
      )
      break
    case 'penguin':
      markings.push(
        `<g ${clip}><path d="M61 54C55 46 39 46 37 60C35 72 40 84 46 92C50 98 55 104 61 104C67 104 72 98 76 92C82 84 87 72 85 60C83 46 67 46 61 54Z" fill="${p.belly}"/></g>`,
      )
      break
    case 'hamster':
      markings.push(
        `<g ${clip}><ellipse cx="60" cy="100" rx="38" ry="24" fill="${p.belly}"/></g>`,
        `<path d="M61 40V47" stroke="${p.mark}" stroke-width="3.2" stroke-linecap="round"/>`,
      )
      break
  }

  const outline = `<path d="${path}" fill="none" stroke="${INK}" stroke-width="${ctx.sw}" stroke-linejoin="round"/>`
  const ears = ctx.species === 'dog'
    ? [
        inked('M30 44C17 45 12 62 17 74C21 81 29 78 32 69C35 60 37 51 37 46Z', p.mark, ctx),
        inked('M92 44C105 45 110 62 105 74C101 81 93 78 90 69C87 60 85 51 85 46Z', p.mark, ctx),
      ].join('')
    : ''

  return `<path d="${path}" fill="${p.body}"/>${markings.join('')}${outline}${ears}`
}

// ---------- face ----------

type FaceLayout = {
  eyeY: number
  eyeDx: number
  mouthY: number
  nose: 'cat' | 'dog' | 'pink' | 'beak' | 'none'
}

const FACE_LAYOUT: Record<PetSpecies, FaceLayout> = {
  cat: { eyeY: 71, eyeDx: 14, mouthY: 76, nose: 'none' },
  dog: { eyeY: 69, eyeDx: 14, mouthY: 78, nose: 'dog' },
  hedgehog: { eyeY: 74, eyeDx: 13, mouthY: 81, nose: 'dog' },
  rabbit: { eyeY: 71, eyeDx: 14, mouthY: 77, nose: 'pink' },
  penguin: { eyeY: 68, eyeDx: 13, mouthY: 78, nose: 'beak' },
  hamster: { eyeY: 70, eyeDx: 15, mouthY: 77, nose: 'pink' },
}

function renderFace(ctx: Ctx): string {
  const layout = FACE_LAYOUT[ctx.species]
  const left = 61 - layout.eyeDx
  const right = 61 + layout.eyeDx
  const blushY = layout.eyeY + 7
  const blushRx = ctx.species === 'hamster' ? 8 : 6.5

  return [
    renderBlush(left - 9, blushY, blushRx, ctx),
    renderBlush(right + 9, blushY, blushRx, ctx),
    // Open dot eyes get a class so the room can make them blink; drawn expressions stay put.
    OPEN_EYE_STATUSES.has(ctx.status) ? '<g class="pet-eyes">' : '<g>',
    renderEye(left, layout.eyeY, 'left', ctx),
    renderEye(right, layout.eyeY, 'right', ctx),
    '</g>',
    renderNose(layout, ctx),
    layout.nose === 'beak' ? '' : renderMouth(layout, ctx),
  ].join('')
}

function renderBlush(x: number, y: number, rx: number, ctx: Ctx): string {
  const blob = `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ctx.icon ? 4.5 : 4}" fill="${BLUSH}"/>`
  if (ctx.icon) return blob

  const hatch = [-3, 0, 3]
    .map((dx) => `<path d="M${x + dx - 1.2} ${y + 1.8}L${x + dx + 1.2} ${y - 1.8}" stroke="${BLUSH_LINE}" stroke-width="1.3" stroke-linecap="round"/>`)
    .join('')

  return blob + hatch
}

function renderEye(x: number, y: number, side: 'left' | 'right', ctx: Ctx): string {
  const k = ctx.icon ? 1.35 : 1
  const line = `fill="none" stroke="${INK}" stroke-width="${(3 * k).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"`

  switch (ctx.status) {
    case 'excited':
      return `<path d="M${x - 4.5 * k} ${y + 1.5} Q${x} ${y - 4.5 * k} ${x + 4.5 * k} ${y + 1.5}" ${line}/>`
    case 'sleepy':
      return `<path d="M${x - 4.5 * k} ${y - 0.5} Q${x} ${y + 3.5 * k} ${x + 4.5 * k} ${y - 0.5}" ${line}/>`
    case 'bored':
      return `<path d="M${x - 5 * k} ${y} H${x + 5 * k}" ${line}/>`
    case 'dirty': {
      const dir = side === 'left' ? 1 : -1
      const s = 3.8 * k

      return `<path d="M${x - dir * s} ${y - s} L${x + dir * s * 0.7} ${y} L${x - dir * s} ${y + s}" ${line}/>`
    }
    case 'hungry':
      return [
        `<circle cx="${x}" cy="${y}" r="${4.4 * k}" fill="${INK}"/>`,
        `<circle cx="${x + 1.4}" cy="${y - 1.5}" r="${1.6 * k}" fill="#ffffff"/>`,
        ctx.icon ? '' : `<circle cx="${x - 1.5}" cy="${y + 1.8}" r="0.8" fill="#ffffff"/>`,
      ].join('')
    default:
      return `<circle cx="${x}" cy="${y}" r="${3.3 * k}" fill="${INK}"/>`
  }
}

function renderNose(layout: FaceLayout, ctx: Ctx): string {
  const y = layout.mouthY - 4

  switch (layout.nose) {
    case 'dog':
      return `<ellipse cx="61" cy="${y}" rx="${ctx.icon ? 4.5 : 3.8}" ry="${ctx.icon ? 3.4 : 2.8}" fill="${INK}"/>`
    case 'pink':
      return `<ellipse cx="61" cy="${y + 0.5}" rx="2.4" ry="1.7" fill="#f28b95"/>`
    case 'beak': {
      const by = layout.mouthY - 5
      if (ctx.status === 'excited') {
        return `<path d="M54 ${by}Q61 ${by - 4} 68 ${by}L61 ${by + 4}Z" fill="${ctx.p.mark}" stroke="${INK}" stroke-width="${ctx.sw * 0.7}" stroke-linejoin="round"/><path d="M55.5 ${by + 4}Q61 ${by + 11} 66.5 ${by + 4}Z" fill="#f08a84" stroke="${INK}" stroke-width="${ctx.sw * 0.7}" stroke-linejoin="round"/>`
      }

      return `<path d="M54.5 ${by}Q61 ${by - 3.5} 67.5 ${by}Q64 ${by + 6} 61 ${by + 6}Q58 ${by + 6} 54.5 ${by}Z" fill="${ctx.p.mark}" stroke="${INK}" stroke-width="${ctx.sw * 0.7}" stroke-linejoin="round"/>`
    }
    default:
      return ''
  }
}

function renderMouth(layout: FaceLayout, ctx: Ctx): string {
  const y = layout.mouthY
  const w = ctx.icon ? 3.6 : 2.4
  const line = `fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`
  const usesW = ctx.species === 'cat' || ctx.species === 'dog' || ctx.species === 'hedgehog'

  switch (ctx.status) {
    case 'excited':
      return `<path d="M55 ${y - 1.5}Q61 ${y + 9} 67 ${y - 1.5}Z" fill="${INK}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/><path d="M57.8 ${y + 3.2}Q61 ${y + 1} 64.2 ${y + 3.2}Q61 ${y + 6.5} 57.8 ${y + 3.2}Z" fill="#f08a84"/>`
    case 'hungry':
      return [
        `<ellipse cx="61" cy="${y + 1}" rx="2.6" ry="3" fill="${INK}"/>`,
        ctx.icon ? '' : `<path d="M64.5 ${y + 1}C64 ${y + 5} 63.5 ${y + 8} 65.5 ${y + 9.5}C67.5 ${y + 8} 66.5 ${y + 5} 64.5 ${y + 1}Z" fill="#a9d6f5" stroke="${INK}" stroke-width="1.2"/>`,
      ].join('')
    case 'sleepy':
      return `<ellipse cx="61" cy="${y + 1}" rx="1.8" ry="2" fill="${INK}"/>`
    case 'bored':
      return `<path d="M58 ${y + 1}H64" ${line}/>`
    case 'dirty':
      return `<path d="M55.5 ${y + 2}Q58.25 ${y - 0.5} 61 ${y + 2}T66.5 ${y + 2}" ${line}/>`
    default:
      return usesW
        ? `<path d="M56 ${y}Q58.5 ${y + 3.5} 61 ${y}Q63.5 ${y + 3.5} 66 ${y}" ${line}/>`
        : `<path d="M57.5 ${y + 2}L61 ${y - 1}L64.5 ${y + 2}" ${line}/>`
  }
}

// ---------- outfits (cosmetic pack) ----------

const HEAD_TOP: Record<PetSpecies, number> = {
  cat: 37,
  dog: 37,
  hedgehog: 34,
  rabbit: 37,
  penguin: 30,
  hamster: 37,
}

function renderOutfit(ctx: Ctx, outfit: PetOutfitId): string {
  const w = ctx.sw * 0.8
  const top = HEAD_TOP[ctx.species]

  switch (outfit) {
    case 'party-hat': {
      const base = top + 6

      return [
        `<g transform="rotate(10 61 ${base})">`,
        `<path d="M47 ${base}L61 ${base - 30}L75 ${base}Q61 ${base + 6} 47 ${base}Z" fill="#8fc3ea" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`,
        `<circle cx="57" cy="${base - 10}" r="2.4" fill="#ffffff"/><circle cx="65" cy="${base - 4}" r="2.4" fill="#ffffff"/><circle cx="62" cy="${base - 18}" r="2" fill="#ffffff"/>`,
        `<circle cx="61" cy="${base - 31}" r="5" fill="#ffd25e" stroke="${INK}" stroke-width="${w}"/>`,
        '</g>',
      ].join('')
    }
    case 'ribbon': {
      const x = 80
      const y = top + 9

      return [
        `<path d="M${x} ${y}C${x - 17} ${y - 17} ${x - 22} ${y + 6} ${x} ${y}Z" fill="#ff9aa6" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`,
        `<path d="M${x} ${y}C${x + 17} ${y - 17} ${x + 22} ${y + 6} ${x} ${y}Z" fill="#ff9aa6" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`,
        `<circle cx="${x}" cy="${y - 1}" r="4.6" fill="#ff7f8f" stroke="${INK}" stroke-width="${w}"/>`,
      ].join('')
    }
    case 'scarf':
      return [
        `<path d="M78 90L84 106L94 103L88 88Z" fill="#ff8a7a" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`,
        `<path d="M23 83Q61 97 99 83L99 92Q61 106 23 92Z" fill="#ff8a7a" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`,
        `<path d="M40 90L42 97M56 92L57 99M72 91L71 98" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity="0.8"/>`,
      ].join('')
    case 'glasses': {
      const layout = FACE_LAYOUT[ctx.species]
      const left = 61 - layout.eyeDx
      const right = 61 + layout.eyeDx
      const y = layout.eyeY
      const r = ctx.icon ? 9 : 8

      return [
        `<circle cx="${left}" cy="${y}" r="${r}" fill="#ffffff" fill-opacity="0.25" stroke="${INK}" stroke-width="${w}"/>`,
        `<circle cx="${right}" cy="${y}" r="${r}" fill="#ffffff" fill-opacity="0.25" stroke="${INK}" stroke-width="${w}"/>`,
        `<path d="M${left + r} ${y - 1}Q61 ${y - 4} ${right - r} ${y - 1}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round"/>`,
      ].join('')
    }
  }
}

// ---------- status props (room only) ----------

function renderStatusProps(ctx: Ctx): string {
  const line = (d: string, color = INK, w = 2.4) =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`

  switch (ctx.status) {
    case 'excited':
      return [
        sparkle(14, 36, 7),
        sparkle(106, 30, 8),
        line('M10 56l-5-2M12 64l-6 1M110 52l5-3M108 62l6 0', '#f2a33a'),
      ].join('')
    case 'happy':
      return heart(102, 34)
    case 'sleepy':
      return [
        zed(88, 22, 9, 3),
        zed(102, 9, 6.5, 2.4),
        `<circle cx="73" cy="82" r="6.5" fill="#e3f2fd" stroke="${INK}" stroke-width="1.6"/>`,
        `<circle cx="71" cy="80" r="1.6" fill="#ffffff"/>`,
      ].join('')
    case 'hungry':
      return [
        `<circle cx="88" cy="42" r="2.4" fill="#ffffff" stroke="${INK}" stroke-width="1.5"/>`,
        `<circle cx="94" cy="33" r="3.4" fill="#ffffff" stroke="${INK}" stroke-width="1.5"/>`,
        `<circle cx="104" cy="17" r="13" fill="#ffffff" stroke="${INK}" stroke-width="2"/>`,
        `<path d="M95.5 17C98.5 12.5 105.5 12.5 108.5 17C105.5 21.5 98.5 21.5 95.5 17Z" fill="#8cc0ec" stroke="${INK}" stroke-width="1.4"/>`,
        `<path d="M108.5 17L113 13.5V20.5Z" fill="#8cc0ec" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`,
        `<circle cx="99" cy="16" r="1.1" fill="${INK}"/>`,
      ].join('')
    case 'dirty':
      return [
        `<ellipse cx="42" cy="91" rx="5.5" ry="3.5" fill="#b08860" opacity="0.55"/>`,
        `<ellipse cx="83" cy="56" rx="4" ry="2.8" fill="#b08860" opacity="0.5"/>`,
        `<ellipse cx="86" cy="89" rx="3.2" ry="2.3" fill="#b08860" opacity="0.55"/>`,
        line('M44 28c-3-4 3-6 0-10M61 24c-3-4 3-6 0-10M78 28c-3-4 3-6 0-10', '#a5ab88'),
        `<path d="M95 52C95 56 92.5 59 92.5 61C92.5 63.5 94 65 95.5 65C97 65 98.5 63.5 98.5 61C98.5 59 96 56 95 52Z" fill="#bfe3fb" stroke="${INK}" stroke-width="1.5"/>`,
      ].join('')
    case 'bored':
      return [
        `<path d="M92 16H113A6 6 0 0 1 119 22V30A6 6 0 0 1 113 36H101L96 41V36H92A6 6 0 0 1 86 30V22A6 6 0 0 1 92 16Z" fill="#ffffff" stroke="${INK}" stroke-width="2"/>`,
        `<circle cx="96" cy="26" r="2" fill="${INK}"/><circle cx="102.5" cy="26" r="2" fill="${INK}"/><circle cx="109" cy="26" r="2" fill="${INK}"/>`,
      ].join('')
    default:
      return ''
  }
}

// ---------- helpers ----------

function sparkle(x: number, y: number, r: number): string {
  const k = r * 0.28

  return `<path d="M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z" fill="#ffd25e" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
}

function heart(x: number, y: number): string {
  return `<path transform="translate(${x} ${y})" d="M0 6C-7 1-8-5-4-7C-2-8 0-6.5 0-5C0-6.5 2-8 4-7C8-5 7 1 0 6Z" fill="#ff9aa6" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
}

function zed(x: number, y: number, size: number, sw: number): string {
  return `<path d="M${x} ${y}H${x + size}L${x} ${y + size}H${x + size}" fill="none" stroke="#7d93bd" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`
}

function hedgehogSpikes(): string {
  const cx = 61
  const cy = 76
  const spikes = 14
  const start = Math.PI * 0.88
  const end = Math.PI * 2.12
  const points: string[] = [`${cx - 24} ${cy + 18}`]

  for (let i = 0; i <= spikes * 2; i += 1) {
    const t = start + ((end - start) * i) / (spikes * 2)
    const isTip = i % 2 === 1
    const rx = isTip ? 48 : 42
    const ry = isTip ? 45 : 39
    points.push(`${(cx + Math.cos(t) * rx).toFixed(1)} ${(cy + Math.sin(t) * ry).toFixed(1)}`)
  }
  points.push(`${cx + 24} ${cy + 18}`)

  return `M${points.join('L')}Z`
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '')
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
