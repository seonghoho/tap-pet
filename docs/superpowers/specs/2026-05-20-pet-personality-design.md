# Tab Pet Personality Design

Date: 2026-05-20

## 1. Summary

Release 3 adds a small personality layer to Tab Pet. The pet receives a personality after the first three completed care actions. The assignment is derived from early user behavior, then shown as a lightweight identity signal in the care feedback card and side panel.

The goal is to make the pet feel shaped by the user without turning care actions into an optimization game.

## 2. Product Decision

Use a behavior-derived personality system.

- Track the first three completed care actions.
- Assign a personality when the third early action completes.
- If one action clearly dominates, map that action to a matching personality.
- If all three actions are mixed or tied, assign the fallback calm personality.
- Show a one-time personality reveal in the care feedback card.
- Show the current personality in the side panel after assignment.
- Apply only a small reward modifier to the personality-matching action.

This keeps the feature fast to understand, local-only, and consistent with the existing short-session product loop.

## 3. Scope

Included:

- Stored personality state
- Storage migration for existing pets
- Early action counting for completed care actions
- Personality assignment after three completed care actions
- Five personalities: calm, hungry, playful, sleepy, neat
- Localized personality names and descriptions
- One-time personality reveal feedback
- Side-panel personality summary
- Small matching-action reward bonus
- Unit, model, storage, and UI tests

Excluded:

- Manual personality selection
- Personality reroll or reset separate from pet reset
- Personality-specific habitat art
- Personality-specific title or favicon changes
- Decoration, shards, inventory, seasonal events
- Server sync, login, payments, real ad SDK changes

## 4. Personality Mapping

The first release uses four action-derived personalities plus a calm fallback.

| Early behavior | Personality id | User-facing concept | Matching action |
| --- | --- | --- | --- |
| Feed dominates | `hungry` | Warm and food-focused | `feed` |
| Play dominates | `playful` | Energetic and curious | `play` |
| Sleep dominates | `sleepy` | Soft and relaxed | `sleep` |
| Wash dominates | `neat` | Clean and precise | `wash` |
| Mixed or tied | `calm` | Steady and balanced | none |

Dominates means one action count is strictly greater than every other action count after the first three completed care actions.

Examples:

- `feed, feed, play` assigns `hungry`.
- `play, wash, play` assigns `playful`.
- `feed, play, wash` assigns `calm`.
- `sleep, wash, feed` assigns `calm`.

## 5. Reward Modifier

The modifier must be small enough that personality feels expressive, not mandatory.

Initial rule:

- `hungry`: `feed` grants a 10% affinity EXP bonus.
- `playful`: `play` grants a 10% affinity EXP bonus.
- `sleepy`: `sleep` grants a 10% level EXP bonus.
- `neat`: `wash` grants a 10% affinity EXP bonus.
- `calm`: no numeric reward bonus in the first release.

The bonus should be rounded predictably with the existing reward calculation style. It should apply once per completed care action and should not stack with itself.

If the base reward is reduced by action-limit or cooldown rules, the personality bonus should be calculated from the final eligible reward amount, not from the unreduced baseline. This keeps the modifier from bypassing existing limits.

## 6. UX

### Assignment Moment

When personality is assigned, the current care feedback card shows a compact reveal block:

- Label: personality reveal
- Personality name
- One short sentence explaining why the personality appeared
- Bonus condition summary

The reveal should sit near the existing reward and unlock feedback, not above the main result. The user should understand it as a new identity detail, not a blocking modal.

### Persistent Display

After assignment, the side panel shows a compact personality section:

- Personality name
- Short description
- Matching action and bonus summary

Before assignment, the side panel can show a small "forming personality" state with progress such as `1/3` or `2/3`. This state should not create pressure; it should read as discovery.

### Copy Tone

Copy should stay quiet and work-safe.

- Hungry: warm, food-focused, not desperate
- Playful: lively, not noisy
- Sleepy: soft, relaxed, not lazy
- Neat: tidy, precise, not judgmental
- Calm: steady, balanced, not bland

## 7. Data Model

Add personality state to `PetState`.

```ts
export type PetPersonality = 'calm' | 'hungry' | 'playful' | 'sleepy' | 'neat'

export type PetPersonalityState = {
  personality: PetPersonality | null
  earlyActionCounts: Record<PetAction, number>
  assignedAt: number | null
}
```

`personality` is `null` until the third completed early care action.

`earlyActionCounts` tracks completed care actions only. Failed, blocked, or unavailable actions do not count.

`assignedAt` stores the timestamp when the personality is first assigned.

## 8. Storage Migration

This release requires a storage version bump.

Existing pets should migrate to:

```ts
personality: {
  personality: null,
  earlyActionCounts: {
    feed: 0,
    play: 0,
    sleep: 0,
    wash: 0,
  },
  assignedAt: null,
}
```

Migration must preserve all existing pet stats, settings, growth, affinity, daily goal, cooldown, and action limit data.

Invalid personality data should normalize back to the default unassigned state rather than resetting the whole pet.

## 9. Architecture

### `utils/petPersonality.ts`

Owns the pure personality rules:

- Create default personality state.
- Normalize stored personality state.
- Record a completed early care action.
- Assign a personality after the first three completed actions.
- Calculate matching-action reward bonuses.
- Return localized copy keys or stable personality ids for UI consumers.

The module should not know about Vue, localStorage, or components.

### `utils/petValidation.ts`

Validates and migrates personality state when loading localStorage data.

### `utils/petFactory.ts`

Creates default personality state for new pets.

### `composables/usePetStore.ts`

On successful care action:

1. Capture the previous pet state.
2. Calculate the normal eligible care result after existing cooldown, limit, and reduction rules.
3. Update personality early action counts if personality is still unassigned.
4. Assign personality if the third completed action was reached.
5. Calculate the personality bonus from the eligible care result.
6. Apply the base care result and any personality bonus to pet growth and affinity.
7. Include personality reveal and bonus data in care feedback.
8. Persist the updated pet state.

### `components/PetActions.vue`

Renders one-time personality reveal and bonus feedback inside the existing care feedback card.

### `components/PetSidePanel.vue`

Renders persistent personality status in the side-panel status mode, directly after the daily goal and before the level unlock summary.

## 10. Care Feedback Shape

Extend care feedback with optional personality data.

```ts
type PetCareFeedback = {
  // existing fields
  personalityReveal?: {
    personality: PetPersonality
    reasonActionCounts: Record<PetAction, number>
  }
  personalityBonus?: {
    personality: PetPersonality
    action: PetAction
    expBonus: number
    affinityBonus: number
  }
}
```

Only include `personalityReveal` on the action that assigns personality.

Only include `personalityBonus` when a numeric bonus greater than zero was applied.

## 11. Error Handling

- If localStorage contains invalid personality fields, normalize only the personality slice.
- If a care action is blocked by cooldown or action limit, do not increment early action counts.
- If personality is already assigned, do not modify early action counts.
- If reward bonus calculation receives an unsupported personality id, return no bonus.
- If localized copy is missing during development, tests should fail through i18n coverage.

## 12. Testing Strategy

Unit tests:

- Default personality state creation.
- Early action count updates only for completed actions.
- Dominant action maps to the expected personality.
- Mixed first three actions assign `calm`.
- Already assigned personality does not change.
- Matching-action bonus applies only to the matching action.
- Bonus is calculated from final eligible reward amounts.

Storage and model tests:

- Older stored pets migrate with default personality state.
- Invalid personality data normalizes safely.
- New pets include personality state.
- Care actions persist updated personality state.
- Personality reveal appears exactly once.
- Personality bonus does not stack or bypass existing reward reduction.

UI tests:

- Side panel renders unassigned progress before assignment.
- Side panel renders personality name, description, and bonus summary after assignment.
- Care feedback renders personality reveal on assignment.
- Care feedback renders personality bonus only when applied.
- `en`, `ko`, and `ja` personality copy keys are complete.

Verification commands:

- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run test:e2e` if UI flow changes need browser coverage

## 13. Acceptance Criteria

- A new pet receives a personality after the third completed care action.
- Dominant early behavior assigns the matching personality.
- Mixed early behavior assigns calm.
- Personality persists after reload.
- Existing stored pets migrate without data loss.
- The care feedback card explains a newly assigned personality once.
- The side panel shows current personality status.
- Matching-action reward bonus is small, visible, and bounded.
- Existing recommendation, daily goal, level unlock, action limit, title, and favicon behavior continue to work.

## 14. Risks

Risk: Users may feel punished for not getting the personality they wanted.

Mitigation: Keep copy positive for every personality and avoid strong gameplay advantages.

Risk: Reward bonuses may speed up progression too much.

Mitigation: Start at 10%, apply after existing reductions, and avoid calm numeric bonuses in the first release.

Risk: Storage migration could regress returning users.

Mitigation: Test migration from existing stored versions and normalize only the personality slice on invalid data.

Risk: The side panel becomes crowded.

Mitigation: Keep personality presentation compact and place it near growth information rather than the main care buttons.

## 15. Implementation Order

1. Add failing pure personality tests.
2. Add personality types, constants, and pure utility functions.
3. Add storage migration and default state creation.
4. Wire care action updates and feedback data in the store.
5. Add side-panel personality UI.
6. Add care-feedback reveal and bonus UI.
7. Add localized copy.
8. Run full verification.
