import { expect, test, type Page } from '@playwright/test'

// Layout intent and visual baselines. These replace the old unit tests that matched
// CSS text: they check what the user sees, so restyling does not break them.

const STORAGE_KEY = 'tab-pet:state'

async function seedPet(page: Page): Promise<void> {
  await page.addInitScript(({ storageKey }) => {
    const now = Date.now()
    const date = new Date(now)
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    window.localStorage.setItem('tab-pet:locale', 'ko')
    window.localStorage.setItem('tab-pet:pin-tip-dismissed', '1')
    window.localStorage.setItem(storageKey, JSON.stringify({
      version: 4,
      species: 'hamster',
      name: '콩이',
      stats: { fullness: 40, energy: 70, cleanliness: 66 },
      growth: { level: 2, exp: 30, affinityExp: 20 },
      settings: {
        titleMode: 'disguise',
        titleVisibility: 'inactive-only',
        disguiseTitleId: 'project-dashboard',
        customDisguiseTitle: '',
        titleAnimationEnabled: false,
        themeId: 'light',
      },
      actionLimit: { windowStartedAt: now, used: 2, bonusUses: 0 },
      dailyGoal: { dateKey, goalId: 'recommended-care', progress: 0, completedAt: null, claimedAt: null },
      personality: { personality: null, earlyActionCounts: { feed: 1, play: 1, sleep: 0, wash: 0 }, assignedAt: null },
      streak: { current: 3, best: 5, lastCareDateKey: dateKey },
      lastUpdatedAt: now,
      lastPlayedAt: now,
    }))
  }, { storageKey: STORAGE_KEY })
}

test.beforeEach(async ({ page }) => {
  // Reduced motion keeps the pet at its default spot so screenshots are stable.
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
})

test('on a phone, the pet and every care button fit in the first screen', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile-chrome', 'mobile-only check')
  await seedPet(page)
  await page.goto('/')

  const viewportHeight = page.viewportSize()!.height
  const habitat = await page.locator('.pet-habitat').boundingBox()
  const buttons = page.locator('.action-button')

  await expect(buttons).toHaveCount(4)
  expect(habitat!.y).toBeGreaterThanOrEqual(0)
  for (const box of await buttons.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().bottom))) {
    expect(box).toBeLessThanOrEqual(viewportHeight)
  }
})

test('care buttons sit in two columns on phones and one row on desktop', async ({ page }) => {
  await seedPet(page)
  await page.goto('/')

  const lefts = await page.locator('.action-button').evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().left)),
  )
  const columns = new Set(lefts).size

  expect(columns).toBe(test.info().project.name === 'mobile-chrome' ? 2 : 4)
})

for (const width of [320, 375]) {
  test(`no horizontal scroll at ${width}px on setup and pet screens`, async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile-chrome', 'mobile-only check')
    await page.setViewportSize({ width, height: 740 })

    await page.goto('/')
    const setupOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    expect(setupOverflow).toBeLessThanOrEqual(1)

    await seedPet(page)
    await page.goto('/')
    await expect(page.locator('.pet-status')).toBeVisible()
    const petOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    expect(petOverflow).toBeLessThanOrEqual(1)
  })
}

test.describe('visual baselines', () => {
  // Countdown text and the rotating voice line change between runs, so they are masked.
  const screenshot = { animations: 'disabled' as const, maxDiffPixelRatio: 0.02 }

  test('setup screen', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('같이 지낼 친구를 골라주세요')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)

    await expect(page).toHaveScreenshot('setup.png', { ...screenshot, fullPage: true })
  })

  test('pet screen', async ({ page }) => {
    await seedPet(page)
    await page.goto('/')
    await expect(page.locator('.pet-status')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)

    await expect(page).toHaveScreenshot('pet.png', {
      ...screenshot,
      fullPage: true,
      mask: [page.locator('.action-meta'), page.locator('.pet-status__voice')],
    })
  })

  test('settings tab', async ({ page }) => {
    await seedPet(page)
    await page.goto('/')
    await page.locator('.pet-side-panel__tab').nth(1).click()
    await expect(page.locator('.pet-settings-panel')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)

    await expect(page.locator('.pet-side-panel')).toHaveScreenshot('settings.png', screenshot)
  })
})
