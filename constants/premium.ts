import type { AppLocale } from '~/types/i18n'

export type PremiumMockItem = {
  id: string
  values: Record<AppLocale, string>
  detail: Record<AppLocale, string>
}

export const PREMIUM_WORK_TITLE_PACKS: PremiumMockItem[] = [
  {
    id: 'roadmap',
    values: {
      en: 'Roadmap',
      ko: '로드맵',
      ja: 'ロードマップ',
    },
    detail: {
      en: 'Work-safe product planning title.',
      ko: '업무용 제품 계획 탭처럼 보이는 제목입니다.',
      ja: '仕事用の計画タブのように見えるタイトルです。',
    },
  },
  {
    id: 'kpi-review',
    values: {
      en: 'KPI Review',
      ko: 'KPI 리뷰',
      ja: 'KPIレビュー',
    },
    detail: {
      en: 'Quiet performance-review disguise.',
      ko: '성과 검토 화면처럼 보이는 조용한 위장 제목입니다.',
      ja: '成果レビュー画面のように見える静かな偽装タイトルです。',
    },
  },
  {
    id: 'sprint-board',
    values: {
      en: 'Sprint Board',
      ko: '스프린트 보드',
      ja: 'スプリントボード',
    },
    detail: {
      en: 'Looks like a delivery board while the pet stays hidden.',
      ko: '펫을 숨기면서 업무 보드처럼 보이게 합니다.',
      ja: 'ペットを隠しながら作業ボードのように見せます。',
    },
  },
  {
    id: 'client-notes',
    values: {
      en: 'Client Notes',
      ko: '클라이언트 노트',
      ja: 'クライアントメモ',
    },
    detail: {
      en: 'A calm notes-style disguise for shared spaces.',
      ko: '공유 공간에서도 부담 없는 노트형 위장 제목입니다.',
      ja: '共有スペースでも使いやすいメモ型の偽装タイトルです。',
    },
  },
]

export const PREMIUM_QUIET_SIGNAL_PACKS: PremiumMockItem[] = [
  {
    id: 'review-needed',
    values: {
      en: 'Review Needed',
      ko: '검토 필요',
      ja: '確認が必要',
    },
    detail: {
      en: 'Care-needed signal written like a work queue.',
      ko: '돌봄 필요 상태를 업무 대기열처럼 보여줍니다.',
      ja: 'お世話が必要な状態を仕事のキューのように表示します。',
    },
  },
  {
    id: 'draft-updated',
    values: {
      en: 'Draft Updated',
      ko: '초안 업데이트',
      ja: '下書き更新',
    },
    detail: {
      en: 'A softer status change that avoids pet wording.',
      ko: '펫 표현 없이 더 조용하게 상태 변화를 알립니다.',
      ja: 'ペット表現を避けて静かに状態変化を知らせます。',
    },
  },
  {
    id: 'focus-return',
    values: {
      en: 'Focus Return',
      ko: '포커스 복귀',
      ja: 'フォーカス復帰',
    },
    detail: {
      en: 'A subtle reminder to check the tab when returning.',
      ko: '돌아왔을 때 탭 확인을 조용히 유도합니다.',
      ja: '戻ったときにタブ確認を静かに促します。',
    },
  },
]

export const PREMIUM_THEME_PACKS: PremiumMockItem[] = [
  {
    id: 'focus',
    values: {
      en: 'Focus',
      ko: '포커스',
      ja: 'フォーカス',
    },
    detail: {
      en: 'Low-noise workspace palette for the page and favicon.',
      ko: '본문과 파비콘에 쓰는 저소음 업무 팔레트입니다.',
      ja: '本文とファビコンに使う控えめな作業用パレットです。',
    },
  },
  {
    id: 'mono',
    values: {
      en: 'Mono',
      ko: '모노',
      ja: 'モノ',
    },
    detail: {
      en: 'Reduced color for a more discreet tab companion.',
      ko: '더 눈에 띄지 않는 탭 펫을 위한 절제된 색상입니다.',
      ja: 'より目立たないタブペットのための抑えた配色です。',
    },
  },
  {
    id: 'soft-night',
    values: {
      en: 'Soft Night',
      ko: '소프트 나이트',
      ja: 'ソフトナイト',
    },
    detail: {
      en: 'Soft dark palette for late work sessions.',
      ko: '늦은 작업 시간에 맞춘 부드러운 다크 팔레트입니다.',
      ja: '夜の作業に合うやわらかいダークパレットです。',
    },
  },
]
