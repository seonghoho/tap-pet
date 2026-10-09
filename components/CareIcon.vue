<script setup lang="ts">
import type { PetAction } from '~/types/pet'

defineProps<{
  action: PetAction
}>()
</script>

<template>
  <svg class="care-icon" viewBox="0 0 32 32" aria-hidden="true">
    <g
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <template v-if="action === 'feed'">
        <path d="M5 15h22c0 6.5-4.9 11-11 11S5 21.5 5 15Z" fill="var(--care-icon-fill)" />
        <path d="M11 11c0-2 2-2 2-4M16 11c0-2 2-2 2-4M21 11c0-2 2-2 2-4" />
      </template>
      <template v-else-if="action === 'play'">
        <circle cx="16" cy="16" r="10" fill="var(--care-icon-fill)" />
        <path d="M7 12.5c6 2 12 2 18 0M7.5 20c5.5-2 11.5-2 17 0" />
      </template>
      <template v-else-if="action === 'sleep'">
        <path d="M24 20.5A10 10 0 0 1 12 7a10 10 0 1 0 12 13.5Z" fill="var(--care-icon-fill)" />
        <path d="M20 6h4l-4 4h4" />
      </template>
      <template v-else>
        <path d="M16 4c4.5 6 8 10 8 14a8 8 0 0 1-16 0c0-4 3.5-8 8-14Z" fill="var(--care-icon-fill)" />
        <path d="M12.5 18.5a3.5 3.5 0 0 0 3.5 3.5" />
      </template>
    </g>
  </svg>
</template>
