<script setup lang="ts">
import { computed } from 'vue'
import type {
  PetDailyGoalRewardFeedback,
  PetDailyGoalState,
  PetLevelUnlock,
  PetPersonalityState,
  PetSettings,
} from '~/types/pet'
import { getExperienceMultiplier } from '~/utils/petGrowth'
import type { ProgressInfo, AffinityProgressInfo } from '~/utils/petGrowth'
import { getAvailableLevelUnlocks, getNextLevelUnlock } from '~/utils/petLevelUnlocks'
import { getPetPersonalityProgress } from '~/utils/petPersonality'

const props = defineProps<{
  mode: 'status' | 'settings'
  name: string
  level: number
  levelProgress: ProgressInfo
  affinityProgress: AffinityProgressInfo
  dailyGoal: PetDailyGoalState
  dailyGoalRewardFeedback: PetDailyGoalRewardFeedback | null
  personality: PetPersonalityState
  settings: PetSettings
}>()

const emit = defineEmits<{
  setMode: [mode: 'status' | 'settings']
  updateName: [name: string]
  updateSettings: [settings: Partial<PetSettings>]
  claimDailyGoal: []
  reset: []
}>()

const { messages } = useLocale()

const hasStartedFirstCareLoop = computed(() =>
  props.level > 1 ||
  props.levelProgress.current > 0 ||
  props.affinityProgress.level > 1 ||
  props.affinityProgress.current > 0,
)
const firstCareGoalCopy = computed(() =>
  hasStartedFirstCareLoop.value
    ? messages.value.firstCareGoal.repeat
    : messages.value.firstCareGoal,
)
const levelGoalRemaining = computed(() =>
  Math.max(0, props.levelProgress.required - props.levelProgress.current),
)
const affinityGoalRemaining = computed(() =>
  Math.max(0, props.affinityProgress.required - props.affinityProgress.current),
)
const levelGoalText = computed(() => {
  if (levelGoalRemaining.value <= 0) return messages.value.sidePanelProgress.goalComplete

  return messages.value.sidePanelProgress.levelGoalRemaining
    .replace('{level}', String(props.level + 1))
    .replace('{remaining}', String(levelGoalRemaining.value))
    .replace('{exp}', messages.value.stats.exp)
})
const affinityGoalText = computed(() => {
  if (affinityGoalRemaining.value <= 0) return messages.value.sidePanelProgress.goalComplete

  return messages.value.sidePanelProgress.affinityGoalRemaining
    .replace('{level}', String(props.affinityProgress.level + 1))
    .replace('{remaining}', String(affinityGoalRemaining.value))
})
const currentAffinityBonus = computed(() => getExperienceMultiplier(props.affinityProgress.level))
const nextAffinityBonus = computed(() => getExperienceMultiplier(props.affinityProgress.level + 1))
const affinityGoalDetail = computed(() => {
  const template = currentAffinityBonus.value === nextAffinityBonus.value
    ? messages.value.sidePanelProgress.affinityGoalMaxDetail
    : messages.value.sidePanelProgress.affinityGoalDetail

  return template
    .replace('{current}', String(props.affinityProgress.current))
    .replace('{required}', String(props.affinityProgress.required))
    .replace('{currentBonus}', formatMultiplier(currentAffinityBonus.value))
    .replace('{nextBonus}', formatMultiplier(nextAffinityBonus.value))
})
const progressGoalRows = computed(() => [
  {
    id: 'level' as const,
    label: messages.value.sidePanelProgress.levelGoalLabel,
    text: levelGoalText.value,
    detail: formatGoalProgress(props.levelProgress.current, props.levelProgress.required),
  },
  {
    id: 'affinity' as const,
    label: messages.value.sidePanelProgress.affinityGoalLabel,
    text: affinityGoalText.value,
    detail: affinityGoalDetail.value,
  },
])
const personalityProgress = computed(() => getPetPersonalityProgress(props.personality))
const assignedPersonality = computed(() => props.personality.personality)
const personalityName = computed(() => {
  const personality = assignedPersonality.value

  return personality
    ? messages.value.personality.personalities[personality].name
    : messages.value.personality.formingName
})
const personalityDetail = computed(() => {
  const personality = assignedPersonality.value

  if (personality) return messages.value.personality.personalities[personality].detail

  return messages.value.personality.formingDetail.replace(
    '{remaining}',
    String(personalityProgress.value.remaining),
  )
})
const personalityProgressText = computed(() =>
  messages.value.personality.progress
    .replace('{current}', String(personalityProgress.value.current))
    .replace('{required}', String(personalityProgress.value.required)),
)
const personalityBonusText = computed(() => {
  const personality = assignedPersonality.value

  return personality ? messages.value.personality.personalities[personality].bonus : personalityProgressText.value
})
const availableLevelUnlocks = computed(() => getAvailableLevelUnlocks(props.level))
const nextLevelUnlock = computed(() => getNextLevelUnlock(props.level))

function formatGoalProgress(current: number, required: number): string {
  return messages.value.sidePanelProgress.goalProgressDetail
    .replace('{current}', String(current))
    .replace('{required}', String(required))
}

function formatMultiplier(multiplier: number): string {
  return multiplier.toFixed(1)
}

function getLevelUnlockName(unlock: PetLevelUnlock): string {
  return messages.value.levelUnlocks.rewards[unlock.id].name
}

function getLevelUnlockDetail(unlock: PetLevelUnlock): string {
  return messages.value.levelUnlocks.rewards[unlock.id].detail
}

function getLevelUnlockRequirement(unlock: PetLevelUnlock): string {
  return messages.value.levelUnlocks.levelRequirement.replace(
    '{level}',
    String(unlock.requiredLevel),
  )
}
</script>

<template>
  <section class="pet-side-panel">
    <div class="pet-side-panel__tabs" role="group" :aria-label="messages.app.settingsLabel">
      <button
        class="pet-side-panel__tab"
        :class="{ 'pet-side-panel__tab--active': mode === 'status' }"
        type="button"
        :aria-pressed="mode === 'status'"
        @click="emit('setMode', 'status')"
      >
        {{ messages.settings.statusTab }}
      </button>
      <button
        class="pet-side-panel__tab"
        :class="{ 'pet-side-panel__tab--active': mode === 'settings' }"
        type="button"
        :aria-pressed="mode === 'settings'"
        @click="emit('setMode', 'settings')"
      >
        {{ messages.settings.settingsTab }}
      </button>
    </div>

    <div v-if="mode === 'status'" class="pet-side-panel__body">
      <div class="section-heading">
        <p class="eyebrow">{{ messages.settings.statusTab }}</p>
        <h2>{{ name }}</h2>
        <p>
          {{ messages.stats.level }} {{ level }} ·
          {{ messages.stats.affinity }} {{ affinityProgress.level }}
        </p>
      </div>

      <section
        class="first-care-goal"
        :class="{ 'first-care-goal--repeat': hasStartedFirstCareLoop }"
        aria-labelledby="first-care-goal-title"
      >
        <div class="first-care-goal__copy">
          <span>{{ firstCareGoalCopy.eyebrow }}</span>
          <strong id="first-care-goal-title">{{ firstCareGoalCopy.title }}</strong>
          <small>{{ firstCareGoalCopy.description }}</small>
        </div>

        <ol class="first-care-goal__list" role="list">
          <li
            v-for="step in firstCareGoalCopy.steps"
            :key="step.id"
            class="first-care-goal__step"
          >
            <span>{{ step.label }}</span>
          </li>
        </ol>
      </section>

      <PetDailyGoal
        :daily-goal="dailyGoal"
        :reward-feedback="dailyGoalRewardFeedback"
        @claim="emit('claimDailyGoal')"
      />

      <section class="pet-personality" aria-labelledby="pet-personality-title">
        <div class="pet-personality__copy">
          <span>{{ messages.personality.heading }}</span>
          <strong id="pet-personality-title">{{ personalityName }}</strong>
          <small>{{ personalityDetail }}</small>
        </div>

        <p class="pet-personality__bonus">
          {{ personalityBonusText }}
        </p>
        <span
          class="pet-personality__progress"
          role="progressbar"
          :aria-label="personalityProgressText"
          :aria-valuemin="0"
          :aria-valuenow="personalityProgress.current"
          :aria-valuemax="personalityProgress.required"
        />
      </section>

      <section class="progress-goals" aria-labelledby="progress-goals-title">
        <div class="progress-goals__copy">
          <strong id="progress-goals-title">{{ messages.sidePanelProgress.progressGoalHeading }}</strong>
        </div>

        <div class="progress-goals__list">
          <div
            v-for="goal in progressGoalRows"
            :key="goal.id"
            class="progress-goal"
          >
            <span>{{ goal.label }}</span>
            <strong>{{ goal.text }}</strong>
            <small>{{ goal.detail }}</small>
          </div>
        </div>
      </section>

      <section class="level-unlocks" aria-labelledby="level-unlocks-title">
        <div class="level-unlocks__copy">
          <strong id="level-unlocks-title">{{ messages.levelUnlocks.heading }}</strong>
          <small>{{ messages.levelUnlocks.description }}</small>
        </div>

        <div class="level-unlocks__list">
          <div
            v-for="unlock in availableLevelUnlocks"
            :key="unlock.id"
            class="level-unlock"
          >
            <span>{{ messages.levelUnlocks.availableLabel }} · {{ getLevelUnlockRequirement(unlock) }}</span>
            <strong>{{ getLevelUnlockName(unlock) }}</strong>
            <small>{{ getLevelUnlockDetail(unlock) }}</small>
          </div>

          <div
            v-if="nextLevelUnlock"
            class="level-unlock level-unlock--next"
          >
            <span>{{ messages.levelUnlocks.nextLabel }} · {{ getLevelUnlockRequirement(nextLevelUnlock) }}</span>
            <strong>{{ getLevelUnlockName(nextLevelUnlock) }}</strong>
            <small>{{ getLevelUnlockDetail(nextLevelUnlock) }}</small>
          </div>
        </div>

        <p v-if="!nextLevelUnlock" class="level-unlocks__complete">
          {{ messages.levelUnlocks.allUnlocked }}
        </p>
      </section>

      <div class="progress-list">
        <div class="stat-row">
          <div class="stat-row__label">
            <span>{{ messages.stats.level }} {{ level }}</span>
            <strong>{{ levelProgress.current }} / {{ levelProgress.required }} {{ messages.stats.exp }}</strong>
          </div>
          <div class="stat-track" aria-hidden="true">
            <div class="stat-fill" :style="{ width: `${levelProgress.percent}%` }" />
          </div>
        </div>

        <div class="stat-row">
          <div class="stat-row__label">
            <span>{{ messages.stats.affinity }} {{ affinityProgress.level }}</span>
            <strong>{{ affinityProgress.current }} / {{ affinityProgress.required }}</strong>
          </div>
          <div class="stat-track" aria-hidden="true">
            <div class="stat-fill" :style="{ width: `${affinityProgress.percent}%` }" />
          </div>
        </div>
      </div>
    </div>

    <PetSettingsPanel
      v-else
      class="pet-side-panel__body"
      :name="name"
      :settings="settings"
      @update-name="emit('updateName', $event)"
      @update-settings="emit('updateSettings', $event)"
      @reset="emit('reset')"
    />
  </section>
</template>
