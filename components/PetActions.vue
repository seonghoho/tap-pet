<script setup lang="ts">
import type { PetAction } from '~/types/pet'

const emit = defineEmits<{
  action: [action: PetAction]
}>()
const { messages } = useLocale()

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
]
</script>

<template>
  <div class="action-panel">
    <button
      v-for="action in actions"
      :key="action.id"
      class="action-button"
      type="button"
      @click="emit('action', action.id)"
    >
      <span>{{ messages.actions[action.id].label }}</span>
      <small>{{ messages.actions[action.id].detail }}</small>
    </button>
  </div>
</template>
