// middleware/auth.ts
import { useAuthStore } from '@/stores/auth'

export default defineNuxtRouteMiddleware(async () => {
    const auth = useAuthStore()

    // evita chamar me() em SSR p/ não duplicar chamadas; mas funciona dos dois jeitos
    if (!auth.booted) {
        try { await auth.me() } catch { }
    }
    if (!auth.isAuthenticated) {
        return navigateTo('/login')
    }
})
