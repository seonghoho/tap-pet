<script setup lang="ts">
import type { PetSpecies } from '~/types/pet'

const emit = defineEmits<{
  select: [species: PetSpecies]
}>()
const { messages } = useLocale()

const options: Array<{
  species: PetSpecies
}> = [
  {
    species: 'cat',
  },
  {
    species: 'dog',
  },
  {
    species: 'hedgehog',
  },
]
</script>

<template>
  <div class="setup-panel">
    <div class="section-heading">
      <p class="eyebrow">{{ messages.setup.eyebrow }}</p>
      <h2>{{ messages.setup.title }}</h2>
      <p>
        {{ messages.setup.description }}
      </p>
    </div>

    <div class="species-grid">
      <button
        v-for="option in options"
        :key="option.species"
        class="species-option"
        type="button"
        @click="emit('select', option.species)"
      >
        <PetAvatar
          :species="option.species"
          status="happy"
          theme-id="system"
          :aria-label="`${messages.species[option.species].label} ${messages.status.aria.happy}`"
          compact
        />
        <span>
          <strong>{{ messages.species[option.species].label }}</strong>
          <small>{{ messages.species[option.species].description }}</small>
        </span>
      </button>
    </div>
  </div>
</template>
