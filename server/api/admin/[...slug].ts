// Catch-all para QUALQUER rota admin -> Laravel
import { proxyToLaravel } from '../../utils/proxyLaravel'
import { getQuery, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    // /server/api/admin/[...slug]  -> /api/admin/<slug...>
    const slug = (event.context.params?.slug || []) as string[] | string
    const parts = Array.isArray(slug) ? slug : (slug ? [slug] : [])
    const laravelPath = `/api/admin/${parts.join('/')}`

    const method = (event.node.req.method || 'GET').toUpperCase()
    const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? await readBody(event) : undefined
    const query = getQuery(event)

    return await proxyToLaravel(event, laravelPath, { method, body, query })
})
