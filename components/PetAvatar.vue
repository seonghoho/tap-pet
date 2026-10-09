<script setup lang="ts">
import { computed, useId } from 'vue'
import type { PetOutfitId, PetSpecies, PetStatus, ThemeId } from '~/types/pet'
import { renderPetArtSvg } from '~/utils/petArt'

const props = withDefaults(
  defineProps<{
    species: PetSpecies
    status: PetStatus
    themeId?: ThemeId
    ariaLabel?: string
    compact?: boolean
    outfit?: PetOutfitId | null
  }>(),
  {
    compact: false,
  },
)

const uid = useId()
const svg = computed(() =>
  renderPetArtSvg({
    species: props.species,
    status: props.status,
    idPrefix: `pet-${uid}`,
    outfit: props.outfit,
  }),
)
</script>

<template>
  <span
    class="pet-avatar"
    :class="{ 'pet-avatar--compact': compact }"
    role="img"
    :aria-label="ariaLabel ?? `${species} ${status}`"
    v-html="svg"
  />
</template>
