# 2026-05-07 Recommendation Chip Mobile Copy

## 개선 방향

- 추천 카드의 CTA 칩을 모바일에서도 짧게 스캔할 수 있도록 ready 문구와 chip 폭 처리를 정리했습니다.

## 변경 사항

- CTA ready 문구를 `지금 가능 · 결과 확인`처럼 짧게 줄였습니다.
- 추천 카드 CTA/evidence/reward chip에 `width: fit-content`와 `min-width: 0`을 적용했습니다.
- reward copy는 유지하고 chip 폭 안전장치만 보강해 변경 범위를 좁혔습니다.

## 검증

- `npm run test -- tests/pet-recommendation-evidence.test.ts tests/pet-recommendation-reward-preview.test.ts`: RED 확인, 3개 기대 실패
- `npm run test -- tests/pet-recommendation-evidence.test.ts tests/pet-recommendation-reward-preview.test.ts`: 통과, 2 files / 18 tests
- `npm run test`: 통과, 25 files / 184 tests
- `npm run lint`: 통과
- `npm run build`: 통과
- `git diff --check`: 통과

## 하위 에이전트 리뷰

- 탐색: CTA copy 축약과 chip `fit-content` 폭 처리가 최소 변경이라는 의견을 확인했습니다.
- spec review: blocking 이슈 없음. 추천 로직/상태 계산 변경 없음, reward copy 유지 확인.
- code quality review: blocking 이슈 없음. 실제 모바일 viewport 시각 확인은 다음 후보로 남김.

## 리스크

- 실제 모바일 줄바꿈은 언어별 텍스트 길이와 viewport에 따라 달라질 수 있습니다.

## 다음 개선 후보

- 추천 카드와 action grid를 실제 모바일 브라우저에서 스크린샷으로 검증해 과밀한 경우 간격을 미세 조정합니다.
