# 2026-05-07 Recommendation CTA Status

## 개선 방향

- 추천 카드에서 추천 이유와 실제 실행 가능 상태를 분리해 사용자가 지금 눌러도 되는지 바로 판단할 수 있게 했습니다.

## 변경 사항

- 추천 행동이 준비된 경우 `지금 가능` CTA 상태를 표시했습니다.
- 추천 행동이 쿨다운 중이면 추천은 유지하되 `추천 대기 · Ns 후 가능` 상태를 표시했습니다.
- en/ko/ja CTA 상태 문구와 responsive-safe chip 스타일을 추가했습니다.

## 검증

- `npm run test -- tests/pet-recommendation-evidence.test.ts`: RED 확인, 5개 기대 실패
- `npm run test -- tests/pet-recommendation-evidence.test.ts tests/pet-action-button-status.test.ts tests/pet-recommendation-reward-preview.test.ts`: 통과, 3 files / 24 tests
- `npm run test`: 통과, 25 files / 181 tests
- `npm run lint`: 통과
- `npm run build`: 통과
- `git diff --check`: 통과

## 하위 에이전트 리뷰

- 탐색: 추천 카드 support 영역에 상태 pill을 추가하는 최소 변경 설계를 권장했습니다.
- spec review: 코드 요구사항 충족. 문서 파일이 untracked이므로 커밋 범위에 포함해야 한다는 제출 범위 지적 확인.
- code quality review: blocking issue 없음.

## 리스크

- 추천 행동의 쿨다운 문구는 클라이언트 타이머 기준으로 갱신됩니다.
- 추천 카드는 기존처럼 횟수 제한, 진행 중, 결과 카드 표시 중에는 숨김을 유지합니다.

## 다음 개선 후보

- 쿨다운 중인 추천 액션이 풀리는 순간 추천 카드의 CTA 상태가 자연스럽게 갱신되는지 브라우저 시각 검증을 자동화합니다.
