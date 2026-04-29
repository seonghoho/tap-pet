import type { ComputedRef, Ref } from 'vue'
import { onMounted, watch } from 'vue'
import { svgToDataUrl } from '~/utils/tabPresentation'

type FaviconSource = Ref<string> | ComputedRef<string>

export function useFavicon(svg: FaviconSource) {
  function applyFavicon(nextSvg: string): void {
    if (!import.meta.client || !nextSvg) return

    const link = getOrCreateFaviconLink()
    link.href = svgToDataUrl(nextSvg)
  }

  onMounted(() => applyFavicon(svg.value))
  watch(svg, applyFavicon, { immediate: true })
}

function getOrCreateFaviconLink(): HTMLLinkElement {
  const tabPetIcon = document.querySelector<HTMLLinkElement>('link[data-tab-pet-icon="true"]')
  if (tabPetIcon) return tabPetIcon

  const existingIcon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (existingIcon) {
    existingIcon.dataset.tabPetIcon = 'true'
    existingIcon.type = 'image/svg+xml'
    return existingIcon
  }

  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/svg+xml'
  link.dataset.tabPetIcon = 'true'
  document.head.appendChild(link)

  return link
}
