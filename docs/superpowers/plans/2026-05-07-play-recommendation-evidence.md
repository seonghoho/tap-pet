# Play Recommendation Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a concrete `lastPlayedAt`-based evidence chip when the recommended care action is `play`, so users understand why the app is asking them to play now.

**Architecture:** Keep recommendation selection unchanged in `utils/petCare.ts`; this task only improves the recommendation card presentation. `app.vue` passes the existing `currentPet.lastPlayedAt` into `PetActions.vue`, and `PetActions.vue` formats elapsed time as localized recommendation evidence when the recommendation action is `play`.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest, localized static messages in `constants/i18n.ts`.

---

### Task 1: Add Play Evidence To Recommendation Card

**Files:**
- Modify: `tests/pet-recommendation-evidence.test.ts`
- Modify: `components/PetActions.vue`
- Modify: `app.vue`
- Modify: `constants/i18n.ts`
- Create: `docs/superpowers/summaries/2026-05-07-play-recommendation-evidence.md`

- [x] **Step 1: Write the failing test**

Add assertions that `PetActions` receives `last-played-at`, and that a `play` recommendation without `statKey` renders elapsed play evidence instead of hiding evidence.

```ts
it('passes last played time into the action controls', () => {
  const appTemplate = readComponentTemplate('app.vue')
  const source = readSource('components/PetActions.vue')

  expect(getComponentPropExpression(appTemplate, 'PetActions', 'last-played-at')).toBe(
    'currentPet.lastPlayedAt',
  )
  expect(source).toContain('lastPlayedAt: number')
})

it('summarizes idle time when play is recommended', () => {
  const setup = setupPetActions({
    lastPlayedAt: 1000 - 1000 * 60 * 135,
    recommendedCareAction: {
      action: 'play',
      reason: 'need',
      status: 'bored',
    },
  })

  expect(setup.shouldShowRecommendationEvidence?.value).toBe(true)
  expect(setup.recommendationEvidenceText?.value).toBe('근거 마지막 놀이 2시간 15분 전')
})
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- tests/pet-recommendation-evidence.test.ts
```

Expected: FAIL because `lastPlayedAt` is not a `PetActions` prop and `play` still hides evidence when `statKey` is absent.

- [x] **Step 3: Implement minimal production code**

Update `PetActions.vue` props:

```ts
const props = defineProps<{
  stats: PetStats
  lastPlayedAt: number
  cooldowns: Record<PetAction, number>
  activeReaction: PetAction | null
  actionLimitInfo: PetActionLimitInfo
  careFeedback: PetCareFeedback | null
  actionLimitRewardFeedback: PetActionLimitRewardFeedback | null
  recommendedCareAction: PetCareRecommendation | null
  recommendedCareRewardPreview?: CareActionRewardPreview | null
  levelProgress?: ProgressInfo | null
}>()
```

Pass the prop from `app.vue`:

```vue
<PetActions
  :stats="currentPet.stats"
  :last-played-at="currentPet.lastPlayedAt"
  :cooldowns="pet.actionCooldowns.value"
  ...
/>
```

Update recommendation evidence:

```ts
const recommendationEvidenceText = computed(() => {
  const recommendation = props.recommendedCareAction
  if (!recommendation) return ''

  if (recommendation.action === 'play') {
    return messages.value.careRecommendation.playEvidence.replace(
      '{time}',
      formatElapsedTime(now.value - props.lastPlayedAt),
    )
  }

  if (!recommendation.statKey) return ''

  return messages.value.careRecommendation.statEvidence
    .replace('{stat}', messages.value.stats[recommendation.statKey])
    .replace('{value}', String(props.stats[recommendation.statKey]))
})
```

Add a small elapsed formatter in `PetActions.vue`:

```ts
function formatElapsedTime(milliseconds: number): string {
  const totalMinutes = Math.max(1, Math.floor(Math.max(0, milliseconds) / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours <= 0) return messages.value.time.minutesAgo.replace('{minutes}', String(minutes))
  if (minutes <= 0) return messages.value.time.hoursAgo.replace('{hours}', String(hours))

  return messages.value.time.hoursMinutesAgo
    .replace('{hours}', String(hours))
    .replace('{minutes}', String(minutes))
}
```

Add localized messages:

```ts
time: {
  minutesAgo: '{minutes}m ago',
  hoursAgo: '{hours}h ago',
  hoursMinutesAgo: '{hours}h {minutes}m ago',
}
careRecommendation: {
  playEvidence: 'Evidence last play {time}',
}
```

Korean:

```ts
time: {
  minutesAgo: '{minutes}분 전',
  hoursAgo: '{hours}시간 전',
  hoursMinutesAgo: '{hours}시간 {minutes}분 전',
}
careRecommendation: {
  playEvidence: '근거 마지막 놀이 {time}',
}
```

Japanese:

```ts
time: {
  minutesAgo: '{minutes}分前',
  hoursAgo: '{hours}時間前',
  hoursMinutesAgo: '{hours}時間{minutes}分前',
}
careRecommendation: {
  playEvidence: '根拠 最後の遊び {time}',
}
```

- [x] **Step 4: Run focused tests to verify GREEN**

Run:

```bash
npm run test -- tests/pet-recommendation-evidence.test.ts tests/pet-care-recommendation.test.ts
```

Expected: all tests pass.

- [x] **Step 5: Add task summary doc**

Create `docs/superpowers/summaries/2026-05-07-play-recommendation-evidence.md` with:

```md
# 2026-05-07 Play Recommendation Evidence

## 개선 방향

- `play` 추천이 뜰 때 사용자가 이유를 바로 이해하도록 마지막 놀이 이후 경과 시간을 추천 카드 근거로 노출했습니다.

## 변경 사항

- `app.vue`에서 `currentPet.lastPlayedAt`을 `PetActions`에 전달했습니다.
- `PetActions.vue`에서 `play` 추천 전용 경과 시간 근거를 계산했습니다.
- 영어/한국어/일본어 메시지에 시간 표현과 `play` 근거 문구를 추가했습니다.
- 추천 근거 테스트로 prop 연결, `play` 근거, 지역화 키를 검증했습니다.

## 검증

- 확인 필요: `npm run test`
- 확인 필요: `npm run lint`
- 확인 필요: `npm run build`

## 리스크

- 경과 시간은 클라이언트 시간 기준이므로 사용자의 시스템 시간이 크게 틀리면 표시가 달라질 수 있습니다.

## 다음 개선 후보

- 추천 카드에서 쿨다운/횟수 제한 상태와 추천 CTA를 더 명확히 분리해 사용자가 지금 가능한 행동을 즉시 판단하도록 개선합니다.
```

- [x] **Step 6: Run full verification**

Run:

```bash
npm run test
npm run lint
npm run build
git diff --check
```

Expected: all commands pass.

- [ ] **Step 7: Commit and push**

Run:

```bash
git add app.vue components/PetActions.vue constants/i18n.ts tests/pet-recommendation-evidence.test.ts docs/superpowers/plans/2026-05-07-play-recommendation-evidence.md docs/superpowers/summaries/2026-05-07-play-recommendation-evidence.md
git commit -m "feat(pet): show play recommendation evidence"
git push
```
