# Action Availability Forecast Work Summary

## 목적

돌봄 버튼을 누른 뒤 사용자가 남은 돌봄 횟수와 쿨다운 회복 시점을 더 쉽게 예측할 수 있도록 액션 가능성 안내를 추가했습니다.

## 변경 요약

- 돌봄 횟수 영역에 30분 제한 윈도우가 언제 초기화되는지 보조 문구로 표시했습니다.
- 돌봄 횟수를 모두 사용한 상태에서는 추가 횟수 버튼으로 이어갈 수 있다는 보조 문구를 표시했습니다.
- 특정 액션이 쿨다운 중이면 버튼 그리드 위에 `놀아주기 2s 후 다시 가능` 형태의 회복 안내를 표시했습니다.
- 액션 진행 중이거나 돌봄 횟수 제한에 도달한 상태에서는 쿨다운 안내를 숨겨 다른 상태 안내와 충돌하지 않게 했습니다.
- 제한 윈도우가 만료됐지만 부모 prop 갱신이 늦는 경계 구간에서는 `0s 후 초기화` 대신 새 돌봄 윈도우가 시작됐다는 안내를 표시합니다.
- `en`, `ko`, `ja` 다국어 카피와 모바일 대응 CSS를 추가했습니다.

## 변경 파일

- `components/PetActions.vue`
- `constants/i18n.ts`
- `assets/css/main.css`
- `tests/pet-action-availability.test.ts`
- `docs/superpowers/plans/2026-05-07-action-availability-forecast.md`
- `docs/superpowers/summaries/2026-05-07-action-availability-forecast.md`

## 검증

- `npm run test`: 15 files, 122 tests 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- Headless Chrome 390px 모바일 검증:
  - 제한 윈도우 초기화 시간 표시 확인
  - 쿨다운 액션의 다음 가능 시간 표시 확인
  - 진행 상태 종료 후 안내가 버튼 그리드 위에 배치되는지 확인
  - 가로 오버플로우 없음 확인

## 남은 리스크

- 쿨다운 안내는 가장 먼저 회복되는 액션 1개만 표시합니다. 여러 액션을 동시에 세부적으로 보여주는 목록은 의도적으로 제외했습니다.
- 초 단위 안내는 기존 250ms 타이머에 맞춰 갱신됩니다. 더 긴 주기의 절전형 타이머가 필요하면 별도 설계가 필요합니다.

## 다음 개선 후보

신규 사용자가 첫 1분 안에 무엇을 반복해야 하는지 더 명확히 알 수 있도록 “첫 돌봄 루프 완료 목표”를 사이드 패널에 추가하는 개선이 적합합니다.
