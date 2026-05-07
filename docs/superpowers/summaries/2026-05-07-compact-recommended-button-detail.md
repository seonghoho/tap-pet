# 2026-05-07 Compact Recommended Button Detail

## 개선 방향

- 추천 이유와 근거는 추천 카드가 설명하고, 액션 버튼은 사용자가 바로 실행할 수 있는 결과 확인 문구에 집중하도록 역할을 분리했습니다.
- 모바일에서는 같은 긴 이유 문구가 카드와 첫 번째 버튼에 반복되면 버튼 높이와 정보 밀도가 커지므로, 버튼 보조 문구는 짧은 실행 안내로 유지합니다.

## 변경 사항

- ready 추천 액션 버튼 detail을 긴 추천 이유 대신 `추천 결과 확인`으로 표시했습니다.
- en/ko/ja `actionButtonState.recommendedDetail` 문구를 추가해 추천 카드 CTA와 버튼 detail 카피를 독립적으로 조정할 수 있게 했습니다.
- 추천 카드 본문, CTA chip, 근거 chip, 보상 chip, 쿨다운/잠금/진행 중 버튼 상태 로직은 그대로 유지했습니다.

## 검증

- RED 확인: `npm run test -- tests/pet-action-button-status.test.ts`
  - 실패 원인: 추천 버튼 detail이 기존 긴 이유를 반환했고, `recommendedDetail` locale 키가 없었습니다.
- GREEN 확인: `npm run test -- tests/pet-action-button-status.test.ts tests/pet-recommendation-evidence.test.ts`
  - 결과: 2 files / 16 tests passed.
- 전체 검증:
  - `npm run test`: 25 files / 184 tests passed.
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - `git diff --check`: passed.

## 근거

- 모바일 390px 스크린샷 검증에서 recommendation card/chip 자체 overflow는 없었습니다.
- 다만 추천 카드가 긴 이유를 이미 설명하는데 추천 액션 버튼이 같은 이유를 반복해 첫 버튼 높이와 반복감이 커지는 점을 확인했습니다.
- 액션 버튼 aria label도 `getActionButtonDetail()`을 포함하므로, 추천 버튼의 스크린리더 문구 역시 짧은 실행 안내로 변경됩니다.

## 서브에이전트 메모

- 탐색 리뷰는 `recommendationDetail`은 추천 카드용으로 유지하고, 액션 버튼의 추천 detail만 분리하는 접근을 권장했습니다.
- 새 i18n 키를 추가하는 방식은 변경 파일이 하나 늘지만 추천 카드 CTA와 버튼 detail을 독립적으로 운영할 수 있어 장기적으로 더 안전하다고 판단했습니다.
- 스펙 리뷰와 코드 품질 리뷰 모두 차단 이슈는 없었습니다.
- 비차단 제안으로 추천 카드 본문 유지 회귀 테스트 보강과 aria label 카피 확인이 있었습니다. 이번 목표에서는 기존 카드 본문 로직과 목표 카피를 유지하고, 더 넓은 콘텐츠 QA 후보로 남겼습니다.
