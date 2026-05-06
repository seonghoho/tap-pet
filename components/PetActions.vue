<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type {
  PetAction,
  PetActionLimitInfo,
  PetActionLimitRewardFeedback,
  PetCareFeedback,
  PetCareRecommendation,
} from '~/types/pet'

const props = defineProps<{
  cooldowns: Record<PetAction, number>
  activeReaction: PetAction | null
  actionLimitInfo: PetActionLimitInfo
  careFeedback: PetCareFeedback | null
  actionLimitRewardFeedback: PetActionLimitRewardFeedback | null
  recommendedCareAction: PetCareRecommendation | null
}>()

const emit = defineEmits<{
  action: [action: PetAction]
  rewardAd: []
}>()
const { messages } = useLocale()
const now = ref(Date.now())

let cooldownTimer: number | null = null

const actions: Array<{
  id: PetAction
}> = [
  {
    id: 'feed',
  },
  {
    id: 'play',
  },
  {
    id: 'sleep',
  },
  {
    id: 'wash',
  },
]

const isLimitReached = computed(() => props.actionLimitInfo.remaining <= 0)
const feedbackStatRows = computed(() => {
  const feedback = props.careFeedback
  if (!feedback) return []

  return (['fullness', 'energy', 'cleanliness'] as const)
    .map((key) => ({
      key,
      label: messages.value.stats[key],
      value: feedback.statChanges[key],
    }))
    .filter((stat) => stat.value !== 0)
})
const careFeedbackTitle = computed(() => {
  const feedback = props.careFeedback
  if (!feedback) return ''

  return messages.value.careFeedback.title.replace(
    '{action}',
    messages.value.actions[feedback.action].label,
  )
})
const recommendationTitle = computed(() => {
  const recommendation = props.recommendedCareAction
  if (!recommendation) return ''

  return messages.value.careRecommendation.title.replace(
    '{action}',
    messages.value.actions[recommendation.action].label,
  )
})
const recommendationDetail = computed(() => {
  const recommendation = props.recommendedCareAction
  if (!recommendation) return ''

  return messages.value.careRecommendation.details[recommendation.action]
})
const actionLimitText = computed(() => {
  const limitMessages = messages.value.actionLimit

  if (isLimitReached.value) {
    return limitMessages.locked.replace(
      '{time}',
      formatRemainingTime(props.actionLimitInfo.resetAt - now.value),
    )
  }

  return limitMessages.remaining
    .replace('{remaining}', String(props.actionLimitInfo.remaining))
    .replace('{limit}', String(props.actionLimitInfo.limit))
})
const actionLimitRewardText = computed(() => {
  const feedback = props.actionLimitRewardFeedback
  if (!feedback) return ''

  return messages.value.actionLimit.rewardGranted.replace('{count}', String(feedback.addedUses))
})

onMounted(() => {
  now.value = Date.now()
  cooldownTimer = window.setInterval(() => {
    now.value = Date.now()
  }, 250)
})

onBeforeUnmount(() => {
  if (!cooldownTimer) return

  window.clearInterval(cooldownTimer)
  cooldownTimer = null
})

function isActionDisabled(action: PetAction): boolean {
  return isLimitReached.value || props.cooldowns[action] > now.value || props.activeReaction === action
}

function isRecommendedAction(action: PetAction): boolean {
  return !isLimitReached.value && props.recommendedCareAction?.action === action
}

function getActionDetail(action: PetAction): string {
  if (props.activeReaction === action) return messages.value.actionState.inProgress
  if (isLimitReached.value) return messages.value.actionState.limitReached

  const remainingCooldown = props.cooldowns[action] - now.value
  if (remainingCooldown > 0) {
    return messages.value.actionState.cooldown.replace(
      '{time}',
      formatRemainingTime(remainingCooldown),
    )
  }

  return messages.value.actions[action].detail
}

function getActionAriaLabel(action: PetAction): string {
  return messages.value.actionState.ariaLabel
    .replace('{action}', messages.value.actions[action].label)
    .replace('{state}', getActionDetail(action))
}

function formatRemainingTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes <= 0) return `${seconds}s`

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

function formatSigned(value: number): string {
  if (value > 0) return `+${value}`

  return String(value)
}
</script>

<template>
  <div class="action-section">
    <div class="action-limit" :class="{ 'action-limit--locked': isLimitReached }">
      <span>{{ actionLimitText }}</span>
      <button
        v-if="isLimitReached"
        class="small-button"
        type="button"
        @click="emit('rewardAd')"
      >
        {{ messages.actionLimit.rewardAd }}
      </button>
    </div>

    <div v-if="actionLimitRewardFeedback" class="action-limit-reward" role="status">
      {{ actionLimitRewardText }}
    </div>

    <div
      v-if="recommendedCareAction && !isLimitReached"
      class="action-recommendation"
      aria-live="polite"
    >
      <div>
        <span>{{ messages.careRecommendation.heading }}</span>
        <strong>{{ recommendationTitle }}</strong>
      </div>
      <small>{{ recommendationDetail }}</small>
    </div>

    <div class="action-panel">
      <button
        v-for="action in actions"
        :key="action.id"
        class="action-button"
        :class="{ 'action-button--recommended': isRecommendedAction(action.id) }"
        type="button"
        :disabled="isActionDisabled(action.id)"
        :aria-label="getActionAriaLabel(action.id)"
        @click="emit('action', action.id)"
      >
        <span class="action-button__label">
          <span>{{ messages.actions[action.id].label }}</span>
          <em v-if="isRecommendedAction(action.id)" class="action-button__badge">
            {{ messages.careRecommendation.badge }}
          </em>
        </span>
        <small>{{ getActionDetail(action.id) }}</small>
      </button>
    </div>

    <div v-if="careFeedback" class="care-feedback" aria-live="polite">
      <div class="care-feedback__header">
        <span>{{ careFeedbackTitle }}</span>
        <strong>+{{ careFeedback.gainedExp }} {{ messages.stats.exp }}</strong>
      </div>

      <div class="care-feedback__chips" :aria-label="messages.careFeedback.ariaLabel">
        <span
          v-for="stat in feedbackStatRows"
          :key="stat.key"
          class="care-feedback__chip"
          :class="{ 'care-feedback__chip--negative': stat.value < 0 }"
        >
          {{ stat.label }} {{ formatSigned(stat.value) }}
        </span>
        <span v-if="careFeedback.gainedAffinityExp > 0" class="care-feedback__chip">
          {{ messages.stats.affinity }} +{{ careFeedback.gainedAffinityExp }}
        </span>
        <span v-if="careFeedback.didLevelUp" class="care-feedback__chip care-feedback__chip--strong">
          {{ messages.careFeedback.levelUp }}
        </span>
        <span
          v-if="careFeedback.didAffinityLevelUp"
          class="care-feedback__chip care-feedback__chip--strong"
        >
          {{ messages.careFeedback.affinityUp }}
        </span>
      </div>

      <p v-if="careFeedback.wasReduced" class="care-feedback__note">
        {{ messages.careFeedback.reduced }}
      </p>
    </div>
  </div>
</template>
