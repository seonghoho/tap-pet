<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PET_OUTFITS } from '~/constants/shop'
import { PET_THEMES } from '~/constants/themes'
import { DISGUISE_TITLES, getDisguiseTitleLabel } from '~/constants/titles'
import type {
  DisguiseTitleId,
  PetOutfitId,
  PetSettings,
  PetSpecies,
  ThemeId,
  TitleMode,
  TitleVisibility,
} from '~/types/pet'

const props = defineProps<{
  name: string
  species?: PetSpecies
  settings: PetSettings
  backupCode?: string | null
  importBackup?: (code: string) => boolean
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
const notificationNotice = ref('')
const backupDraft = ref('')
const backupNotice = ref('')
const isBackupConfirming = ref(false)
const { copyText } = useClipboard()
const shop = useEntitlements()
const ownsOutfits = computed(() => shop.owns('outfit-pack'))
const ownsWorkTitles = computed(() => shop.owns('work-title-pack'))

function setOutfit(outfit: PetOutfitId | null): void {
  emit('updateSettings', { outfit })
  trackEvent('outfit_changed', { outfit: outfit ?? 'none' })
}
const analyticsConsent = useAnalyticsConsent()

function setAnalyticsSharing(event: Event): void {
  analyticsConsent.setOptedOut(!(event.target as HTMLInputElement | null)?.checked)
}
const canImportBackup = computed(() => backupDraft.value.trim().length > 0)

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

async function setCareNotifications(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement | null
  const enabled = Boolean(input?.checked)
  notificationNotice.value = ''

  if (!enabled) {
    emit('updateSettings', { careNotifications: false })
    return
  }

  if (!isNotificationSupported()) {
    if (input) input.checked = false
    notificationNotice.value = messages.value.notifications.unsupported
    return
  }

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission()

  if (permission !== 'granted') {
    if (input) input.checked = false
    notificationNotice.value = messages.value.notifications.denied
    return
  }

  emit('updateSettings', { careNotifications: true })
}

async function copyBackupCode(): Promise<void> {
  if (!props.backupCode) return

  const copied = await copyText(props.backupCode)
  backupNotice.value = copied ? messages.value.backup.copied : ''
  if (copied) trackEvent('backup_exported', {})
}

function requestBackupImport(): void {
  if (!canImportBackup.value) return

  backupNotice.value = ''
  isBackupConfirming.value = true
}

function confirmBackupImport(): void {
  isBackupConfirming.value = false
  const imported = props.importBackup?.(backupDraft.value) ?? false
  backupNotice.value = imported ? messages.value.backup.imported : messages.value.backup.invalid
  if (imported) backupDraft.value = ''
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

    <fieldset v-if="ownsOutfits && species" class="settings-fieldset">
      <legend>{{ messages.shop.outfitHeading }}</legend>
      <div class="outfit-list">
        <button
          class="outfit-button"
          :class="{ 'outfit-button--active': !settings.outfit }"
          type="button"
          :aria-pressed="!settings.outfit"
          @click="setOutfit(null)"
        >
          <PetAvatar :species="species" status="happy" compact />
          <span>{{ messages.shop.outfitNone }}</span>
        </button>
        <button
          v-for="outfit in PET_OUTFITS"
          :key="outfit"
          class="outfit-button"
          :class="{ 'outfit-button--active': settings.outfit === outfit }"
          type="button"
          :aria-pressed="settings.outfit === outfit"
          @click="setOutfit(outfit)"
        >
          <PetAvatar :species="species" status="happy" :outfit="outfit" compact />
          <span>{{ messages.shop.outfits[outfit] }}</span>
        </button>
      </div>
    </fieldset>

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
          :class="{
            'choice-button--active': settings.disguiseTitleId === title.id,
            'choice-button--locked': title.premium && !ownsWorkTitles,
          }"
          type="button"
          :disabled="title.premium && !ownsWorkTitles"
          :aria-pressed="settings.disguiseTitleId === title.id"
          @click="setDisguiseTitle(title.id)"
        >
          {{ getDisguiseTitleLabel(title.id, locale) }}
          <em v-if="title.premium && !ownsWorkTitles">{{ messages.shop.packLabel }}</em>
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


    <label class="settings-checkbox">
      <input
        type="checkbox"
        :checked="settings.titleAnimationEnabled"
        @change="setTitleAnimation"
      >
      <span>{{ messages.settings.titleAnimation }}</span>
    </label>

    <div class="settings-toggle-group">
      <label class="settings-checkbox">
        <input
          type="checkbox"
          :checked="settings.careNotifications === true"
          @change="setCareNotifications"
        >
        <span>{{ messages.notifications.toggle }}</span>
      </label>
      <small>{{ messages.notifications.hint }}</small>
      <small v-if="notificationNotice" class="settings-notice" role="status">{{ notificationNotice }}</small>
    </div>

    <div class="settings-toggle-group">
      <label class="settings-checkbox">
        <input
          type="checkbox"
          :checked="!analyticsConsent.optedOut.value"
          @change="setAnalyticsSharing"
        >
        <span>{{ messages.privacy.analytics }}</span>
      </label>
      <small>
        {{ messages.privacy.analyticsHint }}
        <a href="/privacy.html" target="_blank" rel="noopener">{{ messages.privacy.link }}</a>
      </small>
    </div>

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

    <ShopPanel v-if="species" :species="species" source="settings" />

    <section class="settings-backup" aria-labelledby="settings-backup-title">
      <div>
        <strong id="settings-backup-title">{{ messages.backup.heading }}</strong>
        <p>{{ messages.backup.description }}</p>
      </div>
      <button class="ghost-button" type="button" :disabled="!backupCode" @click="copyBackupCode">
        {{ messages.backup.copy }}
      </button>
      <textarea
        v-model="backupDraft"
        class="settings-input settings-backup__input"
        rows="2"
        :placeholder="messages.backup.placeholder"
        :aria-label="messages.backup.placeholder"
        spellcheck="false"
      />
      <template v-if="isBackupConfirming">
        <p class="settings-danger-zone__confirm">{{ messages.backup.confirm }}</p>
        <div class="settings-danger-zone__actions">
          <button class="ghost-button" type="button" @click="isBackupConfirming = false">
            {{ messages.settings.resetCancel }}
          </button>
          <button class="primary-button settings-backup__confirm" type="button" @click="confirmBackupImport">
            {{ messages.backup.import }}
          </button>
        </div>
      </template>
      <button
        v-else
        class="ghost-button"
        type="button"
        :disabled="!canImportBackup"
        @click="requestBackupImport"
      >
        {{ messages.backup.import }}
      </button>
      <small v-if="backupNotice" class="settings-notice" role="status">{{ backupNotice }}</small>
    </section>

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
