# 2026-05-07 Recommendation Copy Guardrails

## 개선 방향

- 추천 버튼은 사용자가 지금 실행할 행동을 말하고, 추천 카드는 왜 이 행동이 추천되는지 설명하도록 역할을 고정했습니다.
- `결과 확인`은 실행 전 상태에서 결과가 이미 있는 것처럼 들릴 수 있어, 버튼 detail을 시작 중심 문구로 조정했습니다.

## 변경 사항

- 추천 버튼 detail copy를 `추천 돌봄 시작`으로 변경했습니다.
- en/ko/ja `actionButtonState.recommendedDetail`을 exact copy로 검증하도록 테스트를 강화했습니다.
- 추천 카드 본문은 긴 `careRecommendation.details[action]`을 유지하고, 추천 버튼 detail은 compact `actionButtonState.recommendedDetail`을 쓰는지 회귀 테스트로 고정했습니다.
- 추천 버튼 aria label도 `밥 주기: 추천 · 추천 돌봄 시작`으로 검증했습니다.

## 검증

- RED 확인: `npm run test -- tests/pet-action-button-status.test.ts tests/pet-recommendation-evidence.test.ts`
  - 실패 원인: 기존 추천 버튼 detail copy가 `추천 결과 확인` / `Check recommended result`로 남아 있었습니다.
  - 카드 본문과 버튼 detail 분리 테스트는 기존 구조에서도 통과해 회귀 방어선으로 동작했습니다.
- GREEN 확인: `npm run test -- tests/pet-action-button-status.test.ts tests/pet-recommendation-evidence.test.ts`
  - 결과: 2 files / 17 tests passed.
- 리뷰 제안 반영 RED/GREEN:
  - RED: `추천 돌봄 실행` / `Run recommended care`가 `추천 돌봄 시작` / `Start recommended care` 기대와 달라 실패했습니다.
  - GREEN: `npm run test -- tests/pet-action-button-status.test.ts tests/pet-recommendation-evidence.test.ts` 2 files / 17 tests passed.
- 전체 검증:
  - `npm run test`: 25 files / 185 tests passed.
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - `git diff --check`: passed.

## 서브에이전트 메모

- 다음 개선 후보 탐색은 추천 버튼 copy를 실행 중심으로 다듬고, 추천 카드 본문 유지 회귀 테스트를 추가하는 범위를 권장했습니다.
- 스펙 리뷰와 코드 품질 리뷰 모두 차단 이슈는 없었습니다.
- 코드 품질 리뷰의 비차단 제안 중 더 자연스러운 `시작` 중심 copy, 테스트 setup 계약 강화, 카드 본문 template assertion 강화를 반영했습니다.
- 최종 리뷰도 차단 이슈는 없었고, docs 파일을 커밋 범위에 포함해야 한다는 메모만 있었습니다.
