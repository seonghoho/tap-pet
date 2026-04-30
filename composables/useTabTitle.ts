import type { ComputedRef, Ref } from 'vue'
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useHead } from '#app'
import { APP_DEFAULT_TITLE } from '~/constants/titles'

export type TitleSource = Ref<string> | ComputedRef<string>

const TITLE_ANIMATION_INTERVAL_MS = 1500

export function useTabTitle(input: {
  title: TitleSource
  animationEnabled: Ref<boolean> | ComputedRef<boolean>
  isDocumentVisible: Ref<boolean> | ComputedRef<boolean>
}) {
  const headTitle = computed(() => getSafeTitle(input.title.value))

  let animationTimer: number | null = null
  let animationOffset = 0
  let isMounted = false

  useHead({
    title: headTitle,
  })

  function applyTitle(nextTitle: string): void {
    if (!import.meta.client) return

    document.title = getSafeTitle(nextTitle)
  }

  function getSafeTitle(nextTitle: string): string {
    return nextTitle || APP_DEFAULT_TITLE
  }

  function getRotatedTitle(title: string): string {
    if (title.length <= 1) return title

    return `${title.slice(animationOffset)}${title.slice(0, animationOffset)}`
  }

  function stopAnimation(): void {
    if (animationTimer === null) return

    window.clearInterval(animationTimer)
    animationTimer = null
  }

  function tickAnimation(): void {
    const title = getSafeTitle(input.title.value)

    animationOffset = title.length <= 1 ? 0 : (animationOffset + 1) % title.length
    applyTitle(getRotatedTitle(title))
  }

  function syncTitle(): void {
    if (!isMounted || !import.meta.client) return

    const title = getSafeTitle(input.title.value)
    const shouldAnimate = input.animationEnabled.value && !input.isDocumentVisible.value

    stopAnimation()

    if (!shouldAnimate) {
      animationOffset = 0
      applyTitle(title)
      return
    }

    animationOffset = 0
    applyTitle(title)
    animationTimer = window.setInterval(tickAnimation, TITLE_ANIMATION_INTERVAL_MS)
  }

  onMounted(() => {
    isMounted = true
    syncTitle()
  })

  onBeforeUnmount(() => {
    isMounted = false
    stopAnimation()
  })

  watch([input.title, input.animationEnabled, input.isDocumentVisible], syncTitle)
}
