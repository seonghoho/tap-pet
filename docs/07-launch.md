# 출시 준비

## 1. 계정과 키 (운영자가 직접)

| 서비스 | 할 일 | 넣을 값 |
| --- | --- | --- |
| PostHog | 프로젝트 생성 (사용자가 한국이면 US/EU 아무 곳이나 가능, EU 사용자 비중이 크면 EU) | `NUXT_PUBLIC_POSTHOG_KEY`, `NUXT_PUBLIC_POSTHOG_HOST` |
| Sentry | Vue 프로젝트 생성 | `NUXT_PUBLIC_SENTRY_DSN` |
| 도메인 | 배포 주소 확정 | `NUXT_PUBLIC_SITE_URL` |
| 토스페이먼츠 | 가맹점 가입 → 개발자센터에서 API 키 확인 (먼저 `test_` 키로 확인) | `NUXT_PUBLIC_TOSS_CLIENT_KEY`, `NUXT_TOSS_SECRET_KEY` |
| 구매 영수증 서명 | 아무 긴 무작위 문자열 (`openssl rand -base64 32`) | `NUXT_PURCHASE_SIGNING_SECRET` |

키가 비어 있으면 해당 기능은 꺼진 채로 동작한다. 로컬 개발은 아무 키 없이 된다.

## 2. 배포

Nuxt 기본 출력(`nuxt build` → `.output/`)을 그대로 쓴다. 결제 승인이 서버 라우트(`/api/purchases/*`)에서 일어나므로 정적 배포(`nuxt generate`)는 쓰지 않는다. Vercel·Netlify는 Nuxt를 자동 인식하므로 저장소 연결 후 위 환경 변수만 넣으면 된다.

```bash
npm ci
npm run test
npm run lint
npm run build
```

## 3. 배포 후 확인

- [ ] `/privacy.html`에서 운영자 이름과 연락 이메일(노란 표시)을 채웠는지
- [ ] 카카오톡·슬랙에 주소를 붙였을 때 미리보기 이미지가 뜨는지 (카카오 캐시는 [공유 디버거](https://developers.kakao.com/tool/debugger/sharing)에서 초기화)
- [ ] PostHog Live events에 `tab_pet_pet_created`가 들어오는지
- [ ] 설정에서 "익명 사용 통계 보내기"를 끄면 이벤트가 멈추는지
- [ ] Sentry에 테스트 오류가 잡히는지 (브라우저 콘솔에서 `setTimeout(() => { throw new Error('sentry check') })`)
- [ ] 휴대폰에서 친구 카드 공유 창이 뜨는지

## 4. 결제 (토스페이먼츠)

흐름: 상점에서 구매 → 토스 결제창 → `/?purchase=success`로 복귀 → 서버가 `POST /v1/payments/confirm`로 승인 → 서명된 구매 기록을 브라우저에 저장.

- 가격은 `constants/shop.ts`가 기준이다. 서버는 주문번호에서 상품을 찾아 그 가격과 결제 금액을 비교하므로, 브라우저에서 금액을 바꿔도 승인되지 않는다.
- 계정이 없으므로 구매 기록은 브라우저와 백업 코드에 담긴다. 기록이 사라지면 상점의 "구매 복원"에 주문번호를 넣으면 서버가 토스에 결제 상태를 조회해 다시 발급한다.
- 키가 비어 있으면 상점은 "준비 중"으로 보이고 결제 버튼이 꺼진다.

테스트 키로 확인할 것:
- [ ] 꾸미기 팩 구매 → 복귀 후 "구매 완료" 알림, 설정에 "옷 입히기"가 생기는지
- [ ] 결제창에서 취소 → 오류 알림 없이 그대로인지
- [ ] 성공 페이지를 새로고침해도 한 번만 승인되는지
- [ ] 브라우저 데이터를 지운 뒤 주문번호로 복원되는지
- [ ] 토스 개발자센터에서 결제 내역과 금액이 맞는지

## 5. 광고

사이드바 디스플레이 광고(AdSense)는 제거했다. 업무 탭처럼 보이는 화면에 광고가 뜨면 위장이 깨지기 때문이다. `public/ads.txt`는 추후 보상형 광고를 쓸 경우를 위해 남겨 두었다.
