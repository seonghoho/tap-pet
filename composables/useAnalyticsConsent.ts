import { ref } from 'vue'

const OPT_OUT_KEY = 'tab-pet:analytics-opt-out'
export const ANALYTICS_CONSENT_EVENT = 'tabpet:analytics-consent'

export function isAnalyticsOptedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1'
  } catch {
    return false
  }
}

// Per-browser choice, kept outside the pet state so it survives a reset.
export function useAnalyticsConsent() {
  const optedOut = ref(import.meta.client ? isAnalyticsOptedOut() : false)

  function setOptedOut(value: boolean): void {
    optedOut.value = value

    try {
      if (value) localStorage.setItem(OPT_OUT_KEY, '1')
      else localStorage.removeItem(OPT_OUT_KEY)
    } catch {
      // Storage blocked: the choice still applies for this session.
    }

    window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: { optedOut: value } }))
  }

  return { optedOut, setOptedOut }
}
