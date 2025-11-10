// app/stores/projects.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

type AnyMap = Record<string, any>

/** -------- Utils de normalização ---------- */
function normalizeListPayload(res: any): any[] {
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data?.data)) return res.data.data
    if (Array.isArray(res?.data)) return res.data
    return []
}
function unpackResultEntity(data: any) {
    if (!data) return {}
    if (data.data && typeof data.data === 'object') return data.data
    return data
}
function toMinimalUser(u: any) {
    return { id: Number(u.id), name: u.name ?? u.nick ?? u.email ?? `#${u.id}` }
}
function toMinimalClient(c: any) {
    return { id: Number(c.id), name: c.name ?? c.nome ?? c.email ?? `#${c.id}` }
}

/** -------- Batch types ---------- */
// batch de projects
type ProjOp =
    | { id: string; type: 'create'; payload: AnyMap }
    | { id: string; type: 'update'; payload: { id: number; patch: AnyMap } }
    | { id: string; type: 'delete'; payload: { id: number } }

// batch do pivô projects-user
type LinkOp =
    | { id: string; type: 'create'; payload: { user_id: number; project_id: number } }
    | { id: string; type: 'delete'; payload: { id: number } }
    | { id: string; type: 'remove'; payload: { project_id: number; user_id: number } }
    | { id: string; type: 'replace'; payload: { project_id: number; user_ids: number[] } }

type BatchResult = { id: string; ok: boolean; data?: any; error?: string }

export const useProjectsStore = defineStore('projects', () => {
    /** ------------ STATE ------------- */
    const items = ref<any[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    // users/clients mínimos (p/ labels e selects)
    const users = ref<{ id: number; name: string }[]>([])
    const clients = ref<{ id: number; name: string }[]>([])

    const usersMap = computed(() => {
        const m: Record<string, string> = {}
        for (const u of users.value) m[String(u.id)] = u.name
        return m
    })
    const clientsMap = computed(() => {
        const m: Record<string, string> = {}
        for (const c of clients.value) m[String(c.id)] = c.name
        return m
    })
    const usersOptions = computed(() => users.value.map(u => ({ value: u.id, label: u.name })))
    const clientsOptions = computed(() => clients.value.map(c => ({ value: c.id, label: c.name })))

    // outboxes separados
    const outProj = ref<ProjOp[]>([])
    const outLinks = ref<LinkOp[]>([])
    const syncing = ref(false)
    const lastError = ref<string | null>(null)
    const hasUnsynced = computed(() => outProj.value.length > 0 || outLinks.value.length > 0)

    // mapeia op de CREATE -> tempId (pra substituir pelo real)
    const pendingCreates = ref<Record<string, number>>({})
    // se o backend ignorar 'members' no create, guardo aqui p/ criar vínculos depois:
    const createMembersPending = ref<Record<string, number[]>>({})

    let syncTimer: any = null
    const DEBOUNCE_MS = 250

    /** ------------ LOAD ------------- */
    const load = async () => {
        loading.value = true
        try {
            // 1) projetos
            const pr = await $fetch('/api/admin/projects/all')
            items.value = normalizeListPayload(pr)

            // 2) vínculos project_user
            const links = await $fetch('/api/admin/projects-user')
            const pu = normalizeListPayload(links) // [{id, project_id, user_id}, ...]

            // agrupa: project_id -> [{linkId, user_id}]
            const group: Record<number, { linkId: number; user_id: number }[]> = {}
            for (const l of pu) {
                const pid = Number(l.project_id)
                const uid = Number(l.user_id)
                if (!group[pid]) group[pid] = []
                group[pid].push({ linkId: Number(l.id), user_id: uid })
            }

            // injeta members e user_id principal
            for (const it of items.value) {
                const pid = Number(it.id)
                const arr = group[pid] ?? []
                    ; (it as any)._memberLinks = arr
                    ; (it as any).members = arr.map(g => g.user_id)
                if (!it.user_id && arr.length) it.user_id = arr[0].user_id
                if (!it.visibility) it.visibility = 'private' // fallback visual
            }

            // 3) users/clients mínimos
            const [ur, cr] = await Promise.all([
                $fetch('/api/admin/users'),
                $fetch('/api/admin/clients'),
            ])
            users.value = normalizeListPayload(ur).map(toMinimalUser)
            clients.value = normalizeListPayload(cr).map(toMinimalClient)

            enrichLabels()
            error.value = null
        } catch (e: any) {
            error.value = e?.message || 'Falha ao carregar projetos'
        } finally {
            loading.value = false
        }
    }

    /** ------------ Labels ------------- */
    const enrichLabels = () => {
        for (const it of items.value) {
            const uid = String(it.user_id ?? '')
            const cid = String(it.client_id ?? '')
                ; (it as any).user_label = usersMap.value[uid] || (uid || '—')
                ; (it as any).client_label = clientsMap.value[cid] || (cid || '—')
        }
    }

    /** ------------ Queue helpers ------------- */
    const queueProj = (op: ProjOp) => {
        outProj.value.push(op)
        debounceSync()
    }
    const queueLink = (op: LinkOp) => {
        outLinks.value.push(op)
        debounceSync()
    }
    const debounceSync = () => {
        if (syncTimer) clearTimeout(syncTimer)
        syncTimer = setTimeout(() => { sync().catch(() => { }) }, DEBOUNCE_MS)
    }

    /** ------------ Inferências ------------- */
    const inferClientId = (payload: AnyMap) => {
        const auth = useAuthStore()
        return (
            payload.client_id ??
            auth?.user?.client_id ??
            auth?.user?.client?.id ??
            auth?.profile?.client_id ??
            clients.value?.[0]?.id ??
            null
        )
    }
    const inferUserId = (payload: AnyMap) => {
        const auth = useAuthStore()
        return (
            payload.user_id ??
            auth?.user?.id ??
            auth?.profile?.id ??
            null
        )
    }

    /** ------------ CRUD otimista ------------- */
    const create = async (payload: AnyMap) => {
        const base: AnyMap = { ...payload }

        const cid = inferClientId(base); if (cid) base.client_id = cid
        const uid = inferUserId(base); if (uid) base.user_id = uid

        if (!base.visibility) base.visibility = 'private'
        if (!base.date_project) base.date_project = new Date().toISOString().slice(0, 10)

        // manda 'members' no create (se vier user_id)
        if (base.user_id) base.members = [Number(base.user_id)]

        // otimista
        const tempId = Date.now()
        const tempItem = { ...base, id: tempId, members: base.members ?? [], _temp: true }
        items.value.unshift(tempItem)
        enrichLabels()

        const opId = crypto.randomUUID()
        pendingCreates.value[opId] = tempId

        // guarda membros pretendidos, caso o backend ignore no create
        if (Array.isArray(base.members)) createMembersPending.value[opId] = base.members.slice()

        // envia
        queueProj({ id: opId, type: 'create', payload: { ...base, tempId } })
    }

    const update = async (id: number, patch: AnyMap) => {
        const idx = items.value.findIndex(i => i.id === id)
        if (idx === -1) return

        // otimista local
        items.value[idx] = { ...items.value[idx], ...patch }

        // refletir user/members localmente
        if ('user_id' in patch) {
            const uid = Number(patch.user_id)
            items.value[idx].members = Number.isFinite(uid) ? [uid] : []
        }
        if ('members' in patch && Array.isArray(patch.members)) {
            items.value[idx].members = patch.members.map((v: any) => Number(v)).filter((n: number) => Number.isFinite(n))
        }
        if ('user_id' in patch || 'client_id' in patch) enrichLabels()

        // separar responsabilidades
        const { user_id, members, ...rest } = patch

        // -> patch do projeto (name, status, visibility, etc.)
        if (Object.keys(rest).length) {
            queueProj({ id: crypto.randomUUID(), type: 'update', payload: { id, patch: rest } })
        }

        // -> vínculos N:N
        if (user_id !== undefined) {
            const uidNum = Number(user_id)
            queueLink({
                id: crypto.randomUUID(),
                type: 'replace',
                payload: { project_id: id, user_ids: Number.isFinite(uidNum) ? [uidNum] : [] }
            })
        }
        if (Array.isArray(members)) {
            const arr = members.map((v: any) => Number(v)).filter((n: number) => Number.isFinite(n))
            queueLink({
                id: crypto.randomUUID(),
                type: 'replace',
                payload: { project_id: id, user_ids: arr }
            })
        }
    }

    const remove = async (id: number) => {
        const idx = items.value.findIndex(i => i.id === id)
        if (idx !== -1) items.value.splice(idx, 1)
        queueProj({ id: crypto.randomUUID(), type: 'delete', payload: { id } })
    }

    /** ------------ SYNC (duplo) ------------- */
    const sync = async () => {
        if (syncing.value) return
        if (!outProj.value.length && !outLinks.value.length) return
        syncing.value = true
        lastError.value = null

        // snapshot
        const projOps = outProj.value.slice()
        const linkOps = outLinks.value.slice()
        outProj.value = []
        outLinks.value = []

        try {
            // 1) envia projetos
            if (projOps.length) {
                const resp = await $fetch<{ results: BatchResult[] }>('/api/admin/projects/batch', {
                    method: 'POST',
                    body: { ops: projOps }
                })
                const results = Array.isArray(resp?.results) ? resp.results : []
                for (const r of results) {
                    if (!r.ok) { lastError.value = r.error || 'Falha no batch (projects)'; continue }
                    const op = projOps.find(o => o.id === r.id)
                    // tratar CREATE → substituir temp com id real e, se preciso, criar vínculos
                    if (op?.type === 'create') {
                        const tempId = pendingCreates.value[r.id]
                        const real = unpackResultEntity(r.data)
                        if (typeof tempId === 'number') {
                            const i = items.value.findIndex(x => x.id === tempId)
                            if (i !== -1) {
                                items.value[i] = { ...items.value[i], ...real, id: real?.id ?? items.value[i].id, _temp: false }
                                enrichLabels()
                            }
                        }
                        delete pendingCreates.value[r.id]

                        // se backend não devolveu members e tínhamos intenção de criá-los, dispara agora
                        const intended = createMembersPending.value[r.id]
                        if (real?.id && Array.isArray(intended) && intended.length) {
                            await $fetch('/api/admin/projects-user/batch', {
                                method: 'POST',
                                body: {
                                    ops: [
                                        { id: crypto.randomUUID(), type: 'replace', payload: { project_id: Number(real.id), user_ids: intended } }
                                    ]
                                }
                            })
                        }
                        delete createMembersPending.value[r.id]
                    }
                }
            }

            // 2) envia vínculos
            if (linkOps.length) {
                const resp = await $fetch<{ results: BatchResult[] }>('/api/admin/projects-user/batch', {
                    method: 'POST',
                    body: { ops: linkOps }
                })
                const results = Array.isArray(resp?.results) ? resp.results : []
                for (const r of results) {
                    if (!r.ok) { lastError.value = r.error || 'Falha no batch (projects-user)'; continue }
                    // nada especial pra tratar aqui; o estado já foi atualizado otimisticamente
                }
            }

        } catch (e: any) {
            console.error('Falha no sync:', e)
            lastError.value = e?.message || 'Falha no sync'

            // devolve as operações à fila
            if (projOps.length) outProj.value.unshift(...projOps)
            if (linkOps.length) outLinks.value.unshift(...linkOps)
        } finally {
            syncing.value = false
        }
    }

    const flush = async () => {
        if (syncTimer) clearTimeout(syncTimer)
        await sync()
    }

    return {
        // state
        items, loading, error,
        users, clients, usersOptions, clientsOptions, usersMap, clientsMap,
        syncing, hasUnsynced, lastError,

        // crud
        load, create, update, remove,

        // sync controls
        sync, flush,
    }
})
