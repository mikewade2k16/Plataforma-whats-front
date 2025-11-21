<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import NxButton from '@/components/buttons/NxButton.vue'
import NxPageHeader from '@/components/layout/NxPageHeader.vue'
import OmniTable from '@/components/ui/OmniTable.vue'
import ViewBoard from '@/components/board/ViewBoard.vue'
import { useProjectsStore } from '@/stores/projects'
import { useProjectSchema } from '@/schemas/projectSchema'

type ViewMode = 'board' | 'table' | 'chart' | 'calendar'

const projects = useProjectsStore()

// visão inicial
const viewMode = ref<ViewMode>('table')

// ===== AGRUPAR POR (BOARD) =====
const boardBy = ref<'status' | 'client_id' | 'user_id' | 'segment' | 'visibility'>('status')

const groupByOptions = [
    { value: 'status', label: 'Status' },
    { value: 'client_id', label: 'Cliente' },
    { value: 'user_id', label: 'Usuário' },
    { value: 'segment', label: 'Segmento' },
    { value: 'visibility', label: 'Visibilidade' },
]

// ===== SCHEMA =====
const baseSchema = computed(() => useProjectSchema())

const projectSchemaUI = ref<Record<string, any>>({})

watch(
    baseSchema,
    v => {
        if (!Object.keys(projectSchemaUI.value).length) {
            projectSchemaUI.value = v
        }
    },
    { immediate: true }
)

// ===== CONFIG (filtros/ordenação) =====
const filters = ref<any[]>([])
const sorters = ref<any[]>([])

// ===== SEARCH =====
const search = ref('')

// ===== FILTROS RÁPIDOS =====
const selectedStatus = ref<string | null>(null)
const selectedVisibility = ref<string | null>(null)
const selectedClient = ref<string | null>(null)
const selectedUser = ref<string | null>(null)
const selectedSegment = ref<string | null>(null)

// opções derivadas da API
const statusOptions = computed(() =>
    Array.from(new Set(projects.items.map(p => p.status).filter(Boolean))) as string[]
)

const visibilityOptions = computed(() =>
    Array.from(new Set(projects.items.map(p => p.visibility).filter(Boolean))) as string[]
)

const segmentOptions = computed(() =>
    Array.from(new Set(projects.items.map(p => (p as any).segment).filter(Boolean))) as string[]
)

const clientOptions = computed(() =>
    Array.from(
        new Set(
            projects.items
                .map(p => (p as any).client_name || (p as any).client?.name)
                .filter(Boolean)
        )
    ) as string[]
)

const userOptions = computed(() =>
    Array.from(
        new Set(
            projects.items
                .map(p => (p as any).user_name || (p as any).user?.name)
                .filter(Boolean)
        )
    ) as string[]
)

// ===== SCHEMA POR VISUALIZAÇÃO =====
const tableSchema = computed(() => {
    const src = projectSchemaUI.value || {}
    return Object.fromEntries(
        Object.entries(src).filter(([_, cfgAny]) => {
            const cfg: any = cfgAny || {}
            if (cfg.hidden) return false
            if (cfg.views && cfg.views.table === false) return false
            return true
        })
    )
})

// (o board usa o schema completo; quem filtra é o ViewBoard via views.board)

// ===== LISTA FILTRADA =====
const filteredProjects = computed(() => {
    let list = [...projects.items]

    const term = search.value.trim().toLowerCase()
    if (term) {
        list = list.filter(p => {
            const values = [
                p.name,
                p.status,
                p.visibility,
                (p as any).segment,
                (p as any).goal,
                (p as any).description,
                (p as any).client_name,
                (p as any).user_name,
                (p as any).client?.name,
                (p as any).user?.name,
            ]

            return values
                .filter(Boolean)
                .some(v => v!.toString().toLowerCase().includes(term))
        })
    }

    // filtros rápidos
    if (selectedStatus.value) {
        list = list.filter(p => p.status === selectedStatus.value)
    }

    if (selectedVisibility.value) {
        list = list.filter(p => p.visibility === selectedVisibility.value)
    }

    if (selectedSegment.value) {
        list = list.filter(p => (p as any).segment === selectedSegment.value)
    }

    if (selectedClient.value) {
        list = list.filter(p => {
            const name =
                (p as any).client_name || (p as any).client?.name || ''
            return name === selectedClient.value
        })
    }

    if (selectedUser.value) {
        list = list.filter(p => {
            const name =
                (p as any).user_name || (p as any).user?.name || ''
            return name === selectedUser.value
        })
    }

    // filtros avançados do painel
    for (const f of filters.value) {
        const { field, op, value } = f || {}
        if (!field) continue
        list = list.filter(row => {
            const v = (row as any)?.[field]
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

    // ordenação
    for (const s of sorters.value.slice().reverse()) {
        const { field, dir } = s || {}
        if (!field) continue
        list.sort((a, b) => {
            const av = (a as any)?.[field]
            const bv = (b as any)?.[field]
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

const projectTitle = 'Projects'

// ===== CRUD =====
const onCreate = async () => {
    await projects.create({
        name: 'Novo Projeto',
        status: 'not_started',
        visibility: 'public',
        date_project: new Date().toISOString().slice(0, 10),
    })
}

const onUpdate = ({ id, patch }: { id: number | string; patch: any }) => {
    projects.update(id, patch)
}

const onEdit = (p: any) => {
    console.log('edit', p)
}

function applyConfig(payload: { schema?: any; filters?: any[]; sorters?: any[] }) {
    if (payload.schema) projectSchemaUI.value = payload.schema
    if (payload.filters) filters.value = payload.filters
    if (payload.sorters) sorters.value = payload.sorters
}

onMounted(() => {
    projects.load()
})
</script>

<template>
    <section class="p-4">
        <NxPageHeader :title="projectTitle" v-model:view="viewMode" v-model:search="search" v-model:groupBy="boardBy"
            :group-by-options="groupByOptions" :schema="projectSchemaUI" :filters="filters" :sorters="sorters"
            :show-search="true" :show-view-switcher="true" :show-config="true" :show-reload="false" :show-logout="false"
            search-placeholder="Buscar projetos…" @apply-config="applyConfig">
            <!-- FILTROS RÁPIDOS -->
            <template #filters>
                <div class="d-flex flex-wrap gap-2">
                    <select v-model="selectedStatus" class="form-select form-select-sm" style="min-width: 140px;">
                        <option :value="null">Status (todos)</option>
                        <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
                    </select>

                    <select v-model="selectedVisibility" class="form-select form-select-sm" style="min-width: 140px;">
                        <option :value="null">Visibilidade (todas)</option>
                        <option v-for="s in visibilityOptions" :key="s" :value="s">{{ s }}</option>
                    </select>

                    <select v-model="selectedSegment" class="form-select form-select-sm" style="min-width: 140px;">
                        <option :value="null">Segmento (todos)</option>
                        <option v-for="s in segmentOptions" :key="s" :value="s">{{ s }}</option>
                    </select>

                    <select v-model="selectedClient" class="form-select form-select-sm" style="min-width: 160px;">
                        <option :value="null">Cliente (todos)</option>
                        <option v-for="c in clientOptions" :key="c" :value="c">{{ c }}</option>
                    </select>

                    <select v-model="selectedUser" class="form-select form-select-sm" style="min-width: 160px;">
                        <option :value="null">Usuário (todos)</option>
                        <option v-for="u in userOptions" :key="u" :value="u">{{ u }}</option>
                    </select>
                </div>
            </template>

            <!-- AÇÕES -->
            <template #actions>
                <NxButton icon="plus" @click="onCreate">
                    Novo projeto
                </NxButton>
            </template>
        </NxPageHeader>

        <div class="nx-card p-0">
            <!-- BOARD (ViewBoard genérico, agrupando por boardBy) -->
            <ViewBoard v-if="viewMode === 'board'" :rows="filteredProjects" :schema="projectSchemaUI"
                :group-by="boardBy" @edit="onEdit" @delete="projects.remove" @update="onUpdate" />

            <!-- TABELA -->
            <OmniTable v-else :items="filteredProjects" :schema="tableSchema" editable @update="onUpdate" @edit="onEdit"
                @delete="projects.remove" />
        </div>
    </section>
</template>
