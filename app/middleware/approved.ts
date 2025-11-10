// middleware/approved.ts
import { useAuthStore } from '@/stores/auth'

export default defineNuxtRouteMiddleware(async () => {
    const auth = useAuthStore()
    if (!auth.booted) {
        try { await auth.me() } catch { }
    }
    if (!auth.isAuthenticated) return navigateTo('/login')
    if (!auth.isApproved) return navigateTo('/pending-approval')
})
