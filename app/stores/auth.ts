// stores/auth.ts
import { defineStore } from 'pinia'

type User = {
    id: number | string
    name: string
    email: string
    nick?: string
    status?: 'active' | 'pending' | 'inactive' | string
    user_type?: string
    level?: string
    [k: string]: any
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as User | null,
        loading: false as boolean,
        error: '' as string | null,
        booted: false as boolean, // se já tentamos 'me'

        // ⏳ novo: timestamp (epoch ms) em que o token expira
        expiresAt: null as number | null
    }),

    getters: {
        isAuthenticated: (s) => !!s.user,
        isApproved: (s) => s.user?.status === 'active',
        role: (s) => s.user?.level || s.user?.user_type || null,
    },

    actions: {
        setUser(u: User | null) { this.user = u },

        // ===== helpers de expiração (podem ser usados por plugins/middlewares) =====
        setExpiresAt(ms: number | null) {
            this.expiresAt = ms
        },

        /** Aceita headers do BFF: x-auth-expires-at (ISO) e/ou x-auth-expires-in (segundos) */
        setExpiresFromHeaders(h?: Headers | null) {
            if (!h) return
            const at = h.get('x-auth-expires-at')
            const sin = h.get('x-auth-expires-in')
            if (at) {
                const t = Date.parse(at)
                if (!Number.isNaN(t)) this.setExpiresAt(t)
            } else if (sin) {
                const s = Number(sin)
                if (s > 0) this.setExpiresAt(Date.now() + s * 1000)
            }
        },

        /** Aceita corpo de /login e /refresh (expires_in, expires_at, expiresAt) */
        setExpiresFromBody(body?: any) {
            if (!body) return
            if (typeof body.expires_at === 'string') {
                const t = Date.parse(body.expires_at)
                if (!Number.isNaN(t)) this.setExpiresAt(t)
            } else if (typeof body.expiresAt === 'number') {
                this.setExpiresAt(body.expiresAt)
            } else if (typeof body.expires_in === 'number') {
                this.setExpiresAt(Date.now() + body.expires_in * 1000)
            }
        },

        /** Lê o cookie do BFF e atualiza expiresAt/user/token se existirem */
        async hydrateFromCookie() {
            const rc = useRuntimeConfig()
            const cookieName =
                rc.private?.authCookieName ||
                rc.public?.authCookieName ||
                rc.private?.NUXT_PRIVATE_AUTH_COOKIE_NAME ||
                'omnix_auth'

            const c = useCookie<string | null>(cookieName).value
            if (!c) return

            try {
                const obj = JSON.parse(c)

                // tolerante a formatos
                if (obj.expires_at) {
                    const t = Date.parse(obj.expires_at)
                    if (!Number.isNaN(t)) this.setExpiresAt(t)
                } else if (obj.expiresAt) {
                    this.setExpiresAt(Number(obj.expiresAt))
                } else if (obj.expires_in) {
                    this.setExpiresAt(Date.now() + Number(obj.expires_in) * 1000)
                }

                if (obj.user && !this.user) this.user = obj.user as User
            } catch {
                // cookie pode não ser JSON; ignora silenciosamente
            }
        },

        // ========================= AÇÕES ORIGINAIS =========================

        async login(payload: { email: string; password: string }) {
            this.loading = true; this.error = ''
            try {
                const res: any = await $fetch('/api/auth/login', {
                    method: 'POST',
                    body: payload
                })
                if (res?.user) this.user = res.user
                // novo: captura expires* do corpo do login
                this.setExpiresFromBody(res)
                return res
            } catch (e: any) {
                this.error = e?.data?.message || e?.message || 'Falha no login'
                throw e
            } finally {
                this.loading = false
            }
        },

        async register(payload: { name: string; email: string; password: string; password_confirmation: string }) {
            this.loading = true; this.error = ''
            try {
                const res: any = await $fetch('/api/auth/register', {
                    method: 'POST',
                    body: payload
                })
                if (res?.user) this.user = res.user // se API já logar
                // se o back devolver expires_in aqui, tratamos também
                this.setExpiresFromBody(res)
                return res
            } catch (e: any) {
                this.error = e?.data?.message || e?.message || 'Falha no cadastro'
                throw e
            } finally {
                this.loading = false
            }
        },

        async me() {
            try {
                const u: any = await $fetch('/api/auth/me')
                if (u?.id) this.user = u
                // caso o endpoint /me inclua expires_*, aproveita
                this.setExpiresFromBody(u)
                this.booted = true
                return this.user
            } catch {
                this.user = null
                this.booted = true
                return null
            }
        },

        async logout() {
            try { await $fetch('/api/auth/logout', { method: 'POST' }) } catch { }
            this.user = null
            this.booted = true
            this.setExpiresAt(null) // ← limpa contador
        },

        async forgot(email: string) {
            return $fetch('/api/auth/forgot-password', { method: 'POST', body: { email } })
        },

        async reset(payload: { token: string; password: string; password_confirmation?: string }) {
            return $fetch('/api/auth/reset-password', { method: 'POST', body: payload })
        },
    }
})
