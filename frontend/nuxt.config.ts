// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n'
  ],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
    exposeConfig: false,
    viewer: false,
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || ''
    }
  },

  typescript: {
    strict: true,
    typeCheck: false // Disabled for build performance
  },

  i18n: {
    locales: ['en', 'id'],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    vueI18n: './i18n.config.ts'
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Stockmeter - Stock Fair Value Calculator',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes' },
        { name: 'description', content: 'Calculate fair value of stocks using multiple valuation models' },
        { name: 'theme-color', content: '#000000' }
      ],
      link: [
        { rel: 'preconnect', href: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001' }
      ]
    }
  },

  // Performance optimizations
  experimental: {
    payloadExtraction: true,
    renderJsonPayloads: true,
    viewTransition: true
  },

  // Build optimizations
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', 'vue-router'],
            'pinia': ['pinia']
          }
        }
      }
    }
  },

  // Nitro optimizations for SSR
  nitro: {
    compressPublicAssets: true,
    minify: true
  }
})
