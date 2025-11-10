// composables/useAuthStatus.ts
export function useAuthStatus() {
    const expiresAt = useState<number | null>('auth:expAt', () => null)
    const secondsLeft = useState<number>('auth:secLeft', () => 0)

    // 1) Sincroniza com o store
    if (process.client) {
        const auth = useAuthStore()
        watch(
            () => auth.expiresAt,
            (ms) => { if (ms) expiresAt.value = ms },
            { immediate: true }
        )
    }

    // 2) Atualiza countdown
    if (process.client && !(window as any).__auth_timer) {
        ; (window as any).__auth_timer = setInterval(() => {
            const at = expiresAt.value
            secondsLeft.value = at ? Math.max(0, Math.round((at - Date.now()) / 1000)) : 0
        }, 1000)
    }

    // 3) Helpers de atualização
    function bumpBySeconds(sec: number) {
        if (!sec || sec <= 0) return
        expiresAt.value = Date.now() + sec * 1000
        const auth = process.client ? useAuthStore() : null
        auth?.setExpiresAt(expiresAt.value)
    }

    function setFromHeaders(h: Headers) {
        const expAt = h.get('x-auth-expires-at')
        const expIn = h.get('x-auth-expires-in')
        if (expAt) {
            const t = Date.parse(expAt); if (!isNaN(t)) {
                expiresAt.value = t
                useAuthStore().setExpiresAt(t)
            }
        } else if (expIn) {
            bumpBySeconds(Number(expIn))
        }
    }

    // (opcional) também aceitar corpo de resposta (login/refresh padrão Laravel costuma devolver expires_in)
    function setFromBody(body: any) {
        if (!body) return
        if (typeof body.expires_at === 'string') {
            const t = Date.parse(body.expires_at)
            if (!isNaN(t)) { expiresAt.value = t; useAuthStore().setExpiresAt(t) }
        } else if (typeof body.expiresAt === 'number') {
            expiresAt.value = body.expiresAt; useAuthStore().setExpiresAt(body.expiresAt)
        } else if (typeof body.expires_in === 'number') {
            bumpBySeconds(body.expires_in)
        }
    }

    return { expiresAt, secondsLeft, setFromHeaders, setFromBody, bumpBySeconds }
}
