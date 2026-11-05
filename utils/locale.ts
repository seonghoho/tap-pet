import type { AppLocale } from '~/types/i18n'

// Browser language → app language. Shared by the website and the extension.
export function pickLocale(language: string | undefined | null): AppLocale {
  const value = (language ?? '').toLowerCase()
  if (value.startsWith('ko')) return 'ko'
  if (value.startsWith('ja')) return 'ja'

  return 'en'
}
