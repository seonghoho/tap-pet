<script setup lang="ts">
const emojis = ['🐱', '🐶', '💤', '🍗', '✨', '📊', '🗂', '✅']
const clipboard = useClipboard()
const { messages } = useLocale()
</script>

<template>
  <section class="control-panel" aria-labelledby="emoji-copy-heading">
    <div class="control-panel__header">
      <h2 id="emoji-copy-heading">{{ messages.emoji.heading }}</h2>
      <p>{{ messages.emoji.description }}</p>
    </div>

    <div class="emoji-grid">
      <button
        v-for="emoji in emojis"
        :key="emoji"
        class="emoji-button"
        type="button"
        @click="clipboard.copyText(emoji)"
      >
        {{ emoji }}
      </button>
    </div>

    <p v-if="clipboard.copiedText.value" class="mock-message" role="status">
      {{ messages.emoji.copied }} {{ clipboard.copiedText.value }}
    </p>
    <p v-else-if="clipboard.copyError.value" class="mock-message mock-message--error" role="status">
      {{ messages.emoji.copyFailed }}
      <span v-if="clipboard.manualCopyText.value" class="manual-copy-token">
        {{ clipboard.manualCopyText.value }}
      </span>
    </p>
  </section>
</template>
