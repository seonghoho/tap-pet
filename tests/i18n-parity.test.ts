import { describe, expect, it } from 'vitest'
import { I18N_MESSAGES } from '~/constants/i18n'

function keyPaths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => keyPaths(item, `${prefix}[${index}]`))
  if (typeof value !== 'object' || value === null) return [prefix]

  return Object.entries(value).flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key))
}

function placeholders(value: unknown): string[] {
  return typeof value === 'string' ? [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort() : []
}

describe('locale files', () => {
  const english = keyPaths(I18N_MESSAGES.en).sort()

  it.each(['ko', 'ja'] as const)('%s has exactly the same keys as en', (locale) => {
    expect(keyPaths(I18N_MESSAGES[locale]).sort()).toEqual(english)
  })

  it.each(['ko', 'ja'] as const)('%s keeps every {placeholder} that en uses', (locale) => {
    const get = (messages: unknown, path: string) =>
      path.split(/\.|\[(\d+)\]/).filter(Boolean).reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], messages)

    for (const path of english) {
      expect(placeholders(get(I18N_MESSAGES[locale], path)), path).toEqual(placeholders(get(I18N_MESSAGES.en, path)))
    }
  })
})
