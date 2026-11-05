<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const PIN_TIP_STORAGE_KEY = 'tab-pet:pin-tip-dismissed'

const { messages } = useLocale()
const { copyText } = useClipboard()
const siteUrl = String(useRuntimeConfig().public.siteUrl || '')
const isVisible = ref(false)
// Phones have no tab strip or favicon, so "pin this tab" means nothing there.
// Instead we help the visitor get the link onto the computer where the pet lives.
const isPhone = ref(false)
const notice = ref('')
const copy = computed(() => (isPhone.value ? messages.value.pinTip.mobile : messages.value.pinTip))

onMounted(() => {
  isPhone.value = window.matchMedia?.('(hover: none) and (pointer: coarse)').matches ?? false

  try {
    isVisible.value = localStorage.getItem(PIN_TIP_STORAGE_KEY) !== '1'
  } catch {
    isVisible.value = true
  }
})

function dismiss(): void {
  isVisible.value = false
  trackEvent('pin_tip_dismissed', {})

  try {
    localStorage.setItem(PIN_TIP_STORAGE_KEY, '1')
  } catch {
    // Blocked storage only means the tip comes back next visit.
  }
}

async function sendToComputer(): Promise<void> {
  const url = new URL('/', siteUrl || window.location.origin)
  url.searchParams.set('utm_source', 'mobile_handoff')
  const link = url.toString()

  if (navigator.share) {
    try {
      await navigator.share({ url: link, title: messages.value.app.name })
      trackEvent('send_to_desktop', { result: 'shared' })
      return
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
    }
  }

  const copied = await copyText(link)
  notice.value = copied ? messages.value.pinTip.mobile.copied : ''
  if (copied) trackEvent('send_to_desktop', { result: 'copied' })
}
</script>

<template>
  <section v-if="isVisible" class="pin-tip" aria-labelledby="pin-tip-title">
    <svg v-if="isPhone" class="pin-tip__icon" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M5 7h22v14H5Z M12 26h8 M16 21v5"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <svg v-else class="pin-tip__icon" viewBox="0 0 32 32" aria-hidden="true">
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
      <strong id="pin-tip-title">{{ copy.title }}</strong>
      <small>{{ copy.body }}</small>
      <small v-if="notice" role="status">{{ notice }}</small>
    </div>
    <button v-if="isPhone" class="pin-tip__dismiss" type="button" @click="sendToComputer">
      {{ messages.pinTip.mobile.send }}
    </button>
    <button v-else class="pin-tip__dismiss" type="button" @click="dismiss">
      {{ messages.pinTip.dismiss }}
    </button>
  </section>
</template>
