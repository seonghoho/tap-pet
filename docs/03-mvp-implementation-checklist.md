# Tab Pet MVP Implementation Checklist

## 1. 구현 기준

MVP는 한 번에 전체 앱을 만드는 방식이 아니라, 탭 반응까지 연결되는 작은 단위로 나누어 구현한다. 각 단계는 동작 가능한 중간 결과를 가져야 한다.

현재 구현 상태: Phase 0-8 완료, Phase 9 로컬 QA 대부분 완료. Vercel preview 배포와 viewport 기반 모바일 QA는 아직 별도 진행 대상이다.

추가 구현 상태: 한국어/일본어 i18n과 언어 선택 UI 완료. 현재 지원 언어는 English, 한국어, 日本語다.

우선순위:

1. 상태 모델
2. 저장/복원
3. title 반영
4. favicon 반영
5. UI
6. 수익화 UI

## 2. Phase 0: Nuxt 프로젝트 준비

- [x] Nuxt 3 프로젝트 생성
- [x] TypeScript 설정 확인
- [x] 기본 CSS 구조 생성
- [x] Vercel 배포 가능 구조 확인
- [x] lint/test 스크립트 정리

완료 기준:

- [x] 로컬 dev server가 실행된다.
- [x] 기본 페이지가 브라우저에서 열린다.
- [x] TypeScript 오류가 없다.

## 3. Phase 1: 상태 모델

- [x] `types/pet.ts` 생성
- [x] `PetSpecies` 타입 정의
- [x] `PetStatus` 타입 정의
- [x] `PetAction` 타입 정의
- [x] `PetStats` 타입 정의
- [x] `PetState` 타입 정의
- [x] `constants/pet.ts` 생성
- [x] 기본 스탯 상수 정의
- [x] 상태 threshold 상수 정의
- [x] 액션 효과 상수 정의
- [x] decay 상수 정의
- [x] `utils/petStatus.ts` 생성
- [x] `getPetStatus` 구현
- [x] `utils/petActions.ts` 생성
- [x] `applyPetAction` 구현
- [x] `utils/petDecay.ts` 생성
- [x] `applyOfflineDecay` 구현
- [x] `utils/petValidation.ts` 생성
- [x] `clampStat` 구현

완료 기준:

- [x] 스탯만으로 상태가 계산된다.
- [x] 상태값은 저장 모델에 포함하지 않는다.
- [x] 모든 스탯은 0-100 범위를 벗어나지 않는다.
- [x] magic number가 함수 내부에 직접 박혀 있지 않다.

## 4. Phase 2: 저장/복원

- [x] `composables/useLocalPetStorage.ts` 생성
- [x] `PET_STORAGE_KEY` 정의
- [x] `PET_STORAGE_VERSION` 정의
- [x] `loadPetState` 구현
- [x] `savePetState` 구현
- [x] `clearPetState` 구현
- [x] JSON parse 실패 처리
- [x] version 불일치 처리
- [x] 저장값 validate 구현
- [x] 복원 시 offline decay 적용
- [x] 복원 후 보정된 값을 재저장

완료 기준:

- [x] 새로고침 후 상태가 복원된다.
- [x] 브라우저를 닫았다가 다시 열면 지난 시간만큼 decay가 반영된다.
- [x] 깨진 localStorage 값이 있어도 앱이 깨지지 않는다.
- [x] SSR에서 localStorage 접근 오류가 없다.

## 5. Phase 3: 앱 상태 composable

- [x] `composables/usePetStore.ts` 생성
- [x] 초기화 상태와 설정 완료 상태 분리
- [x] `initializePet` 구현
- [x] `performAction` 구현
- [x] `setDisguiseTitle` 구현
- [x] `setTheme` 구현
- [x] `resetPet` 구현
- [x] 현재 `petStatus` computed 구현
- [x] 상태 변경 시 자동 저장 연결

완료 기준:

- [x] 최초 접속 시 펫 선택 전 상태를 표현할 수 있다.
- [x] 펫 선택 후 기본 상태가 생성된다.
- [x] 액션 실행 후 스탯과 상태가 갱신된다.
- [x] 상태 변경이 localStorage에 저장된다.

## 6. Phase 4: title 반영

- [x] `constants/titles.ts` 생성
- [x] 위장 타이틀 프리셋 정의
- [x] 상태별 title signal 정의
- [x] `utils/tabPresentation.ts` 생성
- [x] `getTabTitle` 구현
- [x] `composables/useTabTitle.ts` 생성
- [x] `document.title` 반영 구현
- [x] title 프리셋 변경 시 즉시 반영
- [x] 상태 변경 시 즉시 반영

완료 기준:

- [x] 기본 title이 위장 프리셋으로 표시된다.
- [x] 상태 변경에 따라 title signal이 변경된다.
- [x] SSR에서 document 접근 오류가 없다.
- [x] title 생성 로직이 UI 컴포넌트에 흩어져 있지 않다.

## 7. Phase 5: favicon 반영

- [x] `constants/themes.ts` 생성
- [x] 테마별 색상 토큰 정의
- [x] 상태별 favicon 표현 규칙 정의
- [x] `utils/tabPresentation.ts`에 favicon SVG 생성 함수 추가
- [x] `composables/useFavicon.ts` 생성
- [x] favicon link 조회 구현
- [x] favicon link 없을 때 생성
- [x] 기존 favicon link 갱신
- [x] species/status/theme 변경 시 favicon 갱신

완료 기준:

- [x] 고양이/강아지 선택에 따라 favicon이 달라진다.
- [x] 상태 변경에 따라 favicon 표정 또는 색상이 달라진다.
- [x] 테마 변경에 따라 favicon 색상이 달라진다.
- [x] favicon link가 중복 생성되지 않는다.
- [x] SSR에서 document 접근 오류가 없다.

## 8. Phase 6: 기본 UI

- [x] `components/PetSetup.vue` 구현
- [x] `components/PetStatusPanel.vue` 구현
- [x] `components/PetActions.vue` 구현
- [x] `components/DisguiseTitlePicker.vue` 구현
- [x] `components/ThemePicker.vue` 구현
- [x] `app.vue` 또는 메인 페이지 구성
- [x] 반응형 레이아웃 작성
- [x] 접근 가능한 버튼/라벨 작성
- [x] 스탯 바 UI 작성
- [x] 상태별 메시지 작성

완료 기준:

- [x] 첫 화면에서 펫을 선택할 수 있다.
- [x] 선택 후 스탯과 상태가 보인다.
- [x] feed/play/sleep 액션을 실행할 수 있다.
- [x] 위장 타이틀을 변경할 수 있다.
- [x] 테마를 변경할 수 있다.
- [x] 모바일/데스크톱에서 주요 UI가 겹치지 않는다.

## 9. Phase 7: 수익화 UI 목업

- [x] `components/MonetizationMock.vue` 구현
- [x] 광고 보상형 카드 작성
- [x] 광고 보기 CTA 작성
- [x] 실제 광고 SDK 미연결 상태 표시
- [x] 프리미엄 스킨 카드 작성
- [x] 잠금 상태 UI 작성
- [x] 실제 결제 플로우 미연결 상태 표시

완료 기준:

- [x] 광고 보상형 UI가 보인다.
- [x] 프리미엄 UI가 보인다.
- [x] 실제 SDK/API 호출이 없다.
- [x] 목업임을 제품 내부 상태로 구분할 수 있다.

## 10. Phase 8: 이모지 복사 패널

- [x] `components/EmojiCopyPanel.vue` 구현
- [x] 복사 가능한 이모지 목록 정의
- [x] Clipboard API 연결
- [x] 복사 성공 피드백 구현
- [x] Clipboard API 실패 처리

완료 기준:

- [x] 이모지를 클릭해 복사할 수 있다.
- [x] 복사 성공 상태가 보인다.
- [x] 복사 실패 시 UI가 깨지지 않는다.

## 11. Phase 9: QA

- [x] 최초 진입 테스트
- [x] 펫 선택 테스트
- [x] feed/play/sleep 액션 테스트
- [x] 상태 threshold 테스트
- [x] title 변경 테스트
- [x] favicon 변경 테스트
- [x] 위장 타이틀 프리셋 변경 테스트
- [x] 테마 변경 테스트
- [x] 한국어/일본어 언어 전환 테스트
- [x] 언어 선택 저장/복원 테스트
- [x] 새로고침 복원 테스트
- [x] localStorage 손상값 테스트
- [x] 오프라인 decay 테스트
- [x] 모바일 레이아웃 테스트
- [x] 데스크톱 레이아웃 테스트
- [ ] Vercel preview 배포 테스트

완료 기준:

- [x] 핵심 플로우가 한 번에 동작한다.
- [x] 콘솔에 SSR 또는 hydration 오류가 없다.
- [x] 탭 title과 favicon이 MVP 핵심 경험으로 명확하게 느껴진다.

## 12. 권장 작업 순서

1. Nuxt 프로젝트 생성
2. 타입과 상수 작성
3. 순수 함수 작성
4. 순수 함수 테스트 작성
5. localStorage 저장/복원 연결
6. `usePetStore` 작성
7. title 반영
8. favicon 반영
9. 최소 UI 연결
10. 테마/프리셋 UI 추가
11. 수익화 목업 추가
12. 이모지 복사 패널 추가
13. QA와 배포 점검

## 13. 구현 중 지켜야 할 결정

- 상태값은 저장하지 않는다.
- 스탯은 항상 clamp한다.
- 브라우저 API는 composable에서만 접근한다.
- UI 컴포넌트가 localStorage에 직접 접근하지 않는다.
- UI 컴포넌트가 favicon SVG를 직접 만들지 않는다.
- 광고와 결제는 MVP에서 실제 연동하지 않는다.
- 크롬 확장 구조를 미리 만들지 않는다.

## 14. MVP 완료 정의

다음 조건을 모두 만족하면 MVP 완료로 본다.

- [x] 사용자가 고양이/강아지 중 하나를 선택할 수 있다.
- [x] fullness/mood/energy가 화면에 표시된다.
- [x] feed/play/sleep 액션이 스탯에 영향을 준다.
- [x] 현재 스탯으로 상태가 계산된다.
- [x] 상태에 따라 `document.title`이 변경된다.
- [x] 상태에 따라 favicon이 변경된다.
- [x] 위장 타이틀 프리셋을 선택할 수 있다.
- [x] localStorage 저장/복원이 동작한다.
- [x] 오프라인 decay가 반영된다.
- [x] 스킨/테마 선택 UI가 있다.
- [x] 광고 보상형 UI 목업이 있다.
- [x] 프리미엄 UI 목업이 있다.
- [x] 이모지 복사 패널이 있다.
- [x] 실제 광고 SDK, 결제, 로그인, 서버 DB가 없다.
