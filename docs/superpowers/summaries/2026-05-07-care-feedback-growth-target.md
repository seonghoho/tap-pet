# Care Feedback Growth Target Work Summary

## 목적

돌봄 결과 카드가 단발성 보상으로 끝나지 않고 다음 레벨까지의 거리와 연결되도록 성장 목표 안내를 추가했습니다.

## 변경 요약

- `PetActions`에 기존 `levelProgress` 값을 전달해 결과 카드에서 다음 레벨까지 남은 경험치를 표시했습니다.
- 결과 카드 안에 성장 목표 섹션과 진행 막대를 추가했습니다.
- 레벨업이 발생한 경우에는 “새 레벨에 도달” 상태와 새 성장 게이지 시작점을 별도 문구로 표시합니다.
- `en`, `ko`, `ja` 다국어 카피를 추가했습니다.
- 모바일 폭에서 성장 목표 문구와 진행 막대가 한 열로 접히도록 반응형 CSS를 추가했습니다.

## 변경 파일

- `app.vue`
- `components/PetActions.vue`
- `constants/i18n.ts`
- `assets/css/main.css`
- `tests/pet-care-feedback-growth-target.test.ts`
- `docs/superpowers/plans/2026-05-07-care-feedback-growth-target.md`
- `docs/superpowers/summaries/2026-05-07-care-feedback-growth-target.md`

## 검증

- `npm run test -- tests/pet-care-feedback-growth-target.test.ts`: 1 file, 6 tests 통과
- `npm run test`: 17 files, 131 tests 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- Headless Chrome 390px 모바일 검증:
  - 밥 주기 완료 후 결과 카드에 성장 목표 섹션 표시 확인
  - `다음 레벨까지 45 경험치`, `현재 55/100 경험치까지 채웠습니다.` 표시 확인
  - 진행 막대 `aria-valuenow=55`, `aria-valuemax=100`, `width=55%` 확인
  - 가로 오버플로우 없음 확인
  - 검증 스크린샷: `/private/tmp/tap-pet-care-feedback-growth-mobile.png`

## 남은 리스크

- 성장 목표는 현재 레벨 경험치만 표시합니다. 친밀도 레벨까지 함께 예측하는 복합 목표는 의도적으로 제외했습니다.
- 결과 카드가 길어졌기 때문에 매우 작은 모바일 높이에서는 한 번에 보이는 정보량이 줄어들 수 있습니다.

## 다음 개선 후보

돌봄 버튼을 누르기 전에도 어떤 행동이 성장 보상에 가장 유리한지 비교할 수 있도록 추천 돌봄 카드에 “보상 기대치” 힌트를 추가하는 개선이 적합합니다.
