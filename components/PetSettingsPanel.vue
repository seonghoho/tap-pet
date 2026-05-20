<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  PREMIUM_QUIET_SIGNAL_PACKS,
  PREMIUM_THEME_PACKS,
  PREMIUM_WORK_TITLE_PACKS,
} from '~/constants/premium'
import { PET_THEMES } from '~/constants/themes'
import { DISGUISE_TITLES, getDisguiseTitleLabel } from '~/constants/titles'
import type { PremiumMockItem } from '~/constants/premium'
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
  reset: []
}>()

const { locale, messages } = useLocale()

const draftName = ref(props.name)
const draftCustomTitle = ref(props.settings.customDisguiseTitle)
const isResetConfirming = ref(false)

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

function setCustomTitle(event: Event): void {
  const customDisguiseTitle = (event.target as HTMLInputElement | null)?.value ?? ''
  draftCustomTitle.value = customDisguiseTitle

  if (customDisguiseTitle === props.settings.customDisguiseTitle) return

  emit('updateSettings', { customDisguiseTitle })
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

function getPremiumValue(item: PremiumMockItem): string {
  return item.values[locale.value]
}

function getPremiumDetail(item: PremiumMockItem): string {
  return item.detail[locale.value]
}

function requestReset(): void {
  isResetConfirming.value = true
}

function cancelReset(): void {
  isResetConfirming.value = false
}

function confirmReset(): void {
  isResetConfirming.value = false
  emit('reset')
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
        @input="setCustomTitle"
        @blur="commitCustomTitle"
        @change="commitCustomTitle"
      >
    </label>

    <section class="premium-tab-pack" aria-labelledby="premium-tab-pack-heading">
      <div class="premium-tab-pack__header">
        <span>{{ messages.premium.lockedLabel }}</span>
        <strong id="premium-tab-pack-heading">{{ messages.premium.heading }}</strong>
        <small>{{ messages.premium.description }}</small>
      </div>

      <div class="premium-lock-group">
        <strong>{{ messages.premium.workTitlePack }}</strong>
        <button
          v-for="item in PREMIUM_WORK_TITLE_PACKS"
          :key="item.id"
          class="premium-lock-row"
          type="button"
          :disabled="true"
        >
          <span>{{ getPremiumValue(item) }}</span>
          <small>{{ getPremiumDetail(item) }}</small>
          <em>{{ messages.premium.lockedLabel }}</em>
        </button>
      </div>

      <div class="premium-lock-group">
        <strong>{{ messages.premium.quietSignalPack }}</strong>
        <button
          v-for="item in PREMIUM_QUIET_SIGNAL_PACKS"
          :key="item.id"
          class="premium-lock-row"
          type="button"
          :disabled="true"
        >
          <span>{{ getPremiumValue(item) }}</span>
          <small>{{ getPremiumDetail(item) }}</small>
          <em>{{ messages.premium.lockedLabel }}</em>
        </button>
      </div>

      <div class="premium-lock-group">
        <strong>{{ messages.premium.themePack }}</strong>
        <button
          v-for="item in PREMIUM_THEME_PACKS"
          :key="item.id"
          class="premium-lock-row"
          type="button"
          :disabled="true"
        >
          <span>{{ getPremiumValue(item) }}</span>
          <small>{{ getPremiumDetail(item) }}</small>
          <em>{{ messages.premium.lockedLabel }}</em>
        </button>
      </div>

      <p>{{ messages.premium.unavailable }}</p>
    </section>

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

    <div class="settings-danger-zone" role="group" :aria-label="messages.settings.resetHeading">
      <div>
        <strong>{{ messages.settings.resetHeading }}</strong>
        <p>{{ messages.settings.resetDescription }}</p>
      </div>

      <template v-if="isResetConfirming">
        <p class="settings-danger-zone__confirm">
          {{ messages.settings.resetConfirmMessage }}
        </p>
        <div class="settings-danger-zone__actions">
          <button class="ghost-button" type="button" @click="cancelReset">
            {{ messages.settings.resetCancel }}
          </button>
          <button class="danger-button danger-button--solid" type="button" @click="confirmReset">
            {{ messages.app.reset }}
          </button>
        </div>
      </template>

      <button v-else class="danger-button" type="button" @click="requestReset">
        {{ messages.app.reset }}
      </button>
    </div>
  </form>
</template>
