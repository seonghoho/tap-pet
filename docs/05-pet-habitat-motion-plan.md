# Pet Habitat Motion Plan

## 1. Feasibility

펫을 2D 캐릭터로 카드 안에서 돌아다니게 만드는 것은 현재 구조에서 충분히 가능하다. 별도 게임 엔진 없이 Vue state, CSS transform, `requestAnimationFrame` 또는 interval만으로 MVP 수준의 움직임을 만들 수 있다.

핵심은 기존 `PetAvatar`를 그대로 재사용하지 않고, 이동 가능한 `PetHabitat` 컴포넌트를 추가하는 것이다. `PetStatusPanel`은 스탯과 상태 설명을 유지하고, 왼쪽 시각 영역을 작은 방/케이지처럼 바꾸면 된다.

## 2. Recommended MVP Direction

가장 현실적인 1차 구현은 다음 방식이다.

- `PetHabitat.vue` 추가
- 고정 비율의 habitat box 생성
- `PetAvatar`를 box 안의 작은 캐릭터로 렌더링
- 캐릭터 위치는 `x`, `y`, `direction`, `activity` state로 관리
- 2-4초마다 새 목표 지점을 정하고 CSS transition으로 이동
- 상태별 행동을 다르게 표현

상태별 예시:

| Status | Motion |
| --- | --- |
| `happy` | 천천히 돌아다님 |
| `hungry` | 좌우로 짧게 배회 |
| `sleepy` | 한쪽 구석에서 거의 멈춤 |
| `bored` | 느리게 작은 범위만 이동 |
| `sad` | 아래쪽에 머무름 |
| `excited` | 이동 속도 빠름, 작은 bounce |

## 3. Component Shape

```txt
components/
  PetHabitat.vue
  PetAvatar.vue
```

`PetHabitat` props:

```ts
type Props = {
  species: PetSpecies
  status: PetStatus
  themeId: ThemeId
  ariaLabel: string
}
```

내부 상태:

```ts
type HabitatPosition = {
  x: number
  y: number
  direction: 'left' | 'right'
}
```

## 4. Motion Rules

magic number는 상수화한다.

```ts
const HABITAT_BOUNDS = {
  minX: 8,
  maxX: 72,
  minY: 18,
  maxY: 62,
}

const STATUS_MOTION = {
  happy: { intervalMs: 2800, speedMs: 1200 },
  hungry: { intervalMs: 1800, speedMs: 900 },
  sleepy: { intervalMs: 5200, speedMs: 1800 },
  bored: { intervalMs: 4200, speedMs: 1500 },
  sad: { intervalMs: 4600, speedMs: 1600 },
  excited: { intervalMs: 1300, speedMs: 650 },
}
```

## 5. UI Guidance

Habitat box는 카드 안의 카드처럼 보이지 않게, `PetStatusPanel`의 시각 영역 자체를 방처럼 만든다.

추천 요소:

- 바닥 라인
- 작은 밥그릇
- 작은 쿠션
- 상태별 배경 색상 변화
- 캐릭터 그림자
- 이동 방향에 따른 좌우 반전

주의:

- 과한 애니메이션은 탭 펫의 조용한 업무 위장 컨셉과 충돌한다.
- `prefers-reduced-motion`에서는 이동을 멈추거나 transition을 줄인다.
- layout shift가 없도록 habitat box의 `aspect-ratio`를 고정한다.

## 6. Implementation Steps

1. `PetHabitat.vue` 생성
2. `PetAvatar`에 작은 크기와 좌우 반전 class 지원
3. `PetStatusPanel`의 visual 영역에서 `PetAvatar` 대신 `PetHabitat` 사용
4. status별 motion 상수 추가
5. `setInterval` 또는 `requestAnimationFrame`으로 목표 위치 갱신
6. `prefers-reduced-motion` 대응
7. desktop/mobile 브라우저 QA

## 7. Later Enhancements

- 먹이/놀이/잠자기 액션 직후 짧은 reaction animation
- 밥그릇/쿠션/장난감 클릭 인터랙션
- 스킨별 habitat 소품 변경
- favicon 상태와 habitat 행동의 더 강한 연결
