import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

type Any = Record<string, any>
type BatchOp =
    | { id: string; type: 'create'; payload: Any }
    | { id: string; type: 'update'; payload: { id: number; patch: Any } }
    | { id: string; type: 'delete'; payload: { id: number } }
type BatchResult = { id: string; ok: boolean; data?: any; error?: string }

function normalize(res: any): any[] {
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data?.data)) return res.data.data
    if (Array.isArray(res?.data)) return res.data
    return []
}
function entity(data: any) { return data?.data && typeof data.data === 'object' ? data.data : data }

export const useClientsStore = defineStore('clients', () => {
    const items = ref<any[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const outbox = ref<BatchOp[]>([])
    const syncing = ref(false)
    const lastErr = ref<string | null>(null)
    const hasUnsynced = computed(() => outbox.value.length > 0)
    let t: any = null

    const load = async () => {
        loading.value = true
        try {
            const res = await $fetch('/api/admin/clients/all')
            items.value = normalize(res)
            error.value = null
        } catch (e: any) {
            error.value = e?.message || 'Falha ao carregar clientes'
        } finally { loading.value = false }
    }

    const queue = (op: BatchOp) => {
        outbox.value.push(op)
        if (t) clearTimeout(t)
        t = setTimeout(() => sync().catch(() => { }), 250)
    }

    const create = async (payload: Any) => {
        const tempId = Date.now()
        items.value.unshift({ ...payload, id: tempId, _temp: true })
        queue({ id: crypto.randomUUID(), type: 'create', payload: { ...payload, tempId } })
    }

    const update = async (id: number, patch: Any) => {
        const idx = items.value.findIndex(i => i.id === id); if (idx === -1) return
        items.value[idx] = { ...items.value[idx], ...patch }
        queue({ id: crypto.randomUUID(), type: 'update', payload: { id, patch } })
    }

    const remove = async (id: number) => {
        const idx = items.value.findIndex(i => i.id === id); if (idx !== -1) items.value.splice(idx, 1)
        queue({ id: crypto.randomUUID(), type: 'delete', payload: { id } })
    }

    const sync = async () => {
        if (!outbox.value.length || syncing.value) return
        syncing.value = true; lastErr.value = null
        const ops = outbox.value.slice(); outbox.value = []
        try {
            const resp = await $fetch<{ results: BatchResult[] }>('/api/admin/clients/batch', { method: 'POST', body: { ops } })
            const results = Array.isArray(resp?.results) ? resp.results : []
            for (const r of results) {
                if (!r.ok) { lastErr.value = r.error || 'Falha no batch'; continue }
                const op = ops.find(o => o.id === r.id)
                if (op?.type === 'create') {
                    const real = entity(r.data)
                    const tempId = r?.data?.tempId ?? op.payload?.tempId
                    if (tempId) {
                        const idx = items.value.findIndex(i => i.id === tempId)
                        if (idx !== -1) items.value[idx] = { ...items.value[idx], ...real, id: real?.id ?? tempId, _temp: false }
                    }
                }
            }
        } catch (e: any) {
            lastErr.value = e?.message || 'Falha no sync'; outbox.value.unshift(...ops)
        } finally { syncing.value = false }
    }

    const flush = async () => { if (t) clearTimeout(t); await sync() }

    return { items, loading, error, load, create, update, remove, sync, flush, hasUnsynced, lastErr }
})
