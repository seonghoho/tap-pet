<script setup lang="ts">
import { computed } from 'vue'
import type { PetAction, PetReturnReport } from '~/types/pet'

const props = defineProps<{
  report: PetReturnReport | null
  petName: string
}>()

const { messages } = useLocale()

const shouldShowReport = computed(() => Boolean(props.report))
const reportTitle = computed(() => {
  const report = props.report
  if (!report) return ''

  return messages.value.returnReport.status[report.status].replace('{name}', props.petName)
})
const reportDetail = computed(() => {
  const report = props.report
  if (!report) return ''

  return messages.value.returnReport.elapsed[report.bucket]
})
const reportAction = computed(() => {
  const action = props.report?.recommendedAction
  if (!action) return messages.value.returnReport.stable

  return messages.value.returnReport.actions[action].replace(
    '{action}',
    messages.value.actions[action as PetAction].label,
  )
})
</script>

<template>
  <section v-if="shouldShowReport" class="return-report" aria-live="polite">
    <span>{{ reportDetail }}</span>
    <strong class="return-report__title">{{ reportTitle }}</strong>
    <small>{{ reportAction }}</small>
  </section>
</template>
