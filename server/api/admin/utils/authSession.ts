// server/utils/authSession.ts
import { H3Event, getCookie, setCookie, deleteCookie } from 'h3'

export type AuthPayload = {
    access_token: string
    token_type?: string
    expires_in?: number
    user?: any
}

export type StoredToken = {
    access_token: string
    expires_at: number // epoch ms
}

const COOKIE_VERSION = 'v1' // pra invalidar versões antigas quando necessário

export function getAuthConfig() {
    const config = useRuntimeConfig()
    return {
        name: config.private.authCookieName as string,
        secure: !!config.private.authCookieSecure,
        sameSite: (config.private.authCookieSameSite || 'lax') as 'lax' | 'strict' | 'none',
        maxAge: Number(config.private.authCookieMaxAge || 3600),
        baseURL: config.private.laravelBaseUrl as string,
    }
}

export function readToken(event: H3Event): StoredToken | null {
    const { name } = getAuthConfig()
    const raw = getCookie(event, name)
    if (!raw) return null
    try {
        const data = JSON.parse(raw)
        if (data?.ver !== COOKIE_VERSION) return null
        return data?.token as StoredToken
    } catch {
        return null
    }
}

export function writeToken(event: H3Event, payload: AuthPayload) {
    const { name, secure, sameSite, maxAge } = getAuthConfig()
    const expiresIn = Number(payload.expires_in || maxAge || 3600)
    const token: StoredToken = {
        access_token: payload.access_token,
        expires_at: Date.now() + expiresIn * 1000,
    }
    setCookie(event, name, JSON.stringify({ ver: COOKIE_VERSION, token }), {
        httpOnly: true,
        secure,
        sameSite,
        maxAge: expiresIn,
        path: '/',
    })
}

export function clearToken(event: H3Event) {
    const { name } = getAuthConfig()
    deleteCookie(event, name, { path: '/' })
}

export function isExpiringSoon(stored: StoredToken | null, skewSeconds = 30) {
    if (!stored) return true
    return Date.now() >= stored.expires_at - skewSeconds * 1000
}
