import { ref, computed, watch, reactive } from 'vue'
import { defineStore } from 'pinia'
import { cacheGet, cacheSet } from '@/lib/cache'

export type Task = {
    id: number
    column_id: number
    name: string
    description?: string | null
    priority?: string | null // baixa|media|alta ou '1'|'2'|'3' se preferir
    due_date?: string | null
    // --- campos do schema ---
    client_id?: number | null
    campaign_id?: number | null
    user_id?: number | null
    start_date?: string | null
    type_task?: string | null // enum do teu DB
    number?: number | null
    comment?: string | null
    file?: string | null
    archived?: number | boolean
    order_position?: number
    involved_users?: string | null
    timer_status?: number | null // 0-stopped 1-running 2-paused
    last_started?: string | null // timestamp
    time_spent?: number | null   // segundos acumulados
    project_id?: number | null
    // --- internos UI ---
    _temp?: boolean
    _error?: boolean
    _opId?: string
    [k: string]: any
}

type OutboxOp =
    | { id: string; type: 'create'; payload: Omit<Task, 'id'> & { tempId: number } }
    | { id: string; type: 'update'; payload: { id: number; patch: Record<string, any> } }
    | { id: string; type: 'reorder'; payload: { columnId: number; orderedIds: number[] } }
    | { id: string; type: 'move'; payload: { taskId: number; toColumnId: number; toIndex: number; targetOrderedIds: number[]; sourceColumnId?: number } }
    | { id: string; type: 'delete'; payload: { id: number } }

const CACHE_ITEMS_KEY = 'tasks:items'
const CACHE_OUTBOX_KEY = 'tasks:outbox'
const CACHE_TOMBSTONES_KEY = 'tasks:tombstones'

function rid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

export const useTasksStore = defineStore('tasks', () => {
    const items = ref<Task[]>([])
    const outbox = ref<OutboxOp[]>([])
    const syncing = ref(false)
    const error = ref<string | null>(null)
    const backendMs = ref<number | null>(null)
    const totalItems = ref<number | null>(null)
    let inFlight: AbortController | null = null

    const tombstones = ref<Set<number>>(new Set())
    const deletingIds = ref<Set<number>>(new Set())
    const tempDeletes = ref<Set<number>>(new Set())

    const batching = reactive({ enabled: true, debounceMs: 300 })
    const stagingOps = ref<OutboxOp[]>([])
    const batchFlushing = ref(false)
    let flushTimer: any = null

    // cache
    async function hydrateFromCache() {
        const [cachedItems, cachedOutbox, cachedTombs] = await Promise.all([
            cacheGet<Task[]>(CACHE_ITEMS_KEY),
            cacheGet<OutboxOp[]>(CACHE_OUTBOX_KEY),
            cacheGet<number[]>(CACHE_TOMBSTONES_KEY),
        ])
        if (cachedItems) items.value = cachedItems
        if (cachedOutbox) outbox.value = cachedOutbox
        if (cachedTombs && Array.isArray(cachedTombs)) tombstones.value = new Set(cachedTombs)
    }
    watch(items, v => cacheSet(CACHE_ITEMS_KEY, v), { deep: true })
    watch(outbox, v => cacheSet(CACHE_OUTBOX_KEY, v), { deep: true })
    watch(tombstones, s => cacheSet(CACHE_TOMBSTONES_KEY, Array.from(s)))

    const list = computed(() =>
        [...items.value].sort((a, b) => {
            const ca = a.column_id ?? a.column?.id ?? 0
            const cb = b.column_id ?? b.column?.id ?? 0
            if (ca !== cb) return ca - cb
            return (a.order_position ?? 0) - (b.order_position ?? 0)
        })
    )

    async function fetchAllAll() {
        if (inFlight) { inFlight.abort(); inFlight = null }
        inFlight = new AbortController()
        try {
            const cfg = useRuntimeConfig()
            const projectId = cfg.public?.defaultProjectId
            const res = await $fetch.raw<{ data: Task[] }>('/api/admin/tasks/all', {
                query: { project_id: projectId },
                signal: inFlight.signal
            })
            const remote = Array.isArray((res._data as any)?.data) ? (res._data as any).data as Task[] : []
            const remoteFiltered = remote.filter(r => !tombstones.value.has(r.id))
            const localTemps = items.value.filter(t => t._temp || t._error)
            const merged = [
                ...remoteFiltered.filter(r => !localTemps.some(l => l.id === r.id)),
                ...localTemps
            ]
            items.value = merged
            totalItems.value = Number(res.headers.get('x-items-total') || merged.length)
        } finally {
            inFlight = null
        }
    }

    function nextOrderForColumn(columnId: number) {
        let max = -1
        for (const t of items.value) {
            const col = t.column_id ?? t.column?.id ?? 0
            if (col === columnId) {
                const pos = t.order_position ?? 0
                if (pos > max) max = pos
            }
        }
        return max + 1
    }

    function coalesceIntoStaging(op: OutboxOp) {
        if (op.type === 'update') {
            const cIdx = stagingOps.value.findIndex(x => x.type === 'create' && (x as any).payload?.tempId === (op.payload.id))
            if (cIdx >= 0) {
                ; (stagingOps.value[cIdx] as any).payload = { ...(stagingOps.value[cIdx] as any).payload, ...op.payload.patch }
                return
            }
            for (let i = stagingOps.value.length - 1; i >= 0; i--) {
                const x = stagingOps.value[i]
                if (x.type === 'update' && x.payload.id === op.payload.id) {
                    x.payload.patch = { ...x.payload.patch, ...op.payload.patch }
                    return
                }
            }
            stagingOps.value.push(op); return
        }
        if (op.type === 'delete') {
            const id = op.payload.id
            if (id < 0) {
                tempDeletes.value.add(id)
                stagingOps.value = stagingOps.value.filter(x => !(x.type === 'create' && (x as any).payload?.tempId === id))
                outbox.value = outbox.value.filter(x => !(x.type === 'create' && (x as any).payload?.tempId === id))
                return
            }
            stagingOps.value = stagingOps.value.filter(x => !(x.type === 'update' && x.payload.id === id))
            const already = stagingOps.value.some(x => x.type === 'delete' && x.payload.id === id)
            if (!already) stagingOps.value.push(op)
            return
        }
        if (op.type === 'create') {
            const idx = stagingOps.value.findIndex(x => x.type === 'create' && (x as any).payload?.tempId === (op as any).payload?.tempId)
            if (idx >= 0) {
                ; (stagingOps.value[idx] as any).payload = { ...(stagingOps.value[idx] as any).payload, ...(op as any).payload }
                return
            }
            stagingOps.value.push(op); return
        }
        if (op.type === 'reorder') {
            stagingOps.value = stagingOps.value.filter(x => !(x.type === 'reorder' && x.payload.columnId === op.payload.columnId))
            stagingOps.value.push(op); return
        }
        if (op.type === 'move') {
            stagingOps.value = stagingOps.value.filter(x => !(x.type === 'move' && x.payload.taskId === op.payload.taskId))
            stagingOps.value.push(op); return
        }
        stagingOps.value.push(op)
    }

    function scheduleFlush() {
        if (flushTimer) clearTimeout(flushTimer)
        flushTimer = setTimeout(() => { flushBatch().catch(() => { }) }, batching.debounceMs)
    }

    function enqueue(op: OutboxOp) {
        if (!batching.enabled) { outbox.value.push(op); processOutbox(); return }
        coalesceIntoStaging(op)
        scheduleFlush()
    }

    async function flushBatch() {
        if (!batching.enabled) return
        if (!stagingOps.value.length) return
        const ops = stagingOps.value.slice()
        stagingOps.value = []
        batchFlushing.value = true
        try {
            const res: any = await $fetch('/api/admin/tasks/batch', { method: 'POST', body: { ops } })
            const results: Array<{ id: string; ok: boolean; data?: any; error?: string }> = res?.results || []
            for (let i = 0; i < ops.length; i++) {
                const op = ops[i]
                const r = results[i]
                if (!r) continue
                if (op.type === 'create' && r.ok && r.data) {
                    const tempId = (op as any).payload?.tempId
                    const created = r.data as Task
                    if (tempDeletes.value.has(tempId)) {
                        tombstones.value.add(created.id)
                        items.value = items.value.filter(t => t.id !== tempId && t.id !== created.id)
                        tempDeletes.value.delete(tempId)
                        continue
                    }
                    const idx = items.value.findIndex(t => t.id === tempId)
                    if (idx !== -1) {
                        const keepOrder = items.value[idx].order_position ?? created.order_position ?? 0
                        items.value[idx] = { ...created, order_position: keepOrder }
                    }
                    continue
                }
                if (!r.ok) {
                    error.value = r.error || 'Falha na sincronização'
                    if (op.type === 'create') {
                        const t = items.value.find(t => t.id === (op as any).payload?.tempId)
                        if (t) t._error = true
                    }
                }
            }
        } catch (e: any) {
            stagingOps.value = [...ops, ...stagingOps.value]
            error.value = e?.data?.message || e?.message || 'Falha no batch'
        } finally {
            batchFlushing.value = false
        }
    }

    async function createOptimistic(payload: Partial<Task> & { name: string; column_id: number }) {
        const cfg = useRuntimeConfig()
        const projectId = cfg.public?.defaultProjectId
        const tempId = -Date.now()
        const order_position = nextOrderForColumn(payload.column_id)

        const tempTask: Task = {
            id: tempId,
            project_id: projectId ?? null,
            name: payload.name,
            column_id: payload.column_id,
            description: payload.description ?? null,
            priority: payload.priority ?? '',
            due_date: payload.due_date ?? null,
            // extras do schema (defaults neutros)
            client_id: payload.client_id ?? null,
            campaign_id: payload.campaign_id ?? null,
            user_id: payload.user_id ?? null,
            start_date: payload.start_date ?? null,
            type_task: payload.type_task ?? null,
            number: payload.number ?? null,
            comment: payload.comment ?? null,
            file: payload.file ?? null,
            archived: payload.archived ?? 0,
            order_position,
            involved_users: payload.involved_users ?? null,
            timer_status: payload.timer_status ?? 0,
            last_started: payload.last_started ?? null,
            time_spent: payload.time_spent ?? 0,
            _temp: true
        }
        items.value = [tempTask, ...items.value]
        enqueue({ id: rid(), type: 'create', payload: { ...tempTask, tempId } })
        return tempTask
    }

    function updateOptimistic(id: number, patch: Record<string, any>) {
        const t = items.value.find(t => t.id === id)
        if (t) Object.assign(t, patch)
        enqueue({ id: rid(), type: 'update', payload: { id, patch } })
    }

    async function removeOptimistic(id: number) {
        if (deletingIds.value.has(id)) return
        items.value = items.value.filter(t => t.id !== id)
        if (id < 0) {
            tempDeletes.value.add(id)
            stagingOps.value = stagingOps.value.filter(x => !(x.type === 'create' && (x as any).payload?.tempId === id))
            outbox.value = outbox.value.filter(x => !(x.type === 'create' && (x as any).payload?.tempId === id))
            return
        }
        tombstones.value.add(id)
        enqueue({ id: rid(), type: 'delete', payload: { id } })
    }

    function applyLocalReorder(columnId: number, orderedIds: number[]) {
        const posById = new Map<number, number>(orderedIds.map((id, i) => [id, i]))
        for (const t of items.value) {
            const col = t.column_id ?? t.column?.id ?? 0
            if (col === columnId && posById.has(t.id)) t.order_position = posById.get(t.id)!
        }
        items.value = [...items.value]
        enqueue({ id: rid(), type: 'reorder', payload: { columnId, orderedIds } })
    }

    function applyLocalMove(taskId: number, toColumnId: number, toIndex: number, targetOrderedIds: number[], sourceColumnId?: number) {
        const moved = items.value.find(t => t.id === taskId)
        if (moved) {
            moved.column_id = toColumnId
            moved.order_position = toIndex
        }
        targetOrderedIds.forEach((id, i) => {
            const t = items.value.find(tt => tt.id === id)
            if (t) t.order_position = i
        })
        items.value = [...items.value]
        enqueue({ id: rid(), type: 'move', payload: { taskId, toColumnId, toIndex, targetOrderedIds, sourceColumnId } })
    }

    async function processOutbox() {
        if (batching.enabled) { await flushBatch(); return }
        if (syncing.value) return
        syncing.value = true
        try {
            for (let i = 0; i < outbox.value.length; i++) {
                const op = outbox.value[i]
                try {
                    if (op.type === 'create') {
                        const { tempId, ...withoutTemp } = op.payload
                        const created = await $fetch<Task>('/api/admin/tasks', { method: 'POST', body: withoutTemp })
                        if (tempDeletes.value.has(tempId)) {
                            tombstones.value.add(created.id)
                            items.value = items.value.filter(t => t.id !== tempId && t.id !== created.id)
                            tempDeletes.value.delete(tempId)
                            outbox.value.splice(i, 1); i--; continue
                        }
                        const idx = items.value.findIndex(t => t.id === tempId)
                        if (idx !== -1) {
                            const keepOrder = items.value[idx].order_position ?? created.order_position ?? 0
                            items.value[idx] = { ...created, order_position: keepOrder }
                        }
                        outbox.value.splice(i, 1); i--; continue
                    }
                    if (op.type === 'update') {
                        await $fetch(`/api/admin/tasks/${op.payload.id}`, { method: 'PUT', body: op.payload.patch })
                        outbox.value.splice(i, 1); i--; continue
                    }
                    if (op.type === 'reorder') {
                        const ids = op.payload.orderedIds
                        for (let p = 0; p < ids.length; p++) {
                            await $fetch(`/api/admin/tasks/${ids[p]}`, { method: 'PUT', body: { order_position: p } })
                            const t = items.value.find(t => t.id === ids[p])
                            if (t) t.order_position = p
                        }
                        outbox.value.splice(i, 1); i--; continue
                    }
                    if (op.type === 'move') {
                        await $fetch(`/api/admin/tasks/${op.payload.taskId}`, {
                            method: 'PUT', body: { column_id: op.payload.toColumnId, order_position: op.payload.toIndex }
                        })
                        const moved = items.value.find(t => t.id === op.payload.taskId)
                        if (moved) { moved.column_id = op.payload.toColumnId; moved.order_position = op.payload.toIndex }
                        for (let p = 0; p < op.payload.targetOrderedIds.length; p++) {
                            const id = op.payload.targetOrderedIds[p]
                            await $fetch(`/api/admin/tasks/${id}`, { method: 'PUT', body: { order_position: p } })
                            const t = items.value.find(t => t.id === id)
                            if (t) t.order_position = p
                        }
                        outbox.value.splice(i, 1); i--; continue
                    }
                    if (op.type === 'delete') {
                        const id = op.payload.id
                        if (!deletingIds.value.has(id)) {
                            deletingIds.value.add(id)
                            try { await $fetch(`/api/admin/tasks/${id}`, { method: 'DELETE' }) }
                            catch (e: any) {
                                const code = e?.statusCode || e?.response?.status
                                if (code !== 404) { error.value = e?.data?.message || e?.message || 'Falha ao deletar tarefa'; deletingIds.value.delete(id); continue }
                            }
                            deletingIds.value.delete(id)
                        }
                        outbox.value.splice(i, 1); i--; continue
                    }
                } catch (e: any) {
                    error.value = e?.data?.message || e?.message || 'Falha na sincronização'
                    if ((op as any).type === 'create') {
                        const t = items.value.find(t => t.id === (op as any).payload.tempId)
                        if (t) t._error = true
                    }
                }
            }
        } finally { syncing.value = false }
    }

    function retrySync() { if (batching.enabled) flushBatch(); else processOutbox() }

    if (process.client) {
        window.addEventListener('online', () => { if (batching.enabled) flushBatch(); else processOutbox() })
    }

    function getByColumn(columnId: number) {
        return items.value
            .filter(t => (t.column_id ?? t.column?.id ?? 0) === columnId)
            .sort((a, b) => (a.order_position ?? 0) - (b.order_position ?? 0))
    }

    function bulkMoveFromColumnLocal(fromColumnId: number, toColumnId: number) {
        const fromTasks = getByColumn(fromColumnId)
        if (!fromTasks.length) return [] as number[]
        let base = nextOrderForColumn(toColumnId)
        const movedIds: number[] = []
        for (const t of fromTasks) {
            base += 1
            t.column_id = toColumnId
            t.order_position = base
            movedIds.push(t.id)
        }
        const targetNow = getByColumn(toColumnId)
        targetNow.forEach((tt, i) => { tt.order_position = i })
        items.value = [...items.value]
        return movedIds
    }

    async function persistBulkMove(ids: number[], toColumnId: number) {
        if (!ids.length) return
        const targetOrdered = getByColumn(toColumnId).map(t => t.id)
        const ops: OutboxOp[] = []
        for (let i = 0; i < targetOrdered.length; i++) {
            const id = targetOrdered[i]
            ops.push({ id: rid(), type: 'update', payload: { id, patch: { column_id: toColumnId, order_position: i } } })
        }
        if (batching.enabled) { ops.forEach(enqueue); await flushBatch() }
        else { for (const op of ops) outbox.value.push(op); await processOutbox() }
    }

    async function bulkDeleteByColumn(columnId: number) {
        const toDelete = getByColumn(columnId).map(t => t.id)
        if (!toDelete.length) return
        items.value = items.value.filter(t => (t.column_id ?? t.column?.id ?? 0) !== columnId)
        if (batching.enabled) { toDelete.forEach(id => enqueue({ id: rid(), type: 'delete', payload: { id } })); await flushBatch() }
        else { for (const id of toDelete) outbox.value.push({ id: rid(), type: 'delete', payload: { id } }); await processOutbox() }
    }

    function tasksInColumn(columnId: number) {
        return items.value
            .filter(t => ((t as any).column_id ?? (t as any).column?.id ?? 0) === columnId)
            .sort((a, b) => (a.order_position ?? 0) - (b.order_position ?? 0))
    }

    function countByColumn(columnId: number) {
        return tasksInColumn(columnId).length
    }

    const hasUnsynced = computed(() => batching.enabled ? (stagingOps.value.length > 0 || batchFlushing.value) : outbox.value.length > 0)
    const hasErrors = computed(() => items.value.some(t => t._error))

    return {
        items, list, error, backendMs, totalItems,
        hasUnsynced, hasErrors,
        batching,
        hydrateFromCache, fetchAllAll,
        createOptimistic, updateOptimistic, removeOptimistic,
        applyLocalReorder, applyLocalMove,
        processOutbox, retrySync,
        countByColumn, getByColumn,
        bulkMoveFromColumnLocal, persistBulkMove, bulkDeleteByColumn,
        tasksInColumn,
    }
})
