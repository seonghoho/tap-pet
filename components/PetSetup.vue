<script setup lang="ts">
import { computed } from 'vue'
import type { PetSettings, PetSpecies, TitleMode } from '~/types/pet'
import { renderPetArtSvg } from '~/utils/petArt'
import { getDisguiseTitleValue, svgToDataUrl } from '~/utils/tabPresentation'

const props = withDefaults(defineProps<{
  titleMode?: TitleMode
}>(), {
  titleMode: 'status',
})
const emit = defineEmits<{
  select: [species: PetSpecies]
  updateSettings: [settings: Partial<PetSettings>]
}>()
const { locale, messages } = useLocale()
const titleModeOptions: TitleMode[] = ['status', 'disguise']
const demoTitles = computed(() => {
  if (props.titleMode === 'disguise') {
    const disguise = getDisguiseTitleValue('project-dashboard', locale.value)

    return { normal: disguise, alert: `(1) ${disguise}` }
  }

  return { normal: messages.value.setup.tabPreview.normal, alert: messages.value.setup.tabPreview.alert }
})

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
  {
    species: 'rabbit',
  },
  {
    species: 'penguin',
  },
  {
    species: 'hamster',
  },
]

const demoIcons = computed(() => ({
  normal: svgToDataUrl(renderPetArtSvg({ species: 'cat', status: 'happy', variant: 'icon', idPrefix: 'demo-normal' })),
  alert: svgToDataUrl(renderPetArtSvg({ species: 'cat', status: 'hungry', variant: 'icon', idPrefix: 'demo-alert' })),
}))
</script>

<template>
  <div class="setup-panel">
    <div class="section-heading setup-panel__heading">
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

    <div class="setup-tab-demo" :aria-label="messages.setup.tabPreview.label">
      <div class="setup-tab-demo__copy">
        <strong>{{ messages.setup.tabPreview.label }}</strong>
        <small>{{ messages.setup.tabPreview.hint }}</small>
      </div>
      <div class="setup-tab-demo__choice" role="group" :aria-label="messages.setup.titleChoice.label">
        <span>{{ messages.setup.titleChoice.label }}</span>
        <div class="segmented-control">
          <button
            v-for="mode in titleModeOptions"
            :key="mode"
            class="segmented-button"
            :class="{ 'segmented-button--active': titleMode === mode }"
            type="button"
            :aria-pressed="titleMode === mode"
            @click="emit('updateSettings', { titleMode: mode })"
          >
            {{ messages.setup.titleChoice[mode] }}
          </button>
        </div>
      </div>
      <div class="setup-tab-demo__tabs" aria-hidden="true">
        <span class="setup-tab-demo__tab">
          <img :src="demoIcons.normal" alt="">
          <span>{{ demoTitles.normal }}</span>
        </span>
        <span class="setup-tab-demo__tab setup-tab-demo__tab--alert">
          <img :src="demoIcons.alert" alt="">
          <span>{{ demoTitles.alert }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
