// Renders Chrome Web Store images from the real popup:
// screenshots (1280×800) and the small promo tile (440×280), in Korean and English.
// Usage: npm run build:extension && node extension/store/shots.mjs
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const here = dirname(fileURLToPath(import.meta.url))
const extensionPath = resolve(here, '../dist')
const outdir = resolve(here, 'images')

const COPY = {
  ko: {
    care: ['툴바에 사는 작은 친구', '탭을 안 열어도 아이콘에서 지내요.\n가끔 밥 주고, 놀아주고, 재워주세요.'],
    outfit: ['웹에서 산 꾸미기도 그대로', '백업 코드 한 줄이면 펫도, 옷도 같이 와요.'],
    adopt: ['여섯 친구 중 하나를 골라요', '배고프거나 심심하면\n아이콘에 살짝 티를 내요.'],
    tile: ['Tab Pet', '툴바에 사는 작은 친구'],
    name: '콩이',
    adoptName: '몽이',
  },
  en: {
    care: ['A tiny friend in your toolbar', 'It lives in the icon, no tab needed.\nFeed it, play, tuck it in now and then.'],
    outfit: ['Your outfits come along', 'One backup code brings your pet and its outfits.'],
    adopt: ['Pick one of six friends', 'When it gets hungry or bored,\nthe icon quietly lets you know.'],
    tile: ['Tab Pet', 'A tiny friend in your toolbar'],
    name: 'Bean',
    adoptName: 'Mochi',
  },
}

const OUTFIT_PACK = [{ productId: 'outfit-pack', orderId: 'store-shot', issuedAt: 1, signature: 'store-shot' }]

mkdirSync(outdir, { recursive: true })

for (const [locale, copy] of Object.entries(COPY)) {
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    locale,
    colorScheme: 'light',
    deviceScaleFactor: 2,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`, `--lang=${locale}`],
  })

  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker')
    const popupUrl = `chrome-extension://${new URL(worker.url()).host}/popup.html`
    const popup = await context.newPage()
    await popup.setViewportSize({ width: 340, height: 700 })
    await popup.goto(popupUrl)

    await popup.locator('.adopt__name').fill(copy.adoptName)
    const adoptShot = await popup.locator('main').screenshot()
    const tileArt = await popup.locator('.adopt__option').nth(5).locator('svg').evaluate((node) => node.outerHTML)

    await popup.locator('.adopt__option').nth(5).click()
    await popup.locator('.adopt__name').fill(copy.name)
    await popup.locator('.primary').click()
    await popup.locator('.action').nth(0).click()
    await popup.locator('.action').nth(1).click()
    const careShot = await popup.locator('main').screenshot()

    await worker.evaluate(async (entitlements) => {
      const { pet } = await chrome.storage.local.get('pet')
      await chrome.storage.local.set({ entitlements, pet: { ...pet, settings: { ...pet.settings, outfit: 'ribbon' } } })
    }, OUTFIT_PACK)
    await popup.reload()
    await popup.locator('.more summary').click()
    await popup.evaluate(() => {
      // Keep the store shot about outfits: hide the backup section below the picker.
      document.querySelectorAll('.more > :not(summary, .outfits)').forEach((node) => node.remove())
    })
    const outfitShot = await popup.locator('main').screenshot()

    const stage = await context.newPage()
    await stage.setViewportSize({ width: 1280, height: 800 })
    for (const [key, shot] of [['care', careShot], ['outfit', outfitShot], ['adopt', adoptShot]]) {
      await stage.setContent(screenshotPage(copy[key], shot))
      await stage.screenshot({ path: resolve(outdir, `${locale}-${key}.png`), scale: 'css' })
    }

    await stage.setViewportSize({ width: 440, height: 280 })
    await stage.setContent(tilePage(copy.tile, tileArt))
    await stage.screenshot({ path: resolve(outdir, `${locale}-tile.png`), scale: 'css' })
  } finally {
    await context.close()
  }
}

console.log(`Store images ready: ${outdir}`)

function base(body) {
  return `<!doctype html><meta charset="utf-8"><style>
    * { box-sizing: border-box; margin: 0; }
    body { background: #f5f1ea; color: #2a2420; font-family: -apple-system, "Apple SD Gothic Neo", "Pretendard", system-ui, sans-serif; letter-spacing: -0.02em; height: 100vh; overflow: hidden; }
  </style>${body}`
}

function screenshotPage([title, lead], shot) {
  return base(`<style>
    .wrap { align-items: center; display: grid; gap: 72px; grid-template-columns: 1fr 380px; height: 100%; padding: 0 120px; }
    h1 { font-size: 52px; font-weight: 800; line-height: 1.2; }
    p { color: #7a7068; font-size: 24px; line-height: 1.55; margin-top: 20px; white-space: pre-line; }
    .dot { background: #ff6b4a; border-radius: 50%; display: inline-block; height: 14px; margin-left: 6px; vertical-align: super; width: 14px; }
    .popup { background: #fffdf9; border: 1px solid #e6ded2; border-radius: 18px; box-shadow: 0 24px 60px rgba(80, 60, 40, 0.16); max-height: 700px; overflow: hidden; }
    .popup img { display: block; width: 340px; }
    .popup-wrap { display: grid; justify-items: center; }
  </style><div class="wrap">
    <div><h1>${title}<span class="dot"></span></h1><p>${lead}</p></div>
    <div class="popup-wrap"><div class="popup"><img src="data:image/png;base64,${shot.toString('base64')}"></div></div>
  </div>`)
}

function tilePage([title, lead], art) {
  return base(`<style>
    .tile { align-items: center; display: grid; gap: 18px; grid-template-columns: 170px 1fr; height: 100%; padding: 0 34px; }
    .art svg { display: block; height: 170px; width: 170px; }
    h1 { font-size: 40px; font-weight: 800; }
    p { color: #7a7068; font-size: 19px; line-height: 1.4; margin-top: 8px; }
  </style><div class="tile"><div class="art">${art}</div><div><h1>${title}</h1><p>${lead}</p></div></div>`)
}
