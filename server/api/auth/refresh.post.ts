import { defineEventHandler, setHeader } from 'h3'
import { writeToken, readToken } from '../../../server/utils/authSession'
import { getAuthConfig } from '../../../server/utils/authSession'

export default defineEventHandler(async (event) => {
    const { baseURL } = getAuthConfig()

    // token corrente do cookie httpOnly
    let current: any = null
    try { current = await readToken(event) } catch { }

    const authHeader = current?.access_token
        ? { Authorization: `Bearer ${current.access_token}` }
        : {}

    const url = new URL('/api/refresh', baseURL).toString()

    const res: any = await $fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...authHeader,
        },
    })

    // se veio token novo, persistimos
    if (res?.access_token) {
        writeToken(event, res)

        const expiresIn = Number(res?.expires_in || 0) // segundos
        if (expiresIn > 0) {
            const expMs = Date.now() + expiresIn * 1000

            // headers p/ seu fetch-auth.client.ts
            setHeader(event, 'x-auth-refreshed', '1')
            setHeader(event, 'x-auth-expires-in', String(expiresIn))
            setHeader(event, 'x-auth-expires-at', String(expMs))

            // também no body (fallback)
            return {
                ok: true,
                user: res?.user ?? null,
                expires_in: expiresIn,
                expires_at: expMs,
                now: Date.now(),
            }
        }
    }

    // fallback (sem token novo)
    return {
        ok: true,
        user: res?.user ?? null,
        expires_in: res?.expires_in ?? null,
        expires_at: null,
        now: Date.now(),
    }
})