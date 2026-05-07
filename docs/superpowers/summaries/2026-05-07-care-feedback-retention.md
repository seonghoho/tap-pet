# Care Feedback Retention Summary

## 개선 배경

돌봄 완료 후 결과 카드는 변화량과 다음 추천을 보여주지만, 사용자가 언제 다시 확인해야 하는지와 다시 왔을 때 어떤 변화를 기대할 수 있는지가 한눈에 분리되어 있지 않았습니다. 반복 사용을 늘리려면 결과 직후에 다음 확인 시점과 기대 변화를 명확히 알려주는 편이 낫습니다.

## 변경 내용

- `components/PetActions.vue`에서 결과 카드의 체크백 힌트를 `title + detail` 구조로 분리했습니다.
- `careFeedbackRetentionTitle`을 추가해 즉시 가능, 쿨다운, 횟수 제한, 새 윈도우, fallback 상황별 다음 확인 시점을 계산합니다.
- 기존 `careFeedbackCheckbackText`는 타이밍 안내 대신 기대 변화/다음 행동 이유를 설명하도록 변경했습니다.
- `constants/i18n.ts`에 en/ko/ja retention title/detail 문구를 추가했습니다.
- `assets/css/main.css`에 체크백 힌트 내부 title/detail stack 스타일을 추가했습니다.
- `tests/pet-care-retention-hint.test.ts`로 즉시 가능, 쿨다운, 제한 리셋, 마크업, 다국어 placeholder, CSS를 고정했습니다.
- 기존 `tests/pet-care-checkback-hint.test.ts` 기대 문구를 새 기대 변화 중심 카피에 맞춰 갱신했습니다.

## UX 판단

- store, decay, action limit, recommendation 로직은 바꾸지 않았습니다.
- 새 상태 저장 없이 현재 결과 카드가 살아있는 동안만 리텐션 힌트를 보여줍니다.
- 정확한 장기 예측을 위해 decay/threshold 계산까지 확장하지 않고, 현재 사용자가 다음에 확인할 수 있는 행동 결과와 성장 변화를 설명하는 범위로 제한했습니다.

## 검증

- `npm run test -- tests/pet-care-retention-hint.test.ts`
- `npm run test -- tests/pet-care-checkback-hint.test.ts tests/pet-care-feedback-summary.test.ts tests/pet-care-feedback-priority-layout.test.ts`
- `npm run test`
- `npm run lint`
- `npm run build`
- 모바일 UI 검증: production server + Chrome DevTools Protocol, 390px width
  - 리텐션 제목: `지금 다시 확인`
  - 리텐션 설명: `다음 추천을 돌보면 결과 카드와 성장 변화를 바로 확인할 수 있어요.`
  - horizontal overflow 없음: `scrollWidth 390 / viewportWidth 390`
  - 체크백 블록 viewport 이탈 없음
  - 스크린샷: `/private/tmp/tap-pet-care-feedback-retention-mobile.png`

## 서브에이전트 검토

- 탐색 리뷰: 기존 `care-feedback__checkback`을 확장하는 방식이 최소 변경이며, store/model 변경은 불필요하다는 결론을 받았습니다.
- Spec 리뷰: 추천 행동이 아직 쿨다운 중일 때 결과 카드가 `지금 다시 확인`으로 보이는 gap이 지적되어, 추천 action cooldown이 끝난 경우에만 immediate 분기로 가도록 보완했습니다.
- Code quality 리뷰: production regression, Vue/TypeScript 유지보수성, i18n, 반응형 CSS, 접근성 측면 blocking finding 없음으로 승인되었습니다.

## 남은 리스크

- `lastCareFeedback`은 새로고침 후 유지되지 않습니다. 새로고침 뒤에도 리텐션 힌트를 보존하려면 별도 저장 설계가 필요합니다.
- fallback 상태는 정확한 다음 변화 시간을 계산하지 않습니다. decay와 threshold 기반 예측은 별도 개선으로 분리하는 편이 안전합니다.
- 시간 표기는 기존 `formatRemainingTime` 패턴을 유지하므로 `s`, `m` 단위는 완전 현지화되어 있지 않습니다.

## 다음 개선 후보

`play` 추천에 `lastPlayedAt` 기반 근거를 추가해, 스탯 기반 추천과 동일하게 "마지막 놀이 후 경과 시간"을 보여줍니다.
