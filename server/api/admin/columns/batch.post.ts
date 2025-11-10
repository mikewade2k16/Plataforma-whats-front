// server/api/admin/columns/batch.post.ts
import { defineEventHandler, readBody } from 'h3'
import { proxyToLaravel } from '../../../utils/proxyLaravel'

type Op =
    | { id: string; type: 'create'; payload: { name: string; project_id: number } }
    | { id: string; type: 'rename'; payload: { id: number; name: string } }
    | { id: string; type: 'delete'; payload: { id: number } }

export default defineEventHandler(async (event) => {
    const body = await readBody<{ ops: Op[] }>(event)
    const ops = Array.isArray(body?.ops) ? body.ops : []
    const results: Array<{ id: string; ok: boolean; data?: any; error?: string }> = []

    for (const op of ops) {
        try {
            if (op.type === 'create') {
                const data = await proxyToLaravel(event, '/api/admin/columns', { method: 'POST', body: op.payload })
                results.push({ id: op.id, ok: true, data })
                continue
            }
            if (op.type === 'rename') {
                const { id, name } = op.payload
                const data = await proxyToLaravel(event, `/api/admin/columns/${id}`, { method: 'PUT', body: { name } })
                results.push({ id: op.id, ok: true, data })
                continue
            }
            if (op.type === 'delete') {
                const { id } = op.payload
                try {
                    const data = await proxyToLaravel(event, `/api/admin/columns/${id}`, { method: 'DELETE' })
                    results.push({ id: op.id, ok: true, data })
                } catch (e: any) {
                    const code = e?.statusCode || e?.response?.status
                    if (code === 404) {
                        results.push({ id: op.id, ok: true, data: null }) // idempotente
                    } else {
                        throw e
                    }
                }
                continue
            }
            results.push({ id: op.id, ok: false, error: 'Unknown op' })
        } catch (e: any) {
            results.push({ id: op.id, ok: false, error: e?.data?.message || e?.message || 'Batch failed' })
        }
    }
    return { results }
})
