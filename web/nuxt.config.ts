// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3001'
    }
  },
  nitro: {
    proxy: {
      '/api/**': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})