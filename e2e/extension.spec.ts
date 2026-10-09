import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium, expect, test } from '@playwright/test'

// Loads the built extension (npm run build:extension) into a fresh Chromium profile.
const extensionPath = resolve('extension/dist')

test('extension popup: adopt a pet, care for it, and keep it after reopening', async () => {
  test.skip(test.info().project.name !== 'chromium-desktop', 'runs once')
  test.skip(!existsSync(resolve(extensionPath, 'manifest.json')), 'run npm run build:extension first')

  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  })

  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker')
    const extensionId = new URL(worker.url()).host
    const popup = await context.newPage()
    await popup.goto(`chrome-extension://${extensionId}/popup.html`)

    await popup.locator('.adopt__option').nth(3).click()
    await popup.locator('.adopt__name').fill('솜이')
    await popup.locator('.primary').click()
    await expect(popup.locator('.pet__name')).toHaveText('솜이')

    await popup.locator('.action').first().click()
    await expect(popup.locator('.pet__voice')).not.toBeEmpty()
    await expect(popup.locator('.meta')).toContainText('9/10')

    await popup.reload()
    await expect(popup.locator('.pet__name')).toHaveText('솜이')

    const stored = await worker.evaluate(() => chrome.storage.local.get('pet'))
    expect((stored.pet as { species: string }).species).toBe('rabbit')
  } finally {
    await context.close()
  }
})
