# Action Limit Recovery Summary

## 개선 배경

돌봄 가능 횟수를 모두 사용한 상태에서는 기존 카드가 단일 문장과 버튼만 보여줬습니다. 사용자는 "기다리면 언제 되는지"와 "광고를 보면 무엇을 얻는지"를 비교하기 어려웠기 때문에, 같은 카드 안에서 두 복구 선택지를 나란히 보여주는 방식으로 개선했습니다.

## 변경 내용

- `components/PetActions.vue`에서 locked 상태일 때 표시할 복구 선택지 문구를 계산합니다.
- `ACTION_LIMIT_AD_REWARD_USES`를 사용해 광고 충전으로 즉시 추가되는 횟수를 UI에 명시했습니다.
- 기존 단일 `small-button`을 `.action-limit__recovery` 영역의 두 선택지로 교체했습니다.
- `constants/i18n.ts`에 en/ko/ja 복구 선택지 문구를 추가하고 locked/rewardHint 문구를 중복이 적은 설명으로 줄였습니다.
- `assets/css/main.css`에 locked 카드 grid, wait/reward option 카드, 클릭 가능한 reward option 스타일을 추가했습니다.
- `tests/pet-action-limit-recovery-flow.test.ts`로 computed 값, 마크업, 이벤트, 다국어 placeholder, responsive CSS를 고정했습니다.

## UX 판단

- store와 action-limit 부여 로직은 바꾸지 않았습니다. 이번 변경은 잠금 상태의 의사결정 정보를 명확히 하는 UI 개선입니다.
- 자동 초기화와 광고 충전을 같은 카드 안에서 비교하게 해 사용자가 기다릴지 즉시 충전할지 빠르게 판단할 수 있게 했습니다.
- 실제 광고 SDK가 아직 연결되지 않은 구조이므로, 버튼은 기존처럼 `rewardAd` 이벤트를 emit하고 store가 즉시 추가 횟수를 부여합니다.

## 검증

- `npm run test -- tests/pet-action-limit-recovery-flow.test.ts`
- `npm run test -- tests/pet-action-limit-reward.test.ts tests/pet-action-availability.test.ts tests/pet-side-panel-controls.test.ts`
- `npm run test`
- `npm run lint`
- `npm run build`
- 모바일 UI 검증: production server + Chrome DevTools Protocol, 390px width
  - 복구 카드 aria label: `돌봄 복구 선택지`
  - 대기 선택지: `초기화 기다리기`, `30m 00s 후 자동 초기화`
  - 즉시 충전 선택지: `광고 보고 충전`, `지금 +5회 추가`
  - horizontal overflow 없음: `scrollWidth 390 / viewportWidth 390`
  - 복구 카드와 action grid 겹침 없음
  - 충전 선택지 클릭 후 확인 메시지 표시 및 locked recovery card 제거 확인
  - 스크린샷: `/private/tmp/tap-pet-action-limit-recovery-mobile.png`

## 서브에이전트 검토

- 탐색 리뷰: store/util 로직은 유지하고 `PetActions.vue`의 locked-state 표시만 확장하는 방식이 최소 변경이라는 결론을 받았습니다.
- Spec 리뷰: 스펙 갭 없음. locked 상태 복구 카드, wait/reward 비교, `rewardAd` emit 유지, en/ko/ja i18n, CSS, 문서 업데이트 기준 승인되었습니다.
- Code quality 리뷰: reward detail 색 대비와 복구 옵션 그룹 접근성 지적이 있었고, `var(--app-accent-text)` 적용과 `role="group"` 추가로 보완했습니다.

## 남은 리스크

- 실제 rewarded-ad SDK를 붙일 때는 광고 로딩, 성공/실패, 중복 완료 방지 상태가 추가로 필요합니다.
- 현재 보상 버튼은 locked 상태에서만 보이므로 일반 사용 흐름에서는 누적 충전 위험이 낮지만, 실제 비동기 광고 완료 처리 시 중복 호출 방어가 필요합니다.

## 다음 개선 후보

첫 돌봄 루프 이후 사용자가 다시 돌아올 이유를 더 강화하기 위해, 최근 돌봄 결과 카드에 "다음에 확인할 시간"과 "예상 변화"를 같이 보여주는 리텐션 힌트를 추가합니다.
