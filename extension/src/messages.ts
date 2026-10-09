import { I18N_MESSAGES } from '~/constants/i18n'
import type { AppLocale } from '~/types/i18n'

export function pickLocale(language: string): AppLocale {
  if (language.startsWith('ko')) return 'ko'
  if (language.startsWith('ja')) return 'ja'

  return 'en'
}

export function getMessages(language = navigator.language) {
  return I18N_MESSAGES[pickLocale(language)]
}
