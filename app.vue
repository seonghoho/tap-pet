<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useHead } from '#app'
import { DEFAULT_SETTINGS } from '~/constants/pet'
import type { AppLocale } from '~/types/i18n'
import type { PetAction, PetSettings, PetSpecies, PetStatus } from '~/types/pet'
import { getTabPresentation } from '~/utils/tabPresentation'
import { getThemeById, resolveThemeId } from '~/utils/theme'

const pet = usePetStore()
const { locale, messages, restoreLocale, setLocale } = useLocale()
const runtimeConfig = useRuntimeConfig()
const prefersDark = ref(false)
const isDocumentVisible = ref(true)
const sidePanelElement = ref<HTMLElement | null>(null)

let colorSchemeQuery: MediaQueryList | null = null

onMounted(() => {
  restoreLocale()
  pet.restorePet()
  isDocumentVisible.value = document.visibilityState === 'visible'
  document.addEventListener('visibilitychange', handleVisibilityChange)

  colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
  prefersDark.value = colorSchemeQuery.matches
  colorSchemeQuery.addEventListener('change', handleColorSchemeChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  colorSchemeQuery?.removeEventListener('change', handleColorSchemeChange)
  colorSchemeQuery = null
})

const currentPet = computed(() => pet.petState.value)
const effectiveStatus = computed<PetStatus>(() => pet.petStatus.value ?? 'happy')
const effectiveSettings = computed<PetSettings>(() => currentPet.value?.settings ?? {
  ...DEFAULT_SETTINGS,
  disguiseTitleId: pet.draftDisguiseTitleId.value,
  themeId: pet.draftThemeId.value,
})
const resolvedThemeId = computed(() => resolveThemeId(effectiveSettings.value.themeId, prefersDark.value))
const activeTheme = computed(() => getThemeById(resolvedThemeId.value))
const adsenseClient = computed(() => String(runtimeConfig.public.adsenseClient || ''))
const adsenseSidebarSlot = computed(() => String(runtimeConfig.public.adsenseSidebarSlot || ''))
const adsenseConfigEnabled = computed(() => String(runtimeConfig.public.adsenseEnabled) === 'true')
const adsenseEnabled = computed(() =>
  adsenseConfigEnabled.value && adsenseClient.value.length > 0 && adsenseSidebarSlot.value.length > 0,
)
const shouldShowAdPlacement = computed(() => adsenseEnabled.value || import.meta.dev)
const tabPresentation = computed(() =>
  getTabPresentation({
    species: currentPet.value?.species,
    status: effectiveStatus.value,
    settings: effectiveSettings.value,
    themeId: resolvedThemeId.value,
    locale: locale.value,
    isDocumentVisible: isDocumentVisible.value,
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
    '--app-stat-fill-start': colors.statFillStart,
    '--app-stat-fill-end': colors.statFillEnd,
  }
})

useTabTitle({
  title: computed(() => tabPresentation.value.title),
  animationEnabled: computed(() => effectiveSettings.value.titleAnimationEnabled),
  isDocumentVisible,
})
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

function handleLocaleSelect(nextLocale: AppLocale): void {
  setLocale(nextLocale)
}

function openTabSettings(): void {
  pet.setSidePanelMode('settings')
  sidePanelElement.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

function handleVisibilityChange(): void {
  isDocumentVisible.value = document.visibilityState === 'visible'
}

function handleColorSchemeChange(event: MediaQueryListEvent): void {
  prefersDark.value = event.matches
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
          class="tab-settings-shortcut"
          type="button"
          @click="openTabSettings"
        >
          {{ messages.settings.openTabSettings }}
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
            :theme-id="resolvedThemeId"
            :active-reaction="pet.activeReaction.value"
          />
          <PetActions
            :stats="currentPet.stats"
            :cooldowns="pet.actionCooldowns.value"
            :active-reaction="pet.activeReaction.value"
            :action-limit-info="pet.actionLimitInfo.value"
            :care-feedback="pet.lastCareFeedback.value"
            :action-limit-reward-feedback="pet.actionLimitRewardFeedback.value"
            :recommended-care-action="pet.recommendedCareAction.value"
            :recommended-care-reward-preview="pet.recommendedCareRewardPreview.value"
            :level-progress="pet.levelProgress.value"
            @action="handleAction"
            @reward-ad="pet.grantRewardedAdActions"
          />
        </template>
      </section>

      <aside
        id="tab-settings"
        ref="sidePanelElement"
        class="side-stack"
        :aria-label="messages.app.settingsLabel"
      >
        <PetSidePanel
          v-if="currentPet && pet.levelProgress.value && pet.affinityProgress.value"
          :mode="pet.sidePanelMode.value"
          :name="currentPet.name"
          :level="currentPet.growth.level"
          :level-progress="pet.levelProgress.value"
          :affinity-progress="pet.affinityProgress.value"
          :settings="currentPet.settings"
          @set-mode="pet.setSidePanelMode"
          @update-name="pet.updatePetName"
          @update-settings="pet.updatePetSettings"
          @reset="pet.resetPet"
        />
        <GuidePanel v-if="currentPet" />
        <AdSenseDisplay
          v-if="currentPet && shouldShowAdPlacement"
          :client="adsenseClient"
          :slot="adsenseSidebarSlot"
          :enabled="adsenseEnabled"
        />
      </aside>
    </main>

    <p v-if="pet.storageError.value" class="storage-warning" role="status">
      {{ messages.app.storageWarning }} {{ pet.storageError.value }}
    </p>
  </div>
</template>
