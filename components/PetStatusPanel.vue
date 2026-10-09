<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { pickVoiceLine } from '~/utils/petVoice'
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
const voiceSeed = ref(Math.floor(Math.random() * 1000))
const petCount = ref(0)
const pettedLine = ref('')
let pettedTimer: ReturnType<typeof setTimeout> | null = null

const voiceLine = computed(() =>
  pettedLine.value ||
  pickVoiceLine({
    pools: messages.value.voice,
    status: props.status,
    hour: new Date().getHours(),
    seed: voiceSeed.value,
  }),
)

watch(() => props.status, () => {
  voiceSeed.value += 1
})

function handlePet(): void {
  const lines = messages.value.voice.petted
  pettedLine.value = lines[petCount.value % lines.length]
  petCount.value += 1
  if (petCount.value === 1) trackEvent('pet_patted', {})
  if (pettedTimer) clearTimeout(pettedTimer)
  pettedTimer = setTimeout(() => {
    pettedLine.value = ''
    voiceSeed.value += 1
  }, 2500)
}

onBeforeUnmount(() => {
  if (pettedTimer) clearTimeout(pettedTimer)
})

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
        :pet-name="name"
        @pet="handlePet"
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
        <p class="pet-status__voice" aria-live="polite">{{ voiceLine }}</p>
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
