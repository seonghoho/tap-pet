# Tab Pet 크롬 확장

웹은 "써보는 곳", 확장은 "계속 쓰는 곳"이다. 확장은 탭을 열어두지 않아도 툴바 아이콘으로 펫을 보여준다.

## 구조

| 파일 | 역할 |
| --- | --- |
| `extension/src/petCore.ts` | 펫 규칙 (웹의 `utils/`를 그대로 사용: 감소, 돌봄, 횟수 제한, 연속 돌봄, 성격) |
| `extension/src/background.ts` | 5분마다 시간 경과 반영, 툴바 아이콘·제목 갱신, 알림 (켠 경우만) |
| `extension/src/offscreen.ts` | 서비스 워커 대신 SVG를 아이콘 픽셀로 변환 |
| `extension/src/popup.ts` | 팝업: 친구 고르기, 돌봄 4종, 옷 입히기(꾸미기 팩 보유 시), 옮기기(백업 코드), 알림 설정 |
| `extension/static/` | manifest, HTML, CSS, 기본 아이콘 |

웹과 확장은 출처가 달라 저장소를 공유하지 못한다. 대신 같은 백업 코드 형식을 쓰므로 웹 설정 › "다른 브라우저로 옮기기"에서 복사한 코드를 팝업에 붙여넣으면 된다 (반대도 같다).

## 빌드와 로컬 설치

```bash
npm run build:extension
```

`chrome://extensions` → 개발자 모드 → "압축해제된 확장 프로그램을 로드합니다" → `extension/dist` 선택.

e2e(`e2e/extension.spec.ts`)는 빌드된 `extension/dist`를 실제 Chromium에 올려 팝업 흐름을 확인한다.

## 권한과 이유 (스토어 심사용)

| 권한 | 이유 |
| --- | --- |
| `storage` | 펫 상태를 이 브라우저에 저장 |
| `alarms` | 5분마다 펫 상태를 다시 계산해 아이콘에 반영 |
| `notifications` | 사용자가 켠 경우에만 "돌봄이 필요해요" 알림 |
| `offscreen` | 펫 SVG를 툴바 아이콘 이미지로 변환 |

호스트 권한, 탭 읽기, 원격 코드는 없다. 네트워크 요청도 하지 않는다.

## 스토어 제출 전 남은 일

- [x] 스크린샷 1280×800 3장, 홍보 타일 440×280 (`npm run store:images`)
- [x] 개인정보처리방침 (`/privacy.html` 5절)에 확장 항목 추가
- [x] 꾸미기 팩 연동: 백업 코드로 넘어온 구매 기록을 `chrome.storage.local`의 `entitlements`에 저장한다. 꾸미기 팩이 있으면 팝업 설정에 옷 고르기가 생기고, 아이콘과 팝업에 옷이 보인다. 내보내는 백업 코드에도 구매 기록이 함께 담긴다.
- [x] 제출용 zip (`npm run pack:extension`), 등록 문구는 [10-store-listing.md](10-store-listing.md)
- [ ] 개발자 계정 등록 (일회성 등록비), 배포 도메인 확정 후 개인정보처리방침 URL 입력

## 하지 않은 것

- 새 탭 덮어쓰기: 설치만으로 새 탭이 바뀌면 거부감이 크고 심사도 까다롭다. 반응을 보고 별도 옵션 확장으로 검토한다.
