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
    await popup.locator('.adopt__name').blur()
    const adoptShot = await popup.locator('main').screenshot()
    const tileArt = await popup.locator('.adopt__option').nth(5).locator('svg').evaluate((node) => node.outerHTML)

    await popup.locator('.adopt__option').nth(5).click()
    await popup.locator('.adopt__name').fill(copy.name)
    await popup.locator('.primary').click()
    await popup.locator('.action').nth(0).click()
    await popup.locator('.action').nth(1).click()
    await popup.mouse.move(0, 0) // No hover lift on the last button clicked.
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
      await stage.setContent(screenshotPage(copy[key], shot), { waitUntil: 'networkidle' })
      await stage.evaluate(() => document.fonts.ready)
      await stage.screenshot({ path: resolve(outdir, `${locale}-${key}.png`), scale: 'css' })
    }

    await stage.setViewportSize({ width: 440, height: 280 })
    await stage.setContent(tilePage(copy.tile, tileArt), { waitUntil: 'networkidle' })
    await stage.evaluate(() => document.fonts.ready)
    await stage.screenshot({ path: resolve(outdir, `${locale}-tile.png`), scale: 'css' })
  } finally {
    await context.close()
  }
}

console.log(`Store images ready: ${outdir}`)

// The frame around the popup uses the website's look: dotted wallpaper, rounded Jua
// headings, sticker outlines. (Jua is fetched while rendering; the extension itself
// still makes no network requests.)
function base(body) {
  return `<!doctype html><meta charset="utf-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jua&display=block">
  <style>
    * { box-sizing: border-box; margin: 0; }
    body {
      background:
        radial-gradient(#f6dcc0 2.4px, transparent 2.8px) 0 0 / 34px 34px,
        radial-gradient(#f6dcc0 2.4px, transparent 2.8px) 17px 17px / 34px 34px,
        #fdf1e2;
      color: #2a2420;
      font-family: -apple-system, "Apple SD Gothic Neo", "Pretendard", system-ui, sans-serif;
      height: 100vh;
      letter-spacing: -0.02em;
      overflow: hidden;
    }
    h1 { font-family: "Jua", -apple-system, "Apple SD Gothic Neo", sans-serif; font-weight: 400; letter-spacing: 0; }
    .floor { background: #ecc49a; border-top: 4px solid #4a3934; bottom: 0; height: 22%; left: 0; position: fixed; right: 0; }
  </style>${body}`
}

// Keep the red dot glued to the last word so it never wraps onto a line of its own.
function withDot(title) {
  return title.replace(/(\S+)$/, '<span style="white-space: nowrap">$1<span class="dot"></span></span>')
}

function screenshotPage([title, lead], shot) {
  return base(`<style>
    .wrap { align-items: center; display: grid; gap: 72px; grid-template-columns: 1fr 380px; height: 100%; padding: 0 120px; position: relative; }
    h1 { font-size: 60px; line-height: 1.2; }
    p { color: #6f625a; font-size: 25px; line-height: 1.55; margin-top: 22px; white-space: pre-line; }
    .dot { background: #ff6b4a; border: 3px solid #4a3934; border-radius: 50%; display: inline-block; height: 20px; margin-left: 8px; vertical-align: super; width: 20px; }
    .popup { background: #f5f1ea; border: 4px solid #4a3934; border-radius: 26px; box-shadow: 0 8px 0 #4a3934; max-height: 690px; overflow: hidden; }
    .popup img { display: block; width: 340px; }
    .popup-wrap { display: grid; justify-items: center; }
  </style><div class="floor"></div><div class="wrap">
    <div><h1>${withDot(title)}</h1><p>${lead}</p></div>
    <div class="popup-wrap"><div class="popup"><img src="data:image/png;base64,${shot.toString('base64')}"></div></div>
  </div>`)
}

function tilePage([title, lead], art) {
  return base(`<style>
    .tile { align-items: center; display: grid; gap: 14px; grid-template-columns: 180px 1fr; height: 100%; padding: 0 30px; position: relative; }
    .art svg { display: block; height: 180px; width: 180px; }
    h1 { font-size: 46px; }
    p { color: #6f625a; font-size: 19px; font-weight: 700; line-height: 1.4; margin-top: 6px; }
  </style><div class="floor"></div><div class="tile"><div class="art">${art}</div><div><h1>${title}</h1><p>${lead}</p></div></div>`)
}
