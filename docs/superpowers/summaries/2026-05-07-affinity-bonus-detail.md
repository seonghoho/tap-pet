# 2026-05-07 Affinity Bonus Detail

## 개선 방향

- 사이드 패널의 `보상 보너스` 목표가 친밀도 숫자만이 아니라 돌봄 경험치 배율을 올린다는 점을 바로 이해할 수 있게 했습니다.
- 반복 사용자에게 친밀도를 올릴 이유를 더 명확히 보여주는 작은 콘텐츠 개선입니다.

## 변경 사항

- 친밀도 목표 detail을 `현재 30/140 · 돌봄 경험치 x1.3 → x1.4`처럼 표시했습니다.
- 최대 배율에서는 `x1.5 → x1.5` 대신 `돌봄 경험치 최대 x1.5`로 표시해 다음 목표가 배율을 더 올린다고 오해하지 않게 했습니다.
- 기존 `getExperienceMultiplier()`를 재사용해 현재/다음 보상 보너스 배율을 계산했습니다.
- en/ko/ja `sidePanelProgress.affinityGoalDetail`와 `affinityGoalMaxDetail` copy를 추가했습니다.
- store, growth model, affinity 계산식은 변경하지 않았습니다.

## 검증

- RED 확인: `npm run test -- tests/pet-side-panel-growth-goals.test.ts`
  - 실패 원인: `affinityGoalDetail` computed와 i18n key가 없었습니다.
- GREEN 확인: `npm run test -- tests/pet-side-panel-growth-goals.test.ts`
  - 결과: 1 file / 5 tests passed.
- 리뷰 반영 RED/GREEN:
  - RED: 최대 배율에서 `x1.5 → x1.5`가 표시되어 `돌봄 경험치 최대 x1.5` 기대와 달라 실패했습니다.
  - GREEN: `npm run test -- tests/pet-side-panel-growth-goals.test.ts tests/pet-first-care-goal.test.ts` 2 files / 11 tests passed.
- 전체 검증:
  - `npm run test`: 25 files / 188 tests passed.
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - `git diff --check`: passed.

## 서브에이전트 메모

- 탐색 리뷰는 기존 `getExperienceMultiplier()`를 재사용해 보상 보너스 detail을 표시하는 범위를 권장했습니다.
- 스펙 리뷰와 코드 품질 리뷰 모두 차단 이슈는 없었습니다.
- 코드 품질 리뷰의 비차단 제안 중 최대 배율 copy와 테스트 헬퍼의 petGrowth export 매핑 강화를 반영했습니다.
- 최종 read-only 리뷰에서도 차단/고위험 이슈는 없었습니다.
