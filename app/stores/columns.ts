// app/stores/columns.ts
import { defineStore } from 'pinia'
import { ref, computed, watch, reactive } from 'vue'
import { cacheGet, cacheSet } from '@/lib/cache'
import { useTasksStore } from '@/stores/tasks'


export type Column = {
    id: number
    project_id: number
    name: string
    created_at?: string
    updated_at?: string
}

// Ops de batch
type Op =
    | { id: string; type: 'create'; payload: { tempId: number; name: string; project_id: number } }
    | { id: string; type: 'rename'; payload: { id: number; name: string } }
    | { id: string; type: 'delete'; payload: { id: number } }
// (opcional futuramente) | { id: string; type: 'reorder'; payload: { orderedIds: number[] } }

const CACHE_COLS = 'columns:items'
const CACHE_TOMBS = 'columns:tombstones'
const CACHE_OUTBOX = 'columns:outbox' // fallback se desativar batching

export const useColumnsStore = defineStore('columns', () => {
    const items = ref<Column[]>([])
    const pending = ref(false)
    const error = ref<string | null>(null)
    const backendMs = ref<number | null>(null)

    // guards
    const tombstones = ref<Set<number>>(new Set())
    const deletingIds = ref<Set<number>>(new Set())
    const tempDeletes = ref<Set<number>>(new Set()) // tempIds deletados antes de “nascer”

    // batching (switchable igual às tasks)
    const batching = reactive({ enabled: true, debounceMs: 250 })
    const staging = ref<Op[]>([])
    const outbox = ref<Op[]>([]) // legado quando batching.enabled=false
    let flushTimer: any = null

    const rid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

    // ---------- cache ----------
    async function hydrateFromCache() {
        const [cCols, cTombs, cOut] = await Promise.all([
            cacheGet<Column[]>(CACHE_COLS),
            cacheGet<number[]>(CACHE_TOMBS),
            cacheGet<Op[]>(CACHE_OUTBOX),
        ])
        if (cCols) items.value = cCols
        if (cTombs && Array.isArray(cTombs)) tombstones.value = new Set(cTombs)
        if (cOut) outbox.value = cOut
    }
    watch(items, v => cacheSet(CACHE_COLS, v), { deep: true })
    watch(outbox, v => cacheSet(CACHE_OUTBOX, v), { deep: true })
    watch(tombstones, s => cacheSet(CACHE_TOMBS, Array.from(s)))

    // ---------- fetch ----------
    async function fetchAll() {
        pending.value = true
        error.value = null
        backendMs.value = null
        try {
            const res = await $fetch.raw<{ data?: Column[] } | Column[]>('/api/admin/columns')
            const body = res._data
            const raw = Array.isArray(body) ? body : (body?.data ?? [])
            // não “revive” colunas apagadas localmente
            items.value = raw.filter(c => !tombstones.value.has(c.id))
            const st = res.headers.get('server-timing') || ''
            const match = /dur=(\d+)/i.exec(st)
            backendMs.value = match ? Number(match[1]) : null
            return items.value
        } catch (e: any) {
            const msg = e?.data?.message || e?.response?._data?.message || e?.message || 'Erro ao carregar colunas'
            error.value = msg
            throw new Error(msg)
        } finally {
            pending.value = false
        }
    }

    const byId = (id: number) => items.value.find(c => c.id === id) || null

    // ---------- batching helpers ----------
    function coalesce(op: Op) {
        // Regras:
        // - rename: mantém só a última para o mesmo id (mescla name)
        // - delete: remove renames do mesmo id; se for tempId (<0), cancela create
        // - create: mescla com mesmo tempId
        if (op.type === 'rename') {
            // encontra último rename do mesmo id e substitui o name
            for (let i = staging.value.length - 1; i >= 0; i--) {
                const x = staging.value[i]
                if (x.type === 'rename' && x.payload.id === op.payload.id) {
                    x.payload.name = op.payload.name
                    return
                }
            }
            staging.value.push(op)
            return
        }
        if (op.type === 'delete') {
            const id = op.payload.id
            if (id < 0) {
                tempDeletes.value.add(id)
                // remove create pendente desse tempId
                staging.value = staging.value.filter(x => !(x.type === 'create' && x.payload.tempId === id))
                outbox.value = outbox.value.filter(x => !(x.type === 'create' && x.payload.tempId === id))
                return
            }
            // remove renames desse id
            staging.value = staging.value.filter(x => !(x.type === 'rename' && x.payload.id === id))
            // evita duplicar delete
            if (!staging.value.some(x => x.type === 'delete' && x.payload.id === id)) {
                staging.value.push(op)
            }
            return
        }
        if (op.type === 'create') {
            const idx = staging.value.findIndex(x => x.type === 'create' && x.payload.tempId === op.payload.tempId)
            if (idx >= 0) {
                staging.value[idx].payload = { ...staging.value[idx].payload, ...op.payload }
                return
            }
            staging.value.push(op)
            return
        }
        staging.value.push(op)
    }

    function enqueue(op: Op) {
        if (!batching.enabled) {
            outbox.value.push(op)
            processOutboxLegacy()
            return
        }
        coalesce(op)
        if (flushTimer) clearTimeout(flushTimer)
        flushTimer = setTimeout(() => flushBatch().catch(() => { }), batching.debounceMs)
    }

    async function flushBatch() {
        if (!batching.enabled) return
        if (!staging.value.length) return
        const ops = staging.value.slice()
        staging.value = []
        try {
            const res: any = await $fetch('/api/admin/columns/batch', {
                method: 'POST',
                body: { ops }
            })
            const results: Array<{ id: string; ok: boolean; data?: any; error?: string }> = res?.results || []
            // reconciliação
            for (let i = 0; i < ops.length; i++) {
                const op = ops[i], r = results[i]
                if (!r) continue
                if (!r.ok) { error.value = r.error || 'Falha na sincronização de colunas'; continue }

                if (op.type === 'create') {
                    const tempId = op.payload.tempId
                    const created = r.data as Column
                    if (tempDeletes.value.has(tempId)) {
                        tombstones.value.add(created.id)
                        items.value = items.value.filter(c => c.id !== tempId && c.id !== created.id)
                        tempDeletes.value.delete(tempId)
                        continue
                    }
                    const idx = items.value.findIndex(c => c.id === tempId)
                    if (idx !== -1) items.value[idx] = created
                    continue
                }
                // rename e delete não precisam conciliar (já aplicamos local antes)
            }
        } catch (e: any) {
            // re-enfileira tudo
            staging.value = [...ops, ...staging.value]
            error.value = e?.data?.message || e?.message || 'Falha no batch de colunas'
        }
    }

    // ---------- CRUD otimista (API pública p/ Views) ----------
    async function createOptimistic(name: string) {
        const cfg = useRuntimeConfig()
        const tempId = -Date.now()
        const temp: Column = { id: tempId, project_id: cfg.public?.defaultProjectId, name }

        items.value = [...items.value, temp]
        enqueue({ id: rid(), type: 'create', payload: { tempId, name, project_id: temp.project_id } })
        return temp
    }

    async function renameOptimistic(id: number, newName: string) {
        const idx = items.value.findIndex(c => c.id === id)
        if (idx === -1) return
        items.value[idx] = { ...items.value[idx], name: newName }
        items.value = [...items.value]
        enqueue({ id: rid(), type: 'rename', payload: { id, name: newName } })
    }

    async function removeOptimistic(id: number) {
        if (deletingIds.value.has(id)) return
        items.value = items.value.filter(c => c.id !== id)
        if (id < 0) {
            tempDeletes.value.add(id)
            staging.value = staging.value.filter(x => !(x.type === 'create' && x.payload.tempId === id))
            outbox.value = outbox.value.filter(x => !(x.type === 'create' && x.payload.tempId === id))
            return
        }
        tombstones.value.add(id)
        enqueue({ id: rid(), type: 'delete', payload: { id } })
    }

    // REORDER local apenas (quando tiver endpoint, colocamos no batch)
    function reorderLocal(newOrder: Column[]) {
        items.value = [...newOrder]
    }

    // ---------- Legado: fan-out se batching desligado ----------
    async function processOutboxLegacy() {
        // igual ao fluxo anterior, mas simples
        for (let i = 0; i < outbox.value.length; i++) {
            const op = outbox.value[i]
            try {
                if (op.type === 'create') {
                    const created = await $fetch<Column>('/api/admin/columns', {
                        method: 'POST', body: { name: op.payload.name, project_id: op.payload.project_id }
                    })
                    const idx = items.value.findIndex(c => c.id === op.payload.tempId)
                    if (idx !== -1) items.value[idx] = created
                    outbox.value.splice(i, 1); i--; continue
                }
                if (op.type === 'rename') {
                    await $fetch(`/api/admin/columns/${op.payload.id}`, { method: 'PUT', body: { name: op.payload.name } })
                    outbox.value.splice(i, 1); i--; continue
                }
                if (op.type === 'delete') {
                    const id = op.payload.id
                    try { await $fetch(`/api/admin/columns/${id}`, { method: 'DELETE' }) }
                    catch (e: any) {
                        const code = e?.statusCode || e?.response?.status
                        if (code !== 404) throw e
                    }
                    outbox.value.splice(i, 1); i--; continue
                }
            } catch (e: any) {
                error.value = e?.data?.message || e?.message || 'Falha de sync (colunas)'
            }
        }
    }


    // --- Remoção segura de coluna (mover/cascade) ---
    async function removeColumn(opts: { id: number; mode: 'move' | 'cascade'; targetColumnId?: number }) {
        const { id, mode } = opts
        const tasksStore = useTasksStore()

        // coluna precisa existir localmente (caso contrário, só sai)
        const col = items.value.find(c => c.id === id)
        if (!col) {
            // se já não existe localmente, apenas idempotência:
            try { await removeOptimistic(id) } catch { }
            return
        }

        if (mode === 'move') {
            // alvo: o informado ou a primeira coluna diferente da removida
            let targetId = opts.targetColumnId
            if (!targetId) {
                const firstOther = items.value.find(c => c.id !== id)?.id
                targetId = firstOther
            }
            if (!targetId) {
                // não há outra coluna para onde mover
                throw new Error('Não há outra coluna para mover as páginas.')
            }

            // calcula posição inicial no alvo
            const base = tasksStore.countByColumn(targetId)
            const toMove = tasksStore.tasksInColumn(id)

            // move otimista cada task (mantendo ordem relativa)
            for (let i = 0; i < toMove.length; i++) {
                const t = toMove[i]
                tasksStore.updateOptimistic(t.id, {
                    column_id: targetId,
                    order_position: base + i,
                })
            }

            // por fim, deleta a coluna (otimista + batch)
            await removeOptimistic(id)
            return
        }

        // mode === 'cascade': apaga tarefas e depois a coluna
        const toDelete = tasksStore.tasksInColumn(id)
        for (const t of toDelete) {
            await tasksStore.removeOptimistic(t.id)
        }
        await removeOptimistic(id)
    }


    return {
        items, pending, error, backendMs,
        batching,
        fetchAll, hydrateFromCache,
        byId,
        createOptimistic, renameOptimistic, removeOptimistic,
        reorderLocal,
        // expõe flush para testes/atajos
        _flushColumnsBatch: flushBatch,
        removeColumn,
    }
})
