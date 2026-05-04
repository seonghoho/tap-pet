export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  experimental: {
    appManifest: false,
  },
  app: {
    head: {
      title: 'Project Dashboard',
      meta: [
        {
          name: 'description',
          content: 'A browser-tab pet MVP that reacts through title and favicon.',
        },
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
