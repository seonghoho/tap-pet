import * as Sentry from '@sentry/vue'
import posthog from 'posthog-js'
import { isAnalyticsOptedOut, ANALYTICS_CONSENT_EVENT } from '~/composables/useAnalyticsConsent'

// Product analytics (PostHog) and error reporting (Sentry). Both stay off unless their
// public keys are configured, so local development and forks send nothing.
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public
  const environment = String(config.appEnv || 'development')

  if (config.sentryDsn) {
    Sentry.init({
      app: nuxtApp.vueApp,
      dsn: String(config.sentryDsn),
      environment,
      tracesSampleRate: 0,
      // Pet names and backup codes never leave the browser.
      beforeBreadcrumb: (breadcrumb) => (breadcrumb.category === 'ui.input' ? null : breadcrumb),
    })
  }

  if (!config.posthogKey) return

  posthog.init(String(config.posthogKey), {
    api_host: String(config.posthogHost),
    persistence: 'localStorage',
    person_profiles: 'identified_only',
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
    opt_out_capturing_by_default: isAnalyticsOptedOut(),
  })
  posthog.register({ app_env: environment })

  window.addEventListener('tabpet:analytics', (event) => {
    const { event: name, ...properties } = (event as CustomEvent<Record<string, unknown>>).detail

    posthog.capture(String(name), properties)
  })

  window.addEventListener(ANALYTICS_CONSENT_EVENT, (event) => {
    if ((event as CustomEvent<{ optedOut: boolean }>).detail.optedOut) {
      posthog.opt_out_capturing()
    } else {
      posthog.opt_in_capturing()
    }
  })
})
