# Action Button Status Labels Work Summary

## 목적

돌봄 버튼을 한눈에 비교할 수 있도록 각 버튼에 현재 상태 라벨을 표시했습니다.

## 변경 요약

- 모든 돌봄 버튼에 `추천`, `가능`, `대기`, `진행 중`, `횟수 없음` 상태 라벨을 표시합니다.
- 추천 가능한 버튼은 기존 일반 설명 대신 추천 이유를 버튼 내부에서도 보여줍니다.
- 쿨다운, 진행 중, 횟수 제한 상태는 추천보다 우선 표시해 실제 가능 여부를 먼저 파악할 수 있게 했습니다.
- 버튼의 `aria-label`에 상태 라벨과 상세 설명을 함께 포함했습니다.
- `en`, `ko`, `ja` 다국어 상태 라벨과 overflow-safe 버튼 CSS를 추가했습니다.

## 변경 파일

- `components/PetActions.vue`
- `constants/i18n.ts`
- `assets/css/main.css`
- `tests/pet-action-button-status.test.ts`
- `tests/pet-side-panel-controls.test.ts`
- `docs/superpowers/plans/2026-05-07-action-button-status-labels.md`
- `docs/superpowers/summaries/2026-05-07-action-button-status-labels.md`

## 검증

- `npm run test -- tests/pet-action-button-status.test.ts`: 1 file, 6 tests 통과
- `npm run test -- tests/pet-care-recommendation.test.ts tests/pet-action-availability.test.ts tests/pet-side-panel-controls.test.ts`: 3 files, 33 tests 통과
- `npm run test`: 19 files, 145 tests 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- Headless Chrome 390px 모바일 검증:
  - 초기 상태에서 `밥 주기` 버튼 `추천` 라벨 표시 확인
  - 나머지 버튼 `가능` 라벨 표시 확인
  - `밥 주기` 실행 직후 `진행 중` 라벨과 disabled 상태 확인
  - 가로 오버플로우 없음 확인
  - 검증 스크린샷: `/private/tmp/tap-pet-action-button-status-mobile.png`

## 남은 리스크

- 추천 버튼의 상세 문구가 길어질 수 있어 모바일에서 버튼 높이가 늘어날 수 있습니다. 가로 오버플로우는 CSS와 브라우저 검증으로 확인합니다.
- 상태 라벨은 버튼별 현재 상태만 보여줍니다. 전체 행동의 보상 비교 테이블은 이번 범위에서 제외했습니다.

## 다음 개선 후보

돌봄 결과 카드가 길어지고 있으므로, 결과 카드 안의 성장/다음 추천/감소 보상 정보를 우선순위별로 접히지 않게 재배치하는 개선이 적합합니다.
