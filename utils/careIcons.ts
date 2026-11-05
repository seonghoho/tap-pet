import type { PetAction } from '~/types/pet'

// Little sticker illustrations for the four care actions, in the pets' style: warm ink
// outline, flat pastel fills. Shared by the website (CareIcon.vue) and the extension popup.
// The outline colour follows --care-icon-ink so a coloured button can recolour it.

const STROKE = 'stroke="var(--care-icon-ink, #4a3934)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"'

const BODIES: Record<PetAction, string> = {
  feed: `<circle cx="17" cy="22" r="4.5" fill="#d99b62" /> <circle cx="24" cy="18.5" r="5" fill="#e0a86e" /> <circle cx="31" cy="22" r="4.5" fill="#c98a52" /> <path d="M6 25H42C42 34 35 41 24 41S6 34 6 25Z" fill="#ff9f86" /> <rect x="4" y="22" width="40" height="6" rx="3" fill="#ffc4b3" /> <path d="M24 36c-3-2-4.5-4-3-5.2c1-.8 2.4-.3 3 .8c.6-1.1 2-1.6 3-.8c1.5 1.2 0 3.2-3 5.2Z" fill="#ffffff" stroke="none" />`,
  play: `<defs> <clipPath id="care-ball-clip"><circle cx="24" cy="23" r="15" /></clipPath> </defs> <g clip-path="url(#care-ball-clip)" stroke="none"> <rect x="8" y="7" width="32" height="32" fill="#8fc3ea" /> <path d="M24 7C14 12 12 30 20 40H6V7Z" fill="#ff9aa6" /> <path d="M24 7C18 14 18 32 24 40C30 32 30 14 24 7Z" fill="#fff6e8" /> </g> <path d="M24 8C18 14 18 32 24 38M24 8C30 14 30 32 24 38" fill="none" /> <circle cx="24" cy="23" r="15" fill="none" /> <path d="M14 15a10 10 0 0 1 5-4" fill="none" stroke="#ffffff" stroke-width="2.6" /> <path d="M16 44H32" stroke-width="2" opacity="0.35" />`,
  sleep: `<path d="M30 34A14 14 0 1 1 22 9A11 11 0 0 0 30 34Z" fill="#ffe17a" /> <path d="M13 22q2.5 2.5 5 0" fill="none" /> <circle cx="12" cy="27" r="2.2" fill="#ffb3b3" stroke="none" /> <path d="M31 10h7l-7 7h7" fill="none" stroke="#8fb3e6" stroke-width="2.6" /> <path d="M39 22l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1Z" fill="#fff6d6" stroke-width="1.6" />`,
  wash: `<circle cx="19" cy="27" r="11" fill="#cdeeea" /> <circle cx="33" cy="17" r="7" fill="#dbe4f7" /> <circle cx="34" cy="33" r="5" fill="#ffd9e0" /> <path d="M13 23a6 6 0 0 1 5-4" fill="none" stroke="#ffffff" stroke-width="2.6" /> <path d="M30 14a3 3 0 0 1 3-2" fill="none" stroke="#ffffff" stroke-width="2.2" /> <path d="M10 8l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1Z" fill="#ffe17a" stroke-width="1.8" />`,
}

// Inner markup for a 48×48 viewBox.
export function careIconMarkup(action: PetAction): string {
  return `<g ${STROKE}>${BODIES[action]}</g>`
}

export function careIconSvg(action: PetAction, className = 'care-icon'): string {
  return `<svg class="${className}" viewBox="0 0 48 48" aria-hidden="true">${careIconMarkup(action)}</svg>`
}
