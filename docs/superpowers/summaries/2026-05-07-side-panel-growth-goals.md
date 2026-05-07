# Side Panel Growth Goals Work Summary

## 목적

사이드 패널의 성장/친밀도 정보를 단순 진행률보다 “다음 목표까지 얼마나 남았는지” 중심으로 읽을 수 있게 개선했습니다.

## 변경 요약

- 성장 탭의 첫 돌봄 목표 아래에 `다음 성장 목표` 섹션을 추가했습니다.
- 레벨 목표는 다음 레벨까지 남은 경험치를 계산해 표시합니다.
- 친밀도 목표는 다음 보상 보너스 레벨까지 남은 친밀도 진행량을 표시합니다.
- 기존 성장/친밀도 게이지는 유지해 상세 진행률 확인도 가능하게 했습니다.
- 성장 계산 로직이나 store 상태는 변경하지 않고 기존 `levelProgress`, `affinityProgress` props를 재사용했습니다.
- `en`, `ko`, `ja` 다국어 카피와 모바일 대응 CSS를 추가했습니다.

## 변경 파일

- `components/PetSidePanel.vue`
- `constants/i18n.ts`
- `assets/css/main.css`
- `tests/pet-side-panel-growth-goals.test.ts`
- `docs/superpowers/plans/2026-05-07-side-panel-growth-goals.md`
- `docs/superpowers/summaries/2026-05-07-side-panel-growth-goals.md`

## 검증

- `npm run test -- tests/pet-side-panel-growth-goals.test.ts`: 1 file, 5 tests 통과
- `npm run test -- tests/pet-side-panel-controls.test.ts tests/pet-first-care-goal.test.ts tests/pet-growth.test.ts tests/pet-side-panel-growth-goals.test.ts`: 4 files, 30 tests 통과
- `npm run test`: 22 files, 160 tests 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- Production preview 390px 모바일 검증:
  - 첫 펫 생성 후 성장 탭에 `다음 성장 목표` 섹션 표시 확인
  - 목표 섹션 순서가 `first-care-goal → progress-goals → progress-list`인지 확인
  - 레벨 목표와 보상 보너스 목표 표시 확인
  - 가로 오버플로우 없음 확인 (`viewportWidth: 390`, `scrollWidth: 390`)
  - 검증 스크린샷: `/private/tmp/tap-pet-side-panel-growth-goals-mobile.png`

## 서브에이전트 활용

- 탐색 서브에이전트가 사이드 패널 성장/친밀도 렌더링 위치와 기존 progress 계산 흐름을 확인했습니다.
- i18n은 설정 문구와 분리된 `sidePanelProgress` 그룹으로 두는 방향을 반영했습니다.
- 스펙 리뷰와 코드 품질 리뷰에서 추가 production regression, TypeScript safety, UI 상태 충돌 이슈는 없었습니다.

## 남은 리스크

- 이번 작업은 현재 진행량 요약을 개선하는 범위입니다. 다음 보상 보너스가 실제로 경험치 배율에 어떤 영향을 주는지 상세 설명하는 툴팁은 포함하지 않았습니다.
- 목표 섹션은 정적 요약입니다. 애니메이션이나 완료 체크 상태 저장은 별도 설계가 필요합니다.

## 다음 개선 후보

추천 돌봄 카드에서 “왜 이 행동이 추천됐는지”를 수치 근거와 함께 더 명확히 보여주는 개선이 적합합니다.
