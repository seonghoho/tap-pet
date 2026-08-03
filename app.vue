<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useHead } from '#app'
import { DEFAULT_SETTINGS } from '~/constants/pet'
import type { AppLocale } from '~/types/i18n'
import type { PetAction, PetSettings, PetSpecies, PetStatus } from '~/types/pet'
import { getTabPresentation } from '~/utils/tabPresentation'
import { getThemeById, resolveThemeId } from '~/utils/theme'

const pet = usePetStore()
const { locale, messages, restoreLocale, setLocale } = useLocale()
const prefersDark = ref(false)
const isDocumentVisible = ref(true)
const isSettingsOpen = ref(false)
const settingsCloseButton = ref<HTMLButtonElement | null>(null)

let colorSchemeQuery: MediaQueryList | null = null
let previouslyFocusedElement: HTMLElement | null = null

onMounted(() => {
  restoreLocale()
  pet.restorePet()
  isDocumentVisible.value = document.visibilityState === 'visible'
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('keydown', handleGlobalKeydown)

  colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
  prefersDark.value = colorSchemeQuery.matches
  colorSchemeQuery.addEventListener('change', handleColorSchemeChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('keydown', handleGlobalKeydown)
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
const petAriaLabel = computed(() => {
  const state = currentPet.value
  if (!state) return messages.value.app.name

  return `${state.name}, ${messages.value.species[state.species].label}, ${messages.value.status.aria[effectiveStatus.value]}`
})
const tabPresentation = computed(() =>
  getTabPresentation({
    species: currentPet.value?.species,
    status: effectiveStatus.value,
    settings: effectiveSettings.value,
    themeId: resolvedThemeId.value,
    locale: locale.value,
    isDocumentVisible: isDocumentVisible.value,
    level: currentPet.value?.growth.level,
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

async function openSettings(): Promise<void> {
  previouslyFocusedElement = document.activeElement as HTMLElement | null
  isSettingsOpen.value = true
  await nextTick()
  settingsCloseButton.value?.focus()
}

async function closeSettings(): Promise<void> {
  isSettingsOpen.value = false
  await nextTick()
  previouslyFocusedElement?.focus()
  previouslyFocusedElement = null
}

function handleReset(): void {
  pet.resetPet()
  void closeSettings()
}

function handleGlobalKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isSettingsOpen.value) void closeSettings()
}

function handleVisibilityChange(): void {
  isDocumentVisible.value = document.visibilityState === 'visible'
}

function handleColorSchemeChange(event: MediaQueryListEvent): void {
  prefersDark.value = event.matches
}
</script>

<template>
  <div
    class="app-shell"
    :class="`app-shell--${resolvedThemeId}`"
    :style="themeStyle"
  >
    <header class="living-topbar">
      <div class="living-brand">
        <span class="living-brand__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <circle cx="10" cy="10" r="4" />
            <circle cx="22" cy="10" r="4" />
            <circle cx="6" cy="18" r="3.5" />
            <circle cx="26" cy="18" r="3.5" />
            <path d="M10 23c0-5 3-8 6-8s6 3 6 8c0 3-2.5 5-6 5s-6-2-6-5Z" />
          </svg>
        </span>
        <span>
          <strong>{{ messages.app.name }}</strong>
          <small>{{ messages.app.tagline }}</small>
        </span>
      </div>

      <div class="living-topbar__actions">
        <LocaleSwitcher
          :selected-locale="locale"
          :label="messages.locale.label"
          @select="handleLocaleSelect"
        />
        <div class="living-tab-preview" aria-live="polite">
          <span class="living-tab-preview__dot" aria-hidden="true" />
          <span>
            <small>{{ messages.setup.tabPreview.label }}</small>
            <strong>{{ tabPresentation.title }}</strong>
          </span>
        </div>
        <button
          v-if="currentPet"
          class="living-settings-button"
          type="button"
          :aria-label="messages.settings.openTabSettings"
          @click="openSettings"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
          </svg>
        </button>
      </div>
    </header>

    <main v-if="!pet.isReady.value" class="living-loading">
      <span class="living-loading__orb" aria-hidden="true" />
      <p class="eyebrow">{{ messages.app.loading }}</p>
      <h1>{{ messages.app.restoring }}</h1>
    </main>

    <main v-else-if="!currentPet" class="living-onboarding">
      <PetSetup @select="handleSpeciesSelect" />
    </main>

    <main v-else class="living-stage">
      <section class="living-habitat" aria-labelledby="pet-mood-title">
        <PetCanvas
          :species="currentPet.species"
          :status="effectiveStatus"
          :active-reaction="pet.activeReaction.value"
          :label="petAriaLabel"
        />

        <div class="living-habitat__wordmark" aria-hidden="true">TAB PET</div>

        <div class="living-identity">
          <p class="eyebrow">{{ messages.species[currentPet.species].label }}</p>
          <h1 id="pet-mood-title">
            <span>{{ currentPet.name }}</span>
            <em>{{ messages.status.labels[effectiveStatus] }}</em>
          </h1>
          <p>{{ messages.status.messages[effectiveStatus] }}</p>
        </div>

        <div class="living-needs-panel">
          <PetNeeds :stats="currentPet.stats" />
        </div>

        <div v-if="pet.returnReport.value" class="living-return">
          <PetReturnReport
            :report="pet.returnReport.value"
            :pet-name="currentPet.name"
          />
        </div>

        <PetCareDock
          :cooldowns="pet.actionCooldowns.value"
          :active-reaction="pet.activeReaction.value"
          :recommended-care-action="pet.recommendedCareAction.value"
          :care-feedback="pet.lastCareFeedback.value"
          @action="handleAction"
        />
      </section>
    </main>

    <p v-if="pet.storageError.value" class="storage-warning" role="status">
      {{ messages.app.storageWarning }} {{ pet.storageError.value }}
    </p>

    <Teleport to="body">
      <Transition name="drawer-fade">
        <div
          v-if="isSettingsOpen && currentPet"
          class="settings-drawer-backdrop"
          @click.self="closeSettings"
        >
          <aside
            class="settings-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-drawer-title"
          >
            <header class="settings-drawer__header">
              <span>
                <small>{{ messages.app.name }}</small>
                <h2 id="settings-drawer-title">{{ messages.settings.settingsTab }}</h2>
              </span>
              <button
                ref="settingsCloseButton"
                class="settings-drawer__close"
                type="button"
                :aria-label="messages.settings.resetCancel"
                @click="closeSettings"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </header>

            <div class="settings-drawer__locale">
              <span>{{ messages.locale.label }}</span>
              <LocaleSwitcher
                :selected-locale="locale"
                :label="messages.locale.label"
                @select="handleLocaleSelect"
              />
            </div>

            <PetSettingsPanel
              :name="currentPet.name"
              :settings="currentPet.settings"
              @update-name="pet.updatePetName"
              @update-settings="pet.updatePetSettings"
              @reset="handleReset"
            />
          </aside>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
