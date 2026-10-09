<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  DEFAULT_HABITAT_POSITION,
  STATUS_HABITAT_BOUNDS,
  STATUS_HABITAT_MOTION,
} from '~/constants/habitat'
import type { PetAction, PetCareFeedback, PetOutfitId, PetSpecies, PetStatus, ThemeId } from '~/types/pet'
import { getAvailableLevelUnlocks } from '~/utils/petLevelUnlocks'
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
  level: number
  activeReaction?: PetAction | null
  careFeedback?: PetCareFeedback | null
  petName?: string
  outfit?: PetOutfitId | null
}>()

const emit = defineEmits<{
  pet: []
}>()

const { messages } = useLocale()
const unlockedIds = computed(() => new Set(getAvailableLevelUnlocks(props.level).map((unlock) => unlock.id)))
const isPetting = ref(false)
let pettingTimer: ReturnType<typeof setTimeout> | null = null

// Petting is pure affection: no stats, no limits, just a squish and some hearts.
function petThePet(): void {
  isPetting.value = true
  if (pettingTimer) clearTimeout(pettingTimer)
  pettingTimer = setTimeout(() => {
    isPetting.value = false
  }, 900)
  emit('pet')
}
// The one or two numbers that matter, floated above the pet right after care.
const floatingGains = computed(() => {
  const feedback = props.careFeedback
  if (!feedback) return []

  const statGains = (['fullness', 'energy', 'cleanliness'] as const)
    .filter((key) => feedback.statChanges[key] > 0)
    .map((key) => `${messages.value.stats[key]} +${feedback.statChanges[key]}`)
  const affinity = feedback.gainedAffinityExp > 0
    ? [`${messages.value.stats.affinity} +${feedback.gainedAffinityExp}`]
    : []

  return [...statGains, ...affinity].slice(0, 2)
})

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
const shouldShowReactionSpark = computed(() =>
  Boolean(
    props.activeReaction &&
      getAvailableLevelUnlocks(props.level).some(
        (unlock) => unlock.id === 'habitat-reaction-spark',
      ),
  ),
)

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  isReducedMotion.value = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionPreferenceChange)
  startMotion()
})

onBeforeUnmount(() => {
  if (pettingTimer) clearTimeout(pettingTimer)
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
    :class="[
      `pet-habitat--${status}`,
      activeReaction ? `pet-habitat--reaction-${activeReaction}` : null,
      {
        'pet-habitat--bounce': shouldBounce,
        'pet-habitat--reaction-spark': shouldShowReactionSpark,
        'pet-habitat--petting': isPetting,
      },
    ]"
    :data-reaction="activeReaction ?? undefined"
    :style="habitatStyle"
  >
    <div class="pet-habitat__back-wall" aria-hidden="true">
      <span class="pet-habitat__shelf" />
      <span class="pet-habitat__window" />
      <svg
        v-if="unlockedIds.has('room-lights')"
        class="pet-habitat__item pet-habitat__item--lights"
        viewBox="0 0 600 46"
      >
        <path d="M0 6Q75 34 150 10T300 10T450 10T600 6" fill="none" stroke="#4a3934" stroke-width="2.5" />
        <g stroke="#4a3934" stroke-width="2">
          <circle cx="40" cy="20" r="7" fill="#ffd25e" />
          <circle cx="110" cy="24" r="7" fill="#ff9aa6" />
          <circle cx="190" cy="22" r="7" fill="#9fd3c7" />
          <circle cx="260" cy="14" r="7" fill="#ffd25e" />
          <circle cx="340" cy="22" r="7" fill="#ff9aa6" />
          <circle cx="410" cy="16" r="7" fill="#9fd3c7" />
          <circle cx="490" cy="22" r="7" fill="#ffd25e" />
          <circle cx="560" cy="14" r="7" fill="#ff9aa6" />
        </g>
      </svg>
      <svg
        v-if="unlockedIds.has('room-frame')"
        class="pet-habitat__item pet-habitat__item--frame"
        viewBox="0 0 48 40"
      >
        <rect x="2" y="2" width="44" height="36" rx="4" fill="#e8c49a" stroke="#4a3934" stroke-width="2.5" />
        <rect x="8" y="8" width="32" height="24" rx="2" fill="#fff6e8" />
        <path d="M24 26C17 21 16 16 19.5 14C21.5 13 23.2 14 24 15.5C24.8 14 26.5 13 28.5 14C32 16 31 21 24 26Z" fill="#ff9aa6" />
      </svg>
    </div>

    <div class="pet-habitat__floor" aria-hidden="true">
      <span class="pet-habitat__bowl" />
      <span class="pet-habitat__cushion" />
      <svg
        v-if="unlockedIds.has('room-lamp')"
        class="pet-habitat__item pet-habitat__item--lamp"
        viewBox="0 0 44 110"
      >
        <path d="M8 32L14 6H30L36 32Z" fill="#ffd98a" stroke="#4a3934" stroke-width="2.5" stroke-linejoin="round" />
        <path d="M22 32V100" stroke="#4a3934" stroke-width="3" />
        <ellipse cx="22" cy="102" rx="13" ry="5" fill="#c9a07c" stroke="#4a3934" stroke-width="2.5" />
      </svg>
      <svg
        v-if="unlockedIds.has('room-plant')"
        class="pet-habitat__item pet-habitat__item--plant"
        viewBox="0 0 64 84"
      >
        <path d="M32 50C14 46 6 30 12 18C24 22 30 34 32 50Z" fill="#8cc59a" stroke="#4a3934" stroke-width="2.5" stroke-linejoin="round" />
        <path d="M32 50C50 46 58 30 52 18C40 22 34 34 32 50Z" fill="#9fd3a8" stroke="#4a3934" stroke-width="2.5" stroke-linejoin="round" />
        <path d="M32 50C26 32 28 14 34 4C40 16 38 34 32 50Z" fill="#7bb88b" stroke="#4a3934" stroke-width="2.5" stroke-linejoin="round" />
        <path d="M14 50H50L45 80H19Z" fill="#f0a586" stroke="#4a3934" stroke-width="2.5" stroke-linejoin="round" />
      </svg>
    </div>

    <span
      v-if="activeReaction === 'feed'"
      class="pet-habitat__reaction pet-habitat__reaction--feed"
      aria-hidden="true"
    >
      <span class="pet-habitat__food pet-habitat__food--one" />
      <span class="pet-habitat__food pet-habitat__food--two" />
      <span class="pet-habitat__food pet-habitat__food--three" />
    </span>

    <span
      v-if="activeReaction === 'play' && species !== 'cat'"
      class="pet-habitat__reaction pet-habitat__reaction--play-dog"
      aria-hidden="true"
    >
      <span class="pet-habitat__play-ball" />
      <span class="pet-habitat__play-trail pet-habitat__play-trail--one" />
      <span class="pet-habitat__play-trail pet-habitat__play-trail--two" />
    </span>

    <span
      v-if="activeReaction === 'play' && species === 'cat'"
      class="pet-habitat__reaction pet-habitat__reaction--play-cat"
      aria-hidden="true"
    >
      <span class="pet-habitat__play-string">
        <span class="pet-habitat__play-mouse">
          <span class="pet-habitat__play-mouse-ear pet-habitat__play-mouse-ear--left" />
          <span class="pet-habitat__play-mouse-ear pet-habitat__play-mouse-ear--right" />
          <span class="pet-habitat__play-mouse-tail" />
        </span>
      </span>
    </span>

    <span
      v-if="activeReaction === 'sleep'"
      class="pet-habitat__reaction pet-habitat__reaction--sleep"
      aria-hidden="true"
    >
      <span class="pet-habitat__sleep-mark pet-habitat__sleep-mark--one">Z</span>
      <span class="pet-habitat__sleep-mark pet-habitat__sleep-mark--two">Z</span>
    </span>

    <span
      v-if="activeReaction === 'wash'"
      class="pet-habitat__reaction pet-habitat__reaction--wash"
      aria-hidden="true"
    >
      <span class="pet-habitat__wash-bubble pet-habitat__wash-bubble--one" />
      <span class="pet-habitat__wash-bubble pet-habitat__wash-bubble--two" />
      <span class="pet-habitat__wash-bubble pet-habitat__wash-bubble--three" />
      <span class="pet-habitat__wash-sparkle pet-habitat__wash-sparkle--one" />
      <span class="pet-habitat__wash-sparkle pet-habitat__wash-sparkle--two" />
    </span>

    <span
      v-if="shouldShowReactionSpark"
      class="pet-habitat__reaction pet-habitat__reaction--spark"
      aria-hidden="true"
    >
      <span class="pet-habitat__spark pet-habitat__spark--one" />
      <span class="pet-habitat__spark pet-habitat__spark--two" />
      <span class="pet-habitat__spark pet-habitat__spark--three" />
    </span>

    <div
      v-if="floatingGains.length"
      :key="careFeedback?.createdAt"
      class="pet-habitat__float"
      aria-hidden="true"
    >
      <span v-for="gain in floatingGains" :key="gain">{{ gain }}</span>
    </div>

    <span v-if="isPetting" class="pet-habitat__hearts" aria-hidden="true">
      <svg v-for="index in 3" :key="index" viewBox="-9 -9 18 16">
        <path d="M0 6C-7 1-8-5-4-7C-2-8 0-6.5 0-5C0-6.5 2-8 4-7C8-5 7 1 0 6Z" fill="#ff9aa6" stroke="#4a3934" stroke-width="1.6" />
      </svg>
    </span>

    <button
      class="pet-habitat__pet"
      :class="{ 'pet-habitat__pet--left': position.direction === 'left' }"
      type="button"
      :aria-label="messages.voice.petLabel.replace('{name}', petName ?? messages.species[species].label)"
      @click="petThePet"
    >
      <PetAvatar
        :species="species"
        :status="status"
        :theme-id="themeId"
        :aria-label="avatarLabel"
        :outfit="outfit"
        compact
      />
      <span class="pet-habitat__shadow" aria-hidden="true" />
    </button>
  </div>
</template>
