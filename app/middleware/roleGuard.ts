// middleware/roleGuard.ts
import { useAuthStore } from '@/stores/auth'

type Meta = {
    levels?: string[]
    roles?: string[]
}

export default defineNuxtRouteMiddleware((to) => {
    const auth = useAuthStore()
    const meta = (to.meta || {}) as Meta

    if (!auth.isAuthenticated) return navigateTo('/login')

    const wantedLevels = meta.levels || []
    const wantedRoles = meta.roles || []

    if (!wantedLevels.length && !wantedRoles.length) return

    const userLevel = auth.user?.level || ''
    const userType = auth.user?.user_type || ''

    const levelOk = wantedLevels.length ? wantedLevels.includes(userLevel) : true
    const roleOk = wantedRoles.length ? wantedRoles.includes(userType) : true

    if (!levelOk || !roleOk) {
        // opcional: mandar p/ dashboard
        return navigateTo('/')
    }
})
