import type { AppLocale, LocaleOption } from '~/types/i18n'
import { en } from '~/constants/locales/en'
import { ko } from '~/constants/locales/ko'
import { ja } from '~/constants/locales/ja'

export const I18N_STORAGE_KEY = 'tab-pet:locale'
export const DEFAULT_LOCALE: AppLocale = 'ko'

export const LOCALE_OPTIONS: LocaleOption[] = [
  {
    id: 'en',
    label: 'English',
    nativeLabel: 'English',
  },
  {
    id: 'ko',
    label: 'Korean',
    nativeLabel: '한국어',
  },
  {
    id: 'ja',
    label: 'Japanese',
    nativeLabel: '日本語',
  },
]

export const I18N_MESSAGES = {
  en,
  ko,
  ja,
} as const
