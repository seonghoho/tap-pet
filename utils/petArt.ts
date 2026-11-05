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
  // Orange-cream tabby with a pale muzzle.
  cat: { body: '#ffd29e', belly: '#fff6ea', mark: '#ec9a52', inner: '#ffb8c0', tile: '#fff0d9' },
  // Cream pup with caramel floppy ears and an eye patch.
  dog: { body: '#fffaf2', belly: '#fffaf2', mark: '#d9a273', inner: '#d9a273', tile: '#fdeedd' },
  hedgehog: { body: '#ffe8cc', belly: '#fff6ea', mark: '#9c7a5e', inner: '#c4a68b', tile: '#f3e7da' },
  rabbit: { body: '#ffffff', belly: '#ffffff', mark: '#ffd1d6', inner: '#ffc4cb', tile: '#fde6ea' },
  penguin: { body: '#5f7398', belly: '#fffdf8', mark: '#ffb347', inner: '#4f6286', tile: '#dfe9f6' },
  hamster: { body: '#ffcd8f', belly: '#fffaf1', mark: '#e9a560', inner: '#ffb8c0', tile: '#ffedd6' },
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
    sw: icon ? 4.6 : 3.2,
  }
  const head = HEADS[ctx.species]
  const parts = [
    `<defs><clipPath id="${ctx.id}-clip"><path d="${headPath(ctx.species)}"/></clipPath></defs>`,
    icon ? '' : `<ellipse cx="60" cy="108" rx="30" ry="4.5" fill="${INK}" opacity="0.1"/>`,
    // Icons zoom onto the head: at 16px every pixel goes to ears, colour and face.
    icon ? `<g transform="translate(60 ${head.cy + 2}) scale(${head.iconScale}) translate(-60 -${head.cy + 2})">` : '',
    icon ? '' : renderTail(ctx),
    icon ? '' : renderBody(ctx),
    renderEarsBehind(ctx),
    renderHead(ctx),
    renderFace(ctx),
    icon ? '' : renderPaws(ctx),
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

// ---------- anatomy: a big round head on a small body (chibi proportions) ----------

type Head = { cx: number, cy: number, rx: number, ry: number, iconScale: number }

const HEADS: Record<PetSpecies, Head> = {
  cat: { cx: 60, cy: 54, rx: 34, ry: 29, iconScale: 1.3 },
  dog: { cx: 60, cy: 54, rx: 33, ry: 30, iconScale: 1.3 },
  rabbit: { cx: 60, cy: 60, rx: 31, ry: 27, iconScale: 1.12 },
  hamster: { cx: 60, cy: 60, rx: 38, ry: 33, iconScale: 1.22 },
  hedgehog: { cx: 60, cy: 58, rx: 30, ry: 27, iconScale: 1.12 },
  penguin: { cx: 60, cy: 50, rx: 32, ry: 30, iconScale: 1.3 },
}

// Eye line, eye spacing and where the nose sits, per species.
const FACE: Record<PetSpecies, { eyeY: number, eyeDx: number, noseY: number }> = {
  cat: { eyeY: 57, eyeDx: 14, noseY: 64 },
  dog: { eyeY: 54, eyeDx: 14, noseY: 64 },
  rabbit: { eyeY: 62, eyeDx: 13, noseY: 69 },
  hamster: { eyeY: 59, eyeDx: 15, noseY: 67 },
  hedgehog: { eyeY: 61, eyeDx: 12, noseY: 69 },
  penguin: { eyeY: 51, eyeDx: 12, noseY: 60 },
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`
}

function headPath(species: PetSpecies): string {
  const h = HEADS[species]
  if (species === 'penguin') {
    // Penguins are one egg: the head is the top of the body.
    return 'M60 18C84 18 95 40 95 64C95 90 82 104 60 104C38 104 25 90 25 64C25 40 36 18 60 18Z'
  }
  if (species === 'hamster') {
    // Chubby: a wide bun that is a bit flatter on top.
    return 'M60 28C88 28 99 46 99 63C99 82 84 94 60 94C36 94 21 82 21 63C21 46 32 28 60 28Z'
  }

  return ellipsePath(h.cx, h.cy, h.rx, h.ry)
}

function inked(d: string, fill: string, ctx: Ctx, extra = ''): string {
  return `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${ctx.sw}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`
}

function line(d: string, color: string, width: number, extra = ''): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`
}

function renderTail(ctx: Ctx): string {
  const { p } = ctx

  switch (ctx.species) {
    case 'cat':
      // Long curled tabby tail with stripes.
      return [
        line('M80 96C98 98 106 86 102 72C100 64 94 62 92 66', INK, ctx.sw + 7.5),
        line('M80 96C98 98 106 86 102 72C100 64 94 62 92 66', p.body, 7.5),
        line('M97 93l3-4M103 83l4-1M104 73l4 1', p.mark, 2.6),
      ].join('')
    case 'dog':
      return [
        line('M80 92C92 90 96 80 92 72', INK, ctx.sw + 6),
        line('M80 92C92 90 96 80 92 72', p.mark, 6),
      ].join('')
    case 'rabbit':
      return `<circle cx="84" cy="98" r="7" fill="#ffffff" stroke="${INK}" stroke-width="${ctx.sw}"/>`
    default:
      return ''
  }
}

function renderBody(ctx: Ctx): string {
  const { p } = ctx

  if (ctx.species === 'penguin') {
    // Egg body with a white tummy; flippers and orange feet.
    return [
      inked('M30 74C20 80 18 92 24 96C30 92 34 86 34 80Z', p.inner, ctx),
      inked('M90 74C100 80 102 92 96 96C90 92 86 86 86 80Z', p.inner, ctx),
      inked('M44 101C40 101 37 104 40 107H54C56 104 52 101 48 101Z', p.mark, ctx),
      inked('M76 101C80 101 83 104 80 107H66C64 104 68 101 72 101Z', p.mark, ctx),
    ].join('')
  }

  const wide = ctx.species === 'hamster'
  const body = wide ? ellipsePath(60, 90, 33, 16) : ellipsePath(60, 90, 24, 16)
  const belly = wide ? ellipsePath(60, 93, 20, 10) : ellipsePath(60, 93, 13, 10)
  const bellyFill = ctx.species === 'hedgehog' ? p.body : p.belly

  return [
    inked(body, ctx.species === 'hedgehog' ? p.mark : p.body, ctx),
    `<path d="${belly}" fill="${bellyFill}"/>`,
    // Feet peeking out under the body.
    `<ellipse cx="${wide ? 44 : 49}" cy="104" rx="8" ry="5" fill="${ctx.species === 'hedgehog' ? p.body : p.body}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
    `<ellipse cx="${wide ? 76 : 71}" cy="104" rx="8" ry="5" fill="${p.body}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
  ].join('')
}

function renderEarsBehind(ctx: Ctx): string {
  const { p } = ctx

  switch (ctx.species) {
    case 'cat':
      return [
        inked('M30 46C26 32 28 18 33 12C42 15 50 24 54 32Z', p.body, ctx),
        inked('M90 46C94 32 92 18 87 12C78 15 70 24 66 32Z', p.body, ctx),
        `<path d="M33 40C31 31 32 23 35 19C40 22 44 27 47 32Z" fill="${p.inner}"/>`,
        `<path d="M87 40C89 31 88 23 85 19C80 22 76 27 73 32Z" fill="${p.inner}"/>`,
      ].join('')
    case 'rabbit':
      return [
        `<g transform="rotate(-10 47 40)">`,
        inked(ellipsePath(47, 24, 8.5, 18), '#ffffff', ctx),
        `<path d="${ellipsePath(47, 26, 4.2, 12.5)}" fill="${p.inner}"/></g>`,
        `<g transform="rotate(10 73 40)">`,
        inked(ellipsePath(73, 24, 8.5, 18), '#ffffff', ctx),
        `<path d="${ellipsePath(73, 26, 4.2, 12.5)}" fill="${p.inner}"/></g>`,
      ].join('')
    case 'hamster':
      return [
        `<circle cx="34" cy="34" r="9" fill="${p.body}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
        `<circle cx="86" cy="34" r="9" fill="${p.body}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
        `<circle cx="34" cy="34" r="4.5" fill="${p.inner}"/>`,
        `<circle cx="86" cy="34" r="4.5" fill="${p.inner}"/>`,
      ].join('')
    case 'hedgehog':
      // A crown of spines behind the face.
      return [
        inked(hedgehogSpikes(), p.mark, ctx),
        `<circle cx="38" cy="38" r="6" fill="${p.body}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
        `<circle cx="82" cy="38" r="6" fill="${p.body}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
      ].join('')
    case 'penguin':
      return line('M58 19C55 11 61 7 66 10', INK, ctx.sw)
    default:
      return ''
  }
}

function renderHead(ctx: Ctx): string {
  const { p, id } = ctx
  const clip = `clip-path="url(#${id}-clip)"`
  const path = headPath(ctx.species)
  const markings: string[] = []

  switch (ctx.species) {
    case 'cat':
      // Tabby forehead stripes and a pale muzzle.
      markings.push(
        `<g ${clip}><ellipse cx="60" cy="70" rx="17" ry="11" fill="${p.belly}"/></g>`,
        line('M55 27l1.5 7M60 25v8M65 27l-1.5 7', p.mark, 3),
        line('M27 52l7 2M27 59l7 0M93 52l-7 2M93 59l-7 0', p.mark, 2.6),
      )
      break
    case 'dog':
      markings.push(
        `<g ${clip}><ellipse cx="74" cy="48" rx="12" ry="11" fill="${p.mark}" opacity="0.55"/><ellipse cx="60" cy="69" rx="16" ry="11" fill="${p.belly}"/></g>`,
      )
      break
    case 'hamster':
      markings.push(
        `<g ${clip}><ellipse cx="60" cy="92" rx="40" ry="22" fill="${p.belly}"/></g>`,
        line('M60 31v8', p.mark, 3.2),
      )
      break
    case 'penguin':
      // Heart-shaped white face mask and white tummy.
      markings.push(
        `<g ${clip}><path d="M60 40C53 30 34 33 34 50C34 62 44 70 60 72C76 70 86 62 86 50C86 33 67 30 60 40Z" fill="${p.belly}"/><ellipse cx="60" cy="88" rx="22" ry="20" fill="${p.belly}"/></g>`,
      )
      break
    case 'hedgehog':
      markings.push(`<g ${clip}><ellipse cx="60" cy="72" rx="14" ry="10" fill="#fff6ea"/></g>`)
      break
  }

  const outline = `<path d="${path}" fill="none" stroke="${INK}" stroke-width="${ctx.sw}" stroke-linejoin="round"/>`
  // A soft shine on the top-left of the head makes it read round and plush.
  const shine = ctx.icon
    ? ''
    : `<g ${clip}><ellipse cx="44" cy="${HEADS[ctx.species].cy - 16}" rx="9" ry="5" fill="#ffffff" opacity="0.45" transform="rotate(-20 44 ${HEADS[ctx.species].cy - 16})"/></g>`
  const floppyEars = ctx.species === 'dog'
    ? [
        inked('M30 36C18 38 14 58 19 72C23 80 32 77 34 66C36 56 38 46 37 40Z', p.mark, ctx),
        inked('M90 36C102 38 106 58 101 72C97 80 88 77 86 66C84 56 82 46 83 40Z', p.mark, ctx),
      ].join('')
    : ''

  return `<path d="${path}" fill="${p.body}"/>${markings.join('')}${shine}${outline}${floppyEars}`
}

// ---------- face: big glossy eyes, little nose, cheeks ----------

function renderFace(ctx: Ctx): string {
  const f = FACE[ctx.species]
  const left = 60 - f.eyeDx
  const right = 60 + f.eyeDx
  const blushY = f.eyeY + 8
  const blushDx = f.eyeDx + 9

  return [
    renderBlush(60 - blushDx, blushY, ctx),
    renderBlush(60 + blushDx, blushY, ctx),
    ctx.species === 'cat' && !ctx.icon ? renderWhiskers(f.noseY, ctx) : '',
    // Open eyes get a class so the room can make them blink; drawn expressions stay put.
    OPEN_EYE_STATUSES.has(ctx.status) ? '<g class="pet-eyes">' : '<g>',
    renderEye(left, f.eyeY, 'left', ctx),
    renderEye(right, f.eyeY, 'right', ctx),
    '</g>',
    renderNose(f.noseY, ctx),
    ctx.species === 'penguin' ? '' : renderMouth(f.noseY + 3, ctx),
  ].join('')
}

function renderWhiskers(y: number, ctx: Ctx): string {
  return line(`M37 ${y - 1}l-11-3M37 ${y + 3}l-11 1M83 ${y - 1}l11-3M83 ${y + 3}l11 1`, INK, 1.6, ' opacity="0.7"')
    + (ctx.icon ? '' : '')
}

function renderBlush(x: number, y: number, ctx: Ctx): string {
  const blob = `<ellipse cx="${x}" cy="${y}" rx="${ctx.icon ? 7 : 6}" ry="${ctx.icon ? 4.5 : 3.6}" fill="${BLUSH}"/>`
  if (ctx.icon) return blob

  const hatch = [-3, 0, 3]
    .map((dx) => `<path d="M${x + dx - 1.2} ${y + 1.6}L${x + dx + 1.2} ${y - 1.6}" stroke="${BLUSH_LINE}" stroke-width="1.2" stroke-linecap="round"/>`)
    .join('')

  return blob + hatch
}

function renderEye(x: number, y: number, side: 'left' | 'right', ctx: Ctx): string {
  const k = ctx.icon ? 1.25 : 1
  const stroke = `fill="none" stroke="${INK}" stroke-width="${(3 * k).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"`
  // Big glossy kawaii eye: tall dark oval, a large catch-light and a tiny second one.
  const glossy = (rx: number, ry: number) => [
    `<ellipse cx="${x}" cy="${y}" rx="${rx * k}" ry="${ry * k}" fill="${INK}"/>`,
    `<circle cx="${x + rx * 0.35 * k}" cy="${y - ry * 0.38 * k}" r="${rx * 0.42 * k}" fill="#ffffff"/>`,
    ctx.icon ? '' : `<circle cx="${x - rx * 0.35}" cy="${y + ry * 0.42}" r="${rx * 0.2}" fill="#ffffff"/>`,
  ].join('')

  switch (ctx.status) {
    case 'excited':
      return `<path d="M${x - 5 * k} ${y + 2} Q${x} ${y - 5 * k} ${x + 5 * k} ${y + 2}" ${stroke}/>`
    case 'sleepy':
      return `<path d="M${x - 5 * k} ${y} Q${x} ${y + 4 * k} ${x + 5 * k} ${y}" ${stroke}/>`
    case 'bored':
      // Half-lidded: the lid line cuts the glossy eye in half.
      return [
        `<path d="M${x - 4.6 * k} ${y}A${4.6 * k} ${5 * k} 0 0 0 ${x + 4.6 * k} ${y}Z" fill="${INK}"/>`,
        `<path d="M${x - 5.6 * k} ${y}H${x + 5.6 * k}" ${stroke}/>`,
      ].join('')
    case 'dirty': {
      const dir = side === 'left' ? 1 : -1
      const s = 4 * k

      return `<path d="M${x - dir * s} ${y - s} L${x + dir * s * 0.7} ${y} L${x - dir * s} ${y + s}" ${stroke}/>`
    }
    case 'hungry':
      return glossy(5.6, 6.6) + (ctx.icon ? '' : `<path d="M${x - 1.5} ${y + 2.6}l1 1.2 1-1.2" fill="none" stroke="#ffffff" stroke-width="1"/>`)
    default:
      return glossy(4.8, 5.8)
  }
}

function renderNose(y: number, ctx: Ctx): string {
  switch (ctx.species) {
    case 'cat':
      return `<path d="M57 ${y - 1.5}H63L60 ${y + 1.8}Z" fill="#f28b95" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`
    case 'dog':
      return `<ellipse cx="60" cy="${y}" rx="${ctx.icon ? 5.5 : 4.6}" ry="${ctx.icon ? 4 : 3.4}" fill="${INK}"/><circle cx="58.4" cy="${y - 1.2}" r="1.2" fill="#ffffff"/>`
    case 'hedgehog':
      return `<circle cx="60" cy="${y}" r="${ctx.icon ? 4.4 : 3.6}" fill="${INK}"/><circle cx="58.8" cy="${y - 1}" r="1" fill="#ffffff"/>`
    case 'rabbit':
    case 'hamster':
      return `<ellipse cx="60" cy="${y}" rx="2.6" ry="1.9" fill="#f28b95"/>`
    case 'penguin': {
      const by = y
      if (ctx.status === 'excited') {
        return `<path d="M53 ${by}Q60 ${by - 4} 67 ${by}L60 ${by + 4}Z" fill="${ctx.p.mark}" stroke="${INK}" stroke-width="${ctx.sw * 0.7}" stroke-linejoin="round"/><path d="M54.5 ${by + 4}Q60 ${by + 11} 65.5 ${by + 4}Z" fill="#f08a84" stroke="${INK}" stroke-width="${ctx.sw * 0.7}" stroke-linejoin="round"/>`
      }

      return `<path d="M53.5 ${by}Q60 ${by - 3.5} 66.5 ${by}Q63 ${by + 6} 60 ${by + 6}Q57 ${by + 6} 53.5 ${by}Z" fill="${ctx.p.mark}" stroke="${INK}" stroke-width="${ctx.sw * 0.7}" stroke-linejoin="round"/>`
    }
  }
}

function renderMouth(y: number, ctx: Ctx): string {
  const w = ctx.icon ? 3.4 : 2.2
  const stroke = `fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`
  const omega = `<path d="M55 ${y}Q57.5 ${y + 3.4} 60 ${y}Q62.5 ${y + 3.4} 65 ${y}" ${stroke}/>`

  switch (ctx.status) {
    case 'excited':
      return `<path d="M54 ${y - 1}Q60 ${y + 10} 66 ${y - 1}Z" fill="${INK}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/><path d="M56.8 ${y + 3.6}Q60 ${y + 1.4} 63.2 ${y + 3.6}Q60 ${y + 7} 56.8 ${y + 3.6}Z" fill="#f08a84"/>`
    case 'hungry':
      return `<ellipse cx="60" cy="${y + 2}" rx="2.6" ry="3" fill="${INK}"/>${ctx.icon ? '' : `<path d="M64 ${y + 2}C63.5 ${y + 6} 63 ${y + 9} 65 ${y + 10.5}C67 ${y + 9} 66 ${y + 6} 64 ${y + 2}Z" fill="#a9d6f5" stroke="${INK}" stroke-width="1.2"/>`}`
    case 'sleepy':
      return `<ellipse cx="60" cy="${y + 2}" rx="1.8" ry="2" fill="${INK}"/>`
    case 'bored':
      return `<path d="M57 ${y + 2}H63" ${stroke}/>`
    case 'dirty':
      return `<path d="M54.5 ${y + 3}Q57.25 ${y + 0.5} 60 ${y + 3}T65.5 ${y + 3}" ${stroke}/>`
    default:
      if (ctx.species === 'dog' && !ctx.icon) {
        // Happy pup: little tongue out.
        return omega + `<path d="M57.5 ${y + 1.6}Q60 ${y + 9} 62.5 ${y + 1.6}Z" fill="#ff9aa6" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`
      }

      return omega
  }
}

function renderPaws(ctx: Ctx): string {
  const { p } = ctx
  if (ctx.species === 'penguin') return ''

  const fill = ctx.species === 'hedgehog' ? p.body : p.body
  if (ctx.status === 'excited') {
    // Paws up in a cheer beside the face.
    return [
      `<ellipse cx="27" cy="74" rx="6.5" ry="8" transform="rotate(30 27 74)" fill="${fill}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
      `<ellipse cx="93" cy="74" rx="6.5" ry="8" transform="rotate(-30 93 74)" fill="${fill}" stroke="${INK}" stroke-width="${ctx.sw}"/>`,
    ].join('')
  }

  // Front paws resting on the tummy, with tiny toe lines.
  const y = ctx.species === 'hamster' ? 86 : 88
  const dx = ctx.species === 'hamster' ? 14 : 10

  return [
    `<ellipse cx="${60 - dx}" cy="${y}" rx="6" ry="5" fill="${fill}" stroke="${INK}" stroke-width="${ctx.sw * 0.85}"/>`,
    `<ellipse cx="${60 + dx}" cy="${y}" rx="6" ry="5" fill="${fill}" stroke="${INK}" stroke-width="${ctx.sw * 0.85}"/>`,
    line(`M${60 - dx - 1.6} ${y + 1.5}v2M${60 - dx + 1.6} ${y + 1.5}v2M${60 + dx - 1.6} ${y + 1.5}v2M${60 + dx + 1.6} ${y + 1.5}v2`, INK, 1.2),
  ].join('')
}

// ---------- outfits (cosmetic pack) ----------

function headTop(species: PetSpecies): number {
  if (species === 'penguin') return 19
  if (species === 'hamster') return 29

  return HEADS[species].cy - HEADS[species].ry
}

function renderOutfit(ctx: Ctx, outfit: PetOutfitId): string {
  const w = ctx.sw * 0.8
  const top = headTop(ctx.species)

  switch (outfit) {
    case 'party-hat': {
      const base = top + 6

      return [
        `<g transform="rotate(10 60 ${base})">`,
        `<path d="M46 ${base}L60 ${base - 28}L74 ${base}Q60 ${base + 6} 46 ${base}Z" fill="#8fc3ea" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`,
        `<circle cx="56" cy="${base - 10}" r="2.4" fill="#ffffff"/><circle cx="64" cy="${base - 4}" r="2.4" fill="#ffffff"/><circle cx="61" cy="${base - 18}" r="2" fill="#ffffff"/>`,
        `<circle cx="60" cy="${base - 29}" r="5" fill="#ffd25e" stroke="${INK}" stroke-width="${w}"/>`,
        '</g>',
      ].join('')
    }
    case 'ribbon': {
      const x = 80
      const y = top + 8

      return [
        `<path d="M${x} ${y}C${x - 16} ${y - 16} ${x - 21} ${y + 6} ${x} ${y}Z" fill="#ff9aa6" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`,
        `<path d="M${x} ${y}C${x + 16} ${y - 16} ${x + 21} ${y + 6} ${x} ${y}Z" fill="#ff9aa6" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`,
        `<circle cx="${x}" cy="${y - 1}" r="4.4" fill="#ff7f8f" stroke="${INK}" stroke-width="${w}"/>`,
      ].join('')
    }
    case 'scarf': {
      const y = ctx.species === 'penguin' ? 74 : HEADS[ctx.species].cy + HEADS[ctx.species].ry - 4

      return [
        `<path d="M74 ${y + 4}L80 ${y + 18}L89 ${y + 15}L84 ${y + 2}Z" fill="#ff8a7a" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`,
        `<path d="M34 ${y - 2}Q60 ${y + 8} 86 ${y - 2}L86 ${y + 6}Q60 ${y + 16} 34 ${y + 6}Z" fill="#ff8a7a" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`,
        `<path d="M44 ${y + 4}L45 ${y + 10}M58 ${y + 6}L58.5 ${y + 12}M72 ${y + 5}L71 ${y + 11}" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity="0.8"/>`,
      ].join('')
    }
    case 'glasses': {
      const f = FACE[ctx.species]
      const left = 60 - f.eyeDx
      const right = 60 + f.eyeDx
      const y = f.eyeY
      const r = ctx.icon ? 9.5 : 8.5

      return [
        `<circle cx="${left}" cy="${y}" r="${r}" fill="#ffffff" fill-opacity="0.2" stroke="${INK}" stroke-width="${w}"/>`,
        `<circle cx="${right}" cy="${y}" r="${r}" fill="#ffffff" fill-opacity="0.2" stroke="${INK}" stroke-width="${w}"/>`,
        `<path d="M${left + r} ${y - 1}Q60 ${y - 4} ${right - r} ${y - 1}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round"/>`,
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
  const cx = 60
  const cy = 60
  const spikes = 13
  const start = Math.PI * 0.9
  const end = Math.PI * 2.1
  const points: string[] = [`${cx - 27} ${cy + 14}`]

  for (let i = 0; i <= spikes * 2; i += 1) {
    const t = start + ((end - start) * i) / (spikes * 2)
    const isTip = i % 2 === 1
    const rx = isTip ? 44 : 36
    const ry = isTip ? 41 : 33
    points.push(`${(cx + Math.cos(t) * rx).toFixed(1)} ${(cy + Math.sin(t) * ry).toFixed(1)}`)
  }
  points.push(`${cx + 27} ${cy + 14}`)

  return `M${points.join('L')}Z`
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '')
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
