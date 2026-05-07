# 2026-05-07 Recommendation Availability Dedupe

## 개선 방향

- 추천 카드가 이미 추천 행동의 대기 시간을 안내할 때 일반 쿨다운 안내가 같은 내용을 반복하지 않도록 정리했습니다.

## 변경 사항

- 추천 카드가 보이는 상태에서 다음 쿨다운 액션이 추천 행동과 같으면 `actionAvailabilityText`를 숨겼습니다.
- 추천 액션 외 다른 액션이 실제 다음 쿨다운이면 일반 쿨다운 안내를 기존처럼 유지했습니다.
- 결과 카드의 다음 확인 힌트는 기존 `nextCoolingAction` 의미를 유지해 영향 범위를 좁혔습니다.

## 검증

- `npm run test -- tests/pet-action-availability.test.ts`: RED 확인, 1개 기대 실패
- `npm run test -- tests/pet-action-availability.test.ts tests/pet-recommendation-evidence.test.ts`: 통과, 2 files / 18 tests
- 보완 후 `npm run test -- tests/pet-action-availability.test.ts tests/pet-recommendation-evidence.test.ts`: 통과, 2 files / 19 tests
- `npm run test`: 통과, 25 files / 184 tests
- `npm run lint`: 통과
- `npm run build`: 통과
- `git diff --check`: 통과

## 하위 에이전트 리뷰

- 탐색: 일반 availability 전용 cooldown 후보에서 추천 카드 CTA가 맡는 action만 제외하는 설계를 권장했습니다.
- spec review: 구현 이슈 없음. 문서 파일을 커밋 범위에 포함해야 한다는 제출 범위 지적 확인.
- code quality review: 추천 액션이 실제 다음 쿨다운인데도 나중에 풀리는 다른 액션을 표시하는 회귀 가능성을 지적해, 실제 `nextCoolingAction`이 추천 action일 때만 숨기도록 보완했습니다.
- code quality re-review: 기존 P1 닫힘. computed 순서/의존성 및 보완 테스트 문제 없음.

## 리스크

- 추천 카드가 숨겨지는 상태에서는 일반 쿨다운 안내가 기존처럼 표시됩니다.
- 추천 CTA와 일반 availability가 서로 다른 액션을 말할 때는 정보량이 늘어날 수 있습니다.

## 다음 개선 후보

- 추천 카드와 action grid의 상태 정보 밀도가 높아진 만큼 모바일 실제 화면에서 칩 줄바꿈과 버튼 영역 간 간격을 시각 검증합니다.
