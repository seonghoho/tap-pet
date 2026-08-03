<script setup lang="ts">
import { computed } from 'vue'
import type { PetStats } from '~/types/pet'

const props = defineProps<{
  stats: PetStats
}>()

const { messages } = useLocale()

const needs = computed(() => [
  {
    id: 'fullness',
    label: messages.value.stats.fullness,
    value: props.stats.fullness,
  },
  {
    id: 'energy',
    label: messages.value.stats.energy,
    value: props.stats.energy,
  },
  {
    id: 'cleanliness',
    label: messages.value.stats.cleanliness,
    value: props.stats.cleanliness,
  },
])
</script>

<template>
  <ul class="pet-needs" :aria-label="messages.app.name">
    <li
      v-for="need in needs"
      :key="need.id"
      class="pet-need"
      role="meter"
      :aria-label="need.label"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="need.value"
    >
      <span class="pet-need__label">{{ need.label }}</span>
      <span class="pet-need__track" aria-hidden="true">
        <span class="pet-need__fill" :style="{ width: `${need.value}%` }" />
      </span>
      <strong>{{ need.value }}</strong>
    </li>
  </ul>
</template>
