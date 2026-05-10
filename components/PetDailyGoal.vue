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
