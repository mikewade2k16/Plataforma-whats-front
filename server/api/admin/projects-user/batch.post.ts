// server/api/admin/projects-user/batch.post.ts
import { defineEventHandler, readBody } from 'h3'
import { proxyToLaravel } from '../../../utils/proxyLaravel'

type BatchOp =
    | { id: string; type: 'create'; payload: { user_id: number; project_id: number } }
    | { id: string; type: 'delete'; payload: { id: number } }
    | { id: string; type: 'remove'; payload: { project_id: number; user_id: number } }
    | { id: string; type: 'replace'; payload: { project_id: number; user_ids: number[] } }

export default defineEventHandler(async (event) => {
    const body = await readBody<{ ops: BatchOp[] }>(event)
    const ops = Array.isArray(body?.ops) ? body.ops : []
    const results: Array<{ id: string; ok: boolean; data?: any; error?: string }> = []

    for (const op of ops) {
        try {
            if (op.type === 'create') {
                const data = await proxyToLaravel(event, '/api/admin/projects-user', {
                    method: 'POST', body: { user_id: op.payload.user_id, project_id: op.payload.project_id }
                })
                results.push({ id: op.id, ok: true, data }); continue
            }
            if (op.type === 'delete') {
                const data = await proxyToLaravel(event, `/api/admin/projects-user/${op.payload.id}`, {
                    method: 'DELETE'
                })
                results.push({ id: op.id, ok: true, data }); continue
            }
            if (op.type === 'remove') {
                // apaga vínculo por (project_id, user_id)
                const list = await proxyToLaravel(event, '/api/admin/projects-user', { method: 'GET' })
                const items: any[] = Array.isArray(list?.data) ? list.data : (Array.isArray(list) ? list : [])
                const found = items.find((it: any) =>
                    Number(it.project_id) === Number(op.payload.project_id) &&
                    Number(it.user_id) === Number(op.payload.user_id)
                )
                if (found?.id) {
                    await proxyToLaravel(event, `/api/admin/projects-user/${found.id}`, { method: 'DELETE' })
                    results.push({ id: op.id, ok: true, data: { removed: true } })
                } else {
                    results.push({ id: op.id, ok: true, data: { removed: false } })
                }
                continue
            }
            if (op.type === 'replace') {
                // apaga todos os vínculos do projeto e recria
                const list = await proxyToLaravel(event, '/api/admin/projects-user', { method: 'GET' })
                const items: any[] = Array.isArray(list?.data) ? list.data : (Array.isArray(list) ? list : [])
                const current = items.filter((it: any) => Number(it.project_id) === Number(op.payload.project_id))

                for (const link of current) {
                    await proxyToLaravel(event, `/api/admin/projects-user/${link.id}`, { method: 'DELETE' })
                }
                for (const uid of op.payload.user_ids) {
                    await proxyToLaravel(event, '/api/admin/projects-user', {
                        method: 'POST', body: { user_id: Number(uid), project_id: Number(op.payload.project_id) }
                    })
                }
                results.push({ id: op.id, ok: true, data: { count: op.payload.user_ids.length } }); continue
            }

            results.push({ id: op.id, ok: false, error: 'Unknown operation' })
        } catch (e: any) {
            results.push({ id: op.id, ok: false, error: e?.data?.message || e?.message || 'Batch op failed' })
        }
    }

    return { results }
})
