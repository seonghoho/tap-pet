# Care Feedback Priority Layout Work Summary

## 목적

돌봄 결과 카드의 정보가 늘어난 상태에서 사용자가 보상, 핵심 변화, 성장 목표, 다음 행동을 더 빠르게 훑을 수 있도록 카드 구조를 재배치했습니다.

## 변경 요약

- 결과 카드 상단은 기존처럼 완료 액션과 획득 경험치를 먼저 보여줍니다.
- 핵심 변화와 성장 목표를 `.care-feedback__overview` 안에 묶어 주요 결과를 먼저 읽게 했습니다.
- 상세 스탯 칩은 overview 다음에 배치해 보조 정보로 분리했습니다.
- 다음 추천 행동과 보상 감소 안내는 `.care-feedback__follow-up`으로 묶어 후속 행동 영역으로 정리했습니다.
- 모바일에서는 overview를 한 열로 접어 긴 문구가 가로로 넘치지 않도록 했습니다.

## 변경 파일

- `components/PetActions.vue`
- `assets/css/main.css`
- `tests/pet-care-feedback-priority-layout.test.ts`
- `docs/superpowers/plans/2026-05-07-care-feedback-priority-layout.md`
- `docs/superpowers/summaries/2026-05-07-care-feedback-priority-layout.md`

## 검증

- `npm run test -- tests/pet-care-feedback-priority-layout.test.ts`: 1 file, 3 tests 통과
- `npm run test -- tests/pet-care-feedback-summary.test.ts tests/pet-care-feedback-growth-target.test.ts`: 2 files, 12 tests 통과
- `npm run test`: 20 files, 148 tests 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- 서브에이전트 리뷰: wrapper 내부 포함 여부 테스트 누락 지적을 반영해 overview/follow-up 블록 포함 검증 추가
- Headless Chrome 390px 모바일 검증:
  - 밥 주기 실행 후 결과 카드 표시 확인
  - 결과 카드 순서가 `header → overview → chips → follow-up`인지 확인
  - overview 안에 핵심 변화와 성장 목표 표시 확인
  - follow-up 안에 다음 추천 표시 확인
  - 가로 오버플로우 없음 확인
  - 검증 스크린샷: `/private/tmp/tap-pet-care-feedback-priority-mobile.png`

## 남은 리스크

- 결과 카드 높이는 이전보다 크게 줄어들지는 않습니다. 이번 작업은 정보 순서와 그룹핑 개선에 집중했습니다.
- 긴 다국어 문구가 있는 상태는 브라우저 검증에서 모바일 폭으로 확인합니다.

## 다음 개선 후보

첫 돌봄 이후 사용자가 “언제 다시 확인해야 하는지”를 더 쉽게 알 수 있도록 사이드 패널이나 액션 영역에 다음 체크 시점 안내를 추가하는 개선이 적합합니다.
