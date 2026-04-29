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
    },
  },
  typescript: {
    strict: true,
  },
})
