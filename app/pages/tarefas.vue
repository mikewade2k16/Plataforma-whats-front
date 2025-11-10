<template>
    <section class="p-4">
        <!-- exemplo de barra sutil -->
        <div v-if="tasksStore.hasUnsynced" class="small text-warning">
            Sincronizando alterações…
            <button class="btn btn-link btn-sm" @click="tasksStore.retrySync()">Tentar agora</button>
        </div>
        <div v-if="tasksStore.hasErrors" class="small text-danger">
            Algumas tarefas não foram salvas. Vamos tentar novamente automaticamente.
        </div>

        <div class="d-flex align-items-center gap-3 mb-3">
            <h2 class="m-0">Tasks (Board)</h2>
            <button class="btn btn-sm btn-outline-light ms-auto" :disabled="loading" @click="reload">
                Recarregar
            </button>
            <LogoutButton />
        </div>

        <div v-if="errorMsg" class="alert alert-danger py-2 px-3 mb-3">
            {{ errorMsg }}
        </div>

        <!-- ao mudar a key, o ViewBoard remonta e zera caches internos -->
        <ViewBoard :key="refreshKey" />
    </section>
</template>

<script setup lang="ts">
import ViewBoard from '@/components/board/ViewBoard.vue'
import LogoutButton from '@/components/buttons/LogoutButton.vue'
import { useTasksStore } from '@/stores/tasks'
import { useColumnsStore } from '@/stores/columns'


definePageMeta({ middleware: ['auth', 'approved', 'hydrate'] })


const tasksStore = useTasksStore()
const columnsStore = useColumnsStore()

const loading = ref(false)
const errorMsg = computed(() => tasksStore.error || columnsStore.error || null)
const refreshKey = ref(0)


onMounted(async () => {
    // 1) mostra cache IMEDIATAMENTE
    await Promise.all([
        columnsStore.fetchAll().catch(() => { }), // se quiser, dá pra cachear colunas também
        tasksStore.hydrateFromCache()
    ])
    // 2) revalida em background (SWR) e tenta sincronizar outbox
    tasksStore.fetchAllAll()
    tasksStore.processOutbox()
})

async function reload() {
    loading.value = true
    try {
        await Promise.all([
            columnsStore.fetchAll(),  // columns store já pode enviar project_id se precisar
            tasksStore.fetchAllAll()  // sem per_page
        ])
        refreshKey.value++          // força remontar o board
    } catch (e: any) {
        console.error('[tasks.vue] reload error:', e?.message || e)
    } finally {
        loading.value = false
    }
}

onMounted(() => { reload() })
</script>
