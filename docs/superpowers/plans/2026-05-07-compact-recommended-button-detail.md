# Compact Recommended Button Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce mobile repetition by letting the recommendation card explain the reason while the recommended button shows a short action-oriented detail.

**Architecture:** Keep recommendation logic, button state order, and recommendation card content unchanged. Only change the ready recommended button detail from the full recommendation reason to a compact localized action prompt.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest, localized static messages.

---

### Task 1: Compact Recommended Button Detail

**Files:**
- Modify: `tests/pet-action-button-status.test.ts`
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Create: `docs/superpowers/summaries/2026-05-07-compact-recommended-button-detail.md`

- [x] **Step 1: Write the failing test**

Update the ready recommended action detail expectation and add locale coverage for the new compact copy.

```ts
expect(setup.getActionButtonDetail('feed')).toBe('추천 결과 확인')
expect(actionButtonState.recommendedDetail.length).toBeGreaterThan(0)
```

- [x] **Step 2: Run RED**

Run:

```bash
npm run test -- tests/pet-action-button-status.test.ts
```

Expected: FAIL because the recommended button still uses the full recommendation reason and `recommendedDetail` does not exist.

- [x] **Step 3: Implement minimal code**

Add `recommendedDetail` to `actionButtonState` in en/ko/ja:

```ts
recommendedDetail: 'Check recommended result',
recommendedDetail: '추천 결과 확인',
recommendedDetail: 'おすすめ結果を確認',
```

Update `getActionButtonDetail`:

```ts
function getActionButtonDetail(action: PetAction): string {
  if (getActionButtonState(action) === 'recommended') return messages.value.actionButtonState.recommendedDetail

  return getActionDetail(action)
}
```

- [x] **Step 4: Run focused tests**

Run:

```bash
npm run test -- tests/pet-action-button-status.test.ts tests/pet-recommendation-evidence.test.ts
```

- [x] **Step 5: Add summary doc**

Create `docs/superpowers/summaries/2026-05-07-compact-recommended-button-detail.md` with:

```md
# 2026-05-07 Compact Recommended Button Detail

## 개선 방향

- 추천 이유는 추천 카드가 설명하고, 버튼은 실행 결과 확인에 집중하도록 문구를 짧게 정리했습니다.

## 변경 사항

- ready 추천 버튼 detail을 긴 추천 이유 대신 `추천 결과 확인`으로 표시했습니다.
- en/ko/ja `actionButtonState.recommendedDetail` 문구를 추가했습니다.

## 검증

- 확인 필요: `npm run test`
- 확인 필요: `npm run lint`
- 확인 필요: `npm run build`

## 근거

- 모바일 스크린샷 검증에서 추천 카드와 추천 버튼이 같은 긴 이유 문구를 반복해 첫 버튼 높이가 커지는 점을 확인했습니다.
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
git add components/PetActions.vue constants/i18n.ts tests/pet-action-button-status.test.ts docs/superpowers/plans/2026-05-07-compact-recommended-button-detail.md docs/superpowers/summaries/2026-05-07-compact-recommended-button-detail.md
git commit -m "feat(pet): compact recommended button detail"
```
