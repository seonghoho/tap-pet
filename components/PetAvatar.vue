<script setup lang="ts">
import { computed } from 'vue'
import type { PetSpecies, PetStatus, ThemeId } from '~/types/pet'
import { getThemeById } from '~/utils/theme'

const props = withDefaults(
  defineProps<{
    species: PetSpecies
    status: PetStatus
    themeId: ThemeId
    ariaLabel?: string
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)

const theme = computed(() => getThemeById(props.themeId))
const baseColor = computed(() => theme.value.statusColors[props.status])
const contrastColor = computed(() => theme.value.colors.petContrast)
</script>

<template>
  <svg
    class="pet-avatar"
    :class="{ 'pet-avatar--compact': compact }"
    viewBox="0 0 160 160"
    role="img"
    :aria-label="ariaLabel ?? `${species} is ${status}`"
  >
    <rect
      x="8"
      y="8"
      width="144"
      height="144"
      rx="24"
      :fill="theme.colors.surfaceStrong"
    />

    <template v-if="species === 'cat'">
      <path
        d="M38 59 L53 28 L68 59"
        :fill="baseColor"
        :stroke="contrastColor"
        stroke-width="6"
        stroke-linejoin="round"
      />
      <path
        d="M92 59 L107 28 L122 59"
        :fill="baseColor"
        :stroke="contrastColor"
        stroke-width="6"
        stroke-linejoin="round"
      />
    </template>

    <template v-else>
      <path
        d="M41 66 C24 70 19 91 33 105 C43 115 55 100 54 76"
        :fill="baseColor"
        :stroke="contrastColor"
        stroke-width="6"
      />
      <path
        d="M119 66 C136 70 141 91 127 105 C117 115 105 100 106 76"
        :fill="baseColor"
        :stroke="contrastColor"
        stroke-width="6"
      />
    </template>

    <circle
      cx="80"
      cy="83"
      r="50"
      :fill="baseColor"
      :stroke="contrastColor"
      stroke-width="6"
    />

    <template v-if="status === 'sleepy'">
      <path d="M50 77 H68" :stroke="contrastColor" stroke-width="8" stroke-linecap="round" />
      <path d="M92 77 H110" :stroke="contrastColor" stroke-width="8" stroke-linecap="round" />
      <path d="M67 107 C75 113 85 113 93 107" fill="none" :stroke="contrastColor" stroke-width="6" stroke-linecap="round" />
    </template>

    <template v-else-if="status === 'dirty'">
      <circle cx="58" cy="77" r="6" :fill="contrastColor" />
      <circle cx="102" cy="77" r="6" :fill="contrastColor" />
      <path d="M61 112 C71 99 89 99 99 112" fill="none" :stroke="contrastColor" stroke-width="6" stroke-linecap="round" />
    </template>

    <template v-else-if="status === 'bored'">
      <path d="M51 77 H68" :stroke="contrastColor" stroke-width="8" stroke-linecap="round" />
      <path d="M92 77 H109" :stroke="contrastColor" stroke-width="8" stroke-linecap="round" />
      <path d="M64 107 H96" :stroke="contrastColor" stroke-width="6" stroke-linecap="round" />
    </template>

    <template v-else-if="status === 'hungry'">
      <circle cx="58" cy="77" r="6" :fill="contrastColor" />
      <circle cx="102" cy="77" r="6" :fill="contrastColor" />
      <ellipse cx="80" cy="111" rx="10" ry="14" fill="none" :stroke="contrastColor" stroke-width="6" />
    </template>

    <template v-else-if="status === 'excited'">
      <circle cx="58" cy="77" r="8" :fill="contrastColor" />
      <circle cx="102" cy="77" r="8" :fill="contrastColor" />
      <path d="M58 103 C68 121 92 121 102 103" fill="none" :stroke="contrastColor" stroke-width="8" stroke-linecap="round" />
      <path d="M121 38 L127 49 L139 51 L130 59 L132 71 L121 65 L110 71 L112 59 L103 51 L115 49 Z" :fill="contrastColor" />
    </template>

    <template v-else>
      <circle cx="58" cy="77" r="6" :fill="contrastColor" />
      <circle cx="102" cy="77" r="6" :fill="contrastColor" />
      <path d="M61 103 C72 115 88 115 99 103" fill="none" :stroke="contrastColor" stroke-width="6" stroke-linecap="round" />
    </template>
  </svg>
</template>
