export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: true },
  ssr: false,

  modules: [
    '@nuxtjs/tailwindcss',
    '@vite-pwa/nuxt',
  ],

  nitro: {
    preset: 'vercel',
  },
  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY,
    apifyApiToken: process.env.APIFY_API_TOKEN,
  },


  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Cadence',
      meta: [
        { name: 'theme-color', content: '#0F1117' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
      ],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Cadence',
      short_name: 'Cadence',
      description: 'Remise en forme douce et adaptée au dos, synchronisée au rythme de ta musique.',
      theme_color: '#0F1117',
      background_color: '#0F1117',
      display: 'standalone',
      orientation: 'portrait',
    },
  },
});