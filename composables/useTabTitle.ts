import type { ComputedRef, Ref } from 'vue'
import { onMounted, watch } from 'vue'
import { useHead } from '#app'

type TitleSource = Ref<string> | ComputedRef<string>

export function useTabTitle(title: TitleSource) {
  useHead({
    title,
  })

  function applyTitle(nextTitle: string): void {
    if (!import.meta.client) return

    document.title = nextTitle || 'Project Dashboard'
  }

  onMounted(() => applyTitle(title.value))
  watch(title, applyTitle, { immediate: true })
}
