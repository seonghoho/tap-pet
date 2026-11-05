<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { PetAction, PetStatus } from '~/types/pet'

// The room behind the pet, drawn in the same hand-drawn style as the characters
// (warm ink outline, flat pastel fills). Each piece is its own small SVG placed by
// percentage, so phone (16:11) and desktop (16:9) rooms show everything uncropped.

type DayPart = 'morning' | 'day' | 'evening' | 'night'

const props = defineProps<{
  status: PetStatus
  isDark: boolean
  activeReaction?: PetAction | null
}>()

const INK = '#4a3934'
const hour = ref(12)
let clockTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  hour.value = new Date().getHours()
  clockTimer = setInterval(() => {
    hour.value = new Date().getHours()
  }, 10 * 60 * 1000)
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
})

// The window follows the real clock; the dark theme is always a cosy night room.
const dayPart = computed<DayPart>(() => {
  if (props.isDark) return 'night'

  const h = hour.value

  return h >= 6 && h < 10 ? 'morning' : h >= 10 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'evening' : 'night'
})
const isNightLike = computed(() => dayPart.value === 'night')
const isDim = computed(() => props.activeReaction === 'sleep' || props.status === 'sleepy')
const bowlHasFood = computed(() => props.status !== 'hungry')
const showDust = computed(() => props.status === 'dirty')

const SKY: Record<DayPart, [string, string]> = {
  morning: ['#ffd9c2', '#d6ecff'],
  day: ['#9fd4ff', '#e4f3ff'],
  evening: ['#ff9f7a', '#ffd7a1'],
  night: ['#25315a', '#46578e'],
}
const sky = computed(() => SKY[dayPart.value])
</script>

<template>
  <div
    class="room"
    :class="[`room--${dayPart}`, { 'room--dark': isDark, 'room--dim': isDim }]"
    aria-hidden="true"
  >
    <div class="room__wall" />
    <div class="room__wainscot" />
    <div class="room__floor" />
    <div v-if="!isNightLike" class="room__sunbeam" />
    <div v-else class="room__glow" />

    <!-- window with curtains; the sky matches the time of day -->
    <svg class="room__window" viewBox="0 0 140 128">
      <defs>
        <linearGradient id="room-sky" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" :stop-color="sky[0]" />
          <stop offset="1" :stop-color="sky[1]" />
        </linearGradient>
        <clipPath id="room-pane"><rect x="26" y="20" width="88" height="80" rx="10" /></clipPath>
      </defs>
      <rect x="26" y="20" width="88" height="80" rx="10" fill="url(#room-sky)" />
      <g clip-path="url(#room-pane)">
        <template v-if="dayPart === 'night'">
          <path d="M92 38a12 12 0 1 0 10 18a10 10 0 1 1-10-18Z" fill="#ffe9a8" :stroke="INK" stroke-width="2" />
          <circle cx="44" cy="36" r="1.8" fill="#fff6d6" class="room__star" />
          <circle cx="58" cy="54" r="1.4" fill="#fff6d6" class="room__star room__star--late" />
          <circle cx="76" cy="32" r="1.6" fill="#fff6d6" class="room__star" />
          <circle cx="48" cy="74" r="1.2" fill="#fff6d6" class="room__star room__star--late" />
        </template>
        <template v-else>
          <circle :cx="dayPart === 'evening' ? 52 : 94" :cy="dayPart === 'evening' ? 84 : dayPart === 'morning' ? 70 : 40" r="11" :fill="dayPart === 'evening' ? '#ffcf7a' : '#ffe17a'" :stroke="INK" stroke-width="2" />
          <g class="room__cloud">
            <path d="M34 62c0-6 5-10 11-9c2-6 12-7 15 0c6-1 10 3 9 9Z" fill="#ffffff" :stroke="INK" stroke-width="2" stroke-linejoin="round" />
          </g>
        </template>
      </g>
      <rect x="26" y="20" width="88" height="80" rx="10" fill="none" :stroke="INK" stroke-width="3" />
      <path d="M70 20V100M26 60H114" :stroke="INK" stroke-width="3" />
      <!-- sill -->
      <rect x="18" y="100" width="104" height="10" rx="5" fill="#fffaf2" :stroke="INK" stroke-width="3" />
      <!-- curtains -->
      <path d="M8 10C30 14 34 40 30 62C28 76 20 92 26 104C14 104 6 96 6 80V14Z" fill="#ffb7b2" :stroke="INK" stroke-width="3" stroke-linejoin="round" />
      <path d="M132 10C110 14 106 40 110 62C112 76 120 92 114 104C126 104 134 96 134 80V14Z" fill="#ffb7b2" :stroke="INK" stroke-width="3" stroke-linejoin="round" />
      <circle cx="29" cy="64" r="4" fill="#ffd25e" :stroke="INK" stroke-width="2" />
      <circle cx="111" cy="64" r="4" fill="#ffd25e" :stroke="INK" stroke-width="2" />
      <!-- scalloped valance -->
      <path d="M4 6H136V16Q129 24 122 16Q115 24 108 16Q101 24 94 16Q87 24 80 16Q73 24 66 16Q59 24 52 16Q45 24 38 16Q31 24 24 16Q17 24 10 16Q7 20 4 16Z" fill="#ff9aa6" :stroke="INK" stroke-width="3" stroke-linejoin="round" />
    </svg>

    <!-- wall shelf: cactus, books, mug -->
    <svg class="room__shelf" viewBox="0 0 150 70">
      <path d="M44 40c-2-14 2-24 9-24s11 10 9 24Z" fill="#9fd3a8" :stroke="INK" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M53 20v16M48 26l-2-2M58 28l2-2" stroke="#6ea47c" stroke-width="2" stroke-linecap="round" />
      <circle cx="53" cy="15" r="3.5" fill="#ff9aa6" :stroke="INK" stroke-width="2" />
      <path d="M40 40h26l-3 16H43Z" fill="#f0a586" :stroke="INK" stroke-width="2.5" stroke-linejoin="round" />
      <rect x="80" y="22" width="12" height="34" rx="2" fill="#8fb8e8" :stroke="INK" stroke-width="2.5" />
      <rect x="92" y="28" width="11" height="28" rx="2" fill="#ffd25e" :stroke="INK" stroke-width="2.5" />
      <path d="M106 38h16v14a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4Z" fill="#fffaf2" :stroke="INK" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M122 42c6 0 6 8 0 8" fill="none" :stroke="INK" stroke-width="2.5" />
      <path d="M114 49c-3-2-4-4-2.5-5c1-.6 2 0 2.5 1c.5-1 1.5-1.6 2.5-1c1.5 1 .5 3-2.5 5Z" fill="#ff9aa6" />
      <rect x="10" y="56" width="130" height="9" rx="4" fill="#d9a877" :stroke="INK" stroke-width="2.5" />
      <path d="M30 65v5M120 65v5" :stroke="INK" stroke-width="2.5" stroke-linecap="round" />
    </svg>

    <!-- rug -->
    <svg class="room__rug" viewBox="0 0 300 70">
      <path d="M20 35C20 14 80 4 150 4S280 14 280 35S220 66 150 66S20 56 20 35Z" fill="#ffd9d2" :stroke="INK" stroke-width="3" />
      <path d="M44 35C44 22 92 15 150 15S256 22 256 35S208 55 150 55S44 48 44 35Z" fill="none" stroke="#ffb3a6" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round" />
      <g fill="#ffffff" opacity="0.8">
        <circle cx="110" cy="30" r="3" /><circle cx="150" cy="40" r="3" /><circle cx="190" cy="30" r="3" />
        <circle cx="130" cy="46" r="2.4" /><circle cx="170" cy="24" r="2.4" />
      </g>
    </svg>

    <!-- food bowl (left); empty when the pet is hungry -->
    <svg class="room__bowl" viewBox="0 0 80 44">
      <g v-if="bowlHasFood">
        <circle cx="28" cy="16" r="5" fill="#c98a52" :stroke="INK" stroke-width="2" />
        <circle cx="38" cy="12" r="5.5" fill="#d99b62" :stroke="INK" stroke-width="2" />
        <circle cx="49" cy="15" r="5" fill="#c98a52" :stroke="INK" stroke-width="2" />
        <circle cx="42" cy="19" r="4.5" fill="#e0a86e" :stroke="INK" stroke-width="2" />
      </g>
      <path d="M8 20H72C72 34 60 42 40 42S8 34 8 20Z" fill="#ff9f86" :stroke="INK" stroke-width="3" stroke-linejoin="round" />
      <rect x="5" y="16" width="70" height="8" rx="4" fill="#ffc4b3" :stroke="INK" stroke-width="3" />
      <g fill="#ffffff">
        <ellipse cx="40" cy="34" rx="4" ry="3.2" />
        <circle cx="34" cy="29" r="1.6" /><circle cx="38" cy="27.5" r="1.6" /><circle cx="42" cy="27.5" r="1.6" /><circle cx="46" cy="29" r="1.6" />
      </g>
    </svg>

    <!-- yarn ball toy -->
    <svg class="room__yarn" viewBox="0 0 60 40">
      <path d="M30 30C40 34 48 36 58 32" fill="none" stroke="#ff9aa6" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="20" cy="22" r="15" fill="#ffb7c5" :stroke="INK" stroke-width="2.5" />
      <path d="M8 16C16 20 26 20 33 13M7 25C16 30 28 29 35 22M14 35C20 30 22 18 18 8" fill="none" :stroke="INK" stroke-width="1.8" stroke-linecap="round" opacity="0.55" />
    </svg>

    <!-- pet bed (right) -->
    <svg class="room__bed" viewBox="0 0 170 74">
      <path d="M8 40C8 22 44 16 85 16S162 22 162 40C162 60 130 70 85 70S8 60 8 40Z" fill="#d6ab82" :stroke="INK" stroke-width="3" />
      <path d="M22 44C22 30 50 28 85 28S148 30 148 44C148 54 122 58 85 58S22 54 22 44Z" fill="#b9d3f0" :stroke="INK" stroke-width="2.5" />
      <path d="M30 40C40 36 54 35 66 38" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.7" />
      <path d="M118 30C132 32 146 38 148 46C140 52 128 54 116 52C118 44 118 36 118 30Z" fill="#ffc4cb" :stroke="INK" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M124 38l4 4M132 36l4 4M126 46l4 4" stroke="#ff9aa6" stroke-width="2" stroke-linecap="round" />
      <path d="M30 62l6-6M46 66l6-6M62 68l6-6M100 68l6-6M116 66l6-6M132 62l6-6" stroke="#b98d66" stroke-width="2" stroke-linecap="round" />
    </svg>

    <!-- dust bunnies show up when the pet needs a wash -->
    <template v-if="showDust">
      <svg v-for="n in 2" :key="n" class="room__dust" :class="`room__dust--${n}`" viewBox="0 0 30 22">
        <path d="M4 18C1 14 3 9 7 9C7 4 13 2 16 6C19 2 26 4 25 10C29 11 29 17 26 18Z" fill="#d8d2cc" :stroke="INK" stroke-width="2" stroke-linejoin="round" />
        <circle cx="12" cy="13" r="1.4" :fill="INK" /><circle cx="18" cy="13" r="1.4" :fill="INK" />
      </svg>
    </template>

    <div class="room__dimmer" />
  </div>
</template>
