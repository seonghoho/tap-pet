# Tab Pet Technical Design

## 1. 설계 원칙

Tab Pet의 핵심은 상태 모델과 탭 반응이다. 구현은 다음 원칙을 따른다.

- 순수 함수와 UI를 분리한다.
- magic number는 상수화한다.
- 브라우저 API 접근은 composable에 격리한다.
- 저장 가능한 상태와 계산 가능한 상태를 분리한다.
- Nuxt SSR 환경에서 `window`, `document`, `localStorage` 접근을 안전하게 처리한다.
- 작은 단위로 구현하고 각 단위가 독립적으로 테스트 가능하게 만든다.

## 2. 디렉터리 구조

```txt
constants/
  pet.ts
  titles.ts
  themes.ts

types/
  pet.ts

utils/
  petActions.ts
  petAlert.ts
  petCare.ts
  petDecay.ts
  petFactory.ts
  petGrowth.ts
  petStatus.ts
  petValidation.ts
  tabPresentation.ts
  theme.ts

composables/
  usePetStore.ts
  useLocalPetStorage.ts
  useTabTitle.ts
  useFavicon.ts

components/
  PetSetup.vue
  PetStatusPanel.vue
  PetActions.vue
  PetSidePanel.vue
  PetSettingsPanel.vue
  GuidePanel.vue
  MonetizationMock.vue
  EmojiCopyPanel.vue
```

`EmojiCopyPanel`은 컴포넌트로 남아 있지만 Growth MVP의 메인 화면에서는 숨긴다.

## 3. 타입 설계

```ts
export type PetSpecies = 'cat' | 'dog'

export type PetNeedStatus = 'fine' | 'hungry' | 'sleepy' | 'dirty' | 'bored'
export type PetDisplayStatus = PetNeedStatus | 'happy' | 'excited'
export type PetStatus = PetDisplayStatus

export type PetAction = 'feed' | 'play' | 'sleep' | 'wash'

export type ThemeId = 'system' | 'light' | 'dark'
export type TitleMode = 'status' | 'disguise'
export type TitleVisibility = 'inactive-only' | 'always'

export type PetStats = {
  fullness: number
  energy: number
  cleanliness: number
}

export type PetGrowth = {
  level: number
  exp: number
  affinityExp: number
}

export type PetSettings = {
  titleMode: TitleMode
  titleVisibility: TitleVisibility
  disguiseTitleId: DisguiseTitleId
  customDisguiseTitle: string
  titleAnimationEnabled: boolean
  themeId: ThemeId
}

export type PetState = {
  species: PetSpecies
  name: string
  stats: PetStats
  growth: PetGrowth
  settings: PetSettings
  lastUpdatedAt: number
  lastPlayedAt: number
}

export type StoredPetState = PetState & {
  version: number
}
```

## 4. 상수 설계

```ts
export const PET_STORAGE_KEY = 'tab-pet:state'
export const PET_STORAGE_VERSION = 2

export const STAT_MIN = 0
export const STAT_MAX = 100

export const DEFAULT_STATS = {
  fullness: 70,
  energy: 70,
  cleanliness: 70,
} as const

export const DEFAULT_GROWTH = {
  level: 1,
  exp: 0,
  affinityExp: 0,
} as const

export const DEFAULT_SETTINGS = {
  titleMode: 'status',
  titleVisibility: 'inactive-only',
  disguiseTitleId: 'project-dashboard',
  customDisguiseTitle: '',
  titleAnimationEnabled: false,
  themeId: 'system',
} as const
```

필요 상태와 액션 수치는 `constants/pet.ts`에 모은다.

- `NEED_THRESHOLDS`: 배고픔, 졸림, 더러움, 심심함, 신남 판정 기준
- `ACTION_EFFECTS`: `feed`, `play`, `sleep`, `wash`의 스탯 변화
- `ACTION_COOLDOWN_MS`: 액션별 cooldown
- `BASE_ACTION_EXP`, `BASE_AFFINITY_EXP`: 액션별 성장 보상
- `LEVEL_EXP_BASE`, `LEVEL_EXP_GROWTH`: 레벨 경험치 곡선
- `AFFINITY_EXP_BASE`, `AFFINITY_EXP_GROWTH`: 친밀도 경험치 곡선
- `OVERCARE_THRESHOLD`, `OVERCARE_REWARD_MULTIPLIER`: 과관리 보상 감소
- `DECAY_PER_HOUR`, `MAX_OFFLINE_DECAY_HOURS`: 오프라인 감소량과 최대 반영 시간

## 5. 상태 계산

상태 계산은 스탯, 마지막 놀이 시각, 현재 시각을 입력받는 순수 함수로 구현한다.

우선순위:

1. `fullness <= hungryFullness`이면 `hungry`
2. `energy <= sleepyEnergy`이면 `sleepy`
3. `cleanliness <= dirtyCleanliness`이면 `dirty`
4. `lastPlayedAt` 기준 경과 시간이 `boredAfterMs` 이상이면 `bored`
5. 모든 핵심 스탯이 excited 기준 이상이면 `excited`
6. active alert가 없으면 `fine`
7. 표시용 기본 상태는 `happy`

동시에 여러 필요 상태가 발생하면 `getPrimaryAlert`가 severity를 계산하고, 같은 severity에서는 `hungry`, `sleepy`, `dirty`, `bored` 순서로 결정한다.

## 6. 액션 적용과 성장

액션 적용은 현재 스탯, 성장값, 액션을 받아 새 스탯과 성장 결과를 반환하는 순수 함수로 구현한다.

```ts
export function applyCareAction(input: {
  stats: PetStats
  growth: PetGrowth
  action: PetAction
}): CareActionResult
```

규칙:

- 모든 스탯은 0-100 범위로 clamp한다.
- `feed`, `sleep`, `wash`는 해당 스탯이 `OVERCARE_THRESHOLD` 이상이면 보상이 줄어든다.
- affinity level은 경험치 보너스를 제공하되 `MAX_AFFINITY_EXP_BONUS`로 제한한다.
- `play`는 `lastPlayedAt`을 갱신해 boredom 계산에 반영한다.

`usePetStore.performAction`은 클릭 직후 해당 액션의 cooldown과 active reaction을 먼저 반영하고, 900ms 뒤 `applyCareAction`을 적용한다. reset 또는 재초기화 중 들어온 지연 액션은 generation id로 무시한다.

## 7. 오프라인 decay

오프라인 decay는 `lastUpdatedAt`과 현재 시각을 입력받아 새 스탯을 반환한다.

설계 기준:

- 밀리초 차이를 시간 단위로 변환한다.
- 음수 시간은 0으로 처리한다.
- 최대 반영 시간은 `MAX_OFFLINE_DECAY_HOURS`로 제한한다.
- decay 후에도 0-100 범위로 clamp한다.
- MVP에서는 `Math.round`로 정수 스탯을 유지한다.

## 8. 저장/복원

### 8.1 저장 데이터

```ts
{
  "version": 2,
  "species": "cat",
  "name": "몽이",
  "stats": {
    "fullness": 70,
    "energy": 70,
    "cleanliness": 70
  },
  "growth": {
    "level": 1,
    "exp": 0,
    "affinityExp": 0
  },
  "settings": {
    "titleMode": "status",
    "titleVisibility": "inactive-only",
    "disguiseTitleId": "project-dashboard",
    "customDisguiseTitle": "",
    "titleAnimationEnabled": false,
    "themeId": "system"
  },
  "lastUpdatedAt": 1777460400000,
  "lastPlayedAt": 1777460400000
}
```

### 8.2 저장 규칙

- 상태가 변경될 때마다 저장한다.
- 저장 시 `lastUpdatedAt`을 현재 시각으로 갱신한다.
- 저장 함수는 `localStorage` 접근 실패를 삼켜서는 안 된다. 단, UI가 깨지지 않도록 오류 상태는 composable 내부에서 관리한다.

### 8.3 복원 규칙

복원 순서:

1. 브라우저 환경인지 확인한다.
2. `PET_STORAGE_KEY`를 읽는다.
3. JSON parse 실패 시 `null`을 반환하고 UI는 초기 선택 화면을 유지한다.
4. v1 저장값은 v2 `settings`, `growth`, `cleanliness`, `lastPlayedAt` 구조로 마이그레이션한다.
5. species, stats, growth, settings, timestamps를 검증한다.
6. offline decay를 적용한다.
7. 복원된 값을 즉시 다시 저장한다.

## 9. composable 설계

### 9.1 `usePetStore`

역할:

- 앱의 단일 펫 상태를 관리한다.
- 액션 실행, cooldown, active reaction, 지연 적용을 관리한다.
- 현재 상태값, 레벨 진행률, 친밀도 진행률을 computed로 제공한다.
- 설정 패널 모드와 펫 이름/설정을 갱신한다.
- 저장 composable과 연결한다.

제공값:

```ts
{
  petState,
  draftDisguiseTitleId,
  draftThemeId,
  isReady,
  petStatus,
  levelProgress,
  affinityProgress,
  actionCooldowns,
  activeReaction,
  sidePanelMode,
  storageError,
  restorePet,
  initializePet,
  performAction,
  updatePetName,
  updatePetSettings,
  setSidePanelMode,
  isActionCoolingDown,
  setDisguiseTitle,
  setTheme,
  resetPet
}
```

### 9.2 `useLocalPetStorage`

역할:

- `localStorage` 접근을 격리한다.
- 저장값 parse, validate, migration 책임을 가진다.
- SSR에서는 no-op 또는 `null` 반환만 수행한다.
- 복원 시 offline decay를 적용한 뒤 v2 형태로 다시 저장한다.

### 9.3 `useTabTitle`

역할:

- Nuxt head title과 `document.title` 변경을 함께 담당한다.
- `titleVisibility`가 `inactive-only`이면 visible 상태에서는 기본 title을 유지하고 hidden 상태에서만 상태 title을 반영한다.
- title animation이 켜져 있으면 hidden 상태에서 상태 title을 회전 title로 적용한다.
- 브라우저 환경에서만 `document` 이벤트를 구독한다.

### 9.4 `useFavicon`

역할:

- 현재 species, status, theme에 맞는 SVG favicon을 생성한다.
- favicon link 태그를 생성 또는 갱신한다.
- 작은 SVG 문자열을 `data:image/svg+xml` URL로 encode한다.
- 중복 link 생성을 피하기 위해 `link[data-tab-pet-icon="true"]`를 사용한다.

## 10. 탭 표현 모델

title과 favicon은 UI 컴포넌트가 직접 만들지 않는다. `tabPresentation` 유틸에서 계산한다.

```ts
export type TabPresentation = {
  title: string
  faviconSvg: string
}
```

규칙:

- `titleMode: 'status'`는 상태 title을 사용한다.
- `titleVisibility: 'inactive-only'`는 visible 상태에서 `Tab Pet`, hidden 상태에서 상태 title을 사용한다.
- `titleMode: 'disguise'`는 custom title이 있으면 custom title, 없으면 프리셋 title을 사용한다.
- favicon은 title mode와 무관하게 species, status, theme를 반영한다.

## 11. UI 컴포넌트 책임

### 11.1 `PetSetup`

- 최초 펫 선택 화면
- 고양이/강아지 선택
- 선택 후 `initializePet` 호출

### 11.2 `PetStatusPanel`

- 현재 펫 종, 상태, 스탯 표시
- 상태별 짧은 메시지 표시
- fullness, energy, cleanliness 스탯 바 표시

### 11.3 `PetActions`

- `feed`, `play`, `sleep`, `wash` 버튼 제공
- 클릭 시 `performAction` 호출
- active reaction과 cooldown 상태를 disabled UI로 표시
- 버튼은 같은 크기를 유지한다.

### 11.4 `PetSidePanel`

- 상태 탭과 설정 탭을 제공한다.
- 상태 탭은 레벨, 경험치, 친밀도 진행률을 표시한다.
- 설정 탭은 펫 이름, title mode, title visibility, disguise title, title animation, theme를 편집한다.

### 11.5 `PetSettingsPanel`

- 설정 입력값을 검증 가능한 patch로 emit한다.
- 빈 펫 이름은 저장하지 않고 기존 이름으로 되돌린다.
- 프리셋 disguise title 선택 시 custom title을 비운다.
- custom title은 입력 즉시 반영한다.

### 11.6 `GuidePanel`

- Growth MVP 사용 흐름을 보조하는 정적 안내 UI
- 실제 상태 변경 로직 없음

### 11.7 `MonetizationMock`

- 광고 보상형 UI 목업
- 프리미엄 스킨 UI 목업
- 실제 광고 SDK와 결제 API 호출 없음

### 11.8 `EmojiCopyPanel`

- 복사 가능한 이모지 목록
- Clipboard API 사용
- Growth MVP의 메인 화면에서는 노출하지 않는다.

## 12. Nuxt SSR 주의사항

다음 API는 서버에서 접근하면 안 된다.

- `window`
- `document`
- `localStorage`
- `navigator.clipboard`

접근 방식:

```ts
if (!import.meta.client) {
  return
}
```

또는 Nuxt의 `onMounted` 내부에서만 실행한다.

## 13. 테스트 전략

### 13.1 우선 테스트 대상

순수 함수와 저장/표현 정책부터 테스트한다.

- `getPrimaryAlert`
- `getPetStatus`
- `applyCareAction`
- `applyOfflineDecay`
- `clampStat`
- `getTabTitle`
- `getTabPresentation`
- 저장값 validate/migration 함수
- 설정 패널과 액션 disabled 조건

### 13.2 주요 테스트 케이스

- fullness가 낮으면 `hungry`
- energy가 낮으면 `sleepy`
- cleanliness가 낮으면 `dirty`
- 오래 놀지 않으면 `bored`
- 모든 조건이 좋으면 `excited`
- active alert가 없으면 `fine` 또는 표시용 `happy`
- 액션 후 스탯이 100을 넘지 않음
- 액션 후 스탯이 0보다 작아지지 않음
- overcare 액션은 보상이 줄어듦
- level과 affinity progress가 요구 경험치 기준으로 계산됨
- 오프라인 시간이 음수면 decay 없음
- 오프라인 시간이 24시간을 넘으면 24시간까지만 반영
- v1 저장값은 v2 스키마로 마이그레이션됨
- 깨진 localStorage 값은 초기 선택 화면으로 복구됨
- hidden inactive-only 상태 title은 상태 title을 반환함

## 14. 배포 고려사항

Vercel 배포를 기준으로 한다.

- 서버 API가 없으므로 정적/SSR 배포 모두 가능하다.
- 브라우저 API 사용 코드는 client-only로 제한한다.
- favicon 동적 변경은 페이지 로드 후 client에서 반영된다.
- SEO는 핵심 목표가 아니므로 MVP에서는 최소 설정만 한다.

## 15. 주요 리스크

| 리스크 | 대응 |
| --- | --- |
| 브라우저별 favicon 갱신 차이 | SVG data URL 방식으로 단순화하고 QA 브라우저를 명시한다. |
| SSR에서 브라우저 API 접근 오류 | composable에서 client guard를 강제한다. |
| 위장 타이틀이 너무 노골적임 | title은 업무 프리셋 또는 상태 title 중심으로 유지한다. |
| localStorage 데이터 손상 | validate와 v1 -> v2 migration을 구현한다. |
| MVP 범위 확장 | 실제 광고, 결제, 확장은 목업으로 고정한다. |
