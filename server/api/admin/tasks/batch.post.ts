import { defineEventHandler, readBody } from 'h3'
import { proxyToLaravel } from '../../../utils/proxyLaravel'

type BatchOp =
    | { id: string; type: 'create'; payload: any }
    | { id: string; type: 'update'; payload: { id: number; patch: Record<string, any> } }
    | { id: string; type: 'delete'; payload: { id: number } }
    | { id: string; type: 'reorder'; payload: { columnId: number; orderedIds: number[] } }
    | { id: string; type: 'move'; payload: { taskId: number; toColumnId: number; toIndex: number; targetOrderedIds: number[] } }

// remove campos de UI/temp e mantém somente os do backend
function sanitizeTaskPayload(p: any) {
    const {
        name, description = null, priority = '', due_date = null,
        start_date = null, type_task = null, number = null, comment = null, file = null,
        archived = 0, order_position = 0, project_id, column_id,
        user_id = null, client_id = null, campaign_id = null,
        involved_users = null, timer_status = 0, last_started = null, time_spent = 0
    } = p || {}
    return {
        name, description, priority, due_date, start_date, type_task, number, comment, file,
        archived, order_position, project_id, column_id, user_id, client_id, campaign_id,
        involved_users, timer_status, last_started, time_spent
    }
}

function sanitizePatch(patch: Record<string, any>) {
    const clean = sanitizeTaskPayload(patch)
    // Mantém somente chaves presentes no patch original
    return Object.fromEntries(Object.keys(patch).map(k => [k, (clean as any)[k]]))
}

export default defineEventHandler(async (event) => {
    const body = await readBody<{ ops: BatchOp[] }>(event)
    const ops = Array.isArray(body?.ops) ? body.ops : []

    const results: Array<{ id: string; ok: boolean; data?: any; error?: string }> = []

    for (const op of ops) {
        try {
            if (op.type === 'create') {
                const res = await proxyToLaravel(event, '/api/admin/tasks', {
                    method: 'POST',
                    body: sanitizeTaskPayload(op.payload)
                })
                results.push({ id: op.id, ok: true, data: res })
                continue
            }
            if (op.type === 'update') {
                const { id, patch } = op.payload
                const res = await proxyToLaravel(event, `/api/admin/tasks/${id}`, {
                    method: 'PUT',
                    body: sanitizePatch(patch)
                })
                results.push({ id: op.id, ok: true, data: res })
                continue
            }
            if (op.type === 'delete') {
                const { id } = op.payload
                let okData: any = null
                try {
                    okData = await proxyToLaravel(event, `/api/admin/tasks/${id}`, { method: 'DELETE' })
                } catch (e: any) {
                    const code = e?.statusCode || e?.response?.status
                    if (code !== 404) throw e
                }
                results.push({ id: op.id, ok: true, data: okData })
                continue
            }
            if (op.type === 'reorder') {
                const { orderedIds } = op.payload
                for (let i = 0; i < orderedIds.length; i++) {
                    const id = orderedIds[i]
                    await proxyToLaravel(event, `/api/admin/tasks/${id}`, { method: 'PUT', body: { order_position: i } })
                }
                results.push({ id: op.id, ok: true, data: { count: orderedIds.length } })
                continue
            }
            if (op.type === 'move') {
                const { taskId, toColumnId, toIndex, targetOrderedIds } = op.payload
                await proxyToLaravel(event, `/api/admin/tasks/${taskId}`, {
                    method: 'PUT',
                    body: { column_id: toColumnId, order_position: toIndex }
                })
                for (let i = 0; i < targetOrderedIds.length; i++) {
                    const id = targetOrderedIds[i]
                    await proxyToLaravel(event, `/api/admin/tasks/${id}`, { method: 'PUT', body: { order_position: i } })
                }
                results.push({ id: op.id, ok: true, data: { moved: taskId } })
                continue
            }
            results.push({ id: op.id, ok: false, error: 'Unknown operation' })
        } catch (e: any) {
            results.push({ id: op.id, ok: false, error: e?.data?.message || e?.message || 'Batch op failed' })
        }
    }
    return { results }
})
