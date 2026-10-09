// Service worker: keeps the toolbar icon in sync with the pet and nudges when care is needed.
import { CARE_NOTIFICATION_COOLDOWN_MS } from '~/constants/pet'
import type { PetStatus } from '~/types/pet'
import { petNeedsCare, renderPetArtSvg } from '~/utils/petArt'
import { getMessages } from './messages'
import { loadPet, serializePet, statusOf } from './petCore'
import { LAST_NOTIFIED_KEY, LAST_STATUS_KEY, NOTIFY_KEY, PET_KEY, readStorage, writeStorage } from './storage'

const ALARM = 'tab-pet-tick'
const ICON_SIZES = [16, 32] as const

chrome.runtime.onInstalled.addListener(() => {
  void chrome.alarms.create(ALARM, { periodInMinutes: 5 })
  void refresh()
})
chrome.runtime.onStartup.addListener(() => void refresh())
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) void refresh()
})
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && PET_KEY in changes) void refreshIcon()
})
chrome.notifications.onClicked.addListener(() => {
  void chrome.action.openPopup?.().catch(() => undefined)
})

// Applies time passed since the last save, then updates icon and maybe notifies.
async function refresh(): Promise<void> {
  const now = Date.now()
  const pet = loadPet(await readStorage(PET_KEY), now)
  if (!pet) {
    await setIdleIcon()
    return
  }

  await writeStorage({ [PET_KEY]: serializePet(pet) })
  const status = statusOf(pet, now)
  await maybeNotify(pet.name, status, now)
}

async function refreshIcon(): Promise<void> {
  const now = Date.now()
  const pet = loadPet(await readStorage(PET_KEY), now)
  if (!pet) {
    await setIdleIcon()
    return
  }

  const status = statusOf(pet, now)
  const messages = getMessages()
  const svg = renderPetArtSvg({ species: pet.species, status, variant: 'icon', idPrefix: 'ext', outfit: null })

  await chrome.action.setIcon({ imageData: await rasterize(svg) })
  await chrome.action.setTitle({ title: `${pet.name} · ${messages.status.labels[status]}` })
}

async function setIdleIcon(): Promise<void> {
  await chrome.action.setIcon({ path: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png' } })
  await chrome.action.setTitle({ title: getMessages().setup.title })
}

async function maybeNotify(name: string, status: PetStatus, now: number): Promise<void> {
  const previous = await readStorage<PetStatus>(LAST_STATUS_KEY)
  await writeStorage({ [LAST_STATUS_KEY]: status })

  if (!petNeedsCare(status) || (previous && petNeedsCare(previous))) return
  if ((await readStorage<boolean>(NOTIFY_KEY)) !== true) return

  const last = Number(await readStorage(LAST_NOTIFIED_KEY))
  if (Number.isFinite(last) && now - last < CARE_NOTIFICATION_COOLDOWN_MS) return

  await chrome.notifications.create('tab-pet-care', {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: name,
    message: getMessages().status.messages[status],
  })
  await writeStorage({ [LAST_NOTIFIED_KEY]: now })
}

// Service workers have no <img>; an offscreen document turns the SVG into pixels.
async function rasterize(svg: string): Promise<Record<number, ImageData>> {
  await ensureOffscreen()
  const response = await chrome.runtime.sendMessage({ target: 'offscreen', type: 'rasterize', svg, sizes: ICON_SIZES })
  const images: Record<number, ImageData> = {}

  for (const size of ICON_SIZES) {
    const { width, height, data } = response[size] as { width: number, height: number, data: number[] }
    images[size] = new ImageData(new Uint8ClampedArray(data), width, height)
  }

  return images
}

async function ensureOffscreen(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType] })
  if (contexts.length > 0) return

  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['DOM_PARSER' as chrome.offscreen.Reason],
    justification: 'Draw the pet SVG into toolbar icon pixels.',
  })
}
