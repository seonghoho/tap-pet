<script setup lang="ts">
import { computed } from 'vue'
import type { PetSettings } from '~/types/pet'
import type { ProgressInfo, AffinityProgressInfo } from '~/utils/petGrowth'

const props = defineProps<{
  mode: 'status' | 'settings'
  name: string
  level: number
  levelProgress: ProgressInfo
  affinityProgress: AffinityProgressInfo
  settings: PetSettings
}>()

const emit = defineEmits<{
  setMode: [mode: 'status' | 'settings']
  updateName: [name: string]
  updateSettings: [settings: Partial<PetSettings>]
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
    detail: formatGoalProgress(props.affinityProgress.current, props.affinityProgress.required),
  },
])

function formatGoalProgress(current: number, required: number): string {
  return messages.value.sidePanelProgress.goalProgressDetail
    .replace('{current}', String(current))
    .replace('{required}', String(required))
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
