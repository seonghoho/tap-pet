import { expect, test, type Page } from '@playwright/test'

const STORAGE_KEY = 'tab-pet:state'
const LOCALE_KEY = 'tab-pet:locale'

async function choosePet(page: Page, species = 'rabbit'): Promise<void> {
  await page.locator(`[data-species="${species}"]`).click()
  await page.getByTestId('confirm-pet').click()
  await expect(page.locator('.living-habitat')).toBeVisible()
}

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

test('first load shows one living preview and six species choices', async ({ page }) => {
  await expect(page.locator('.setup-stage__scene canvas')).toBeVisible()
  await expect(page.locator('[data-species]')).toHaveCount(6)
  await expect(page.locator('[data-species="cat"]')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('confirm-pet')).toBeVisible()
})

test('confirming a species reveals the living care habitat', async ({ page }) => {
  await choosePet(page)

  await expect(page.locator('.living-habitat canvas')).toHaveAttribute('aria-label', /토리|토끼/)
  await expect(page.locator('button[data-action]')).toHaveCount(4)
  await expect(page.locator('.pet-needs [role="meter"]')).toHaveCount(3)
})

test('a care action produces a canvas reaction and concise feedback', async ({ page }) => {
  await choosePet(page, 'hamster')

  const recommendedAction = page.locator('button[data-recommended="true"]')
  await expect(recommendedAction).toHaveCount(1)
  await recommendedAction.click()
  await expect(recommendedAction).toBeDisabled()
  await expect(page.locator('.care-dock__feedback')).toBeVisible({ timeout: 6_000 })
})

test('reload restores the selected species', async ({ page }) => {
  await choosePet(page, 'penguin')

  await page.reload()

  await expect(page.locator('.living-habitat')).toBeVisible()
  await expect(page.locator('.living-habitat canvas')).toHaveAttribute('aria-label', /펭이|펭귄/)
})

test('settings open as a dismissible dialog', async ({ page }) => {
  await choosePet(page, 'cat')

  await page.getByRole('button', { name: '탭 설정' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByText('펫 이름')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('a corrupted localStorage payload falls back to species selection', async ({ page }) => {
  await page.evaluate(({ storageKey }) => {
    window.localStorage.setItem(storageKey, '{not really json')
  }, { storageKey: STORAGE_KEY })
  await page.reload()

  await expect(page.locator('.setup-stage__scene canvas')).toBeVisible()
  await expect(page.getByTestId('confirm-pet')).toBeVisible()
})

test('document.title is non-empty after the app mounts', async ({ page }) => {
  await expect.poll(async () => (await page.title()).length).toBeGreaterThan(0)
})

test('no horizontal overflow on a narrow mobile viewport', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile-chrome', 'mobile-only check')

  await expect(page.locator('.setup-stage__scene')).toBeVisible()
  const setupOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(setupOverflow).toBeLessThanOrEqual(1)

  await choosePet(page)
  const habitatOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(habitatOverflow).toBeLessThanOrEqual(1)
})

test('returning after absence shows a compact return report', async ({ page }) => {
  const staleTimestamp = Date.now() - 1000 * 60 * 60 * 3

  await page.evaluate(
    ({ storageKey, staleTimestamp }) => {
      const date = new Date()
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          version: 4,
          species: 'cat',
          name: '몽이',
          stats: {
            fullness: 35,
            energy: 70,
            cleanliness: 70,
          },
          growth: {
            level: 1,
            exp: 0,
            affinityExp: 0,
          },
          settings: {
            titleMode: 'status',
            titleVisibility: 'inactive-only',
            disguiseTitleId: 'project-dashboard',
            customDisguiseTitle: '',
            titleAnimationEnabled: false,
            themeId: 'system',
          },
          actionLimit: {
            windowStartedAt: staleTimestamp,
            used: 0,
            bonusUses: 0,
          },
          dailyGoal: {
            dateKey,
            goalId: 'recommended-care',
            progress: 0,
            completedAt: null,
            claimedAt: null,
          },
          personality: {
            personality: null,
            earlyActionCounts: {
              feed: 0,
              play: 0,
              sleep: 0,
              wash: 0,
            },
            assignedAt: null,
          },
          lastUpdatedAt: staleTimestamp,
          lastPlayedAt: staleTimestamp,
        }),
      )
    },
    { storageKey: STORAGE_KEY, staleTimestamp },
  )
  await page.reload()

  await expect(page.locator('.living-return')).toBeVisible()
  await expect(page.locator('.return-report').getByText('다시 만난 탭 펫', { exact: true })).toBeVisible()
})
