import { ref } from 'vue'

export function useClipboard() {
  const copiedText = ref<string | null>(null)
  const copyError = ref<string | null>(null)
  const manualCopyText = ref<string | null>(null)

  async function copyText(text: string): Promise<boolean> {
    if (!import.meta.client) return false

    copyError.value = null
    copiedText.value = null
    manualCopyText.value = null

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      } else {
        copyWithTextarea(text)
      }

      copiedText.value = text
      return true
    } catch (error) {
      try {
        copyWithTextarea(text)
        copiedText.value = text
        return true
      } catch (fallbackError) {
        copyError.value =
          fallbackError instanceof Error
            ? fallbackError.message
            : error instanceof Error
              ? error.message
              : 'Copy failed.'
        manualCopyText.value = text
        return false
      }
    }
  }

  return {
    copiedText,
    copyError,
    manualCopyText,
    copyText,
  }
}

function copyWithTextarea(text: string): void {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)

  if (!copied) {
    throw new Error('Clipboard fallback failed.')
  }
}
