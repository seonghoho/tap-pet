# Care Checkback Hint Work Summary

## 목적

돌봄 결과를 확인한 뒤 사용자가 지금 이어서 돌봐야 하는지, 잠시 후 다시 확인해야 하는지 더 빠르게 판단할 수 있도록 결과 카드에 다음 확인 시점 안내를 추가했습니다.

## 변경 요약

- 결과 카드의 follow-up 영역에 `다음 확인` 힌트를 추가했습니다.
- 다음 추천이 가능한 상태에서는 즉시 이어서 돌볼 수 있다는 문구를 보여줍니다.
- 돌봄 횟수를 모두 사용한 상태에서는 제한 윈도우 리셋까지 남은 시간을 안내합니다.
- 즉시 추천은 없지만 쿨다운 중인 액션이 있으면 가장 먼저 풀리는 액션과 시간을 안내합니다.
- 별도 상태 변경 없이 기존 `careFeedback`, `recommendedCareAction`, `nextCoolingAction`, `actionLimitInfo.resetAt` 계산을 재사용했습니다.
- `en`, `ko`, `ja` 다국어 카피와 모바일 대응 CSS를 추가했습니다.

## 변경 파일

- `components/PetActions.vue`
- `constants/i18n.ts`
- `assets/css/main.css`
- `tests/pet-care-checkback-hint.test.ts`
- `tests/pet-care-feedback-priority-layout.test.ts`
- `docs/superpowers/plans/2026-05-07-care-checkback-hint.md`
- `docs/superpowers/summaries/2026-05-07-care-checkback-hint.md`

## 검증

- `npm run test -- tests/pet-care-checkback-hint.test.ts`: 1 file, 7 tests 통과
- `npm run test -- tests/pet-care-feedback-priority-layout.test.ts tests/pet-care-feedback-summary.test.ts tests/pet-action-availability.test.ts tests/pet-care-checkback-hint.test.ts`: 4 files, 22 tests 통과
- `npm run test`: 21 files, 155 tests 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- Headless Chrome 390px 모바일 검증:
  - 첫 펫 생성 후 돌봄 액션 실행
  - 결과 카드 follow-up 안에 `다음 확인` 힌트 표시 확인
  - 결과 카드 순서가 `header → overview → chips → follow-up`인지 확인
  - 가로 오버플로우 없음 확인 (`viewportWidth: 390`, `scrollWidth: 390`)
  - 검증 스크린샷: `/private/tmp/tap-pet-care-checkback-mobile.png`

## 서브에이전트 활용

- 탐색 서브에이전트가 기존 쿨다운/제한 계산 위치를 확인했습니다.
- 추천 삽입 위치는 `PetActions.vue`의 `care-feedback__follow-up` 내부로 제안했고, 구현도 이 방향을 따랐습니다.
- 스펙 리뷰에서 전체 검증 기록 누락이 지적되어 계획 체크리스트와 요약 문서의 검증 내역을 실제 실행 결과 기준으로 보강했습니다.
- 코드 품질 리뷰에서는 추가 production regression 또는 TypeScript safety 이슈가 없었습니다.

## 남은 리스크

- 힌트는 결과 카드에만 표시됩니다. 결과 카드가 사라진 뒤에도 상시 체크 시점을 노출하려면 별도 사이드 패널 설계가 필요합니다.
- 쿨다운 힌트는 가장 먼저 풀리는 액션 1개만 안내합니다. 전체 액션별 타임라인은 이번 범위에서 제외했습니다.

## 다음 개선 후보

반복 방문 사용자가 현재 성장/친밀도 진행을 더 빠르게 이해할 수 있도록 사이드 패널의 성장 정보를 “다음 보상까지 남은 목표” 중심으로 재정리하는 개선이 적합합니다.
