<template>
    <section class="p-1">
        <!-- status -->
        <div v-if="tasksStore.hasUnsynced" class="small text-warning" style="position: absolute; bottom: 0; left: 0;">
            Sincronizando alterações…
            <button class="btn btn-link btn-sm p-0" @click="tasksStore.retrySync()">Tentar agora</button>
        </div>
        <div v-if="tasksStore.hasErrors" class="small text-danger">
            Algumas tarefas não foram salvas. Vamos tentar novamente automaticamente.
        </div>

        <!-- header -->
        <div class="d-flex align-items-center gap-3 mb-3">
            <h2 class="m-0">{{ projectTitle }}</h2>

            <!-- 🔁 agora ligado: troca de visualização -->
            <ViewSwitcher v-model="currentView" @open-config="configOpen = true" />

            <!-- ⚙️ painel de configuração (abre/fecha) -->
            <ViewConfigPanel v-model:open="configOpen" :schema="schemaUI" :filters="filters" :sorters="sorters"
                @apply="applyConfig" />

            <button class="btn btn-sm btn-outline-light ms-auto" :disabled="loading" @click="reload">
                Recarregar
            </button>
            <LogoutButton />
        </div>

        <div v-if="errorMsg" class="alert alert-danger py-2 px-3 mb-3">
            {{ errorMsg }}
        </div>

        <!-- 🔀 troca reativa da visualização -->
        <ViewBoard v-if="currentView === 'board'" :schema="schemaUI" />
      
        <TasksTable v-else-if="currentView === 'table'" :items="tasksFiltered" :schema="schemaUI"
            @update="onTableUpdate" @archive="onArchive" @delete="onDelete" />
        <!-- você pode colocar outras visões aqui: chart / calendar -->
        <div v-else class="text-muted">Visualização “{{ currentView }}” ainda não implementada.</div>

        <!-- modal único -->
        <TaskModal :task="activeTask" :users="usersList" :clients="clientsList" @update="patchFromModal" />
    </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import ViewBoard from '@/components/board/ViewBoard.vue'
import TasksTable from '@/components/views/TasksTable.vue'   // ⬅️ ajuste se seu componente tiver outro nome/caminho
import LogoutButton from '@/components/buttons/LogoutButton.vue'
import TaskModal from '@/components/modals/TaskModal.vue'
import ViewSwitcher from '@/components/views/ViewSwitcher.vue'
import ViewConfigPanel from '@/components/views/ViewConfigPanel.vue'

import { useTasksStore } from '@/stores/tasks'
import { useColumnsStore } from '@/stores/columns'
import { useDirectoryStore } from '@/stores/directory'
import { useTaskModal } from '@/stores/taskModal'

// (opcional) título do projeto atual
const projectTitle = 'Tasks (Board)'

// ===== STORES =====
definePageMeta({ middleware: ['auth', 'approved'] })
const tasksStore = useTasksStore()
const columnsStore = useColumnsStore()
const dir = useDirectoryStore()
const modal = useTaskModal()
const { taskId } = storeToRefs(modal)

// ===== STATE: visualização e config =====
const currentView = ref<'board' | 'table' | 'chart' | 'calendar'>('board')
const configOpen = ref(false)

// Schema UI (quais campos exibir/editar nas visões). 
// Se você já tem app/schemas/tasks.ts, importe e use aqui.
// Exemplo mínimo local:
const schemaUI = ref<Record<string, any>>({
    name: { label: 'Título', type: 'text' },
    client_id: { label: 'Cliente', type: 'select' },
    user_id: { label: 'Responsável', type: 'select' },
    start_date: { label: 'Início', type: 'date' },
    due_date: { label: 'Prazo', type: 'date' },
    priority: { label: 'Prioridade', type: 'select' },
    type_task: { label: 'Tipo', type: 'select' },
    involved_users: { label: 'Envolvidos', type: 'multiselect' },
    comment: { label: 'Comentário', type: 'text' },
    archived: { label: 'Arquivada', type: 'switch', hidden: true },
})
const filters = ref<any[]>([])  // [{ field, op, value }]
const sorters = ref<any[]>([])  // [{ field, dir: 'asc'|'desc' }]

// ===== HELPERS =====
function asArray(x: any) {
    if (Array.isArray(x)) return x
    if (x && Array.isArray(x.data)) return x.data
    if (x && typeof x === 'object') return Object.values(x)
    return []
}

// listas p/ o modal
const usersList = computed(() => asArray(dir.users))
const clientsList = computed(() => asArray(dir.clients))

// task ativa = espelha o id salvo na store do modal
const activeTask = computed(() => tasksStore.list.find(t => t.id === taskId.value) || null)

// patch vindo do modal -> store
function patchFromModal(patch: Record<string, any>) {
    if (!activeTask.value) return
    tasksStore.updateOptimistic(activeTask.value.id, patch)
}

// ===== FILTRO/ORDENAÇÃO (mínimo viável; pode trocar pelo seu engine de filtros) =====
const tasksFiltered = computed(() => {
    let list = [...tasksStore.list]

    // aplica filtros básicos
    for (const f of filters.value) {
        const { field, op, value } = f || {}
        if (!field) continue
        list = list.filter(row => {
            const v = row?.[field]
            switch (op) {
                case 'is': return String(v) === String(value)
                case 'contains': return String(v ?? '').toLowerCase().includes(String(value ?? '').toLowerCase())
                case 'gt': return (v ?? 0) > value
                case 'lt': return (v ?? 0) < value
                case 'is_set': return v !== null && v !== undefined && v !== ''
                default: return true
            }
        })
    }

    // aplica sort
    for (const s of sorters.value.slice().reverse()) {
        const { field, dir } = s || {}
        if (!field) continue
        list.sort((a, b) => {
            const av = a?.[field], bv = b?.[field]
            if (av == null && bv != null) return dir === 'desc' ? 1 : -1
            if (av != null && bv == null) return dir === 'desc' ? -1 : 1
            if (av == null && bv == null) return 0
            if (av > bv) return dir === 'desc' ? -1 : 1
            if (av < bv) return dir === 'desc' ? 1 : -1
            return 0
        })
    }

    return list
})

// quando usuário clica em “Aplicar” no painel
function applyConfig(payload: { schema?: any; filters?: any[]; sorters?: any[] }) {
    if (payload?.schema) schemaUI.value = payload.schema
    if (payload?.filters) filters.value = payload.filters
    if (payload?.sorters) sorters.value = payload.sorters
    configOpen.value = false
}

// callbacks da tabela (encaminha para a store)
function onTableUpdate({ id, patch }: { id: number; patch: Record<string, any> }) {
    tasksStore.updateOptimistic(id, patch)
}
function onArchive(id: number) {
    tasksStore.updateOptimistic(id, { archived: 1 })
}
function onDelete(id: number) {
    tasksStore.removeOptimistic(id)
}

// ===== ESTADO DA PÁGINA =====
const loading = ref(false)
const errorMsg = computed(() => tasksStore.error || columnsStore.error || null)

onMounted(async () => {
    await Promise.allSettled([
        tasksStore.hydrateFromCache(),
        (columnsStore as any).hydrateFromCache?.(),
        dir.hydrateFromCache?.(),
    ])
    dir.ensureLoaded?.()
    tasksStore.processOutbox()
    reload()
})

async function reload() {
    loading.value = true
    try {
        await Promise.allSettled([
            columnsStore.fetchAll?.(),
            tasksStore.fetchAllAll?.(),
            dir.fetchAll?.(),
        ])
    } finally {
        loading.value = false
    }
}
</script>
