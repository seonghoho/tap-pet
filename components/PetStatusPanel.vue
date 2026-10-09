<script setup lang="ts">
import { computed } from 'vue'
import type { PetAction, PetCareFeedback, PetSpecies, PetStats, PetStatus, ThemeId } from '~/types/pet'

const props = defineProps<{
  species: PetSpecies
  name?: string
  stats: PetStats
  status: PetStatus
  themeId: ThemeId
  level: number
  activeReaction?: PetAction | null
  careFeedback?: PetCareFeedback | null
}>()

const { messages } = useLocale()

const statRows = computed(() => [
  {
    key: 'fullness',
    label: messages.value.stats.fullness,
    value: props.stats.fullness,
  },
  {
    key: 'energy',
    label: messages.value.stats.energy,
    value: props.stats.energy,
  },
  {
    key: 'cleanliness',
    label: messages.value.stats.cleanliness,
    value: props.stats.cleanliness,
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
        :level="level"
        :active-reaction="activeReaction"
        :care-feedback="careFeedback"
        :avatar-label="`${messages.species[species].label} ${messages.status.aria[status]}`"
      />
    </div>

    <div class="pet-status__content">
      <div class="section-heading pet-status__heading">
        <p class="eyebrow">{{ messages.species[species].label }} · {{ messages.stats.level }} {{ level }}</p>
        <h2>
          {{ name ?? messages.species[species].label }}
          <span class="pet-status__mood">{{ messages.status.labels[status] }}</span>
        </h2>
        <p class="pet-status__voice">{{ messages.status.messages[status] }}</p>
      </div>

      <div class="stat-list">
        <div
          v-for="stat in statRows"
          :key="stat.key"
          class="stat-row"
          :class="[`stat-row--${stat.key}`, { 'stat-row--low': stat.value < 30 }]"
        >
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
