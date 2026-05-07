# 2026-05-07 Play Recommendation Evidence

## 개선 방향

- `play` 추천이 뜰 때 사용자가 이유를 바로 이해하도록 마지막 놀이 이후 경과 시간을 추천 카드 근거로 노출했습니다.

## 변경 사항

- `app.vue`에서 `currentPet.lastPlayedAt`을 `PetActions`에 전달했습니다.
- `PetActions.vue`에서 `play` 추천 전용 경과 시간 근거를 계산했습니다.
- 영어/한국어/일본어 메시지에 시간 표현과 `play` 근거 문구를 추가했습니다.
- 추천 근거 테스트로 prop 연결, `play` 근거, 지역화 키를 검증했습니다.

## 검증

- `npm run test -- tests/pet-recommendation-evidence.test.ts tests/pet-care-recommendation.test.ts`: 통과
- 하위 품질 리뷰어 추가 검증 `npm run test -- tests/pet-recommendation-evidence.test.ts tests/pet-action-button-status.test.ts tests/pet-care-feedback-summary.test.ts tests/pet-action-availability.test.ts`: 통과
- `npm run test`: 통과, 25 files / 179 tests
- `npm run lint`: 통과
- `npm run build`: 통과
- `git diff --check`: 통과

## 하위 에이전트 리뷰

- spec review: blocking 누락/과잉 구현 없음
- code quality review: blocking issue 없음

## 리스크

- 경과 시간은 클라이언트 시간 기준이므로 사용자의 시스템 시간이 크게 틀리면 표시가 달라질 수 있습니다.

## 다음 개선 후보

- 추천 카드에서 쿨다운/횟수 제한 상태와 추천 CTA를 더 명확히 분리해 사용자가 지금 가능한 행동을 즉시 판단하도록 개선합니다.
