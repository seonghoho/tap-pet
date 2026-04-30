import type { AppLocale } from '~/types/i18n'
import type { DisguiseTitleId, DisguiseTitlePreset, PetStatus } from '~/types/pet'

export const APP_DEFAULT_TITLE = 'Tab Pet'

export const DEFAULT_DISGUISE_TITLE_ID: DisguiseTitleId = 'project-dashboard'

export const DISGUISE_TITLES: DisguiseTitlePreset[] = [
  {
    id: 'project-dashboard',
    values: {
      en: 'Project Dashboard',
      ko: '프로젝트 대시보드',
      ja: 'プロジェクトダッシュボード',
    },
  },
  {
    id: 'quarterly-report',
    values: {
      en: 'Quarterly Report',
      ko: '분기 보고서',
      ja: '四半期レポート',
    },
  },
  {
    id: 'inbox',
    values: {
      en: 'Inbox',
      ko: '받은 편지함',
      ja: '受信トレイ',
    },
  },
  {
    id: 'analytics',
    values: {
      en: 'Analytics',
      ko: '분석',
      ja: '分析',
    },
  },
  {
    id: 'untitled-document',
    values: {
      en: 'Untitled Document',
      ko: '제목 없는 문서',
      ja: '無題のドキュメント',
    },
  },
  {
    id: 'meeting-notes',
    values: {
      en: 'Meeting Notes',
      ko: '회의록',
      ja: '会議メモ',
    },
  },
]

export function getDisguiseTitleLabel(titleId: DisguiseTitleId, locale: AppLocale): string {
  return (
    DISGUISE_TITLES.find((title) => title.id === titleId)?.values[locale] ??
    DISGUISE_TITLES.find((title) => title.id === DEFAULT_DISGUISE_TITLE_ID)?.values[locale] ??
    'Project Dashboard'
  )
}

export const STATUS_TITLE_MESSAGES: Record<PetStatus, Record<AppLocale, string>> = {
  fine: { en: 'Tab Pet', ko: 'Tab Pet', ja: 'Tab Pet' },
  happy: { en: 'Tab Pet', ko: 'Tab Pet', ja: 'Tab Pet' },
  excited: { en: 'Feeling great', ko: '기분 좋아요', ja: '元気です' },
  hungry: { en: 'I am hungry', ko: '배고파요', ja: 'お腹すいた' },
  sleepy: { en: 'I am sleepy', ko: '졸려요', ja: '眠いです' },
  dirty: { en: 'Please clean me', ko: '씻겨주세요', ja: 'きれいにして' },
  bored: { en: 'Please play', ko: '놀아주세요', ja: '遊んで' },
}
