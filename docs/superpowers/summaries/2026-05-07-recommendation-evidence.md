# Recommendation Evidence Summary

## 개선 배경

추천 돌봄 카드는 다음 행동을 알려주지만, 사용자가 "왜 이 행동이 추천됐는지"를 즉시 판단하기에는 근거가 부족했습니다. 많은 사용자가 반복적으로 쓰는 서비스에서는 추천의 신뢰도를 높이기 위해 현재 상태 수치를 같이 보여주는 편이 더 낫습니다.

## 변경 내용

- `app.vue`에서 `currentPet.stats`를 `PetActions`로 전달했습니다.
- `components/PetActions.vue`에서 `recommendedCareAction.statKey`가 있는 경우 현재 스탯 값을 읽어 추천 근거 문구를 계산합니다.
- 추천 카드 지원 영역에 `근거 에너지 21/100` 형태의 compact chip을 추가했습니다.
- `constants/i18n.ts`에 en/ko/ja `careRecommendation.statEvidence` 문구를 추가했습니다.
- `assets/css/main.css`에 추천 근거 chip 스타일과 모바일 좌측 정렬을 추가했습니다.
- `tests/pet-recommendation-evidence.test.ts`로 데이터 흐름, computed 값, no-statKey 숨김 처리, 마크업, 다국어 문구, 반응형 CSS를 고정했습니다.

## UX 판단

- 추천 알고리즘 자체는 바꾸지 않았습니다. 이번 개선은 "선택 결과의 설명력"만 높이는 좁은 변경입니다.
- `play` 추천처럼 `statKey`가 없는 경우에는 억지 수치를 만들지 않고 기존 설명만 유지합니다. 추후 `lastPlayedAt` 기반의 별도 근거를 추가할 수 있습니다.
- 기존 예상 보상 chip과 같은 영역에 배치해, 추천의 이유와 기대 보상을 한눈에 비교할 수 있게 했습니다.

## 검증

- `npm run test -- tests/pet-recommendation-evidence.test.ts`
- `npm run test -- tests/pet-care-recommendation.test.ts tests/pet-recommendation-reward-preview.test.ts tests/pet-action-button-status.test.ts tests/pet-action-availability.test.ts tests/pet-care-feedback-priority-layout.test.ts tests/pet-care-checkback-hint.test.ts tests/pet-care-feedback-growth-target.test.ts tests/pet-care-feedback-summary.test.ts tests/pet-side-panel-controls.test.ts tests/pet-side-panel-growth-goals.test.ts`
- `npm run test`
- `npm run lint`
- `npm run build`
- 모바일 UI 검증: production server + Chrome DevTools Protocol, 390px width
  - 추천 근거 문구: `근거 에너지 21/100`
  - horizontal overflow 없음: `scrollWidth 390 / viewportWidth 390`
  - 추천 카드와 action grid 겹침 없음
  - 스크린샷: `/private/tmp/tap-pet-recommendation-evidence-mobile.png`

## 서브에이전트 검토

- 탐색 리뷰: `PetActions`에 `currentPet.stats`를 전달하고 `statKey` 기반으로 수치 근거를 만드는 방식이 가장 작은 데이터 흐름이라는 결론을 받았습니다.
- Spec 리뷰: 구현 항목은 정상이며, 문서 체크 상태 불일치만 지적되어 계획 문서를 실제 완료 상태로 갱신했습니다.
- Code quality 리뷰: 프로덕션 회귀로 볼 만한 이슈 없음. `stats` prop 경로, i18n placeholder, responsive CSS, 신규/전체 테스트 기준 승인되었습니다.

## 남은 리스크

- `play` 추천은 현재 수치 근거가 표시되지 않습니다. 행동 로그 기반 근거가 필요하면 별도 derived evidence 모델이 필요합니다.
- 추천 카드 안에 reward chip과 evidence chip이 함께 표시될 때 긴 다국어 문구의 시각적 밀도는 모바일에서 계속 확인해야 합니다.

## 다음 개선 후보

행동 제한에 도달했을 때 "광고로 횟수 충전"을 더 명확한 복구 플로우로 보여주고, 남은 초기화 시간과 보상형 광고 선택지를 한 카드에서 비교할 수 있게 개선합니다.
