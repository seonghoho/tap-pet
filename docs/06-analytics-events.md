# Tab Pet 이벤트 계측

코드의 단일 소스는 `composables/useAnalytics.ts`의 `AnalyticsEvents` 타입이다. 이벤트를 추가하거나 이름을 바꿀 때는 이 문서와 타입을 함께 고친다.

## 전송 방식

- 외부 SDK는 붙어 있지 않다. `trackEvent()`는 다음 두 곳으로만 보낸다.
  - `window.dataLayer`가 있으면 `{ event: 'tab_pet_<name>', ...props }`를 push (GTM/GA4 연동용)
  - 항상 `window`에 `tabpet:analytics` CustomEvent를 발생 (다른 SDK가 구독 가능)
- 개발 모드에서는 `console.debug('[analytics]', payload)`로 확인할 수 있다.
- 개인 정보(펫 이름, 백업 코드, 커스텀 제목 문구)는 보내지 않는다. `pet_created.custom_name`도 이름을 바꿨는지 여부만 보낸다.

## 핵심 지표

| 지표 | 정의 | 사용하는 이벤트 |
| --- | --- | --- |
| North star: 주간 돌봄 일수 | 사용자당 7일 중 `care_performed`가 1회 이상 있는 날 수 | `care_performed` |
| D1 / D7 리텐션 | `pet_created` 다음 날 / 7일째에 `care_performed` 또는 `return_visit` | `pet_created`, `care_performed`, `return_visit` |
| 첫 돌봄 전환율 | `pet_created` 후 10분 안에 `care_performed` | `pet_created`, `care_performed` |
| 위장 모드 선호 | `pet_created.title_mode`, `title_mode_changed` 비율 | |
| 제한 마찰 | 세션당 `care_limit_reached` 비율, 그중 `care_recharge_used` 비율 | |
| 바이럴 계수 | `share_card_created` / 주간 활성 사용자 | |

## 첫 주 퍼널

1. 랜딩 (페이지뷰, 호스팅 분석 도구)
2. `pet_created`
3. 첫 `care_performed`
4. `pin_tip_dismissed` (탭 고정 안내를 읽음)
5. 다음 날 `return_visit` 또는 `care_performed`
6. `streak_extended` (days ≥ 3)

## 이벤트 목록

| 이벤트 | 속성 | 언제 |
| --- | --- | --- |
| `pet_created` | `species`, `title_mode`, `custom_name` | 온보딩에서 "같이 살기 시작" |
| `care_performed` | `action`, `recommended`, `level` | 돌봄 횟수가 실제로 차감된 돌봄 |
| `care_limit_reached` | `level` | 돌봄 직후 남은 횟수가 0이 됨 |
| `care_recharge_used` | – | 하루 한 번 충전을 실제로 사용 |
| `daily_goal_claimed` | `streak` | 오늘의 목표 보상 수령 |
| `streak_extended` | `days` | 연속 돌봄 일수가 2일 이상으로 늘어남 |
| `return_visit` | `bucket`, `status` | 30분 이상 비운 뒤 복귀해 복귀 리포트가 뜸 |
| `title_mode_changed` | `mode` | 탭 제목 모드 변경 (온보딩/설정) |
| `notifications_toggled` | `enabled` | 알림 설정을 켜거나 끔 (권한 허용 후) |
| `notification_shown` | `status` | 브라우저 알림을 실제로 띄움 |
| `share_card_created` | `result` (`shared`/`downloaded`) | 친구 카드 공유 또는 저장 |
| `backup_exported` | – | 백업 코드 복사 성공 |
| `backup_imported` | `ok` | 백업 코드 불러오기 시도 |
| `pin_tip_dismissed` | – | "이 탭을 고정해두세요" 안내 닫기 |
| `pet_patted` | – | 페이지를 연 뒤 처음 펫을 쓰다듬음 (방문당 1회) |
