import { ref } from 'vue'

export function useClipboard() {
  const copiedText = ref<string | null>(null)
  const copyError = ref<string | null>(null)

  async function copyText(text: string): Promise<boolean> {
    if (!import.meta.client) return false

    try {
      copyError.value = null

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      } else {
        copyWithTextarea(text)
      }

      copiedText.value = text
      return true
    } catch (error) {
      copyError.value = error instanceof Error ? error.message : 'Copy failed.'
      return false
    }
  }

  return {
    copiedText,
    copyError,
    copyText,
  }
}

function copyWithTextarea(text: string): void {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
