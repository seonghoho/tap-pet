# Recommendation Reward Preview Work Summary

## 목적

사용자가 추천 돌봄을 누르기 전에 예상 경험치와 친밀도 보상을 확인할 수 있도록 추천 카드에 보상 힌트를 추가했습니다.

## 변경 요약

- 돌봄 완료 결과와 동일한 계산식을 사용하는 `getCareActionRewardPreview`를 추가했습니다.
- 현재 추천 돌봄 행동 기준의 예상 보상을 스토어에서 계산해 `PetActions`로 전달했습니다.
- 추천 카드에 예상 경험치/친밀도 보상 칩을 표시했습니다.
- 이미 충분히 돌본 상태라 보상이 줄어드는 경우 별도 보조 문구를 표시할 수 있게 했습니다.
- `en`, `ko`, `ja` 다국어 카피와 모바일 대응 CSS를 추가했습니다.

## 변경 파일

- `utils/petCare.ts`
- `composables/usePetStore.ts`
- `app.vue`
- `components/PetActions.vue`
- `constants/i18n.ts`
- `assets/css/main.css`
- `tests/pet-recommendation-reward-preview.test.ts`
- `docs/superpowers/plans/2026-05-07-recommendation-reward-preview.md`
- `docs/superpowers/summaries/2026-05-07-recommendation-reward-preview.md`

## 검증

- `npm run test -- tests/pet-recommendation-reward-preview.test.ts`: 1 file, 8 tests 통과
- `npm run test`: 18 files, 139 tests 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- Headless Chrome 390px 모바일 검증:
  - 추천 카드에 `예상 보상 경험치 +13 · 친밀도 +2` 표시 확인
  - 긴 영문 보상 감소 문구 `Expected reward is lower because this need is already high.` 표시 확인
  - 추천 카드가 390px 뷰포트 안에 배치되는지 확인
  - 일반/보상 감소 상태 모두 가로 오버플로우 없음 확인
  - 검증 스크린샷: `/private/tmp/tap-pet-recommendation-reward-mobile.png`
  - 보상 감소 검증 스크린샷: `/private/tmp/tap-pet-recommendation-reward-reduced-mobile.png`

## 남은 리스크

- 추천 카드는 현재 추천 행동 1개에 대해서만 예상 보상을 표시합니다. 전체 행동 간 보상 비교는 의도적으로 제외했습니다.
- 보상 감소 안내는 추천 행동이 과돌봄 상태일 때만 표시됩니다. 버튼별 세부 보상 차이는 별도 개선이 필요합니다.

## 다음 개선 후보

돌봄 버튼 자체에서 추천 이유, 쿨다운, 제한 상태가 한눈에 비교되도록 버튼 내부 정보 밀도를 정리하는 개선이 적합합니다.
