<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PetSpecies } from '~/types/pet'
import { renderShareCard, shareOrDownloadCard } from '~/utils/petShareCard'

const props = defineProps<{
  species: PetSpecies
  name: string
  level: number
  streakDays: number
}>()

const emit = defineEmits<{
  shared: [result: 'shared' | 'downloaded']
}>()

const { messages } = useLocale()
const isMaking = ref(false)
const notice = ref('')

const subtitle = computed(() =>
  messages.value.shareCard.subtitle
    .replace('{species}', messages.value.species[props.species].label)
    .replace('{level}', String(props.level)),
)
const highlight = computed(() =>
  props.streakDays > 0
    ? messages.value.shareCard.streak.replace('{days}', String(props.streakDays))
    : messages.value.shareCard.fresh,
)

async function share(): Promise<void> {
  if (isMaking.value) return

  isMaking.value = true
  notice.value = ''

  try {
    const blob = await renderShareCard({
      species: props.species,
      name: props.name,
      subtitle: subtitle.value,
      highlight: highlight.value,
      footer: messages.value.shareCard.footer,
    })
    const result = await shareOrDownloadCard(
      blob,
      `tab-pet-${props.species}.png`,
      messages.value.shareCard.text.replace('{name}', props.name),
    )
    notice.value = result === 'downloaded' ? messages.value.shareCard.saved : ''
    trackEvent('share_card_created', { result })
    emit('shared', result)
  } catch {
    notice.value = messages.value.shareCard.failed
  } finally {
    isMaking.value = false
  }
}
</script>

<template>
  <div class="share-card">
    <button class="share-card__button" type="button" :disabled="isMaking" @click="share">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 15V4m0 0L8 8m4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      {{ isMaking ? messages.shareCard.making : messages.shareCard.button }}
    </button>
    <small v-if="notice" role="status">{{ notice }}</small>
  </div>
</template>
