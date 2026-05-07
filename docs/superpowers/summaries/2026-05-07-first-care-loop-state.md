# 2026-05-07 First Care Loop State

## 개선 방향

- 첫 돌봄 이후에도 사이드 패널이 같은 온보딩 체크리스트를 보여주는 문제를 줄였습니다.
- 첫 루프 전에는 `한 번의 돌봄 흐름`을 안내하고, 성장/친밀도 진행이 생기면 `다음 루프`를 이어가도록 문구를 전환합니다.

## 변경 사항

- `PetSidePanel`에서 `level`, `levelProgress`, `affinityProgress`만으로 첫 돌봄 루프 시작 여부를 파생했습니다.
- 첫 루프 전/후 copy를 `firstCareGoal`과 `firstCareGoal.repeat`으로 분리했습니다.
- 반복 상태에서는 `first-care-goal--repeat` 클래스를 적용해 마커 색을 성공 톤으로 바꿉니다.
- 새 저장 상태나 pet model 변경은 추가하지 않았습니다.

## 검증

- RED 확인: `npm run test -- tests/pet-first-care-goal.test.ts tests/pet-side-panel-growth-goals.test.ts`
  - 실패 원인: 반복 루프 상태/copy/template class/i18n/CSS가 아직 없었습니다.
- GREEN 확인: `npm run test -- tests/pet-first-care-goal.test.ts tests/pet-side-panel-growth-goals.test.ts`
  - 결과: 2 files / 10 tests passed.
- 리뷰 반영 후 재검증: `npm run test -- tests/pet-first-care-goal.test.ts tests/pet-side-panel-growth-goals.test.ts`
  - 결과: 2 files / 10 tests passed.
- 전체 검증:
  - `npm run test`: 25 files / 187 tests passed.
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - `git diff --check`: passed.

## 서브에이전트 메모

- 다음 후보 탐색은 첫 돌봄 목표가 첫 행동 이후에도 정적 안내로 유지되는 점을 가장 작은 가치 개선 후보로 추천했습니다.
- 스펙 리뷰와 코드 품질 리뷰 모두 차단 이슈는 없었습니다.
- 코드 품질 리뷰의 비차단 제안 중 파생 상태 이름을 `hasStartedFirstCareLoop`로 바꾸고, reload 이후에도 자연스럽게 읽히도록 `다음 결과 확인` copy를 반영했습니다.
