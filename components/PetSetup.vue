<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PetSpecies } from '~/types/pet'

const emit = defineEmits<{
  select: [species: PetSpecies]
}>()

const { messages } = useLocale()
const selectedSpecies = ref<PetSpecies>('cat')
const speciesOptions: readonly PetSpecies[] = [
  'cat',
  'dog',
  'hedgehog',
  'rabbit',
  'penguin',
  'hamster',
]

const selectedLabel = computed(() => messages.value.species[selectedSpecies.value].label)
const selectedDescription = computed(
  () => messages.value.species[selectedSpecies.value].description,
)
const previewAriaLabel = computed(
  () => `${selectedLabel.value} ${messages.value.status.aria.happy}`,
)
</script>

<template>
  <section class="setup-stage">
    <div class="setup-stage__intro">
      <p class="eyebrow">{{ messages.setup.eyebrow }}</p>
      <h2>{{ messages.setup.title }}</h2>
      <p>{{ messages.setup.description }}</p>
    </div>

    <div class="setup-stage__scene">
      <PetCanvas
        :species="selectedSpecies"
        status="happy"
        :label="previewAriaLabel"
      />

      <div class="setup-stage__caption">
        <span>{{ selectedLabel }}</span>
        <p>{{ selectedDescription }}</p>
      </div>

      <div class="setup-tab-signal" :aria-label="messages.setup.tabPreview.label">
        <span class="setup-tab-signal__dot" aria-hidden="true" />
        <span>
          <small>{{ messages.setup.tabPreview.label }}</small>
          <strong>{{ messages.setup.tabPreview.normal }}</strong>
        </span>
      </div>
    </div>

    <div class="setup-stage__controls">
      <div class="species-rail" :aria-label="messages.setup.title">
        <button
          v-for="species in speciesOptions"
          :key="species"
          class="species-rail__button"
          type="button"
          :data-species="species"
          :aria-pressed="selectedSpecies === species"
          @click="selectedSpecies = species"
        >
          <span class="species-rail__mark" aria-hidden="true">
            {{ messages.species[species].label.slice(0, 1) }}
          </span>
          <span>{{ messages.species[species].label }}</span>
        </button>
      </div>

      <div class="setup-stage__confirm">
        <p class="setup-save-note">{{ messages.setup.localSave }}</p>
        <button
          class="setup-confirm-button"
          type="button"
          data-testid="confirm-pet"
          @click="emit('select', selectedSpecies)"
        >
          <span>{{ messages.setup.title }}</span>
          <strong>{{ selectedLabel }}</strong>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>
