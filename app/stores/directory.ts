import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { cacheGet, cacheSet } from '@/lib/cache'

type Row = { id: number | string; name: string }

function normalizeResp(res: any): Row[] {
    // Aceita {data:[...]} | {data:{data:[...]}} | [...]
    const arr =
        Array.isArray(res) ? res
            : Array.isArray(res?.data?.data) ? res.data.data
                : Array.isArray(res?.data) ? res.data
                    : []
    return arr
        .map((r: any) => ({ id: r.id ?? r.value ?? r.user_id ?? r.client_id, name: r.name ?? r.label ?? r.title }))
        .filter((r: any) => r.id != null && r.name)
}

export const useDirectoryStore = defineStore('directory', () => {
    const users = ref<Row[]>([])
    const clients = ref<Row[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const usersOptions = computed(() => users.value.map(u => ({ value: u.id, label: u.name })))
    const clientsOptions = computed(() => clients.value.map(c => ({ value: c.id, label: c.name })))

    async function hydrateFromCache() {
        const [u, c] = await Promise.all([
            cacheGet<Row[]>('dir:users'),
            cacheGet<Row[]>('dir:clients'),
        ])
        if (u) users.value = u
        if (c) clients.value = c
    }
    watch(users, v => cacheSet('dir:users', v), { deep: true })
    watch(clients, v => cacheSet('dir:clients', v), { deep: true })

    async function fetchUsers() {
        try {
            loading.value = true
            // ajuste o endpoint conforme teu Laravel
            const res = await $fetch('/api/admin/users', { query: { per_page: 1000 } })
            users.value = normalizeResp(res)
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Falha ao carregar usuários'
        } finally { loading.value = false }
    }

    async function fetchClients() {
        try {
            loading.value = true
            const res = await $fetch('/api/admin/clients', { query: { per_page: 1000 } })
            clients.value = normalizeResp(res)
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Falha ao carregar clientes'
        } finally { loading.value = false }
    }

    async function ensureLoaded() {
        if (!users.value.length) await fetchUsers()
        if (!clients.value.length) await fetchClients()
    }

    return {
        users, clients, usersOptions, clientsOptions, loading, error,
        hydrateFromCache, fetchUsers, fetchClients, ensureLoaded,
    }
})
