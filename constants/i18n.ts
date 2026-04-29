import type { AppLocale, LocaleOption } from '~/types/i18n'

export const I18N_STORAGE_KEY = 'tab-pet:locale'
export const DEFAULT_LOCALE: AppLocale = 'en'

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
  en: {
    app: {
      name: 'Tab Pet',
      tagline: 'Title and favicon-first pet care.',
      reset: 'Reset',
      loading: 'Loading',
      restoring: 'Restoring local tab state',
      settingsLabel: 'Tab Pet settings',
      storageWarning: 'Local save is unavailable:',
    },
    locale: {
      label: 'Language',
    },
    setup: {
      eyebrow: 'Setup',
      title: 'Choose your tab companion',
      description: 'The page stays simple; the browser tab carries the main pet reaction.',
    },
    species: {
      cat: {
        label: 'Cat',
        description: 'Quiet signals and sharper tab moods.',
      },
      dog: {
        label: 'Dog',
        description: 'Warm signals and more obvious energy shifts.',
      },
    },
    status: {
      labels: {
        happy: 'Stable',
        hungry: 'Needs food',
        sleepy: 'Needs rest',
        bored: 'Needs play',
        sad: 'Needs care',
        excited: 'Excellent',
      },
      messages: {
        happy: 'The tab is calm. Keep it open and check back later.',
        hungry: 'Fullness is low. Feed will move the tab back toward normal.',
        sleepy: 'Energy is low. Sleep restores the strongest amount.',
        bored: 'Mood is drifting down. Play is the fastest fix.',
        sad: 'Mood is critical. A few care actions should stabilize the tab.',
        excited: 'Everything is high. The tab gets a brighter signal.',
      },
      aria: {
        happy: 'happy',
        hungry: 'hungry',
        sleepy: 'sleepy',
        bored: 'bored',
        sad: 'sad',
        excited: 'excited',
      },
    },
    stats: {
      fullness: 'Fullness',
      mood: 'Mood',
      energy: 'Energy',
    },
    actions: {
      feed: {
        label: 'Feed',
        detail: '+30 fullness',
      },
      play: {
        label: 'Play',
        detail: '+25 mood',
      },
      sleep: {
        label: 'Sleep',
        detail: '+35 energy',
      },
    },
    titles: {
      heading: 'Disguise title',
      description: 'Pick the base browser tab label.',
    },
    themes: {
      heading: 'Theme',
      description: 'Change the page skin and favicon palette.',
      premiumMock: 'Premium mock',
      default: {
        name: 'Default',
        description: 'Clean workday colors with warm pet accents.',
      },
      focus: {
        name: 'Focus',
        description: 'Muted office palette for quiet desks.',
      },
      night: {
        name: 'Night',
        description: 'Dark workspace with high contrast controls.',
      },
      pastel: {
        name: 'Pastel',
        description: 'Soft color set reserved for premium skins.',
      },
    },
    monetization: {
      heading: 'Monetization mock',
      description: 'Visible placement only; no payment or ad SDK.',
      rewardedAd: 'Rewarded ad',
      rewardedAdDetail: 'Restore energy preview',
      watch: 'Watch',
      premiumSkins: 'Premium skins',
      premiumSkinsDetail: 'Extra themes locked',
      locked: 'Locked',
      idleMessage: 'No SDK connected.',
      rewardMessage: 'Reward preview shown. No ad request was made.',
    },
    emoji: {
      heading: 'Emoji copy',
      description: 'Quick symbols for notes or custom titles later.',
      copied: 'Copied',
      copyFailed: 'Copy failed',
    },
  },
  ko: {
    app: {
      name: 'Tab Pet',
      tagline: '탭 제목과 파비콘으로 돌보는 작은 펫.',
      reset: '초기화',
      loading: '불러오는 중',
      restoring: '로컬 탭 상태를 복원하는 중',
      settingsLabel: 'Tab Pet 설정',
      storageWarning: '로컬 저장을 사용할 수 없습니다:',
    },
    locale: {
      label: '언어',
    },
    setup: {
      eyebrow: '시작',
      title: '탭 친구를 선택하세요',
      description: '본문은 단순하게 두고, 브라우저 탭이 펫의 핵심 반응을 전달합니다.',
    },
    species: {
      cat: {
        label: '고양이',
        description: '조용한 신호와 더 섬세한 탭 기분 변화.',
      },
      dog: {
        label: '강아지',
        description: '따뜻한 신호와 더 분명한 에너지 변화.',
      },
    },
    status: {
      labels: {
        happy: '안정적',
        hungry: '밥이 필요함',
        sleepy: '휴식 필요',
        bored: '놀이 필요',
        sad: '돌봄 필요',
        excited: '최상',
      },
      messages: {
        happy: '탭이 차분합니다. 열어두고 나중에 다시 확인하세요.',
        hungry: '포만감이 낮습니다. 먹이 주기로 탭 상태를 안정시킬 수 있습니다.',
        sleepy: '에너지가 낮습니다. 잠자기는 가장 크게 회복합니다.',
        bored: '기분이 내려가고 있습니다. 놀아주기가 가장 빠른 해결책입니다.',
        sad: '기분이 위험 수준입니다. 몇 번 돌보면 다시 안정됩니다.',
        excited: '모든 수치가 높습니다. 탭 신호가 더 밝아집니다.',
      },
      aria: {
        happy: '행복한',
        hungry: '배고픈',
        sleepy: '졸린',
        bored: '지루한',
        sad: '슬픈',
        excited: '신난',
      },
    },
    stats: {
      fullness: '포만감',
      mood: '기분',
      energy: '에너지',
    },
    actions: {
      feed: {
        label: '먹이',
        detail: '포만감 +30',
      },
      play: {
        label: '놀이',
        detail: '기분 +25',
      },
      sleep: {
        label: '잠자기',
        detail: '에너지 +35',
      },
    },
    titles: {
      heading: '위장 타이틀',
      description: '브라우저 탭에 표시될 기본 문구를 고르세요.',
    },
    themes: {
      heading: '테마',
      description: '본문 스킨과 파비콘 팔레트를 바꿉니다.',
      premiumMock: '프리미엄 목업',
      default: {
        name: '기본',
        description: '따뜻한 펫 포인트가 있는 깔끔한 업무 색상.',
      },
      focus: {
        name: '집중',
        description: '조용한 데스크에 맞춘 낮은 채도의 사무실 팔레트.',
      },
      night: {
        name: '나이트',
        description: '대비가 높은 어두운 작업 공간.',
      },
      pastel: {
        name: '파스텔',
        description: '프리미엄 스킨용 부드러운 색상 세트.',
      },
    },
    monetization: {
      heading: '수익화 목업',
      description: '노출 위치만 확인합니다. 결제나 광고 SDK는 없습니다.',
      rewardedAd: '보상형 광고',
      rewardedAdDetail: '에너지 회복 미리보기',
      watch: '보기',
      premiumSkins: '프리미엄 스킨',
      premiumSkinsDetail: '추가 테마 잠금',
      locked: '잠김',
      idleMessage: 'SDK가 연결되어 있지 않습니다.',
      rewardMessage: '보상 미리보기를 표시했습니다. 광고 요청은 보내지 않았습니다.',
    },
    emoji: {
      heading: '이모지 복사',
      description: '메모나 커스텀 타이틀에 쓸 빠른 기호입니다.',
      copied: '복사됨',
      copyFailed: '복사 실패',
    },
  },
  ja: {
    app: {
      name: 'Tab Pet',
      tagline: 'タブタイトルとファビコンで世話する小さなペット。',
      reset: 'リセット',
      loading: '読み込み中',
      restoring: 'ローカルのタブ状態を復元中',
      settingsLabel: 'Tab Pet 設定',
      storageWarning: 'ローカル保存を利用できません:',
    },
    locale: {
      label: '言語',
    },
    setup: {
      eyebrow: 'セットアップ',
      title: 'タブの相棒を選択',
      description: '本文はシンプルに保ち、ブラウザタブがペットの反応を伝えます。',
    },
    species: {
      cat: {
        label: '猫',
        description: '静かな合図と、より細かなタブ気分の変化。',
      },
      dog: {
        label: '犬',
        description: '温かい合図と、より分かりやすいエネルギー変化。',
      },
    },
    status: {
      labels: {
        happy: '安定',
        hungry: 'ごはんが必要',
        sleepy: '休憩が必要',
        bored: '遊びが必要',
        sad: 'ケアが必要',
        excited: '最高',
      },
      messages: {
        happy: 'タブは落ち着いています。開いたまま後で確認してください。',
        hungry: '満腹度が低いです。ごはんでタブ状態を安定させられます。',
        sleepy: 'エネルギーが低いです。睡眠が最も大きく回復します。',
        bored: '気分が下がっています。遊ぶのが一番早い対処です。',
        sad: '気分が危険域です。何度かケアすると安定します。',
        excited: 'すべての数値が高いです。タブの合図が明るくなります。',
      },
      aria: {
        happy: '元気な',
        hungry: 'お腹が空いた',
        sleepy: '眠い',
        bored: '退屈な',
        sad: '悲しい',
        excited: 'わくわくした',
      },
    },
    stats: {
      fullness: '満腹度',
      mood: '気分',
      energy: 'エネルギー',
    },
    actions: {
      feed: {
        label: 'ごはん',
        detail: '満腹度 +30',
      },
      play: {
        label: '遊ぶ',
        detail: '気分 +25',
      },
      sleep: {
        label: '眠る',
        detail: 'エネルギー +35',
      },
    },
    titles: {
      heading: '偽装タイトル',
      description: 'ブラウザタブに表示する基本文言を選びます。',
    },
    themes: {
      heading: 'テーマ',
      description: '本文スキンとファビコンのパレットを変更します。',
      premiumMock: 'プレミアムモック',
      default: {
        name: 'デフォルト',
        description: '温かいペットのアクセントを持つ清潔な仕事用カラー。',
      },
      focus: {
        name: '集中',
        description: '静かなデスク向けの落ち着いたオフィスパレット。',
      },
      night: {
        name: 'ナイト',
        description: '高コントラストの暗いワークスペース。',
      },
      pastel: {
        name: 'パステル',
        description: 'プレミアムスキン用の柔らかいカラーセット。',
      },
    },
    monetization: {
      heading: '収益化モック',
      description: '配置確認のみです。決済や広告SDKはありません。',
      rewardedAd: 'リワード広告',
      rewardedAdDetail: 'エネルギー回復プレビュー',
      watch: '見る',
      premiumSkins: 'プレミアムスキン',
      premiumSkinsDetail: '追加テーマはロック中',
      locked: 'ロック',
      idleMessage: 'SDKは接続されていません。',
      rewardMessage: 'リワードのプレビューを表示しました。広告リクエストは送信していません。',
    },
    emoji: {
      heading: '絵文字コピー',
      description: 'メモやカスタムタイトルに使えるクイック記号です。',
      copied: 'コピーしました',
      copyFailed: 'コピー失敗',
    },
  },
} as const
