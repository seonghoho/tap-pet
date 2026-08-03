<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type {
  PetAction,
  PetCareFeedback,
  PetCareRecommendation,
} from '~/types/pet'

const props = defineProps<{
  cooldowns: Record<PetAction, number>
  activeReaction: PetAction | null
  recommendedCareAction: PetCareRecommendation | null
  careFeedback: PetCareFeedback | null
}>()

const emit = defineEmits<{
  action: [action: PetAction]
}>()

const { messages } = useLocale()
const now = ref(Date.now())
const actions: readonly PetAction[] = ['feed', 'play', 'sleep', 'wash']
let timer: ReturnType<typeof setInterval> | null = null

const feedbackSummary = computed(() => {
  const feedback = props.careFeedback
  if (!feedback) return ''

  const positiveChanges = (['fullness', 'energy', 'cleanliness'] as const)
    .map((key) => ({
      label: messages.value.stats[key],
      value: feedback.statChanges[key],
    }))
    .filter((change) => change.value > 0)
    .sort((current, next) => next.value - current.value)

  const strongestChange = positiveChanges[0]
  if (!strongestChange) return messages.value.careFeedback.title.replace(
    '{action}',
    messages.value.actions[feedback.action].label,
  )

  return `${messages.value.actions[feedback.action].label} · ${strongestChange.label} +${strongestChange.value}`
})

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 250)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  timer = null
})

function isRecommended(action: PetAction): boolean {
  return props.recommendedCareAction?.action === action
}

function isDisabled(action: PetAction): boolean {
  return props.activeReaction === action || props.cooldowns[action] > now.value
}

function cooldownLabel(action: PetAction): string {
  if (props.activeReaction === action) return messages.value.careProgress.heading

  const remaining = Math.max(0, props.cooldowns[action] - now.value)
  if (remaining <= 0) return ''

  return `${Math.ceil(remaining / 1000)}s`
}
</script>

<template>
  <div class="care-dock-wrap">
    <Transition name="feedback-pop">
      <p
        v-if="feedbackSummary"
        :key="careFeedback?.createdAt"
        class="care-dock__feedback"
        role="status"
      >
        <span aria-hidden="true">✓</span>
        {{ feedbackSummary }}
      </p>
    </Transition>

    <div class="care-dock" :aria-label="messages.careRecommendation.heading">
      <button
        v-for="action in actions"
        :key="action"
        class="care-dock__action"
        type="button"
        :data-action="action"
        :data-recommended="isRecommended(action)"
        :disabled="isDisabled(action)"
        :aria-label="`${messages.actions[action].label}. ${messages.actions[action].detail}`"
        @click="emit('action', action)"
      >
        <span v-if="isRecommended(action)" class="care-dock__recommended">
          {{ messages.careRecommendation.badge }}
        </span>
        <span class="care-dock__icon" aria-hidden="true">
          <svg v-if="action === 'feed'" viewBox="0 0 32 32">
            <path d="M7 16h18v2a9 9 0 0 1-18 0v-2Z" />
            <path d="M10 13c2.7-2.4 9.3-2.4 12 0" />
          </svg>
          <svg v-else-if="action === 'play'" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="9" />
            <path d="m10 11 12 10M21 10 11 22" />
          </svg>
          <svg v-else-if="action === 'sleep'" viewBox="0 0 32 32">
            <path d="M22.5 23A10 10 0 0 1 11 8.5 10 10 0 1 0 22.5 23Z" />
          </svg>
          <svg v-else viewBox="0 0 32 32">
            <path d="M16 5c4 5.1 6 8.7 6 11.5a6 6 0 0 1-12 0C10 13.7 12 10.1 16 5Z" />
            <path d="M19 17a3 3 0 0 1-3 3" />
          </svg>
        </span>
        <span class="care-dock__copy">
          <strong>{{ messages.actions[action].label }}</strong>
          <small v-if="cooldownLabel(action)">{{ cooldownLabel(action) }}</small>
          <small v-else>{{ messages.actions[action].detail }}</small>
        </span>
      </button>
    </div>
  </div>
</template>
