<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { PetOutfitId, PetSpecies } from '~/types/pet'

// A happy moment (level up, streak milestone) deserves a pause: confetti, the pet
// cheering, and the one button that matters right then: show a friend.

export type Celebration =
  | { kind: 'level', level: number, unlockNames: string[] }
  | { kind: 'streak', days: number }

const props = defineProps<{
  celebration: Celebration
  species: PetSpecies
  name: string
  level: number
  streakDays: number
  outfit?: PetOutfitId | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { messages } = useLocale()
const closeButton = ref<HTMLButtonElement | null>(null)

const copy = computed(() => {
  const c = messages.value.celebration
  if (props.celebration.kind === 'level') {
    return {
      title: c.levelTitle.replace('{level}', String(props.celebration.level)),
      body: c.levelBody.replace('{name}', props.name),
      highlight: c.shareLevel.replace('{level}', String(props.celebration.level)),
      unlocked: props.celebration.unlockNames.map((item) => c.unlocked.replace('{item}', item)),
    }
  }

  return {
    title: c.streakTitle.replace('{days}', String(props.celebration.days)),
    body: c.streakBody.replace('{name}', props.name),
    highlight: c.shareStreak.replace('{days}', String(props.celebration.days)),
    unlocked: [] as string[],
  }
})

// Confetti pieces: fixed layout so it looks the same every time (and in screenshots).
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i % 6) * 90}ms`,
  color: ['#ff9aa6', '#ffd25e', '#8fc3ea', '#9fd3a8', '#ffb38a'][i % 5],
  rotate: `${(i * 47) % 360}deg`,
  round: i % 3 === 0,
}))

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  void nextTick(() => closeButton.value?.focus())
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="celebration" role="dialog" aria-modal="true" aria-labelledby="celebration-title" @click.self="emit('close')">
    <div class="celebration__card">
      <div class="celebration__confetti" aria-hidden="true">
        <span
          v-for="(piece, index) in CONFETTI"
          :key="index"
          :class="{ 'celebration__confetti-piece--round': piece.round }"
          class="celebration__confetti-piece"
          :style="{ left: piece.left, animationDelay: piece.delay, background: piece.color, rotate: piece.rotate }"
        />
      </div>

      <PetAvatar
        class="celebration__pet"
        :species="species"
        status="excited"
        theme-id="light"
        :outfit="outfit"
        :aria-label="messages.species[species].label"
      />

      <h2 id="celebration-title" class="celebration__title">{{ copy.title }}</h2>
      <p class="celebration__body">{{ copy.body }}</p>
      <p v-for="line in copy.unlocked" :key="line" class="celebration__unlock">{{ line }}</p>

      <div class="celebration__actions">
        <ShareCardButton
          :species="species"
          :name="name"
          :level="level"
          :streak-days="streakDays"
          :outfit="outfit"
          :highlight="copy.highlight"
          source="celebration"
          :label="messages.celebration.share"
          primary
        />
        <button ref="closeButton" class="text-button celebration__close" type="button" @click="emit('close')">
          {{ messages.celebration.close }}
        </button>
      </div>
    </div>
  </div>
</template>
