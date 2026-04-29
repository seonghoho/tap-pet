<script setup lang="ts">
import { computed, ref } from 'vue'

const { messages } = useLocale()
const rewardWasPreviewed = ref(false)
const mockMessage = computed(() =>
  rewardWasPreviewed.value
    ? messages.value.monetization.rewardMessage
    : messages.value.monetization.idleMessage,
)

function handleAdClick(): void {
  rewardWasPreviewed.value = true
}
</script>

<template>
  <section class="control-panel" aria-labelledby="monetization-heading">
    <div class="control-panel__header">
      <h2 id="monetization-heading">{{ messages.monetization.heading }}</h2>
      <p>{{ messages.monetization.description }}</p>
    </div>

    <div class="mock-list">
      <div class="mock-row">
        <div>
          <strong>{{ messages.monetization.rewardedAd }}</strong>
          <span>{{ messages.monetization.rewardedAdDetail }}</span>
        </div>
        <button class="small-button" type="button" @click="handleAdClick">
          {{ messages.monetization.watch }}
        </button>
      </div>

      <div class="mock-row mock-row--locked">
        <div>
          <strong>{{ messages.monetization.premiumSkins }}</strong>
          <span>{{ messages.monetization.premiumSkinsDetail }}</span>
        </div>
        <button class="small-button" type="button" disabled>
          {{ messages.monetization.locked }}
        </button>
      </div>
    </div>

    <p class="mock-message" role="status">{{ mockMessage }}</p>
  </section>
</template>
