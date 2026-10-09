<script setup lang="ts">
import { computed } from 'vue'
import {
  DAILY_GOAL_REWARD_AFFINITY_EXP,
  DAILY_GOAL_REWARD_EXP,
} from '~/constants/pet'
import type { PetDailyGoalRewardFeedback, PetDailyGoalState } from '~/types/pet'

const props = defineProps<{
  dailyGoal: PetDailyGoalState
  rewardFeedback: PetDailyGoalRewardFeedback | null
  streak?: { current: number, best: number, caredToday: boolean } | null
}>()

const emit = defineEmits<{
  claim: []
}>()

const { messages } = useLocale()

const isComplete = computed(() => props.dailyGoal.completedAt !== null)
const isClaimed = computed(() => props.dailyGoal.claimedAt !== null)
const progressText = computed(() =>
  messages.value.dailyGoal.progress
    .replace('{current}', String(props.dailyGoal.progress))
    .replace('{required}', '1'),
)
const rewardText = computed(() =>
  messages.value.dailyGoal.rewards
    .replace('{exp}', String(DAILY_GOAL_REWARD_EXP))
    .replace('{affinity}', String(DAILY_GOAL_REWARD_AFFINITY_EXP)),
)
const streakTitle = computed(() => {
  const streak = props.streak
  if (!streak || streak.current === 0) return messages.value.streak.start
  if (!streak.caredToday) {
    return messages.value.streak.keepGoing.replace('{next}', String(streak.current + 1))
  }

  return messages.value.streak.days.replace('{days}', String(streak.current))
})
const streakBestText = computed(() => {
  const best = props.streak?.best ?? 0

  return best > 1 ? messages.value.streak.best.replace('{best}', String(best)) : ''
})
const rewardFeedbackText = computed(() => {
  const feedback = props.rewardFeedback
  if (!feedback) return ''

  return messages.value.dailyGoal.rewardFeedback
    .replace('{exp}', String(feedback.gainedExp))
    .replace('{affinity}', String(feedback.gainedAffinityExp))
})
</script>

<template>
  <section class="daily-goal" aria-labelledby="daily-goal-title">
    <div
      v-if="streak"
      class="daily-goal__streak"
      :class="{ 'daily-goal__streak--lit': streak.caredToday && streak.current > 0 }"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2.2-4.6.2 1.6 1 2.6 2 3C11 9 11 6 12 3Z"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
      </svg>
      <strong>{{ streakTitle }}</strong>
      <small v-if="streakBestText">{{ streakBestText }}</small>
    </div>

    <div class="daily-goal__copy">
      <span>{{ messages.dailyGoal.heading }}</span>
      <strong id="daily-goal-title" class="daily-goal__title">
        {{ messages.dailyGoal.title }}
      </strong>
      <small>{{ messages.dailyGoal.description }}</small>
    </div>

    <div class="daily-goal__meta">
      <span>{{ isComplete ? messages.dailyGoal.completed : progressText }}</span>
      <strong>{{ rewardText }}</strong>
    </div>

    <button
      v-if="isComplete && !isClaimed"
      class="daily-goal__claim"
      type="button"
      @click="emit('claim')"
    >
      {{ messages.dailyGoal.claim }}
    </button>
    <span v-else-if="isClaimed" class="daily-goal__claimed">
      {{ messages.dailyGoal.claimed }}
    </span>

    <p v-if="rewardFeedbackText" class="daily-goal__feedback" role="status">
      {{ rewardFeedbackText }}
    </p>
  </section>
</template>
