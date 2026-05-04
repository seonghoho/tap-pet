<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

type AdSenseWindow = Window & {
  adsbygoogle?: unknown[]
}

const props = withDefaults(defineProps<{
  client: string
  enabled: boolean
  format?: string
  label?: string
  slot: string
}>(), {
  format: 'auto',
  label: 'Sponsored',
})

const adWasRequested = ref(false)
const canRequestAd = computed(() => props.enabled && props.client.length > 0 && props.slot.length > 0)
const scriptId = computed(() => `adsense-script-${props.client}`)

onMounted(() => {
  void nextTick(requestAd)
})

watch(canRequestAd, (isReady) => {
  if (!isReady) return

  void nextTick(requestAd)
})

function ensureAdSenseScript(): void {
  if (!canRequestAd.value || typeof document === 'undefined') return
  if (document.getElementById(scriptId.value)) return

  const script = document.createElement('script')
  script.id = scriptId.value
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${props.client}`

  document.head.appendChild(script)
}

function getAdQueue(): unknown[] | null {
  if (typeof window === 'undefined') return null

  const adWindow = window as AdSenseWindow

  if (!Array.isArray(adWindow.adsbygoogle)) {
    adWindow.adsbygoogle = []
  }

  return adWindow.adsbygoogle
}

function pushAdRequest(): void {
  if (!canRequestAd.value || adWasRequested.value) return

  const adQueue = getAdQueue()
  if (!adQueue) return

  adQueue.push({})
  adWasRequested.value = true
}

function requestAd(): void {
  ensureAdSenseScript()
  pushAdRequest()
}
</script>

<template>
  <section class="ad-panel" :aria-label="label">
    <span class="ad-panel__label">{{ label }}</span>
    <ins
      v-if="canRequestAd"
      class="adsbygoogle ad-panel__slot"
      :data-ad-client="client"
      :data-ad-slot="slot"
      :data-ad-format="format"
      data-full-width-responsive="true"
      style="display: block;"
    />
    <div v-else class="ad-panel__placeholder" aria-hidden="true" />
  </section>
</template>
