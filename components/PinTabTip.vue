<script setup lang="ts">
import { onMounted, ref } from 'vue'

const PIN_TIP_STORAGE_KEY = 'tab-pet:pin-tip-dismissed'

const { messages } = useLocale()
const isVisible = ref(false)

onMounted(() => {
  try {
    isVisible.value = localStorage.getItem(PIN_TIP_STORAGE_KEY) !== '1'
  } catch {
    isVisible.value = true
  }
})

function dismiss(): void {
  isVisible.value = false

  try {
    localStorage.setItem(PIN_TIP_STORAGE_KEY, '1')
  } catch {
    // Blocked storage only means the tip comes back next visit.
  }
}
</script>

<template>
  <section v-if="isVisible" class="pin-tip" aria-labelledby="pin-tip-title">
    <svg class="pin-tip__icon" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M12 4h8l-1 8 4 4v2H9v-2l4-4-1-8Z M16 18v10"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <div class="pin-tip__copy">
      <strong id="pin-tip-title">{{ messages.pinTip.title }}</strong>
      <small>{{ messages.pinTip.body }}</small>
    </div>
    <button class="pin-tip__dismiss" type="button" @click="dismiss">
      {{ messages.pinTip.dismiss }}
    </button>
  </section>
</template>
