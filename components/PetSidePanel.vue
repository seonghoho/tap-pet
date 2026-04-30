<script setup lang="ts">
import type { PetAction, PetSettings, PetSpecies, PetStats, PetStatus } from '~/types/pet'
import type { ProgressInfo, AffinityProgressInfo } from '~/utils/petGrowth'

defineProps<{
  mode: 'status' | 'settings'
  species: PetSpecies
  name: string
  status: PetStatus
  stats: PetStats
  level: number
  levelProgress: ProgressInfo
  affinityProgress: AffinityProgressInfo
  settings: PetSettings
  activeReaction?: PetAction | null
}>()

const emit = defineEmits<{
  setMode: [mode: 'status' | 'settings']
  updateName: [name: string]
  updateSettings: [settings: Partial<PetSettings>]
}>()

const { messages } = useLocale()
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
        <p class="eyebrow">{{ messages.species[species].label }}</p>
        <h2>{{ name }}</h2>
        <p>{{ messages.status.labels[status] }}</p>
      </div>

      <PetStatusPanel
        :species="species"
        :stats="stats"
        :status="status"
        :theme-id="settings.themeId"
        :active-reaction="activeReaction"
      />

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
    />
  </section>
</template>
