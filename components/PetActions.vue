<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { PetAction } from '~/types/pet'

const props = defineProps<{
  cooldowns: Record<PetAction, number>
  activeReaction: PetAction | null
}>()

const emit = defineEmits<{
  action: [action: PetAction]
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
  return props.cooldowns[action] > now.value || props.activeReaction === action
}
</script>

<template>
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
</template>
