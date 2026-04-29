<script setup lang="ts">
import { ref } from 'vue'

const { messages } = useLocale()
const isOpen = ref(false)
</script>

<template>
  <section class="control-panel guide-panel" aria-labelledby="guide-panel-heading">
    <button
      class="guide-panel__toggle"
      type="button"
      :aria-expanded="isOpen"
      aria-controls="guide-panel-content"
      @click="isOpen = !isOpen"
    >
      <span>
        <strong id="guide-panel-heading">{{ messages.guide.heading }}</strong>
        <small>{{ messages.guide.description }}</small>
      </span>
      <span class="guide-panel__chevron" aria-hidden="true">
        {{ isOpen ? '−' : '+' }}
      </span>
    </button>

    <div v-if="isOpen" id="guide-panel-content" class="guide-panel__content">
      <p>{{ messages.guide.summary }}</p>

      <div class="guide-section">
        <h3>{{ messages.guide.sections.tab.title }}</h3>
        <ul>
          <li v-for="item in messages.guide.sections.tab.items" :key="item">
            {{ item }}
          </li>
        </ul>
      </div>

      <div class="guide-section">
        <h3>{{ messages.guide.sections.signals.title }}</h3>
        <ul class="signal-list">
          <li v-for="item in messages.guide.sections.signals.items" :key="item">
            {{ item }}
          </li>
        </ul>
      </div>

      <div class="guide-section">
        <h3>{{ messages.guide.sections.care.title }}</h3>
        <ul>
          <li v-for="item in messages.guide.sections.care.items" :key="item">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
