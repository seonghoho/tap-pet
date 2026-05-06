# Care Feedback Next Step Work Summary

## 목적

돌봄 액션 완료 후 사용자가 결과를 더 빠르게 이해하고 다음 행동으로 이어갈 수 있도록 완료 피드백 카드를 강화했습니다.

## 변경 요약

- `PetActions.vue`의 완료 피드백 카드에 `핵심 변화` 요약을 추가했습니다.
- 완료 피드백 카드 안에 `다음 추천` 안내를 추가해 결과 확인 후 바로 다음 행동을 고를 수 있게 했습니다.
- 완료 피드백이 보이는 동안 상단의 독립 추천 박스를 숨겨 같은 추천이 중복 노출되지 않도록 했습니다.
- 돌봄 가능 횟수를 모두 사용한 상태에서는 완료 카드 안의 다음 추천도 숨겨 비활성화된 행동을 유도하지 않게 했습니다.
- `en`, `ko`, `ja` 다국어 카피와 모바일 대응 CSS를 추가했습니다.

## 변경 파일

- `components/PetActions.vue`
- `constants/i18n.ts`
- `assets/css/main.css`
- `tests/pet-care-feedback-summary.test.ts`
- `tests/pet-action-progress.test.ts`
- `tests/pet-action-limit-reward.test.ts`
- `docs/superpowers/plans/2026-05-07-care-feedback-next-step.md`
- `docs/superpowers/summaries/2026-05-07-care-feedback-next-step.md`

## 검증

- `npm run test`: 14 files, 116 tests 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- Headless Chrome 390px 모바일 검증:
  - 완료 카드에 `핵심 변화` 표시 확인
  - 완료 카드에 `다음 추천` 표시 확인
  - 완료 피드백 노출 중 독립 추천 박스 숨김 확인
  - 가로 오버플로우 없음 확인

## 남은 리스크

- 현재 테스트는 Vue 실제 렌더링보다 소스 구조 검증 비중이 높습니다. 주요 UI 흐름은 headless Chrome 검증으로 보완했습니다.
- 완료 피드백은 최근 결과 1개만 보여줍니다. 여러 행동의 히스토리를 제공하려면 별도 설계가 필요합니다.

## 다음 개선 후보

돌봄 가능 횟수와 쿨다운을 더 예측 가능하게 만드는 “다음 가능 시간/회복 흐름 안내” 개선이 적합합니다.
