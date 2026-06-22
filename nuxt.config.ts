export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Deck Royale - Poker Multijugador',
      link: [
        { rel: 'icon', type: 'image/png', href: '/images/logo.png' },
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Juega poker Texas Hold\'em multijugador en linea' },
      ],
    },
  },

  ssr: false,
})
