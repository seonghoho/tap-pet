# First Care Goal Work Summary

## 목적

신규 사용자가 첫 1분 안에 어떤 행동을 반복해야 하는지 바로 이해할 수 있도록 상태 사이드 패널에 “첫 돌봄 루프” 목표를 추가했습니다.

## 변경 요약

- 성장 탭 상단에 추천 돌봄, 결과 카드 확인, 성장/친밀도 확인으로 이어지는 3단계 목표 블록을 추가했습니다.
- 목표 블록은 기존 성장 게이지 앞에 배치해 사용자가 게이지를 보기 전에 현재 목표를 먼저 이해하도록 했습니다.
- `en`, `ko`, `ja` 다국어 카피를 추가했습니다.
- 목표 블록을 이름 붙은 `section`과 명시적 목록으로 구성해 보조 기술에서도 루프 안내를 구분할 수 있게 했습니다.
- 좁은 모바일 폭에서도 줄바꿈과 숫자 마커가 깨지지 않도록 전용 CSS를 추가했습니다.

## 변경 파일

- `components/PetSidePanel.vue`
- `constants/i18n.ts`
- `assets/css/main.css`
- `tests/pet-first-care-goal.test.ts`
- `docs/superpowers/plans/2026-05-07-first-care-goal.md`
- `docs/superpowers/summaries/2026-05-07-first-care-goal.md`

## 검증

- `npm run test -- tests/pet-first-care-goal.test.ts`: 1 file, 3 tests 통과
- `npm run test`: 16 files, 125 tests 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- Headless Chrome 390px 모바일 검증:
  - 목표 블록 텍스트와 3단계 항목 표시 확인
  - 목표 블록이 성장 게이지 영역에 앞서 표시되는지 확인
  - viewport 390px 기준 가로 오버플로우 없음 확인
  - 검증 스크린샷: `/private/tmp/tap-pet-first-care-goal-mobile.png`

## 남은 리스크

- 현재 목표 블록은 정적 안내입니다. 실제 완료 상태를 저장하거나 단계별 완료 체크를 표시하지 않습니다.
- 첫 돌봄 완료 후에도 같은 안내가 유지됩니다. 완료형 체크리스트가 필요하면 별도 상태 설계가 필요합니다.

## 다음 개선 후보

첫 돌봄을 완료한 뒤 사용자가 “조금 더 하면 무엇이 좋아지는지” 이해할 수 있도록 다음 레벨까지 남은 경험치와 보상 기대감을 액션 결과 카드에 더 명확히 연결하는 개선이 적합합니다.
