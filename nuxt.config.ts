// nuxt.config.ts
const env = process.env as Record<string, string | undefined>
const LARAVEL_BASE_URL = env.LARAVEL_BASE_URL ?? 'http://localhost'
const LARAVEL_API_TOKEN = env.LARAVEL_API_TOKEN ?? ''

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  runtimeConfig: {
    // 🔒 privadas (server-only)
    laravel: {
      baseURL: LARAVEL_BASE_URL,
      token: LARAVEL_API_TOKEN,
    },
    laravelBaseUrl: process.env.NUXT_PRIVATE_LARAVEL_BASE_URL || 'http://localhost',
    authCookieName: process.env.NUXT_PRIVATE_AUTH_COOKIE_NAME || 'omnix_auth',
    authCookieSecure: process.env.NUXT_PRIVATE_AUTH_COOKIE_SECURE === 'true',
    authCookieSameSite: (process.env.NUXT_PRIVATE_AUTH_COOKIE_SAMESITE as any) || 'lax',
    authCookieMaxAge: Number(process.env.NUXT_PRIVATE_AUTH_COOKIE_MAXAGE || 3600),

    // 🌐 públicas (client + server)
    public: {
      authDriver: process.env.NUXT_PUBLIC_AUTH_DRIVER || 'bff',
      defaultProjectId: Number(process.env.NUXT_PUBLIC_DEFAULT_PROJECT_ID || 2) // <- ajuste se precisar
    },
  },

  build: { transpile: ['@iconify/vue'] },
  devtools: { enabled: true },
  components: { dirs: ['~/components'] },
  css: [
    '~/assets/scss/main.scss',
    '~/assets/css/bootstrap/grid.min.css',
    '~/assets/css/bootstrap/utilities.min.css',
  ],
  vite: {
    css: {
      preprocessorOptions: {
        scss: { additionalData: `@use "~/assets/scss/_tokens.scss" as *;` },
      },
    },
  },
  modules: [
    '@pinia/nuxt',
    ['unplugin-icons/nuxt', {
      scale: 1,
      defaultStyle: 'vertical-align: -0.125em;',
      autoInstall: true,
    }],
  ],
})
