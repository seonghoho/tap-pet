<script setup lang="ts">
import { PET_THEMES } from '~/constants/themes'
import type { ThemeId } from '~/types/pet'

defineProps<{
  selectedId: ThemeId
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [themeId: ThemeId]
}>()
const { messages } = useLocale()
</script>

<template>
  <section class="control-panel" aria-labelledby="theme-picker-heading">
    <div class="control-panel__header">
      <h2 id="theme-picker-heading">{{ messages.themes.heading }}</h2>
      <p>{{ messages.themes.description }}</p>
    </div>

    <div class="theme-list">
      <button
        v-for="theme in PET_THEMES"
        :key="theme.id"
        class="theme-button"
        :class="{ 'theme-button--active': selectedId === theme.id }"
        type="button"
        :disabled="disabled"
        :aria-pressed="selectedId === theme.id"
        @click="emit('select', theme.id)"
      >
        <span
          class="theme-swatch"
          :style="{
            background: theme.colors.background,
            borderColor: theme.colors.border,
          }"
          aria-hidden="true"
        >
          <span :style="{ background: theme.colors.accent }" />
        </span>
        <span>
          <strong>{{ messages.themes[theme.id].name }}</strong>
          <small>{{ messages.themes[theme.id].description }}</small>
        </span>
      </button>
    </div>
  </section>
</template>
