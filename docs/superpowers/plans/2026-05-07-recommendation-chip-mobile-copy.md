# Recommendation Chip Mobile Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make recommendation card chips easier to scan on mobile by shortening the ready CTA copy and hardening chip width/wrapping styles.

**Architecture:** Keep recommendation logic and CTA state calculation unchanged. Only adjust localized CTA copy and shared recommendation chip CSS so the card remains compact across desktop and mobile.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest, static CSS tests.

---

### Task 1: Compact Recommendation CTA Chips

**Files:**
- Modify: `tests/pet-recommendation-evidence.test.ts`
- Modify: `assets/css/main.css`
- Modify: `constants/i18n.ts`
- Create: `docs/superpowers/summaries/2026-05-07-recommendation-chip-mobile-copy.md`

- [x] **Step 1: Write the failing test**

Update CTA copy expectations to shorter strings and add CSS assertions that all recommendation chips use `width: fit-content` and `min-width: 0`.

```ts
expect(setup.recommendationCtaStatusText?.value).toBe('지금 가능 · 결과 확인')
expect(I18N_MESSAGES.en.careRecommendation.ctaReady).toBe('Ready now · see result')
expect(I18N_MESSAGES.ja.careRecommendation.ctaReady).toBe('今すぐ可能 · 結果を確認')
expect(css).toMatch(/\.action-recommendation__cta\s*\{[^}]*width: fit-content;/)
expect(css).toMatch(/\.action-recommendation__reward\s*\{[^}]*width: fit-content;/)
expect(css).toMatch(/\.action-recommendation__evidence\s*\{[^}]*width: fit-content;/)
```

- [x] **Step 2: Run RED**

Run:

```bash
npm run test -- tests/pet-recommendation-evidence.test.ts tests/pet-recommendation-reward-preview.test.ts
```

Expected: FAIL because current ready CTA copy is longer and chips do not define `width: fit-content`.

- [x] **Step 3: Implement minimal code**

Update `careRecommendation.ctaReady`:

- en: `Ready now · see result`
- ko: `지금 가능 · 결과 확인`
- ja: `今すぐ可能 · 結果を確認`

Add to `.action-recommendation__reward`, `.action-recommendation__cta`, and `.action-recommendation__evidence`:

```css
min-width: 0;
width: fit-content;
```

- [x] **Step 4: Run focused tests**

Run:

```bash
npm run test -- tests/pet-recommendation-evidence.test.ts tests/pet-recommendation-reward-preview.test.ts
```

- [x] **Step 5: Add summary doc**

Create `docs/superpowers/summaries/2026-05-07-recommendation-chip-mobile-copy.md` with:

```md
# 2026-05-07 Recommendation Chip Mobile Copy

## 개선 방향

- 추천 카드의 CTA 칩을 모바일에서도 짧게 스캔할 수 있도록 ready 문구와 chip 폭 처리를 정리했습니다.

## 변경 사항

- CTA ready 문구를 `지금 가능 · 결과 확인`처럼 짧게 줄였습니다.
- 추천 카드 CTA/evidence/reward chip에 `width: fit-content`와 `min-width: 0`을 적용했습니다.

## 검증

- 확인 필요: `npm run test`
- 확인 필요: `npm run lint`
- 확인 필요: `npm run build`

## 다음 개선 후보

- 추천 카드와 action grid를 실제 모바일 브라우저에서 스크린샷으로 검증해 과밀한 경우 간격을 미세 조정합니다.
```

- [x] **Step 6: Full verification**

Run:

```bash
npm run test
npm run lint
npm run build
git diff --check
```

- [ ] **Step 7: Commit**

Run:

```bash
git add assets/css/main.css constants/i18n.ts tests/pet-recommendation-evidence.test.ts docs/superpowers/plans/2026-05-07-recommendation-chip-mobile-copy.md docs/superpowers/summaries/2026-05-07-recommendation-chip-mobile-copy.md
git commit -m "style(pet): tighten recommendation chip copy"
```
