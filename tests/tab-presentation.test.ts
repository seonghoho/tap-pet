import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '~/constants/pet'
import { APP_DEFAULT_TITLE } from '~/constants/titles'
import type { PetSettings } from '~/types/pet'
import {
  getDisguiseTitleValue,
  getFaviconSvg,
  getTabPresentation,
  getTabTitle,
  svgToDataUrl,
} from '~/utils/tabPresentation'

const baseSettings: PetSettings = {
  ...DEFAULT_SETTINGS,
}

describe('getDisguiseTitleValue', () => {
  it('returns the locale label for a known disguise', () => {
    expect(getDisguiseTitleValue('project-dashboard', 'ko')).toBe('프로젝트 대시보드')
    expect(getDisguiseTitleValue('inbox', 'ja')).toBe('受信トレイ')
    expect(getDisguiseTitleValue('analytics', 'en')).toBe('Analytics')
  })

  it('prefers a trimmed custom title when provided', () => {
    expect(getDisguiseTitleValue('project-dashboard', 'ko', '  My Tab  ')).toBe('My Tab')
  })

  it('falls back to the locale label when the custom title is blank', () => {
    expect(getDisguiseTitleValue('project-dashboard', 'en', '   ')).toBe('Project Dashboard')
  })
})

describe('getTabTitle', () => {
  it('uses the disguise title when title mode is disguise', () => {
    expect(
      getTabTitle({
        status: 'happy',
        settings: { ...baseSettings, titleMode: 'disguise', disguiseTitleId: 'inbox' },
        locale: 'ko',
        isDocumentVisible: true,
      }),
    ).toBe('받은 편지함')
  })

  it('returns the default title when the document is visible and visibility is inactive-only', () => {
    expect(
      getTabTitle({
        status: 'hungry',
        settings: { ...baseSettings, titleMode: 'status', titleVisibility: 'inactive-only' },
        locale: 'ko',
        isDocumentVisible: true,
      }),
    ).toBe(APP_DEFAULT_TITLE)
  })

  it('returns the localized status message when the document is hidden', () => {
    expect(
      getTabTitle({
        status: 'sleepy',
        settings: { ...baseSettings, titleMode: 'status', titleVisibility: 'inactive-only' },
        locale: 'ja',
        isDocumentVisible: false,
      }),
    ).toBe('眠いです')
  })

  it('returns the localized status message when visibility is always', () => {
    expect(
      getTabTitle({
        status: 'bored',
        settings: { ...baseSettings, titleMode: 'status', titleVisibility: 'always' },
        locale: 'en',
        isDocumentVisible: true,
      }),
    ).toBe('Please play')
  })
})

describe('getTabPresentation', () => {
  it('produces both a localized title and a non-empty favicon svg', () => {
    const presentation = getTabPresentation({
      species: 'cat',
      status: 'hungry',
      settings: { ...baseSettings, titleMode: 'status', titleVisibility: 'always' },
      locale: 'ko',
      isDocumentVisible: false,
    })

    expect(presentation.title).toBe('배고파요')
    expect(presentation.faviconSvg).toContain('<svg')
  })

  it('uses sensible defaults when only optional inputs are provided', () => {
    const presentation = getTabPresentation({
      disguiseTitleId: 'analytics',
      themeId: 'light',
      locale: 'en',
    })

    expect(presentation.title).toBe('Analytics')
    expect(presentation.faviconSvg.length).toBeGreaterThan(0)
  })
})

describe('getFaviconSvg', () => {
  it('returns valid SVG markup for each species', () => {
    expect(getFaviconSvg('cat', 'happy', 'system')).toMatch(/^<svg[\s\S]*<\/svg>$/)
    expect(getFaviconSvg('dog', 'sleepy', 'light')).toMatch(/^<svg[\s\S]*<\/svg>$/)
    expect(getFaviconSvg('hedgehog', 'excited', 'dark')).toMatch(/^<svg[\s\S]*<\/svg>$/)
  })

  it('produces different output for different statuses', () => {
    const happy = getFaviconSvg('cat', 'happy', 'light')
    const sad = getFaviconSvg('cat', 'sleepy', 'light')

    expect(happy).not.toBe(sad)
  })
})

describe('svgToDataUrl', () => {
  it('returns a data url with svg+xml content type', () => {
    expect(svgToDataUrl('<svg></svg>')).toBe('data:image/svg+xml,%3Csvg%3E%3C%2Fsvg%3E')
  })

  it('encodes special characters', () => {
    const url = svgToDataUrl('<svg fill="#ff0">x&y</svg>')

    expect(url.startsWith('data:image/svg+xml,')).toBe(true)
    expect(url).toContain('%26')
    expect(url).not.toContain('&y')
  })
})
