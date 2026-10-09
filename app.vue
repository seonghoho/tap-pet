<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DEFAULT_PET_NAMES } from '~/constants/pet'
import { useHead } from '#app'
import type { AppLocale } from '~/types/i18n'
import type { PetAction, PetSettings, PetSpecies, PetStatus } from '~/types/pet'
import { renderPetArtSvg } from '~/utils/petArt'
import { getDisguiseTitleValue, getTabPresentation, svgToDataUrl } from '~/utils/tabPresentation'
import { getThemeById, resolveThemeId } from '~/utils/theme'

const pet = usePetStore()
const shop = useEntitlements()
const purchases = usePurchases()
const purchaseNoticeText = computed(() => {
  const notice = purchases.notice.value
  if (!notice) return ''

  const name = notice.productId ? messages.value.shop.products[notice.productId].name : ''
  if (notice.kind === 'success') return messages.value.shop.success.replace('{name}', name)

  return notice.message ? `${messages.value.shop.failed} (${notice.message})` : messages.value.shop.failed
})
const { locale, messages, restoreLocale, setLocale } = useLocale()
const prefersDark = ref(false)
const isDocumentVisible = ref(true)
const sidePanelElement = ref<HTMLElement | null>(null)

let colorSchemeQuery: MediaQueryList | null = null

onMounted(() => {
  restoreLocale()
  shop.restoreEntitlements()
  pet.restorePet()
  void purchases.handleCheckoutReturn()
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
// Outfits only show while the outfit pack is owned (e.g. not after site data was cleared).
const effectiveSettings = computed<PetSettings>(() => {
  const settings = currentPet.value?.settings ?? pet.activeSettings.value

  return shop.owns('outfit-pack') ? settings : { ...settings, outfit: null }
})
const ownedOutfit = computed(() => effectiveSettings.value.outfit ?? null)
const resolvedThemeId = computed(() => resolveThemeId(effectiveSettings.value.themeId, prefersDark.value))
const activeTheme = computed(() => getThemeById(resolvedThemeId.value))
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
const backupCode = computed(() => (currentPet.value ? pet.exportPetBackup(shop.entitlements.value) : null))
const faviconDataUrl = computed(() => svgToDataUrl(tabPresentation.value.faviconSvg))
const brandIcon = computed(() =>
  svgToDataUrl(
    renderPetArtSvg({
      species: currentPet.value?.species ?? 'cat',
      status: 'happy',
      variant: 'icon',
      idPrefix: 'brand',
    }),
  ),
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
useCareNotifications({
  status: computed(() => (currentPet.value ? pet.petStatus.value : null)),
  settings: effectiveSettings,
  isDocumentVisible,
  iconUrl: faviconDataUrl,
  getContent: (status) => {
    const settings = effectiveSettings.value
    if (settings.titleMode === 'disguise') {
      return {
        title: getDisguiseTitleValue(settings.disguiseTitleId, locale.value, settings.customDisguiseTitle),
        body: messages.value.notifications.disguisedBody,
      }
    }

    return {
      title: currentPet.value?.name ?? messages.value.app.name,
      body: messages.value.status.messages[status],
    }
  },
  onShown: (status) => trackEvent('notification_shown', { status }),
})

watch(
  () => pet.streakInfo.value?.current ?? 0,
  (days, previousDays) => {
    if (days > previousDays && days > 1) trackEvent('streak_extended', { days })
  },
)
watch(
  () => pet.returnReport.value,
  (report) => {
    if (report) trackEvent('return_visit', { bucket: report.bucket, status: report.status })
  },
)
useHead(() => ({
  htmlAttrs: {
    lang: locale.value,
  },
}))

function handleSpeciesSelect(species: PetSpecies, name: string): void {
  pet.initializePet(species)
  pet.updatePetName(name)
  trackEvent('pet_created', {
    species,
    title_mode: effectiveSettings.value.titleMode,
    custom_name: name !== DEFAULT_PET_NAMES[species],
  })
}

function handleAction(action: PetAction): void {
  const recommended = pet.recommendedCareAction.value?.action === action
  const usedBefore = pet.actionLimitInfo.value.used
  pet.performAction(action)
  if (pet.actionLimitInfo.value.used === usedBefore) return

  trackEvent('care_performed', {
    action,
    recommended,
    level: currentPet.value?.growth.level ?? 1,
  })
  if (pet.actionLimitInfo.value.remaining === 0) {
    trackEvent('care_limit_reached', { level: currentPet.value?.growth.level ?? 1 })
  }
}

function handleRecharge(): void {
  const before = pet.actionLimitInfo.value.limit
  pet.grantRewardedAdActions()
  if (pet.actionLimitInfo.value.limit > before) trackEvent('care_recharge_used', {})
}

function handleClaimDailyGoal(): void {
  pet.claimDailyGoalReward()
  if (pet.dailyGoalRewardFeedback.value) {
    trackEvent('daily_goal_claimed', { streak: pet.streakInfo.value?.current ?? 0 })
  }
}

function handleSettingsUpdate(settings: Partial<PetSettings>): void {
  const previous = effectiveSettings.value
  pet.updatePetSettings(settings)
  if (settings.titleMode && settings.titleMode !== previous.titleMode) {
    trackEvent('title_mode_changed', { mode: settings.titleMode })
  }
  if (typeof settings.careNotifications === 'boolean' && settings.careNotifications !== previous.careNotifications) {
    trackEvent('notifications_toggled', { enabled: settings.careNotifications })
  }
}

function handleImportBackup(code: string): boolean {
  const purchases = pet.importPetBackup(code)
  const ok = purchases !== null
  if (purchases?.length) shop.addEntitlements(purchases)
  trackEvent('backup_imported', { ok })

  return ok
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
  if (isDocumentVisible.value) pet.applyLiveDecay()
}

function handleColorSchemeChange(event: MediaQueryListEvent): void {
  prefersDark.value = event.matches
}
</script>

<template>
  <div class="app-shell" :style="themeStyle">
    <header class="topbar">
      <div class="brand">
        <img class="brand-mark" :src="brandIcon" alt="" aria-hidden="true">
        <div>
          <h1>{{ messages.app.name }}</h1>
          <p>{{ messages.app.tagline }}</p>
        </div>
      </div>

      <div class="topbar-actions">
        <div class="tab-preview" aria-live="polite">
          <img class="tab-preview__icon" :src="faviconDataUrl" alt="" aria-hidden="true">
          <span class="tab-preview__title">{{ tabPresentation.title }}</span>
          <span class="tab-preview__close" aria-hidden="true">×</span>
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

    <main class="app-grid" :class="{ 'app-grid--setup': pet.isReady.value && !currentPet }">
      <section class="main-panel" aria-labelledby="pet-panel-title">
        <div v-if="!pet.isReady.value" class="empty-panel">
          <p class="eyebrow">{{ messages.app.loading }}</p>
          <h2 id="pet-panel-title">{{ messages.app.restoring }}</h2>
        </div>

        <PetSetup
          v-else-if="!currentPet"
          id="pet-panel-title"
          :title-mode="effectiveSettings.titleMode"
          @select="handleSpeciesSelect"
          @update-settings="handleSettingsUpdate"
        />

        <template v-else>
          <PetStatusPanel
            :species="currentPet.species"
            :name="currentPet.name"
            :stats="currentPet.stats"
            :status="effectiveStatus"
            :theme-id="resolvedThemeId"
            :level="currentPet.growth.level"
            :active-reaction="pet.activeReaction.value"
            :care-feedback="pet.lastCareFeedback.value"
            :outfit="ownedOutfit"
          />
          <PetReturnReport
            :report="pet.returnReport.value"
            :pet-name="currentPet.name"
          />
          <PetActions
            :stats="currentPet.stats"
            :last-played-at="currentPet.lastPlayedAt"
            :cooldowns="pet.actionCooldowns.value"
            :active-reaction="pet.activeReaction.value"
            :action-limit-info="pet.actionLimitInfo.value"
            :care-feedback="pet.lastCareFeedback.value"
            :action-limit-reward-feedback="pet.actionLimitRewardFeedback.value"
            :recommended-care-action="pet.recommendedCareAction.value"
            :recommended-care-reward-preview="pet.recommendedCareRewardPreview.value"
            :level-progress="pet.levelProgress.value"
            @action="handleAction"
            @reward-ad="handleRecharge"
          />
          <PinTabTip />
        </template>
      </section>

      <aside
        v-if="currentPet"
        id="tab-settings"
        ref="sidePanelElement"
        class="side-stack"
        :aria-label="messages.app.settingsLabel"
      >
        <PetSidePanel
          v-if="currentPet && pet.levelProgress.value && pet.affinityProgress.value && pet.dailyGoal.value"
          :mode="pet.sidePanelMode.value"
          :species="currentPet.species"
          :name="currentPet.name"
          :level="currentPet.growth.level"
          :level-progress="pet.levelProgress.value"
          :affinity-progress="pet.affinityProgress.value"
          :daily-goal="pet.dailyGoal.value"
          :daily-goal-reward-feedback="pet.dailyGoalRewardFeedback.value"
          :streak="pet.streakInfo.value"
          :backup-code="backupCode"
          :import-backup="handleImportBackup"
          :personality="currentPet.personality"
          :settings="effectiveSettings"
          @set-mode="pet.setSidePanelMode"
          @update-name="pet.updatePetName"
          @update-settings="handleSettingsUpdate"
          @claim-daily-goal="handleClaimDailyGoal"
          @reset="pet.resetPet"
        />
        <GuidePanel v-if="currentPet" />
      </aside>
    </main>

    <footer class="app-footer">
      <span>
        {{ messages.app.footerNote }}
        <a class="app-footer__link" href="/privacy.html" target="_blank" rel="noopener">{{ messages.privacy.link }}</a>
      </span>
      <LocaleSwitcher
        :selected-locale="locale"
        :label="messages.locale.label"
        @select="handleLocaleSelect"
      />
    </footer>

    <div
      v-if="purchaseNoticeText"
      class="app-toast"
      :class="`app-toast--${purchases.notice.value?.kind}`"
      role="status"
    >
      <span>{{ purchaseNoticeText }}</span>
      <button type="button" @click="purchases.dismissNotice">{{ messages.shop.dismiss }}</button>
    </div>

    <p v-if="pet.storageError.value" class="storage-warning" role="status">
      {{ messages.app.storageWarning }} {{ pet.storageError.value }}
    </p>
  </div>
</template>
