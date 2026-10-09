# 출시 준비

## 1. 계정과 키 (운영자가 직접)

| 서비스 | 할 일 | 넣을 값 |
| --- | --- | --- |
| PostHog | 프로젝트 생성 (사용자가 한국이면 US/EU 아무 곳이나 가능, EU 사용자 비중이 크면 EU) | `NUXT_PUBLIC_POSTHOG_KEY`, `NUXT_PUBLIC_POSTHOG_HOST` |
| Sentry | Vue 프로젝트 생성 | `NUXT_PUBLIC_SENTRY_DSN` |
| 도메인 | 배포 주소 확정 | `NUXT_PUBLIC_SITE_URL` |

키가 비어 있으면 해당 기능은 꺼진 채로 동작한다. 로컬 개발은 아무 키 없이 된다.

## 2. 배포

Nuxt 기본 출력(`nuxt build` → `.output/`)을 그대로 쓴다. Vercel·Netlify는 Nuxt를 자동 인식하므로 저장소 연결 후 위 환경 변수만 넣으면 된다.

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

## 4. 광고

사이드바 디스플레이 광고(AdSense)는 제거했다. 업무 탭처럼 보이는 화면에 광고가 뜨면 위장이 깨지기 때문이다. `public/ads.txt`는 추후 보상형 광고를 쓸 경우를 위해 남겨 두었다.
