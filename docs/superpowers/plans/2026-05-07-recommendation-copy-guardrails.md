# Recommendation Copy Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the recommended action button copy feel like an action the user can take now, while locking in that the recommendation card body still owns the longer recommendation reason.

**Architecture:** Keep `PetActions` state logic unchanged. The recommendation card continues to read `careRecommendation.details[action]`; the recommended action button continues to read `actionButtonState.recommendedDetail`, with more action-oriented localized copy.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest, localized static messages.

---

### Task 1: Recommended Copy Guardrails

**Files:**
- Modify: `tests/pet-action-button-status.test.ts`
- Modify: `tests/pet-recommendation-evidence.test.ts`
- Modify: `constants/i18n.ts`
- Create: `docs/superpowers/summaries/2026-05-07-recommendation-copy-guardrails.md`

- [x] **Step 1: Write failing tests**

Update button copy expectations and add card/body separation regression coverage.

Expected assertions:

```ts
expect(setup.getActionButtonDetail('feed')).toBe('추천 돌봄 시작')
expect(setup.getActionAriaLabel('feed')).toBe('밥 주기: 추천 · 추천 돌봄 시작')
expect(I18N_MESSAGES.en.actionButtonState.recommendedDetail).toBe('Start recommended care')
expect(I18N_MESSAGES.ko.actionButtonState.recommendedDetail).toBe('추천 돌봄 시작')
expect(I18N_MESSAGES.ja.actionButtonState.recommendedDetail).toBe('おすすめのお世話を始める')
expect(setup.recommendationDetail?.value).toBe(I18N_MESSAGES.ko.careRecommendation.details.sleep)
expect(setup.getActionButtonDetail?.('sleep')).toBe(I18N_MESSAGES.ko.actionButtonState.recommendedDetail)
expect(setup.recommendationDetail?.value).not.toBe(setup.getActionButtonDetail?.('sleep'))
```

- [x] **Step 2: Run RED**

Run:

```bash
npm run test -- tests/pet-action-button-status.test.ts tests/pet-recommendation-evidence.test.ts
```

Expected: FAIL because the current button copy does not match the new action-oriented copy. The recommendation card/body separation coverage may already pass if the component keeps separate message sources.

- [x] **Step 3: Implement minimal code**

Update `actionButtonState.recommendedDetail` in `constants/i18n.ts`:

```ts
recommendedDetail: 'Start recommended care',
recommendedDetail: '추천 돌봄 시작',
recommendedDetail: 'おすすめのお世話を始める',
```

If needed for tests, extend `PetActionsSetup` test typing only. Do not change production component exposure unless existing setup return already exposes the helper.

- [x] **Step 4: Run focused tests**

Run:

```bash
npm run test -- tests/pet-action-button-status.test.ts tests/pet-recommendation-evidence.test.ts
```

- [x] **Step 5: Add summary doc**

Create `docs/superpowers/summaries/2026-05-07-recommendation-copy-guardrails.md` with:

```md
# 2026-05-07 Recommendation Copy Guardrails

## 개선 방향

- 추천 버튼은 사용자가 지금 실행할 행동을 말하고, 추천 카드는 왜 이 행동이 추천되는지 설명하도록 역할을 고정했습니다.

## 변경 사항

- 추천 버튼 detail copy를 `추천 돌봄 시작`으로 변경했습니다.
- 추천 카드 본문과 추천 버튼 detail이 서로 다른 메시지 소스를 쓰는지 테스트로 고정했습니다.

## 검증

- 확인 필요: `npm run test`
- 확인 필요: `npm run lint`
- 확인 필요: `npm run build`
```

- [x] **Step 6: Subagent reviews**

Ask read-only reviewers for:

- spec compliance
- code quality, i18n consistency, accessibility copy risk

- [x] **Step 7: Full verification**

Run:

```bash
npm run test
npm run lint
npm run build
git diff --check
```

- [x] **Step 8: Commit**

Run:

```bash
git add constants/i18n.ts tests/pet-action-button-status.test.ts tests/pet-recommendation-evidence.test.ts docs/superpowers/plans/2026-05-07-recommendation-copy-guardrails.md docs/superpowers/summaries/2026-05-07-recommendation-copy-guardrails.md
git commit -m "test(pet): guard recommendation copy roles"
```
