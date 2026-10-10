# 크롬 웹스토어 등록 자료

제출할 때 그대로 복사해 쓰는 문구와 파일. 확장 구조와 권한 설명은 [08-extension.md](08-extension.md).

## 제출 순서

1. `npm run pack:extension` → `extension/release/tab-pet-<버전>.zip` 업로드
2. `npm run store:images` → `extension/store/images/` 의 이미지 업로드
3. 아래 문구를 스토어 등록정보·개인정보 보호 탭에 붙여넣기
4. 개인정보처리방침 URL: `https://<배포 도메인>/privacy.html`

다시 올릴 때는 `extension/static/manifest.json`의 `version`을 올린다 (같은 버전은 업로드 거부).

## 이미지

| 용도 | 파일 | 크기 |
| --- | --- | --- |
| 스크린샷 (ko) | `ko-care.png`, `ko-outfit.png`, `ko-adopt.png` | 1280×800 |
| 스크린샷 (en) | `en-care.png`, `en-outfit.png`, `en-adopt.png` | 1280×800 |
| 작은 홍보 타일 | `ko-tile.png` / `en-tile.png` | 440×280 |
| 스토어 아이콘 | `extension/static/icons/icon-128.png` | 128×128 |

모두 실제 팝업을 띄워 찍는다. 팝업 디자인이 바뀌면 `npm run store:images`를 다시 돌린다.

## 등록정보

- 카테고리: 재미 (Fun)
- 언어: 한국어(기본), 영어

### 한국어

**이름:** Tab Pet

**요약 (132자 이내):**
툴바에 사는 작은 친구. 배고프거나 심심하면 아이콘에 살짝 티를 내요.

**설명:**
```
Tab Pet은 브라우저 툴바에 사는 작은 펫이에요.

• 여섯 친구 중 하나를 골라 이름을 지어주세요. 고양이, 강아지, 고슴도치, 토끼, 펭귄, 햄스터가 있어요.
• 탭을 열어두지 않아도 툴바 아이콘에서 지내요. 기분에 따라 표정이 바뀌어요.
• 배고프거나 심심하면 아이콘에 빨간 점이 떠요. 아이콘을 눌러 밥 주고, 놀아주고, 재우고, 씻겨주세요.
• 매일 조금씩 돌보면 레벨이 오르고 연속 돌봄 기록이 쌓여요.
• 원하면 돌봄이 필요할 때 알림을 받을 수 있어요. (기본은 꺼져 있어요)
• 웹사이트에서 키우던 친구도 백업 코드 한 줄로 옮겨 올 수 있어요. 웹에서 산 꾸미기도 그대로 따라와요.

가입이 없고, 펫은 이 브라우저에만 저장돼요. 확장은 어떤 정보도 밖으로 보내지 않고, 방문한 사이트나 탭 내용을 읽지 않아요.
```

### English

**Name:** Tab Pet

**Summary:**
A tiny friend that lives in your toolbar. The icon quietly lets you know when it's hungry or bored.

**Description:**
```
Tab Pet is a tiny pet that lives in your browser toolbar.

• Pick one of six friends and give it a name: a cat, dog, hedgehog, rabbit, penguin or hamster.
• It lives in the toolbar icon, no tab needed. Its face changes with its mood.
• When it gets hungry or bored, a red dot shows up on the icon. Click it to feed, play, tuck in or wash your pet.
• A little care each day levels it up and builds a care streak.
• Turn on notifications if you'd like a nudge when it needs you. (Off by default.)
• Already raising a pet on the website? Bring it over with one backup code, outfits included.

No account. Your pet is stored only in this browser. The extension sends nothing anywhere and never reads the sites or tabs you visit.
```

## 개인정보 보호 탭

**단일 목적 (Single purpose):**
툴바 아이콘에 사는 가상 펫을 키우는 것. 펫 상태를 아이콘으로 보여주고 팝업에서 돌본다.
/ Raise a virtual pet that lives in the toolbar icon: the icon shows its mood and the popup is where you care for it.

**권한 사유:**

| 권한 | 사유 (영문, 그대로 붙여넣기) |
| --- | --- |
| `storage` | Saves the pet (name, stats, level) and settings locally in chrome.storage.local. Nothing is synced or sent anywhere. |
| `alarms` | Recalculates the pet's mood every 5 minutes so the toolbar icon stays up to date while the popup is closed. |
| `notifications` | Shows a "your pet needs care" notification, only if the user turns it on in the popup. Off by default. |
| `offscreen` | Service workers cannot draw images, so an offscreen document turns the pet's SVG into the toolbar icon pixels. |

**원격 코드 사용:** 아니요. 모든 코드는 패키지에 포함됨.

**데이터 사용:** 수집하는 항목 없음 (모든 항목 체크 해제).
아래 세 가지 확인란은 모두 체크:
- 승인된 사용 사례 외 목적으로 사용자 데이터를 판매·전송하지 않음
- 단일 목적과 무관한 목적으로 사용자 데이터를 사용·전송하지 않음
- 신용도 판단·대출 목적으로 사용자 데이터를 사용·전송하지 않음

## 심사 메모 (필요할 때)

> The popup works without any account. To test: click the toolbar icon, pick a pet, press "Start". The care buttons change the stats; the toolbar icon updates within a few seconds. Outfits appear only after importing a backup code from the website that contains an outfit-pack purchase; no purchase happens inside the extension.
