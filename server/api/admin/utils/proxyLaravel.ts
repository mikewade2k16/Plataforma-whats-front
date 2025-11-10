// server/utils/proxyLaravel.ts
import { H3Event } from 'h3'
import { readBody, getQuery } from 'h3'
import { getAuthConfig, readToken, writeToken, clearToken, isExpiringSoon } from './authSession'

async function fetchLaravel(path: string, opts: any = {}, bearer?: string) {
    const { baseURL } = getAuthConfig()
    const url = new URL(path, baseURL).toString()

    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
    }
    if (bearer) headers.Authorization = `Bearer ${bearer}`

    return await $fetch(url, { ...opts, headers })
}

/**
 * Encaminha a request atual para o Laravel com Bearer da sessão.
 * - Se o token estiver perto de expirar, tenta /api/refresh primeiro.
 * - Em 401/419, tenta refresh uma vez e repete; se falhar, limpa sessão e lança erro.
 */
export async function proxyToLaravel(event: H3Event, laravelPath: string, init?: any) {
    const method = (init?.method || event.node.req.method || 'GET').toUpperCase()
    const body = init?.body ?? (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? await readBody(event) : undefined)
    const query = getQuery(event)
    const search = new URLSearchParams(query as Record<string, string>).toString()
    const fullPath = search ? `${laravelPath}?${search}` : laravelPath

    const stored = readToken(event)

    // tenta refresh se expira em breve
    if (stored && isExpiringSoon(stored)) {
        try {
            const refreshed: any = await fetchLaravel('/api/refresh', { method: 'POST' }, stored.access_token)
            if (refreshed?.access_token) writeToken(event, refreshed)
        } catch (e) {
            // refresh falhou → limpa e segue, a próxima chamada tratará 401
            clearToken(event)
        }
    }

    const bearer = readToken(event)?.access_token

    try {
        return await fetchLaravel(fullPath, { method, body }, bearer || undefined)
    } catch (err: any) {
        const code = err?.status || err?.response?.status
        if ((code === 401 || code === 419) && bearer) {
            // tenta 1x refresh e repete
            try {
                const refreshed: any = await fetchLaravel('/api/refresh', { method: 'POST' }, bearer)
                if (refreshed?.access_token) {
                    writeToken(event, refreshed)
                    const newBearer = refreshed.access_token as string
                    return await fetchLaravel(fullPath, { method, body }, newBearer)
                }
            } catch {
                clearToken(event)
            }
        }
        // propaga erro
        throw createError({
            statusCode: code || 500,
            statusMessage: err?.data?.message || err?.message || 'Proxy error',
            data: err?.data,
        })
    }
}
