# 2026-05-07 Recommendation Reward Bonus Detail

## 개선 방향

- 추천 카드의 예상 보상에서 현재 친밀도 EXP 보너스 배율을 바로 확인할 수 있게 했습니다.
- 사이드 패널의 `보상 보너스` 설명이 실제 추천 행동 보상과 연결되도록 했습니다.

## 변경 사항

- 예상 보상 문구에 `경험치 보너스 x1.1`을 추가했습니다.
- 기존 reward preview의 `rewardMultiplier`를 재사용했습니다.
- en/ko/ja `careRecommendation.rewardHint` copy에 `{bonus}` placeholder를 추가했습니다.
- store, 추천 알고리즘, 보상 계산식은 변경하지 않았습니다.

## 검증

- RED 확인: `npm run test -- tests/pet-recommendation-reward-preview.test.ts`
  - 실패 원인: 추천 보상 문구에 보너스 배율이 없고, i18n `rewardHint`에 `{bonus}` placeholder가 없었습니다.
- GREEN 확인: `npm run test -- tests/pet-recommendation-reward-preview.test.ts tests/pet-recommendation-evidence.test.ts`
  - 결과: 2 files / 19 tests passed.
- 리뷰 반영 RED/GREEN:
  - RED: `보너스 x1.1` copy를 `경험치 보너스 x1.1`로 기대하도록 바꾸자 기존 문구와 달라 실패했습니다.
  - GREEN: `npm run test -- tests/pet-recommendation-reward-preview.test.ts tests/pet-recommendation-evidence.test.ts` 2 files / 19 tests passed.
- 전체 검증:
  - `npm run test`: 25 files / 188 tests passed.
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - `git diff --check`: passed.

## 서브에이전트 메모

- 후보 탐색은 추천 보상 카드가 이미 가진 `rewardMultiplier`를 표시하는 범위를 권장했습니다.
- 스펙 리뷰와 코드 품질 리뷰 모두 차단 이슈는 없었습니다.
- 코드 품질 리뷰의 비차단 제안 중 EXP 보너스 의미를 더 명확히 하는 copy를 반영했습니다.
