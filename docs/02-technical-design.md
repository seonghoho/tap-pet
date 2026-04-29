# Tab Pet Technical Design

## 1. 설계 원칙

Tab Pet의 핵심은 상태 모델과 탭 반응이다. 구현은 다음 원칙을 따른다.

- 순수 함수와 UI를 분리한다.
- magic number는 상수화한다.
- 브라우저 API 접근은 composable에 격리한다.
- 상태값은 저장하지 않고 스탯에서 계산한다.
- Nuxt SSR 환경에서 `window`, `document`, `localStorage` 접근을 안전하게 처리한다.
- 작은 단위로 구현하고 각 단위가 독립적으로 테스트 가능하게 만든다.

## 2. 권장 디렉터리 구조

```txt
constants/
  pet.ts
  titles.ts
  themes.ts

types/
  pet.ts

utils/
  petActions.ts
  petDecay.ts
  petStatus.ts
  petValidation.ts
  tabPresentation.ts

composables/
  usePetStore.ts
  useLocalPetStorage.ts
  useTabTitle.ts
  useFavicon.ts

components/
  PetSetup.vue
  PetStatusPanel.vue
  PetActions.vue
  DisguiseTitlePicker.vue
  ThemePicker.vue
  MonetizationMock.vue
  EmojiCopyPanel.vue
```

## 3. 타입 설계

```ts
export type PetSpecies = 'cat' | 'dog'

export type PetStatus =
  | 'happy'
  | 'hungry'
  | 'sleepy'
  | 'bored'
  | 'sad'
  | 'excited'

export type PetAction = 'feed' | 'play' | 'sleep'

export type PetStats = {
  fullness: number
  mood: number
  energy: number
}

export type PetState = {
  species: PetSpecies
  stats: PetStats
  disguiseTitleId: string
  themeId: string
  lastUpdatedAt: number
}

export type StoredPetState = PetState & {
  version: number
}
```

## 4. 상수 설계

```ts
export const PET_STORAGE_KEY = 'tab-pet:state'
export const PET_STORAGE_VERSION = 1

export const STAT_MIN = 0
export const STAT_MAX = 100

export const DEFAULT_STATS = {
  fullness: 70,
  mood: 70,
  energy: 70,
} as const

export const STATUS_THRESHOLDS = {
  hungryFullness: 25,
  sleepyEnergy: 20,
  sadMood: 25,
  boredMood: 45,
  excitedMood: 85,
  excitedFullness: 70,
  excitedEnergy: 50,
} as const

export const ACTION_EFFECTS = {
  feed: {
    fullness: 30,
    mood: 5,
    energy: -5,
  },
  play: {
    fullness: -10,
    mood: 25,
    energy: -15,
  },
  sleep: {
    fullness: -8,
    mood: 5,
    energy: 35,
  },
} as const

export const DECAY_PER_HOUR = {
  fullness: -6,
  mood: -4,
  energy: -3,
} as const

export const MAX_OFFLINE_DECAY_HOURS = 24
```

## 5. 상태 계산

상태 계산은 `PetStats`만 입력받는 순수 함수로 구현한다.

우선순위:

1. `fullness <= hungryFullness`이면 `hungry`
2. `energy <= sleepyEnergy`이면 `sleepy`
3. `mood <= sadMood`이면 `sad`
4. `mood <= boredMood`이면 `bored`
5. `mood >= excitedMood && fullness >= excitedFullness && energy >= excitedEnergy`이면 `excited`
6. 그 외 `happy`

```ts
export function getPetStatus(stats: PetStats): PetStatus {
  if (stats.fullness <= STATUS_THRESHOLDS.hungryFullness) return 'hungry'
  if (stats.energy <= STATUS_THRESHOLDS.sleepyEnergy) return 'sleepy'
  if (stats.mood <= STATUS_THRESHOLDS.sadMood) return 'sad'
  if (stats.mood <= STATUS_THRESHOLDS.boredMood) return 'bored'

  const isExcited =
    stats.mood >= STATUS_THRESHOLDS.excitedMood &&
    stats.fullness >= STATUS_THRESHOLDS.excitedFullness &&
    stats.energy >= STATUS_THRESHOLDS.excitedEnergy

  return isExcited ? 'excited' : 'happy'
}
```

## 6. 액션 적용

액션 적용은 현재 스탯과 액션을 받아 새 스탯을 반환하는 순수 함수로 구현한다.

```ts
export function applyPetAction(stats: PetStats, action: PetAction): PetStats {
  const effect = ACTION_EFFECTS[action]

  return {
    fullness: clampStat(stats.fullness + effect.fullness),
    mood: clampStat(stats.mood + effect.mood),
    energy: clampStat(stats.energy + effect.energy),
  }
}
```

`clampStat`은 모든 스탯을 0-100 범위로 제한한다.

## 7. 오프라인 decay

오프라인 decay는 `lastUpdatedAt`과 현재 시각을 입력받아 새 스탯을 반환한다.

설계 기준:

- 밀리초 차이를 시간 단위로 변환한다.
- 음수 시간은 0으로 처리한다.
- 최대 반영 시간은 `MAX_OFFLINE_DECAY_HOURS`로 제한한다.
- decay 후에도 0-100 범위로 clamp한다.

```ts
export function applyOfflineDecay(
  stats: PetStats,
  lastUpdatedAt: number,
  now: number,
): PetStats {
  const elapsedHours = Math.max(0, (now - lastUpdatedAt) / 1000 / 60 / 60)
  const decayHours = Math.min(elapsedHours, MAX_OFFLINE_DECAY_HOURS)

  return {
    fullness: clampStat(stats.fullness + DECAY_PER_HOUR.fullness * decayHours),
    mood: clampStat(stats.mood + DECAY_PER_HOUR.mood * decayHours),
    energy: clampStat(stats.energy + DECAY_PER_HOUR.energy * decayHours),
  }
}
```

MVP에서는 소수점 스탯을 허용하지 않고 `Math.round` 또는 `Math.floor` 중 하나로 통일한다. 권장값은 UI 표시가 자연스러운 `Math.round`다.

## 8. 저장/복원

### 8.1 저장 데이터

```ts
{
  "version": 1,
  "species": "cat",
  "stats": {
    "fullness": 70,
    "mood": 70,
    "energy": 70
  },
  "disguiseTitleId": "project-dashboard",
  "themeId": "default",
  "lastUpdatedAt": 1777460400000
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
3. JSON parse 실패 시 기본값을 반환한다.
4. version이 다르면 마이그레이션 또는 기본값을 반환한다.
5. species, stats, title ID, theme ID를 검증한다.
6. offline decay를 적용한다.
7. 복원된 값을 즉시 다시 저장한다.

## 9. composable 설계

### 9.1 `usePetStore`

역할:

- 앱의 단일 펫 상태를 관리한다.
- 액션 실행 함수를 제공한다.
- 현재 상태값을 computed로 제공한다.
- 저장 composable과 연결한다.

제공값:

```ts
{
  petState,
  petStatus,
  initializePet,
  performAction,
  setDisguiseTitle,
  setTheme,
  resetPet
}
```

### 9.2 `useLocalPetStorage`

역할:

- `localStorage` 접근을 격리한다.
- 저장값 parse, validate, migration 책임을 가진다.
- SSR에서는 no-op 또는 기본값 반환만 수행한다.

제공값:

```ts
{
  loadPetState,
  savePetState,
  clearPetState
}
```

### 9.3 `useTabTitle`

역할:

- `document.title` 변경을 담당한다.
- 프리셋과 상태를 받아 최종 title을 만든다.
- 브라우저 환경에서만 실행한다.

```ts
export function getTabTitle(baseTitle: string, status: PetStatus): string {
  const signal = STATUS_TITLE_SIGNALS[status]
  return signal ? `${baseTitle} ${signal}` : baseTitle
}
```

### 9.4 `useFavicon`

역할:

- 현재 species, status, theme에 맞는 SVG favicon을 생성한다.
- favicon link 태그를 생성 또는 갱신한다.
- object URL을 쓰는 경우 이전 URL을 revoke한다.

권장 방식:

- 작은 SVG 문자열을 `data:image/svg+xml` URL로 encode한다.
- link selector는 `link[rel~="icon"]`를 사용한다.
- 중복 link 생성을 피한다.

## 10. 탭 표현 모델

title과 favicon은 UI 컴포넌트가 직접 만들지 않는다. `tabPresentation` 유틸에서 계산한다.

```ts
export type TabPresentation = {
  title: string
  faviconSvg: string
}

export function getTabPresentation(input: {
  species: PetSpecies
  status: PetStatus
  disguiseTitleId: string
  themeId: string
}): TabPresentation {
  return {
    title: getTabTitleByPreset(input.disguiseTitleId, input.status),
    faviconSvg: getFaviconSvg(input.species, input.status, input.themeId),
  }
}
```

## 11. UI 컴포넌트 책임

### 11.1 `PetSetup`

- 최초 펫 선택 화면
- 고양이/강아지 선택
- 선택 후 `initializePet` 호출

### 11.2 `PetStatusPanel`

- 현재 펫 종, 상태, 스탯 표시
- 상태별 짧은 메시지 표시
- 스탯 바 표시

### 11.3 `PetActions`

- `feed`, `play`, `sleep` 버튼 제공
- 클릭 시 `performAction` 호출
- 버튼은 항상 같은 크기를 유지한다.

### 11.4 `DisguiseTitlePicker`

- title 프리셋 목록 제공
- 선택 시 `setDisguiseTitle` 호출
- 선택 즉시 `document.title` 반영

### 11.5 `ThemePicker`

- 테마 선택
- 선택 즉시 본문 UI와 favicon 반영

### 11.6 `MonetizationMock`

- 광고 보상형 UI 목업
- 프리미엄 스킨 UI 목업
- 실제 광고 SDK와 결제 API 호출 없음

### 11.7 `EmojiCopyPanel`

- 복사 가능한 이모지 목록
- Clipboard API 사용
- 실패 시 수동 복사 안내 상태 제공

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

순수 함수부터 테스트한다.

- `getPetStatus`
- `applyPetAction`
- `applyOfflineDecay`
- `clampStat`
- `getTabTitle`
- 저장값 validate 함수

### 13.2 주요 테스트 케이스

- fullness가 낮으면 `hungry`
- energy가 낮으면 `sleepy`
- mood가 매우 낮으면 `sad`
- mood가 낮으면 `bored`
- 모든 조건이 좋으면 `excited`
- 그 외 `happy`
- 액션 후 스탯이 100을 넘지 않음
- 액션 후 스탯이 0보다 작아지지 않음
- 오프라인 시간이 음수면 decay 없음
- 오프라인 시간이 24시간을 넘으면 24시간까지만 반영
- 깨진 localStorage 값은 기본 상태로 복구

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
| 위장 타이틀이 너무 노골적임 | title은 업무 프리셋 + 작은 시그널 중심으로 유지한다. |
| localStorage 데이터 손상 | validate와 기본값 복구를 구현한다. |
| MVP 범위 확장 | 실제 광고, 결제, 확장은 목업으로 고정한다. |
