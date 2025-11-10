// plugins/fetch-auth.client.ts
import type { FetchContext } from 'ofetch'
import { useAuthStore } from '@/stores/auth'

export default defineNuxtPlugin((nuxtApp) => {
    if (process.server) return

    const auth = useAuthStore()
    const $f = (nuxtApp.$fetch || (globalThis as any).$fetch) as any
    if (!$f || typeof $f.onResponse !== 'function') {
        console.warn('[fetch-auth] $fetch.onResponse indisponível')
        return
    }

    $f.onResponse((ctx: any) => {
        const h: Headers | undefined = ctx.response?.headers
        if (h) {
            auth.setExpiresFromHeaders(h)
            if (h.get('x-auth-refreshed') === '1') {
                useToast().success('Sessão renovada')
                auth.hydrateFromCookie().catch(() => { })
                return
            }
        }

        // Fallback via body
        const data = ctx.response?._data
        if (data && (typeof data.expires_in === 'number' || typeof data.expires_at === 'number')) {
            useAuthStatus().setFromBody(data)
            if (typeof data.expires_at === 'number') auth.setExpiresAt(data.expires_at)
            else if (typeof data.expires_in === 'number') auth.setExpiresAt(Date.now() + data.expires_in * 1000)
            useToast().success('Sessão renovada')
        }
    })

    $f.onResponseError((ctx: any) => {
        if (ctx.response?.status === 401) {
            useToast().error('Sua sessão expirou. Faça login novamente.')
        }
    })
})

