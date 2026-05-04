<script setup lang="ts">
import { computed } from 'vue'
import type { PetSpecies, PetStatus, ThemeId } from '~/types/pet'
import type { PetPixelColor } from '~/utils/petPixelSprite'
import {
  getPetPixelPalette,
  getPetPixelSpriteCells,
} from '~/utils/petPixelSprite'
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
const pixelPalette = computed(() =>
  getPetPixelPalette({
    body: baseColor.value,
    contrast: contrastColor.value,
    accent: theme.value.statusColors.excited,
    dirt: theme.value.colors.warning,
    bubble: theme.value.statusColors.sleepy,
  }),
)
const pixelCells = computed(() =>
  getPetPixelSpriteCells({
    species: props.species,
    status: props.status,
  }),
)

function getCellFill(color: PetPixelColor): string {
  return pixelPalette.value[color]
}
</script>

<template>
  <svg
    class="pet-avatar"
    :class="{ 'pet-avatar--compact': compact }"
    viewBox="0 0 24 24"
    shape-rendering="crispEdges"
    role="img"
    :aria-label="ariaLabel ?? `${species} is ${status}`"
  >
    <rect
      v-for="(cell, index) in pixelCells"
      :key="`${cell.role}-${index}-${cell.x}-${cell.y}`"
      :x="cell.x"
      :y="cell.y"
      :width="cell.width"
      :height="cell.height"
      :fill="getCellFill(cell.color)"
    />
  </svg>
</template>
