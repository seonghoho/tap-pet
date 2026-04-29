<script setup lang="ts">
import { DISGUISE_TITLES, getDisguiseTitleLabel } from '~/constants/titles'
import type { DisguiseTitleId } from '~/types/pet'

defineProps<{
  selectedId: DisguiseTitleId
  disabled?: boolean
}>()
const { locale, messages } = useLocale()

const emit = defineEmits<{
  select: [titleId: DisguiseTitleId]
}>()
</script>

<template>
  <section class="control-panel" aria-labelledby="title-picker-heading">
    <div class="control-panel__header">
      <h2 id="title-picker-heading">{{ messages.titles.heading }}</h2>
      <p>{{ messages.titles.description }}</p>
    </div>

    <div class="choice-list">
      <button
        v-for="title in DISGUISE_TITLES"
        :key="title.id"
        class="choice-button"
        :class="{ 'choice-button--active': selectedId === title.id }"
        type="button"
        :disabled="disabled"
        :aria-pressed="selectedId === title.id"
        @click="emit('select', title.id)"
      >
        {{ getDisguiseTitleLabel(title.id, locale) }}
      </button>
    </div>
  </section>
</template>
