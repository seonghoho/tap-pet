<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { PetAction, PetActionLimitInfo } from '~/types/pet'

const props = defineProps<{
  cooldowns: Record<PetAction, number>
  activeReaction: PetAction | null
  actionLimitInfo: PetActionLimitInfo
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
  </div>
</template>
