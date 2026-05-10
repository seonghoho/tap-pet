# Tab Pet Retention Growth Design

Date: 2026-05-10

## 1. Summary

Tab Pet should grow from a care-action MVP into a quiet daily companion that users want to reopen tomorrow. The core identity remains unchanged: the browser tab title and favicon are the primary play surface, while the page body is the control panel.

The next product direction is a phased retention layer:

1. Return report
2. Daily goal
3. Visible level rewards
4. Personality and preference
5. Room decoration and collection
6. Seasonal events

This order is intentional. It first improves the moment of return, then gives each day a small purpose, then gives growth a visible payoff, and only then expands into long-term personalization and live-operation content.

## 2. Current Baseline

The current app already supports:

- Single local pet state stored in `localStorage`
- Species selection: cat, dog, hedgehog
- Stats: fullness, energy, cleanliness
- Status calculation: happy, hungry, sleepy, dirty, bored, excited
- Care actions: feed, play, sleep, wash
- Action cooldowns and a 30-minute action limit window
- Rewarded-ad action recharge mock
- Level EXP and affinity EXP
- Recommended care action and reward preview
- Care feedback card
- Browser title and favicon presentation
- Disguise title and tab visibility settings
- Pet habitat motion and action reactions

The main gap is not the absence of more actions. The main gap is that return, daily purpose, and visible long-term progress are still thin.

## 3. Design Goals

- Make the user feel the pet continued living while they were away.
- Give each day one clear, short goal.
- Make level and affinity growth visible through unlocks, not only numbers.
- Let pets develop identity through personality and preferences.
- Add collection depth without turning the app into a heavy inventory game.
- Preserve the low-pressure, work-safe tab companion concept.

## 4. Non-Goals

The next retention layer does not require:

- Login
- Server sync
- Social features
- Push notifications
- Actual payment
- Actual ad SDK integration
- Multi-pet ownership
- Real-time multiplayer or competitive systems

These can be revisited after local retention is validated.

## 5. Product Positioning

Tab Pet is not a clicker, idle RPG, or full-screen virtual pet game. It is a hidden companion for people who keep browser tabs open while working or studying.

The target loop is:

1. User leaves the tab open or returns later.
2. Title or favicon shows a small status signal.
3. User opens the page for a short check-in.
4. User completes one recommended care action or daily goal.
5. The pet reacts, growth moves, and a small next reason appears.
6. User goes back to work.

The ideal session length is 10 seconds to 2 minutes. Longer sessions should be possible through decoration and collection, but the core loop must stay light.

## 6. Approach Options

### Option A: Phased Retention Layer

Build return report, daily goal, level rewards, personality, decoration, and seasonal events in sequence on top of the existing local single-pet model.

Pros:

- Lowest technical risk
- Works with current `localStorage` model
- Improves day-1 and day-2 retention first
- Keeps scope aligned with the tab-first concept

Cons:

- Collection and live-operation depth arrive later
- Monetization remains mostly mock-level in the near term

### Option B: Decoration-First Expansion

Prioritize room items, item inventory, unlock tables, and visual customization before return reports and daily goals.

Pros:

- Stronger visual payoff early
- Easier to show in screenshots and demos

Cons:

- Adds UI weight before the return loop is proven
- Risks making the body page more important than the browser tab
- Requires more asset and state-management work up front

### Option C: Server and Live-Ops First

Introduce login, server persistence, cloud saves, real event scheduling, and live configuration before local retention features.

Pros:

- Better foundation for long-term operations
- Easier to run real account-based events later

Cons:

- Too heavy before proving retention mechanics
- Adds privacy, auth, infra, and operational overhead
- Delays improvements users can feel immediately

Recommended approach: Option A.

## 7. Phase 1: Return Report

### Purpose

Return report turns offline decay from a silent number change into an emotional check-in. The user should feel that the pet waited, rested, wandered, or needed care while they were away.

### User Experience

When a saved pet is restored after a meaningful absence, show a one-time return card near the care section or status panel.

The card should include:

- Short headline
- One-sentence story
- Primary need or stable outcome
- Recommended next care action when relevant

Example messages:

- "몽이가 2시간 동안 조용히 기다렸어요."
- "초코가 조금 지쳐 보여요. 잠깐 쉬게 해주세요."
- "밤이가 탭 구석에서 꾸벅꾸벅 졸고 있었어요."
- "다시 와줘서 기분이 좋아졌어요."

### Trigger Rules

Return report should appear when:

- A pet is restored from storage.
- Elapsed time since `lastUpdatedAt` is at least 30 minutes.
- The report has not already been shown for that restore event.

No report should appear when:

- This is the first pet creation.
- The elapsed time is too short.
- Storage load fails and the app returns to setup.

### Message Inputs

Return report text should be generated from deterministic inputs:

- Elapsed time bucket
- Current pet status
- Lowest stat
- Species
- Pet name
- Affinity level, when available

Initial elapsed buckets:

- 30 minutes to 2 hours
- 2 hours to 8 hours
- 8 hours to 24 hours
- More than 24 hours, capped by existing offline decay behavior

### Data Model

Do not store a full report history in phase 1. The report can be computed during restore and held in UI state.

Suggested type:

```ts
export type PetReturnReport = {
  id: string
  elapsedMs: number
  status: PetStatus
  primaryStat: keyof PetStats
  title: string
  detail: string
  recommendedAction?: PetAction
  createdAt: number
}
```

### Acceptance Criteria

- Return report appears once after restore when absence is at least 30 minutes.
- Report copy changes by status and elapsed bucket.
- Recommended care matches the existing recommendation system.
- Report does not block the main care actions.
- Report is deterministic and testable without browser APIs.

## 8. Phase 2: Daily Goal

### Purpose

Daily goal gives the user one reason to check in each day. It should be short, low pressure, and aligned with existing care behavior.

### Goal Types

Initial daily goal pool:

- Complete one recommended care action.
- Bring all stats to at least 60.
- Play once.
- Resolve one active tab signal.
- Keep the tab active for a lightweight time threshold, such as 30 minutes.

The first implementation should start with one or two goal types to keep the system understandable.

Recommended MVP goal:

- "Complete one recommended care action today."

This uses existing recommendation and care feedback systems and avoids adding a passive timer in the first pass.

### Reward

Initial rewards:

- Small level EXP
- Small affinity EXP
- One decoration shard, once decoration exists
- Daily completion stamp

Before decoration is implemented, the reward should be EXP and affinity only.

### Reset Rules

Daily goal should reset by local calendar day in the user's browser timezone.

Suggested stored state:

```ts
export type PetDailyGoalState = {
  dateKey: string
  goalId: PetDailyGoalId
  progress: number
  completedAt: number | null
  claimedAt: number | null
}
```

`dateKey` should use local `YYYY-MM-DD`.

### UX Rules

- Show the daily goal in the side panel status area.
- Keep one primary action, not a full quest list.
- After completion, show claim feedback and next reset hint.
- Do not punish missed days in the first version.

### Acceptance Criteria

- A daily goal is created for the current local day.
- Completing the recommended care action advances and completes the goal.
- Reward can be claimed once.
- Reload preserves daily goal progress.
- A new local day creates a new goal without corrupting pet state.

## 9. Phase 3: Visible Level Rewards

### Purpose

Current level and affinity growth are useful but abstract. Growth should unlock visible changes that reinforce attachment.

### Reward Categories

Initial unlock categories:

- Favicon expression variant
- Habitat prop
- Disguise title preset
- Title signal style
- Action reaction variant
- Pet skin or palette

### Suggested Reward Table

| Requirement | Reward |
| --- | --- |
| Level 2 | New favicon expression |
| Level 3 | First habitat prop |
| Level 5 | New disguise title preset |
| Level 7 | Enhanced action reaction |
| Level 10 | Species-specific skin |
| Affinity 2 | Warmer return report copy |
| Affinity 3 | Expanded pet-specific messages |
| Affinity 5 | Special title signal style |

### Unlock Model

Unlocks should be computed from current growth where possible. User selection should be stored separately.

Suggested types:

```ts
export type PetUnlockId =
  | 'favicon-expression-1'
  | 'habitat-prop-cushion-1'
  | 'title-preset-focus-1'
  | 'signal-style-soft-1'

export type PetCosmeticSelection = {
  habitatPropIds: string[]
  faviconExpressionId: string
  titleSignalStyleId: string
}
```

### UX Rules

- Level-up feedback should name the unlocked item.
- Locked items may be visible as silhouettes or disabled rows, but the UI should stay compact.
- The first visible unlock should arrive early, preferably Level 2 or Level 3.

### Acceptance Criteria

- Reaching a level unlocks the expected reward.
- Unlock availability can be tested as a pure function.
- Selected cosmetic survives reload.
- Locked cosmetic cannot be selected.
- Level-up feedback mentions newly available content.

## 10. Phase 4: Personality and Preference

### Purpose

Personality gives the pet identity beyond species. Preferences make repeated care actions feel more personal.

### Initial Personalities

| Personality | Gameplay Trait | Copy Trait |
| --- | --- | --- |
| Calm | Slightly slower decay | Quiet, steady messages |
| Playful | Higher play affinity, boredom sooner | Energetic messages |
| Neat | Wash gives bonus affinity, dirty state is more sensitive | Clean, precise messages |
| Sleepy | Sleep gives bonus EXP, energy drops slightly faster | Soft, drowsy messages |
| Hungry | Feed gives bonus affinity, fullness is more sensitive | Food-focused messages |

### Assignment

Recommended assignment: derive personality from early behavior.

Example:

- Track the first three completed care actions.
- If one action dominates, assign the matching personality.
- If actions are mixed, assign Calm.

This makes personality feel connected to the user's behavior.

### Data Model

Suggested stored fields:

```ts
export type PetPersonality =
  | 'calm'
  | 'playful'
  | 'neat'
  | 'sleepy'
  | 'hungry'

export type PetPersonalityState = {
  personality: PetPersonality | null
  earlyActionCounts: Record<PetAction, number>
  assignedAt: number | null
}
```

### Gameplay Rules

Personality modifiers must stay small. They should add flavor, not force optimal play.

Initial modifier bounds:

- EXP or affinity bonus: 10% to 15%
- Decay modifier: 5% to 10%
- Threshold sensitivity: small constant adjustment only

### Acceptance Criteria

- Personality is assigned after the early-care window.
- Personality persists after reload.
- Personality affects copy and one small gameplay modifier.
- Existing care recommendation still works without personality.
- No personality can create runaway rewards or severe penalties.

## 11. Phase 5: Room Decoration and Collection

### Purpose

Decoration gives long-term progression a visible destination while keeping the page body secondary to the tab-first concept.

### Initial Collection Categories

- Bowl
- Cushion
- Toy
- Window background
- Floor pattern
- Small desk prop
- Favicon palette
- Title signal style

### Currency

Use a single soft collection currency at first:

```ts
export type PetInventory = {
  shards: number
  ownedItemIds: string[]
}
```

Sources:

- Daily goal completion
- Level reward
- Return report bonus, rarely
- Future rewarded-ad mock, only as optional acceleration

### Scope for First Decoration Release

Start with:

- Three habitat props
- One selected prop slot
- Shard earning from daily goal
- No shop refresh
- No gacha
- No paid purchase

### UX Rules

- Decoration should live in the side panel, not replace the care loop.
- The habitat should show selected props immediately.
- Avoid a large grid until there are enough items to justify it.

### Acceptance Criteria

- User can earn shards.
- User can unlock one decoration item.
- User can select an owned item.
- Selected item appears in the habitat.
- Locked and owned states are clear.

## 12. Phase 6: Seasonal Events

### Purpose

Seasonal events create freshness after the core retention loop is validated.

### Event Types

Tab Pet events should connect to work or daily rhythms:

- Monday focus event
- Friday wind-down event
- Rainy-day theme
- Winter tab skin
- Exam or study focus event
- Year-end desk decoration

### Event Rules

First seasonal implementation should be local and date-driven, not server-driven.

Example:

- On Fridays, completing the daily goal gives a limited title signal.
- During a date range, one seasonal prop is available.

### Acceptance Criteria

- Event content can be enabled by local date range.
- Event reward does not break normal progression.
- Event copy stays subtle and work-safe.
- Event can be disabled without data loss.

## 13. Technical Architecture

The retention layer should follow existing patterns:

- Store durable pet state in `types/pet.ts`.
- Put numeric constants in `constants/pet.ts`.
- Put copy in `constants/i18n.ts`.
- Keep calculations in `utils/`.
- Keep browser and lifecycle behavior in composables.
- Render compact surfaces in components.

Suggested new modules over time:

```txt
utils/petReturnReport.ts
utils/petDailyGoal.ts
utils/petUnlocks.ts
utils/petPersonality.ts
utils/petInventory.ts
utils/petSeason.ts

components/PetReturnReport.vue
components/PetDailyGoal.vue
components/PetUnlockToast.vue
components/PetDecorationsPanel.vue
```

The first implementation should avoid a large shared "retention engine." Each system should be a small pure module with a clear input and output.

## 14. Storage Versioning

Adding daily goals, personality, unlock selections, and inventory will require storage migration.

Recommended rule:

- Phase 1 return report can avoid a storage version bump if it is computed only during restore.
- Phase 2 daily goal requires a storage version bump.
- Phase 3 unlock selections require a storage version bump.
- Phase 4 personality requires a storage version bump.
- Phase 5 inventory requires a storage version bump.

Migration should preserve existing pets and fill new fields with safe defaults.

## 15. Copy Guidelines

Tone should be:

- Calm
- Observational
- Affectionate but not needy
- Work-safe
- Short enough for compact UI

Avoid:

- Guilt-heavy copy
- Punishment language
- Loud game terminology
- Long tutorial text
- Pushy ad or monetization copy

Good copy pattern:

- What happened
- How the pet feels
- What to do next

Example:

"몽이가 한참 쉬고 있었어요. 에너지가 낮으니 잠깐 재워주세요."

## 16. Metrics

Because the app currently has no backend, early validation can be manual or local instrumentation only. When analytics are added, useful metrics are:

- First care completion rate
- Return report seen rate
- Return report to action conversion
- Daily goal completion rate
- Day-2 return rate
- Day-7 return rate
- Level 2 reach rate
- Decoration unlock rate
- Rewarded-action recharge click rate

Product success should focus on return behavior, not long session length.

## 17. Implementation Roadmap

### Release 1: Return and Daily Purpose

Ship:

- Return report
- One daily goal: complete recommended care
- EXP and affinity daily reward
- Compact UI placement
- Unit tests for report and daily goal logic

Goal:

- Improve day-2 return motivation without adding heavy systems.

### Release 2: Visible Growth

Ship:

- Level reward table
- Early favicon or habitat unlock
- Level-up unlock feedback
- Cosmetic availability pure function

Goal:

- Make growth feel tangible.

### Release 3: Personality

Ship:

- Early-action personality assignment
- Personality-specific copy
- One small modifier per personality

Goal:

- Make pets feel individually shaped by the user.

### Release 4: Decoration

Ship:

- Shards
- Three habitat props
- Owned/locked/selected item states
- Decoration side-panel surface

Goal:

- Create a long-term collection sink.

### Release 5: Seasonal Layer

Ship:

- Local date-driven event config
- One seasonal prop or title signal
- Event completion copy

Goal:

- Add freshness after the retention loop is proven.

## 18. Testing Strategy

Unit tests:

- Return report bucket selection
- Return report recommendation selection
- Daily goal creation and reset
- Daily goal completion and reward claim
- Unlock availability by level and affinity
- Personality assignment from early actions
- Inventory ownership and selection validation
- Seasonal event active/inactive date checks

Component tests:

- Return report renders once after restore.
- Daily goal shows progress, completed, and claimed states.
- Level-up feedback shows unlock names.
- Decoration panel prevents selecting locked items.

E2E tests:

- Returning after manipulated storage timestamp shows report.
- Completing recommended care completes daily goal.
- Reload preserves daily goal state.
- Leveling up exposes a new visible reward.

## 19. Risks and Mitigations

Risk: The app becomes too much like a generic pet game.

Mitigation: Keep title and favicon as the primary product surface. Body UI should remain a compact control panel.

Risk: Too many systems arrive before any retention signal is validated.

Mitigation: Ship in the proposed order and validate return report plus daily goal first.

Risk: Daily goals create pressure or guilt.

Mitigation: No streak punishment in the first version. Missed days should simply reset.

Risk: Personality modifiers create optimal-play pressure.

Mitigation: Keep modifiers small and mostly expressive.

Risk: Decoration UI becomes heavy.

Mitigation: Start with one prop slot and three items.

## 20. Open Product Decisions

These decisions can wait until implementation planning:

- Exact return report UI placement: status panel vs care section
- Whether daily reward is auto-claimed or manually claimed
- First visible level reward: favicon expression vs habitat prop
- Whether personality is revealed immediately or after three care actions
- First decoration category: cushion, toy, or bowl

Recommended defaults:

- Place return report above care actions.
- Use manual daily reward claim for clearer reward feedback.
- Make Level 2 unlock a favicon expression.
- Reveal personality after three care actions.
- Start decoration with a cushion prop.
