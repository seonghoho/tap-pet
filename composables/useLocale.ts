import { computed, readonly } from 'vue'
import { useState } from '#app'
import { DEFAULT_LOCALE, I18N_MESSAGES, I18N_STORAGE_KEY } from '~/constants/i18n'
import type { AppLocale } from '~/types/i18n'
import { pickLocale } from '~/utils/locale'

const LOCALES: AppLocale[] = ['en', 'ko', 'ja']

export function useLocale() {
  const locale = useState<AppLocale>('tab-pet:locale', () => DEFAULT_LOCALE)
  const hasRestoredLocale = useState<boolean>('tab-pet:has-restored-locale', () => false)
  const messages = computed(() => I18N_MESSAGES[locale.value])

  function restoreLocale(): void {
    if (!import.meta.client || hasRestoredLocale.value) return

    try {
      const storedLocale = localStorage.getItem(I18N_STORAGE_KEY)
      // A visitor who never picked a language gets their browser's (e.g. an English
      // friend opening a shared card), instead of always landing on Korean.
      locale.value = isAppLocale(storedLocale) ? storedLocale : pickLocale(navigator.language)
    } catch {
      locale.value = pickLocale(navigator.language)
    } finally {
      hasRestoredLocale.value = true
    }
  }

  function setLocale(nextLocale: AppLocale): void {
    if (!isAppLocale(nextLocale)) return

    locale.value = nextLocale

    if (import.meta.client) {
      try {
        localStorage.setItem(I18N_STORAGE_KEY, nextLocale)
      } catch {
        // Language switching should keep working even when localStorage is blocked.
      }
    }
  }

  return {
    locale: readonly(locale),
    messages,
    restoreLocale,
    setLocale,
  }
}

function isAppLocale(value: unknown): value is AppLocale {
  return LOCALES.includes(value as AppLocale)
}
