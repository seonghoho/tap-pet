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

test('returning after absence shows a return report', async ({ page }) => {
  const staleTimestamp = Date.now() - 1000 * 60 * 60 * 3

  await page.addInitScript(
    ({ storageKey, localeKey, staleTimestamp }) => {
      const date = new Date()
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      window.localStorage.setItem(localeKey, 'ko')
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          version: 3,
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
          lastUpdatedAt: staleTimestamp,
          lastPlayedAt: staleTimestamp,
        }),
      )
    },
    { storageKey: STORAGE_KEY, localeKey: LOCALE_KEY, staleTimestamp },
  )

  await page.goto('/')

  await expect(page.locator('.return-report').getByText('다시 만난 탭 펫', { exact: true })).toBeVisible()
})

test('completing recommended care completes the daily goal and claims reward', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /고양이/ }).first().click()

  await expect(page.getByText('오늘의 목표')).toBeVisible()

  const recommendedCard = page.locator('.action-recommendation')
  const recommendedText = await recommendedCard.textContent()
  const actionName = recommendedText?.includes('놀이')
    ? /놀이/
    : recommendedText?.includes('잠')
      ? /잠/
      : recommendedText?.includes('목욕')
        ? /목욕/
        : /먹이|밥/

  await page.getByRole('button', { name: actionName }).first().click()
  await expect(page.getByText('오늘 목표를 완료했어요.')).toBeVisible({ timeout: 6000 })

  await page.getByRole('button', { name: '보상 받기' }).click()
  await expect(page.getByText('오늘 보상을 받았어요.')).toBeVisible()
})
