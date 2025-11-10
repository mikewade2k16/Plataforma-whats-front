import { H3Event, readBody, getQuery, setResponseHeader } from 'h3'
import { getAuthConfig, readToken, writeToken, clearToken, isExpiringSoon as _isExpiringSoon } from './authSession'

function setAuthHeaders(event: H3Event, expiresIn?: number) {
  if (!expiresIn) return
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
  setResponseHeader(event, 'x-auth-refreshed', '1')
  setResponseHeader(event, 'x-auth-expires-in', String(expiresIn))
  setResponseHeader(event, 'x-auth-expires-at', expiresAt)
}

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

function isDefinitiveAuthFailure(err: any) {
  const code = err?.status || err?.response?.status
  const msg = (err?.data?.error || err?.data?.message || '').toString().toLowerCase()
  // Ajuste às mensagens do teu Laravel, se precisar
  if (code === 401 || code === 419) return true
  if (msg.includes('invalid') || msg.includes('token')) return true
  return false
}

// Menos agressivo: só refresca proativamente se faltarem <= 60s
function isExpiringSoonSafe(stored: any) {
  try { return _isExpiringSoon(stored, 60) } catch { return false }
}

// Mutex para evitar múltiplos refresh simultâneos
let refreshing: Promise<any> | null = null
async function safeRefresh(bearer?: string) {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        return await fetchLaravel('/api/refresh', { method: 'POST' }, bearer)
      } finally {
        refreshing = null
      }
    })()
  }
  return refreshing
}

// Mescla getQuery(event) com init.query e com o que já veio em laravelPath (se tiver ?)
function buildFullPath(laravelPath: string, event: H3Event, init?: any) {
  const base = laravelPath
  const hasQ = base.includes('?')
  const qEvent = getQuery(event) as Record<string, any>
  const qInit = (init?.query || {}) as Record<string, any>

  const params = new URLSearchParams()
  for (const [k, v] of Object.entries({ ...qEvent, ...qInit })) {
    if (v === undefined || v === null || v === '') continue
    params.append(k, String(v))
  }

  if (!params.toString()) return base
  return hasQ ? `${base}&${params.toString()}` : `${base}?${params.toString()}`
}

export async function proxyToLaravel(event: H3Event, laravelPath: string, init?: any) {
  const method = (init?.method || event.node.req.method || 'GET').toUpperCase()
  const body = init?.body ?? (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? await readBody(event) : undefined)
  const fullPath = buildFullPath(laravelPath, event, init)

  const stored = readToken(event)

  // refresh proativo (seguro)
  if (stored && isExpiringSoonSafe(stored)) {
    try {
      const refreshed: any = await safeRefresh(stored.access_token)
      if (refreshed?.access_token) {
        writeToken(event, refreshed)
        setAuthHeaders(event, Number(refreshed.expires_in ?? refreshed.expiresIn))
      }
    } catch (e) {
      // não limpar em falha transitória
      if (isDefinitiveAuthFailure(e)) clearToken(event)
    }
  }

  const bearer = readToken(event)?.access_token

  // chamada direta de refresh
  if (fullPath === '/api/refresh' && method === 'POST') {
    const refreshed: any = await safeRefresh(bearer)
    if (refreshed?.access_token) {
      writeToken(event, refreshed)
      setAuthHeaders(event, Number(refreshed.expires_in ?? refreshed.expiresIn))
      return refreshed
    }
  }

  try {
    return await fetchLaravel(fullPath, { method, body }, bearer || undefined)
  } catch (err: any) {
    const code = err?.status || err?.response?.status
    if ((code === 401 || code === 419) && bearer) {
      try {
        const refreshed: any = await safeRefresh(bearer)
        if (refreshed?.access_token) {
          writeToken(event, refreshed)
          setAuthHeaders(event, Number(refreshed.expires_in ?? refreshed.expiresIn))
          const newBearer = refreshed.access_token as string
          return await fetchLaravel(fullPath, { method, body }, newBearer)
        }
      } catch (e) {
        if (isDefinitiveAuthFailure(e)) clearToken(event)
      }
    }
    throw createError({
      statusCode: code || 500,
      statusMessage: err?.data?.message || err?.message || 'Proxy error',
      data: err?.data,
    })
  }
}
