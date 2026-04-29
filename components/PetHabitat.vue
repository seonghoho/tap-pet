<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  DEFAULT_HABITAT_POSITION,
  STATUS_HABITAT_BOUNDS,
  STATUS_HABITAT_MOTION,
} from '~/constants/habitat'
import type { PetSpecies, PetStatus, ThemeId } from '~/types/pet'
import { getThemeById } from '~/utils/theme'

type Direction = 'left' | 'right'
type HabitatPosition = {
  x: number
  y: number
  direction: Direction
}

const props = defineProps<{
  species: PetSpecies
  status: PetStatus
  themeId: ThemeId
  avatarLabel: string
}>()

const theme = computed(() => getThemeById(props.themeId))
const isReducedMotion = ref(false)
const position = ref<HabitatPosition>({
  ...DEFAULT_HABITAT_POSITION,
  direction: 'right',
})

let moveTimer: ReturnType<typeof setInterval> | null = null
let motionQuery: MediaQueryList | null = null

const motion = computed(() => STATUS_HABITAT_MOTION[props.status])
const habitatStyle = computed<Record<string, string>>(() => ({
  '--habitat-accent': theme.value.statusColors[props.status],
  '--habitat-surface': theme.value.colors.surfaceStrong,
  '--habitat-border': theme.value.colors.border,
  '--habitat-muted': theme.value.colors.muted,
  '--pet-x': `${position.value.x}%`,
  '--pet-y': `${position.value.y}%`,
  '--pet-speed': isReducedMotion.value ? '0ms' : `${motion.value.speedMs}ms`,
}))

const shouldBounce = computed(() => props.status === 'excited' && !isReducedMotion.value)

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  isReducedMotion.value = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionPreferenceChange)
  startMotion()
})

onBeforeUnmount(() => {
  stopMotion()
  motionQuery?.removeEventListener('change', handleMotionPreferenceChange)
})

watch(
  () => props.status,
  () => {
    moveWithinStatusBounds()
    startMotion()
  },
)

function handleMotionPreferenceChange(event: MediaQueryListEvent): void {
  isReducedMotion.value = event.matches
  startMotion()
}

function startMotion(): void {
  stopMotion()

  if (isReducedMotion.value) return

  moveWithinStatusBounds()
  moveTimer = setInterval(moveWithinStatusBounds, motion.value.intervalMs)
}

function stopMotion(): void {
  if (!moveTimer) return

  clearInterval(moveTimer)
  moveTimer = null
}

function moveWithinStatusBounds(): void {
  const bounds = STATUS_HABITAT_BOUNDS[props.status]
  const nextX = randomWithin(bounds.minX, bounds.maxX)
  const nextY = randomWithin(bounds.minY, bounds.maxY)

  position.value = {
    x: nextX,
    y: nextY,
    direction: nextX >= position.value.x ? 'right' : 'left',
  }
}

function randomWithin(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10
}
</script>

<template>
  <div
    class="pet-habitat"
    :class="[`pet-habitat--${status}`, { 'pet-habitat--bounce': shouldBounce }]"
    :style="habitatStyle"
  >
    <div class="pet-habitat__back-wall" aria-hidden="true">
      <span class="pet-habitat__shelf" />
      <span class="pet-habitat__window" />
    </div>

    <div class="pet-habitat__floor" aria-hidden="true">
      <span class="pet-habitat__bowl" />
      <span class="pet-habitat__cushion" />
    </div>

    <div
      class="pet-habitat__pet"
      :class="{ 'pet-habitat__pet--left': position.direction === 'left' }"
    >
      <PetAvatar
        :species="species"
        :status="status"
        :theme-id="themeId"
        :aria-label="avatarLabel"
        compact
      />
      <span class="pet-habitat__shadow" aria-hidden="true" />
    </div>
  </div>
</template>
