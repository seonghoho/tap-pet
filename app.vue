<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useHead } from '#app'
import { DEFAULT_DISGUISE_TITLE_ID } from '~/constants/titles'
import { DEFAULT_THEME_ID } from '~/constants/themes'
import type { AppLocale } from '~/types/i18n'
import type { DisguiseTitleId, PetAction, PetSpecies, PetStatus, ThemeId } from '~/types/pet'
import { getTabPresentation } from '~/utils/tabPresentation'
import { getThemeById } from '~/utils/theme'

const pet = usePetStore()
const { locale, messages, restoreLocale, setLocale } = useLocale()

onMounted(() => {
  restoreLocale()
  pet.restorePet()
})

const currentPet = computed(() => pet.petState.value)
const effectiveStatus = computed<PetStatus>(() => pet.petStatus.value ?? 'happy')
const effectiveTitleId = computed<DisguiseTitleId>(
  () => currentPet.value?.disguiseTitleId ?? DEFAULT_DISGUISE_TITLE_ID,
)
const effectiveThemeId = computed<ThemeId>(() => currentPet.value?.themeId ?? DEFAULT_THEME_ID)
const activeTheme = computed(() => getThemeById(effectiveThemeId.value))
const tabPresentation = computed(() =>
  getTabPresentation({
    species: currentPet.value?.species,
    status: effectiveStatus.value,
    disguiseTitleId: effectiveTitleId.value,
    themeId: effectiveThemeId.value,
    locale: locale.value,
  }),
)
const themeStyle = computed<Record<string, string>>(() => {
  const colors = activeTheme.value.colors

  return {
    '--app-bg': colors.background,
    '--app-surface': colors.surface,
    '--app-surface-strong': colors.surfaceStrong,
    '--app-border': colors.border,
    '--app-text': colors.text,
    '--app-muted': colors.muted,
    '--app-accent': colors.accent,
    '--app-accent-text': colors.accentText,
    '--app-warning': colors.warning,
    '--app-success': colors.success,
  }
})

useTabTitle(computed(() => tabPresentation.value.title))
useFavicon(computed(() => tabPresentation.value.faviconSvg))
useHead(() => ({
  htmlAttrs: {
    lang: locale.value,
  },
}))

function handleSpeciesSelect(species: PetSpecies): void {
  pet.initializePet(species)
}

function handleAction(action: PetAction): void {
  pet.performAction(action)
}

function handleTitleSelect(titleId: DisguiseTitleId): void {
  pet.setDisguiseTitle(titleId)
}

function handleThemeSelect(themeId: ThemeId): void {
  pet.setTheme(themeId)
}

function handleLocaleSelect(nextLocale: AppLocale): void {
  setLocale(nextLocale)
}
</script>

<template>
  <div class="app-shell" :style="themeStyle">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">TP</div>
        <div>
          <h1>{{ messages.app.name }}</h1>
          <p>{{ messages.app.tagline }}</p>
        </div>
      </div>

      <div class="topbar-actions">
        <LocaleSwitcher
          :selected-locale="locale"
          :label="messages.locale.label"
          @select="handleLocaleSelect"
        />
        <div class="tab-preview" aria-live="polite">
          <span class="tab-preview__dot" aria-hidden="true" />
          <span>{{ tabPresentation.title }}</span>
        </div>
        <button
          v-if="currentPet"
          class="ghost-button"
          type="button"
          @click="pet.resetPet"
        >
          {{ messages.app.reset }}
        </button>
      </div>
    </header>

    <main class="app-grid">
      <section class="main-panel" aria-labelledby="pet-panel-title">
        <div v-if="!pet.isReady.value" class="empty-panel">
          <p class="eyebrow">{{ messages.app.loading }}</p>
          <h2 id="pet-panel-title">{{ messages.app.restoring }}</h2>
        </div>

        <PetSetup
          v-else-if="!currentPet"
          id="pet-panel-title"
          @select="handleSpeciesSelect"
        />

        <template v-else>
          <PetStatusPanel
            :species="currentPet.species"
            :stats="currentPet.stats"
            :status="effectiveStatus"
            :theme-id="currentPet.themeId"
          />
          <PetActions @action="handleAction" />
        </template>
      </section>

      <aside class="side-stack" :aria-label="messages.app.settingsLabel">
        <DisguiseTitlePicker
          :disabled="!currentPet"
          :selected-id="effectiveTitleId"
          @select="handleTitleSelect"
        />
        <ThemePicker
          :disabled="!currentPet"
          :selected-id="effectiveThemeId"
          @select="handleThemeSelect"
        />
        <MonetizationMock />
        <EmojiCopyPanel />
      </aside>
    </main>

    <p v-if="pet.storageError.value" class="storage-warning" role="status">
      {{ messages.app.storageWarning }} {{ pet.storageError.value }}
    </p>
  </div>
</template>
