# Recommendation Availability Dedupe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Avoid repeating the same recommended action cooldown in both the recommendation card CTA chip and the general action availability helper.

**Architecture:** Keep cooldown calculation and recommendation visibility rules unchanged. When the next cooling action is the same action currently shown in the recommendation card, suppress the generic availability helper because the recommendation card already owns that message.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Vitest.

---

### Task 1: Suppress Duplicate Recommended Cooldown Helper

**Files:**
- Modify: `tests/pet-action-availability.test.ts`
- Modify: `components/PetActions.vue`
- Create: `docs/superpowers/summaries/2026-05-07-recommendation-availability-dedupe.md`

- [x] **Step 1: Write the failing test**

Add a test that keeps the generic availability helper hidden when the next cooling action is also the visible recommended action, and another assertion that unrelated cooldowns still show.

```ts
it('hides the generic cooldown helper when the recommendation card already shows that action wait', () => {
  vi.useFakeTimers()
  vi.setSystemTime(1000)
  vi.stubGlobal('useLocale', () => ({ messages: { value: I18N_MESSAGES.ko } }))
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const component = loadScriptSetupComponent<PetActionsSetup>('components/PetActions.vue')

  const setup = component.setup(
    {
      ...createBaseProps(),
      recommendedCareAction: {
        action: 'sleep',
        reason: 'lowest-stat',
        status: 'happy',
        statKey: 'energy',
      },
      cooldowns: {
        feed: 0,
        play: 0,
        sleep: 2100,
        wash: 0,
      },
    },
    {
      emit: vi.fn(),
      expose: vi.fn(),
    },
  )

  expect(setup.shouldShowActionAvailability.value).toBe(false)
  expect(setup.actionAvailabilityText.value).toBe('')
})
```

- [x] **Step 2: Run RED**

Run:

```bash
npm run test -- tests/pet-action-availability.test.ts
```

Expected: FAIL because the generic helper still shows `재우기 2s 후 다시 가능`.

- [x] **Step 3: Implement minimal code**

In `components/PetActions.vue`, let `actionAvailabilityText` return an empty string when:

- the recommendation card is visible;
- `nextCoolingAction.id` equals `recommendedCareAction.action`.

Keep generic availability visible for non-recommended cooldowns.

- [x] **Step 4: Run focused tests**

Run:

```bash
npm run test -- tests/pet-action-availability.test.ts tests/pet-recommendation-evidence.test.ts
```

Expected: all focused tests pass.

- [x] **Step 5: Add summary doc**

Create `docs/superpowers/summaries/2026-05-07-recommendation-availability-dedupe.md` with:

```md
# 2026-05-07 Recommendation Availability Dedupe

## 개선 방향

- 추천 카드가 이미 추천 행동의 대기 시간을 안내할 때 일반 쿨다운 안내가 같은 내용을 반복하지 않도록 정리했습니다.

## 변경 사항

- 추천 카드가 보이는 상태에서 다음 쿨다운 액션이 추천 행동과 같으면 `actionAvailabilityText`를 숨겼습니다.
- 다른 액션의 쿨다운 안내는 기존처럼 유지했습니다.

## 검증

- 확인 필요: `npm run test`
- 확인 필요: `npm run lint`
- 확인 필요: `npm run build`

## 다음 개선 후보

- 추천 카드와 action grid의 상태 정보 밀도가 높아진 만큼 모바일 실제 화면에서 칩 줄바꿈과 버튼 영역 간 간격을 시각 검증합니다.
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
git add components/PetActions.vue tests/pet-action-availability.test.ts docs/superpowers/plans/2026-05-07-recommendation-availability-dedupe.md docs/superpowers/summaries/2026-05-07-recommendation-availability-dedupe.md
git commit -m "fix(pet): avoid duplicate recommendation cooldown helper"
```
