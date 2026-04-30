import { computed, getCurrentInstance, onBeforeUnmount, onMounted, readonly } from 'vue'
import type { Ref } from 'vue'
import { useState } from '#app'
import { ACTION_COOLDOWN_MS, DEFAULT_SETTINGS } from '~/constants/pet'
import type {
  DisguiseTitleId,
  PetAction,
  PetSettings,
  PetSpecies,
  PetState,
  ThemeId,
} from '~/types/pet'
import { applyCareAction } from '~/utils/petCare'
import { createInitialPetState } from '~/utils/petFactory'
import { getAffinityProgress, getLevelProgress } from '~/utils/petGrowth'
import { getPetStatus } from '~/utils/petStatus'
import { isDisguiseTitleId, isPetSpecies, isThemeId } from '~/utils/petValidation'

type SidePanelMode = 'status' | 'settings'
type ActionScheduler = (callback: () => void) => void
type PetStoreOptions = {
  scheduleAction?: ActionScheduler
}

const ACTION_REACTION_DELAY_MS = 900
const CLOCK_UPDATE_INTERVAL_MS = 1000 * 60

let clockIntervalId: number | null = null
let clockSubscriberCount = 0

export function usePetStore(options: PetStoreOptions = {}) {
  const storage = useLocalPetStorage()
  const petState = useState<PetState | null>('tab-pet:pet-state', () => null)
  const isReady = useState<boolean>('tab-pet:is-ready', () => false)
  const hasRestored = useState<boolean>('tab-pet:has-restored', () => false)
  const now = useState<number>('tab-pet:now', () => Date.now())
  const draftSettings = useState<PetSettings>('tab-pet:draft-settings', () => ({
    ...DEFAULT_SETTINGS,
  }))
  const actionCooldowns = useState<Record<PetAction, number>>('tab-pet:action-cooldowns', () => ({
    feed: 0,
    play: 0,
    sleep: 0,
    wash: 0,
  }))
  const activeReaction = useState<PetAction | null>('tab-pet:active-reaction', () => null)
  const sidePanelMode = useState<SidePanelMode>('tab-pet:side-panel-mode', () => 'status')
  const actionGeneration = useState<number>('tab-pet:action-generation', () => 0)
  const latestActionRunId = useState<number>('tab-pet:latest-action-run-id', () => 0)

  usePetClock(now)

  const activeSettings = computed(() => petState.value?.settings ?? draftSettings.value)
  const draftDisguiseTitleId = computed(() => activeSettings.value.disguiseTitleId)
  const draftThemeId = computed(() => activeSettings.value.themeId)

  const petStatus = computed(() => {
    if (!petState.value) return null

    return getPetStatus(petState.value.stats, petState.value.lastPlayedAt, now.value)
  })
  const levelProgress = computed(() =>
    petState.value ? getLevelProgress(petState.value.growth) : null,
  )
  const affinityProgress = computed(() =>
    petState.value ? getAffinityProgress(petState.value.growth.affinityExp) : null,
  )

  function restorePet(): void {
    if (!import.meta.client || hasRestored.value) return

    petState.value = storage.loadPetState()
    hasRestored.value = true
    isReady.value = true
  }

  function initializePet(species: PetSpecies): void {
    if (!isPetSpecies(species)) return

    actionGeneration.value += 1
    latestActionRunId.value += 1
    activeReaction.value = null
    commitState(
      createInitialPetState(species, Date.now(), {
        settings: {
          ...draftSettings.value,
        },
      }),
    )
  }

  function performAction(action: PetAction): void {
    if (!petState.value || isActionCoolingDown(action)) return

    const startedAt = Date.now()
    actionCooldowns.value = {
      ...actionCooldowns.value,
      [action]: startedAt + ACTION_COOLDOWN_MS[action],
    }
    activeReaction.value = action
    const pendingGeneration = actionGeneration.value
    const actionRunId = latestActionRunId.value + 1
    latestActionRunId.value = actionRunId

    const resolveAction = () => {
      if (!petState.value || actionGeneration.value !== pendingGeneration) return

      const result = applyCareAction({
        stats: petState.value.stats,
        growth: petState.value.growth,
        action,
      })
      const resolvedAt = Date.now()

      commitState({
        ...petState.value,
        stats: result.stats,
        growth: result.growth,
        lastPlayedAt: action === 'play' ? resolvedAt : petState.value.lastPlayedAt,
      })
      if (latestActionRunId.value === actionRunId && activeReaction.value === action) {
        activeReaction.value = null
      }
    }

    scheduleCareAction(resolveAction)
  }

  function updatePetName(name: string): void {
    const trimmedName = name.trim()
    if (!trimmedName || !petState.value) return

    commitState({
      ...petState.value,
      name: trimmedName,
    })
  }

  function updatePetSettings(settings: Partial<PetSettings>): void {
    const nextSettings = getValidSettingsPatch(settings)
    if (Object.keys(nextSettings).length === 0) return

    if (!petState.value) {
      draftSettings.value = {
        ...draftSettings.value,
        ...nextSettings,
      }
      return
    }

    commitState({
      ...petState.value,
      settings: {
        ...petState.value.settings,
        ...nextSettings,
      },
    })
  }

  function setSidePanelMode(mode: SidePanelMode): void {
    if (!isSidePanelMode(mode)) return

    sidePanelMode.value = mode
  }

  function isActionCoolingDown(action: PetAction): boolean {
    return Date.now() < actionCooldowns.value[action]
  }

  function setDisguiseTitle(disguiseTitleId: DisguiseTitleId): void {
    updatePetSettings({ disguiseTitleId })
  }

  function setTheme(themeId: ThemeId): void {
    updatePetSettings({ themeId })
  }

  function resetPet(): void {
    actionGeneration.value += 1
    latestActionRunId.value += 1
    petState.value = null
    draftSettings.value = { ...DEFAULT_SETTINGS }
    actionCooldowns.value = {
      feed: 0,
      play: 0,
      sleep: 0,
      wash: 0,
    }
    activeReaction.value = null
    sidePanelMode.value = 'status'
    storage.clearPetState()
  }

  function commitState(nextState: PetState): void {
    const currentTime = Date.now()
    now.value = currentTime
    const committedState: PetState = {
      ...nextState,
      lastUpdatedAt: currentTime,
    }

    petState.value = committedState
    storage.savePetState(committedState, currentTime)
  }

  function scheduleCareAction(callback: () => void): void {
    if (options.scheduleAction) {
      options.scheduleAction(callback)
      return
    }

    if (import.meta.client) {
      window.setTimeout(callback, ACTION_REACTION_DELAY_MS)
      return
    }

    callback()
  }

  return {
    petState: readonly(petState),
    draftDisguiseTitleId: readonly(draftDisguiseTitleId),
    draftThemeId: readonly(draftThemeId),
    isReady: readonly(isReady),
    petStatus,
    levelProgress,
    affinityProgress,
    actionCooldowns: readonly(actionCooldowns),
    activeReaction: readonly(activeReaction),
    sidePanelMode: readonly(sidePanelMode),
    storageError: storage.storageError,
    restorePet,
    initializePet,
    performAction,
    updatePetName,
    updatePetSettings,
    setSidePanelMode,
    isActionCoolingDown,
    setDisguiseTitle,
    setTheme,
    resetPet,
  }
}

function usePetClock(now: Ref<number>): void {
  if (!import.meta.client || !getCurrentInstance()) return

  onMounted(() => {
    now.value = Date.now()
    clockSubscriberCount += 1

    if (clockIntervalId !== null) return

    clockIntervalId = window.setInterval(() => {
      now.value = Date.now()
    }, CLOCK_UPDATE_INTERVAL_MS)
  })

  onBeforeUnmount(() => {
    clockSubscriberCount = Math.max(0, clockSubscriberCount - 1)
    if (clockSubscriberCount > 0 || clockIntervalId === null) return

    window.clearInterval(clockIntervalId)
    clockIntervalId = null
  })
}

function isSidePanelMode(mode: unknown): mode is SidePanelMode {
  return mode === 'status' || mode === 'settings'
}

function getValidSettingsPatch(settings: Partial<PetSettings>): Partial<PetSettings> {
  const nextSettings: Partial<PetSettings> = {}

  if (settings.titleMode === 'status' || settings.titleMode === 'disguise') {
    nextSettings.titleMode = settings.titleMode
  }

  if (settings.titleVisibility === 'inactive-only' || settings.titleVisibility === 'always') {
    nextSettings.titleVisibility = settings.titleVisibility
  }

  if (isDisguiseTitleId(settings.disguiseTitleId)) {
    nextSettings.disguiseTitleId = settings.disguiseTitleId
  }

  if (typeof settings.customDisguiseTitle === 'string') {
    nextSettings.customDisguiseTitle = settings.customDisguiseTitle
  }

  if (typeof settings.titleAnimationEnabled === 'boolean') {
    nextSettings.titleAnimationEnabled = settings.titleAnimationEnabled
  }

  if (isThemeId(settings.themeId)) {
    nextSettings.themeId = settings.themeId
  }

  return nextSettings
}
