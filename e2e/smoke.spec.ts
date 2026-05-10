import { expect, test } from '@playwright/test'

const STORAGE_KEY = 'tab-pet:state'
const LOCALE_KEY = 'tab-pet:locale'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ storageKey, localeKey }) => {
      window.localStorage.removeItem(storageKey)
      window.localStorage.setItem(localeKey, 'ko')
    },
    { storageKey: STORAGE_KEY, localeKey: LOCALE_KEY },
  )
  await page.reload()
})

test('first load shows the species selection screen', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('button', { name: /고양이/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /강아지/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /고슴도치/ })).toBeVisible()
})

test('selecting a species reveals the care panel', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /고양이/ }).first().click()

  await expect(page.getByRole('button', { name: /먹이|밥/ })).toBeVisible()
  await expect(page.locator('.pet-status').getByText('배부름', { exact: true })).toBeVisible()
})

test('reload restores the selected species', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /고양이/ }).first().click()
  await expect(page.getByRole('button', { name: /먹이|밥/ })).toBeVisible()

  await page.reload()

  await expect(page.getByRole('button', { name: /먹이|밥/ })).toBeVisible()
})

test('a corrupted localStorage payload falls back to species selection', async ({ page }) => {
  await page.addInitScript(
    ({ storageKey }) => {
      window.localStorage.setItem(storageKey, '{not really json')
    },
    { storageKey: STORAGE_KEY },
  )

  await page.goto('/')

  await expect(page.getByRole('button', { name: /고양이/ })).toBeVisible()
})

test('document.title is non-empty after the app mounts', async ({ page }) => {
  await page.goto('/')

  await expect.poll(async () => (await page.title()).length).toBeGreaterThan(0)
})

test('no horizontal overflow on a narrow mobile viewport', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile-chrome', 'mobile-only check')

  await page.goto('/')

  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth
  })

  expect(overflow).toBeLessThanOrEqual(1)
})
