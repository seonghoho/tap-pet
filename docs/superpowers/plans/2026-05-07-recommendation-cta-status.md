# Recommendation CTA Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the recommendation card clearly distinguish a care action users can do now from a recommended action that is still cooling down.

**Architecture:** Keep recommendation selection and action availability rules unchanged. Add a small localized CTA status chip inside the existing recommendation card support area, derived from the recommended action cooldown and existing `now` timer.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest, localized static messages in `constants/i18n.ts`.

---

### Task 1: Recommendation CTA Status

**Files:**
- Modify: `tests/pet-recommendation-evidence.test.ts`
- Modify: `components/PetActions.vue`
- Modify: `constants/i18n.ts`
- Modify: `assets/css/main.css`
- Create: `docs/superpowers/summaries/2026-05-07-recommendation-cta-status.md`

- [x] **Step 1: Write the failing test**

Add assertions that the recommendation card exposes a CTA status text and class for ready vs cooldown recommendations, renders the CTA chip inside `.action-recommendation__support`, and includes localized copy for every supported locale.

```ts
type PetActionsSetup = {
  recommendationEvidenceText?: { value: string }
  shouldShowRecommendationEvidence?: { value: boolean }
  recommendationCtaStatusText?: { value: string }
  recommendationCtaStatusClass?: { value: string }
}

it('separates ready recommendation CTA status from the detail copy', () => {
  const setup = setupPetActions()

  expect(setup.recommendationCtaStatusText?.value).toBe('지금 가능 · 추천 버튼을 눌러 결과를 확인하세요')
  expect(setup.recommendationCtaStatusClass?.value).toBe('action-recommendation__cta--ready')
})

it('shows cooldown CTA status for a recommended action that is not ready yet', () => {
  const setup = setupPetActions({
    cooldowns: {
      feed: 4500,
      play: 0,
      sleep: 0,
      wash: 0,
    },
  })

  expect(setup.recommendationCtaStatusText?.value).toBe('추천 대기 · 4s 후 가능')
  expect(setup.recommendationCtaStatusClass?.value).toBe('action-recommendation__cta--cooldown')
})
```

- [x] **Step 2: Run RED**

Run:

```bash
npm run test -- tests/pet-recommendation-evidence.test.ts
```

Expected: FAIL because the CTA status computed values and i18n keys do not exist.

- [x] **Step 3: Implement minimal code**

Add computed values in `components/PetActions.vue`:

```ts
const recommendationCtaStatus = computed<'ready' | 'cooldown'>(() => {
  const recommendation = props.recommendedCareAction
  if (!recommendation) return 'ready'

  return props.cooldowns[recommendation.action] > now.value ? 'cooldown' : 'ready'
})

const recommendationCtaStatusText = computed(() => {
  const recommendation = props.recommendedCareAction
  if (!recommendation) return ''

  if (recommendationCtaStatus.value === 'cooldown') {
    return messages.value.careRecommendation.ctaCooldown.replace(
      '{time}',
      formatRemainingTime(props.cooldowns[recommendation.action] - now.value),
    )
  }

  return messages.value.careRecommendation.ctaReady
})

const recommendationCtaStatusClass = computed(
  () => `action-recommendation__cta--${recommendationCtaStatus.value}`,
)
```

Render the chip inside `.action-recommendation__support`:

```vue
<span
  v-if="recommendationCtaStatusText"
  class="action-recommendation__cta"
  :class="recommendationCtaStatusClass"
>
  {{ recommendationCtaStatusText }}
</span>
```

Add locale messages:

```ts
ctaReady: 'Ready now · tap the recommended button to see the result',
ctaCooldown: 'Recommended wait · ready in {time}',
```

Korean:

```ts
ctaReady: '지금 가능 · 추천 버튼을 눌러 결과를 확인하세요',
ctaCooldown: '추천 대기 · {time} 후 가능',
```

Japanese:

```ts
ctaReady: '今すぐ可能 · おすすめボタンで結果を確認',
ctaCooldown: 'おすすめ待機 · {time} 後に可能',
```

Add CSS for `.action-recommendation__cta`, `.action-recommendation__cta--ready`, and `.action-recommendation__cta--cooldown`, matching existing chip sizing and wrapping.

- [x] **Step 4: Run focused tests**

Run:

```bash
npm run test -- tests/pet-recommendation-evidence.test.ts tests/pet-action-button-status.test.ts tests/pet-recommendation-reward-preview.test.ts
```

Expected: all focused tests pass.

- [x] **Step 5: Add summary doc**

Create `docs/superpowers/summaries/2026-05-07-recommendation-cta-status.md` with:

```md
# 2026-05-07 Recommendation CTA Status

## 개선 방향

- 추천 카드에서 추천 이유와 실제 실행 가능 상태를 분리해 사용자가 지금 눌러도 되는지 바로 판단할 수 있게 했습니다.

## 변경 사항

- 추천 행동이 준비된 경우 `지금 가능` CTA 상태를 표시했습니다.
- 추천 행동이 쿨다운 중이면 추천은 유지하되 `추천 대기 · Ns 후 가능` 상태를 표시했습니다.
- en/ko/ja CTA 상태 문구와 responsive-safe chip 스타일을 추가했습니다.

## 검증

- 확인 필요: `npm run test`
- 확인 필요: `npm run lint`
- 확인 필요: `npm run build`

## 다음 개선 후보

- 쿨다운 중인 추천 액션이 풀리는 순간 추천 카드의 CTA 상태가 자연스럽게 갱신되는지 브라우저 시각 검증을 자동화합니다.
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
git add assets/css/main.css components/PetActions.vue constants/i18n.ts tests/pet-recommendation-evidence.test.ts docs/superpowers/plans/2026-05-07-recommendation-cta-status.md docs/superpowers/summaries/2026-05-07-recommendation-cta-status.md
git commit -m "feat(pet): clarify recommendation cta status"
```
