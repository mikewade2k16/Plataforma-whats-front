// middleware/hydrate.client.ts
import { useAuthStore } from '@/stores/auth'

let keepAliveTimer: any = null
let refreshing = false
const REFRESH_BUFFER_MS = 5 * 60 * 1000 // 5min

export default defineNuxtPlugin((nuxtApp) => {
    if (process.server) return
    const auth = useAuthStore()

    nuxtApp.hook('app:mounted', async () => {
        try {
            await auth.hydrateFromCookie()
            if (!auth.user) await auth.fetchMe()
        } catch { }

        startKeepAlive()
        document.addEventListener('visibilitychange', onVis)
    })

    nuxtApp.hook('app:beforeUnmount', () => {
        stopKeepAlive()
        document.removeEventListener('visibilitychange', onVis)
    })

    function onVis() {
        if (document.hidden) stopKeepAlive()
        else startKeepAlive()
    }

    function startKeepAlive() {
        if (keepAliveTimer) return
        keepAliveTimer = setInterval(async () => {
            const exp = auth.expiresAt // epoch ms do seu store
            if (!exp || refreshing) return
            const remaining = exp - Date.now()
            if (remaining < REFRESH_BUFFER_MS) {
                try {
                    refreshing = true
                    // chama via BFF; ele grava cookie e manda x-auth-* (plugin mostra toast)
                    await $fetch('/api/refresh', { method: 'POST' })
                    await auth.hydrateFromCookie()
                } catch { /* plugin de fetch lida com 401 */ }
                finally { refreshing = false }
            }
        }, 60_000) // checa a cada 1 min
    }

    function stopKeepAlive() {
        if (keepAliveTimer) { clearInterval(keepAliveTimer); keepAliveTimer = null }
    }
})
