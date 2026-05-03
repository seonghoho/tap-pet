import { describe, expect, it } from 'vitest'
import { getPrimaryAlert } from '~/utils/petAlert'
import { getTabPresentation, getTabTitle } from '~/utils/tabPresentation'

describe('pet alert severity', () => {
  it('chooses the most severe stat need', () => {
    const alert = getPrimaryAlert({
      stats: { fullness: 20, energy: 10, cleanliness: 80 },
      lastPlayedAt: 0,
      now: 1000,
    })

    expect(alert.status).toBe('sleepy')
  })

  it('uses fixed tie-break order for equal severity', () => {
    const alert = getPrimaryAlert({
      stats: { fullness: 20, energy: 20, cleanliness: 20 },
      lastPlayedAt: Date.now(),
      now: Date.now(),
    })

    expect(alert.status).toBe('hungry')
  })

  it('detects boredom from elapsed play time', () => {
    const alert = getPrimaryAlert({
      stats: { fullness: 80, energy: 80, cleanliness: 80 },
      lastPlayedAt: 0,
      now: 1000 * 60 * 60 * 3,
    })

    expect(alert.status).toBe('bored')
  })
})

describe('tab title policy', () => {
  it('uses status title in status mode', () => {
    expect(
      getTabTitle({
        status: 'hungry',
        locale: 'ko',
        settings: {
          titleMode: 'status',
          titleVisibility: 'always',
          disguiseTitleId: 'project-dashboard',
          customDisguiseTitle: '',
          titleAnimationEnabled: false,
          themeId: 'system',
        },
        isDocumentVisible: true,
      }),
    ).toBe('배고파요')
  })

  it('uses disguise title before status title in disguise mode', () => {
    expect(
      getTabTitle({
        status: 'hungry',
        locale: 'ko',
        settings: {
          titleMode: 'disguise',
          titleVisibility: 'always',
          disguiseTitleId: 'inbox',
          customDisguiseTitle: '회의 자료',
          titleAnimationEnabled: false,
          themeId: 'system',
        },
        isDocumentVisible: false,
      }),
    ).toBe('회의 자료')
  })

  it('uses app title while visible for inactive-only status mode', () => {
    expect(
      getTabTitle({
        status: 'hungry',
        locale: 'ko',
        settings: {
          titleMode: 'status',
          titleVisibility: 'inactive-only',
          disguiseTitleId: 'project-dashboard',
          customDisguiseTitle: '',
          titleAnimationEnabled: false,
          themeId: 'system',
        },
        isDocumentVisible: true,
      }),
    ).toBe('Tab Pet')
  })

  it('uses status title while hidden for inactive-only status mode', () => {
    expect(
      getTabTitle({
        status: 'hungry',
        locale: 'ko',
        settings: {
          titleMode: 'status',
          titleVisibility: 'inactive-only',
          disguiseTitleId: 'project-dashboard',
          customDisguiseTitle: '',
          titleAnimationEnabled: false,
          themeId: 'system',
        },
        isDocumentVisible: false,
      }),
    ).toBe('배고파요')
  })

  it('keeps favicon state even when title is disguised', () => {
    const presentation = getTabPresentation({
      species: 'cat',
      status: 'dirty',
      settings: {
        titleMode: 'disguise',
        titleVisibility: 'always',
        disguiseTitleId: 'inbox',
        customDisguiseTitle: '',
        titleAnimationEnabled: false,
        themeId: 'light',
      },
      locale: 'ko',
      isDocumentVisible: false,
    })

    expect(presentation.title).toBe('받은 편지함')
    expect(presentation.faviconSvg).toContain('<svg')
  })
})
