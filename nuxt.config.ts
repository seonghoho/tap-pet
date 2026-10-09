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
      script: process.env.NUXT_PUBLIC_ADSENSE_ENABLED === 'true'
        ? [
            {
              async: true,
              crossorigin: 'anonymous',
              src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6884620250599904',
            },
          ]
        : [],
    },
  },
  typescript: {
    strict: true,
  },
  runtimeConfig: {
    public: {
      adsenseClient: process.env.NUXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-6884620250599904',
      adsenseSidebarSlot: process.env.NUXT_PUBLIC_ADSENSE_SIDEBAR_SLOT ?? '2040518208',
      adsenseEnabled: process.env.NUXT_PUBLIC_ADSENSE_ENABLED === 'true',
    },
  },
})
