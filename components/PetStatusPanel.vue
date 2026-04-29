<script setup lang="ts">
import { computed } from 'vue'
import type { PetSpecies, PetStats, PetStatus, ThemeId } from '~/types/pet'

const props = defineProps<{
  species: PetSpecies
  stats: PetStats
  status: PetStatus
  themeId: ThemeId
}>()
const { messages } = useLocale()

const statRows = computed(() => [
  {
    key: 'fullness',
    label: messages.value.stats.fullness,
    value: props.stats.fullness,
  },
  {
    key: 'mood',
    label: messages.value.stats.mood,
    value: props.stats.mood,
  },
  {
    key: 'energy',
    label: messages.value.stats.energy,
    value: props.stats.energy,
  },
])
</script>

<template>
  <div class="pet-status">
    <div class="pet-status__visual">
      <PetHabitat
        :species="species"
        :status="status"
        :theme-id="themeId"
        :avatar-label="`${messages.species[species].label} ${messages.status.aria[status]}`"
      />
    </div>

    <div class="pet-status__content">
      <div class="section-heading">
        <p class="eyebrow">{{ messages.species[species].label }}</p>
        <h2>{{ messages.status.labels[status] }}</h2>
        <p>{{ messages.status.messages[status] }}</p>
      </div>

      <div class="stat-list">
        <div v-for="stat in statRows" :key="stat.key" class="stat-row">
          <div class="stat-row__label">
            <span>{{ stat.label }}</span>
            <strong>{{ stat.value }}</strong>
          </div>
          <div class="stat-track" aria-hidden="true">
            <div class="stat-fill" :style="{ width: `${stat.value}%` }" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
