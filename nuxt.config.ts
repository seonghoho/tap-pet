// Absolute origin for share previews (e.g. https://tabpet.app). Crawlers need absolute og:image URLs.
const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
const description = '탭 한 칸에 사는 작은 친구. 탭 아이콘에 살면서, 배고프거나 심심하면 살짝 티를 내요.'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  experimental: {
    appManifest: false,
  },
  app: {
    head: {
      title: 'Tab Pet',
      link: [
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css',
        },
      ],
      meta: [
        { name: 'description', content: description },
        { name: 'theme-color', content: '#f5f1ea' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Tab Pet' },
        { property: 'og:title', content: 'Tab Pet · 탭 한 칸에 사는 작은 친구' },
        { property: 'og:description', content: description },
        { property: 'og:image', content: `${siteUrl}/og.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    },
  },
  typescript: {
    strict: true,
  },
  runtimeConfig: {
    // Server-only secrets for purchases. Without them the shop shows "coming soon".
    tossSecretKey: process.env.NUXT_TOSS_SECRET_KEY ?? '',
    purchaseSigningSecret: process.env.NUXT_PURCHASE_SIGNING_SECRET ?? '',
    // All optional: without a key the matching integration stays off. See .env.example.
    public: {
      tossClientKey: process.env.NUXT_PUBLIC_TOSS_CLIENT_KEY ?? '',
      siteUrl,
      appEnv: process.env.NUXT_PUBLIC_APP_ENV ?? 'development',
      posthogKey: process.env.NUXT_PUBLIC_POSTHOG_KEY ?? '',
      posthogHost: process.env.NUXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN ?? '',
    },
  },
})
