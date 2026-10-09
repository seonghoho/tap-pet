<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { DEFAULT_PET_NAMES } from '~/constants/pet'
import type { PetSettings, PetSpecies, TitleMode } from '~/types/pet'
import { renderPetArtSvg } from '~/utils/petArt'
import { getDisguiseTitleValue, svgToDataUrl } from '~/utils/tabPresentation'

const props = withDefaults(defineProps<{
  titleMode?: TitleMode
}>(), {
  titleMode: 'status',
})
const emit = defineEmits<{
  select: [species: PetSpecies, name: string]
  updateSettings: [settings: Partial<PetSettings>]
}>()
const { locale, messages } = useLocale()
const titleModeOptions: TitleMode[] = ['status', 'disguise']
const pendingSpecies = ref<PetSpecies | null>(null)
const draftName = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

function chooseSpecies(species: PetSpecies): void {
  pendingSpecies.value = species
  draftName.value = DEFAULT_PET_NAMES[species]
  void nextTick(() => nameInput.value?.select())
}

function confirmName(): void {
  if (!pendingSpecies.value) return

  emit('select', pendingSpecies.value, draftName.value.trim() || DEFAULT_PET_NAMES[pendingSpecies.value])
}
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
  <form
    v-if="pendingSpecies"
    class="setup-panel setup-naming"
    @submit.prevent="confirmName"
  >
    <PetAvatar
      :species="pendingSpecies"
      status="excited"
      :aria-label="messages.species[pendingSpecies].label"
    />
    <div class="section-heading setup-naming__heading">
      <p class="eyebrow">{{ messages.species[pendingSpecies].label }}</p>
      <h2>{{ messages.setup.naming.title }}</h2>
    </div>
    <label class="setup-naming__field">
      <span class="visually-hidden">{{ messages.settings.petName }}</span>
      <input
        ref="nameInput"
        v-model="draftName"
        class="settings-input setup-naming__input"
        type="text"
        maxlength="12"
        autocomplete="off"
      >
      <small>{{ messages.setup.naming.hint }}</small>
    </label>
    <button class="primary-button" type="submit">
      {{ messages.setup.naming.start }}
    </button>
    <button class="text-button" type="button" @click="pendingSpecies = null">
      {{ messages.setup.naming.back }}
    </button>
  </form>

  <div v-else class="setup-panel">
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
        @click="chooseSpecies(option.species)"
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
