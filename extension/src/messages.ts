import { I18N_MESSAGES } from '~/constants/i18n'
import type { AppLocale } from '~/types/i18n'

import { pickLocale } from '~/utils/locale'

export { pickLocale }

export function getMessages(language = navigator.language) {
  return I18N_MESSAGES[pickLocale(language)]
}
