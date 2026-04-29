<script setup lang="ts">
import { LOCALE_OPTIONS } from '~/constants/i18n'
import type { AppLocale } from '~/types/i18n'

defineProps<{
  selectedLocale: AppLocale
  label: string
}>()

const emit = defineEmits<{
  select: [locale: AppLocale]
}>()
</script>

<template>
  <div class="locale-switcher" :aria-label="label">
    <button
      v-for="option in LOCALE_OPTIONS"
      :key="option.id"
      class="locale-button"
      :class="{ 'locale-button--active': selectedLocale === option.id }"
      type="button"
      :aria-label="`${label}: ${option.label}`"
      :aria-pressed="selectedLocale === option.id"
      @click="emit('select', option.id)"
    >
      {{ option.nativeLabel }}
    </button>
  </div>
</template>
