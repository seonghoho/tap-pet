<script setup lang="ts">
import { computed } from 'vue'
import type { PetAction } from '~/types/pet'
import { careIconMarkup } from '~/utils/careIcons'

// Illustrated care icon; the drawings live in utils/careIcons.ts (shared with the extension).
const props = defineProps<{
  action: PetAction
}>()

const markup = computed(() => careIconMarkup(props.action))
</script>

<template>
  <svg class="care-icon" viewBox="0 0 48 48" aria-hidden="true" v-html="markup" />
</template>
