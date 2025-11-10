// server/api/admin/projects/batch.post.ts
import { defineEventHandler, readBody } from 'h3'
import { proxyToLaravel } from '../../../utils/proxyLaravel'

type BatchOp =
    | { id: string; type: 'create'; payload: any }
    | { id: string; type: 'update'; payload: { id: number; patch: Record<string, any> } }
    | { id: string; type: 'delete'; payload: { id: number } }
    // 👇 novo: seta membros do projeto (substitui todos)
    | { id: string; type: 'setMembers'; payload: { project_id: number; user_ids: number[] } }

export default defineEventHandler(async (event) => {
    const body = await readBody<{ ops: BatchOp[] }>(event)
    const ops = Array.isArray(body?.ops) ? body.ops : []

    const results: Array<{ id: string; ok: boolean; data?: any; error?: string }> = []

    for (const op of ops) {
        try {
            if (op.type === 'create') {
                const res = await proxyToLaravel(event, '/api/admin/projects', { method: 'POST', body: op.payload })
                results.push({ id: op.id, ok: true, data: res })
                continue
            }
            if (op.type === 'update') {
                const { id, patch } = op.payload
                const res = await proxyToLaravel(event, `/api/admin/projects/${id}`, { method: 'PUT', body: patch })
                results.push({ id: op.id, ok: true, data: res })
                continue
            }
            if (op.type === 'delete') {
                const { id } = op.payload
                let okData: any = null
                try {
                    okData = await proxyToLaravel(event, `/api/admin/projects/${id}`, { method: 'DELETE' })
                } catch (e: any) {
                    const code = e?.statusCode || e?.response?.status
                    if (code !== 404) throw e
                }
                results.push({ id: op.id, ok: true, data: okData })
                continue
            }
            // 👇 novo – usa UpdateProjectRequest { members: [...] }
            if (op.type === 'setMembers') {
                const { project_id, user_ids } = op.payload
                const res = await proxyToLaravel(event, `/api/admin/projects/${project_id}`, {
                    method: 'PUT',
                    body: { members: user_ids }
                })
                results.push({ id: op.id, ok: true, data: res })
                continue
            }

            results.push({ id: op.id, ok: false, error: 'Unknown operation' })
        } catch (e: any) {
            results.push({ id: op.id, ok: false, error: e?.data?.message || e?.message || 'Batch op failed' })
        }
    }

    return { results }
})
