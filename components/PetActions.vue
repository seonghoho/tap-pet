<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { PetAction, PetActionLimitInfo, PetCareFeedback } from '~/types/pet'

const props = defineProps<{
  cooldowns: Record<PetAction, number>
  activeReaction: PetAction | null
  actionLimitInfo: PetActionLimitInfo
  careFeedback: PetCareFeedback | null
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

    <div class="action-panel">
      <button
        v-for="action in actions"
        :key="action.id"
        class="action-button"
        type="button"
        :disabled="isActionDisabled(action.id)"
        @click="emit('action', action.id)"
      >
        <span>{{ messages.actions[action.id].label }}</span>
        <small>{{ messages.actions[action.id].detail }}</small>
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
