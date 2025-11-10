import { proxyToLaravel } from '../../../server/utils/proxyLaravel'
import { clearToken } from '../../../server/utils/authSession'

export default defineEventHandler(async (event) => {
    try { await proxyToLaravel(event, '/api/logout', { method: 'POST' }) } catch { }
    clearToken(event)
    return { ok: true }
})
