<script setup lang="ts">
import { ref, watch } from 'vue'
import { PET_THEMES } from '~/constants/themes'
import { DISGUISE_TITLES, getDisguiseTitleLabel } from '~/constants/titles'
import type {
  DisguiseTitleId,
  PetSettings,
  ThemeId,
  TitleMode,
  TitleVisibility,
} from '~/types/pet'

const props = defineProps<{
  name: string
  settings: PetSettings
}>()

const emit = defineEmits<{
  updateName: [name: string]
  updateSettings: [settings: Partial<PetSettings>]
}>()

const { locale, messages } = useLocale()

const draftName = ref(props.name)
const draftCustomTitle = ref(props.settings.customDisguiseTitle)

const titleModeOptions: Array<{
  id: TitleMode
  labelKey: 'titleModeStatus' | 'titleModeDisguise'
}> = [
  { id: 'status', labelKey: 'titleModeStatus' },
  { id: 'disguise', labelKey: 'titleModeDisguise' },
]

const titleVisibilityOptions: Array<{
  id: TitleVisibility
  labelKey: 'inactiveOnly' | 'always'
}> = [
  { id: 'inactive-only', labelKey: 'inactiveOnly' },
  { id: 'always', labelKey: 'always' },
]

watch(
  () => props.name,
  (name) => {
    draftName.value = name
  },
)

watch(
  () => props.settings.customDisguiseTitle,
  (customDisguiseTitle) => {
    draftCustomTitle.value = customDisguiseTitle
  },
)

function commitName(): void {
  const nextName = draftName.value.trim()

  if (!nextName) {
    draftName.value = props.name
    return
  }

  draftName.value = nextName

  if (nextName === props.name) return

  emit('updateName', nextName)
}

function commitCustomTitle(): void {
  if (draftCustomTitle.value === props.settings.customDisguiseTitle) return

  emit('updateSettings', {
    customDisguiseTitle: draftCustomTitle.value,
  })
}

function setTitleMode(titleMode: TitleMode): void {
  emit('updateSettings', { titleMode })
}

function setTitleVisibility(titleVisibility: TitleVisibility): void {
  emit('updateSettings', { titleVisibility })
}

function setDisguiseTitle(disguiseTitleId: DisguiseTitleId): void {
  draftCustomTitle.value = ''
  emit('updateSettings', { disguiseTitleId, customDisguiseTitle: '' })
}

function setTitleAnimation(event: Event): void {
  emit('updateSettings', {
    titleAnimationEnabled: Boolean((event.target as HTMLInputElement | null)?.checked),
  })
}

function setTheme(themeId: ThemeId): void {
  emit('updateSettings', { themeId })
}
</script>

<template>
  <form class="pet-settings-panel" @submit.prevent>
    <label class="settings-field">
      <span>{{ messages.settings.petName }}</span>
      <input
        v-model="draftName"
        class="settings-input"
        type="text"
        autocomplete="off"
        @blur="commitName"
        @change="commitName"
      >
    </label>

    <fieldset class="settings-fieldset">
      <legend>{{ messages.settings.titleMode }}</legend>
      <div class="segmented-control">
        <button
          v-for="option in titleModeOptions"
          :key="option.id"
          class="segmented-button"
          :class="{ 'segmented-button--active': settings.titleMode === option.id }"
          type="button"
          :aria-pressed="settings.titleMode === option.id"
          @click="setTitleMode(option.id)"
        >
          {{ messages.settings[option.labelKey] }}
        </button>
      </div>
    </fieldset>

    <fieldset class="settings-fieldset">
      <legend>{{ messages.settings.titleVisibility }}</legend>
      <div class="segmented-control">
        <button
          v-for="option in titleVisibilityOptions"
          :key="option.id"
          class="segmented-button"
          :class="{ 'segmented-button--active': settings.titleVisibility === option.id }"
          type="button"
          :aria-pressed="settings.titleVisibility === option.id"
          @click="setTitleVisibility(option.id)"
        >
          {{ messages.settings[option.labelKey] }}
        </button>
      </div>
    </fieldset>

    <fieldset class="settings-fieldset">
      <legend>{{ messages.titles.heading }}</legend>
      <div class="choice-list">
        <button
          v-for="title in DISGUISE_TITLES"
          :key="title.id"
          class="choice-button"
          :class="{ 'choice-button--active': settings.disguiseTitleId === title.id }"
          type="button"
          :aria-pressed="settings.disguiseTitleId === title.id"
          @click="setDisguiseTitle(title.id)"
        >
          {{ getDisguiseTitleLabel(title.id, locale) }}
        </button>
      </div>
    </fieldset>

    <label class="settings-field">
      <span>{{ messages.settings.customTitle }}</span>
      <input
        v-model="draftCustomTitle"
        class="settings-input"
        type="text"
        autocomplete="off"
        @blur="commitCustomTitle"
        @change="commitCustomTitle"
      >
    </label>

    <label class="settings-checkbox">
      <input
        type="checkbox"
        :checked="settings.titleAnimationEnabled"
        @change="setTitleAnimation"
      >
      <span>{{ messages.settings.titleAnimation }}</span>
    </label>

    <fieldset class="settings-fieldset">
      <legend>{{ messages.settings.themeMode }}</legend>
      <div class="segmented-control">
        <button
          v-for="theme in PET_THEMES"
          :key="theme.id"
          class="segmented-button"
          :class="{ 'segmented-button--active': settings.themeId === theme.id }"
          type="button"
          :aria-pressed="settings.themeId === theme.id"
          @click="setTheme(theme.id)"
        >
          {{ messages.themes[theme.id].name }}
        </button>
      </div>
    </fieldset>
  </form>
</template>
