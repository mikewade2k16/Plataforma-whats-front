<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import NxButton from '@/components/buttons/NxButton.vue'
import NxPageHeader from '@/components/layout/NxPageHeader.vue'
import OmniTable from '@/components/ui/OmniTable.vue'
import ViewBoard from '@/components/board/ViewBoard.vue'
import { useLeadSchema } from '@/schemas/leadSchema'

type ViewMode = 'board' | 'table' | 'chart' | 'calendar'

const q = ref('')
const viewMode = ref<ViewMode>('board')

// filtros rápidos
const selectedSource = ref<string | null>(null)
const selectedStatus = ref<string | null>(null)

const sourcesList = ['WhatsApp', 'Landing', 'Indicação', 'Instagram']
const statusList = ['Novo', 'Qualificado', 'Em negociação', 'Ganho', 'Perdido']


// qual campo vira COLUNA no board
const boardBy = ref<'status' | 'source'>('status')
const groupByOptions = [
    { value: 'status', label: 'Status' },
    { value: 'source', label: 'Origem' },
]

// Mock de dados só pra UI.
const leads = ref([
    { id: 1, name: 'Ana', source: 'WhatsApp', status: 'Novo' },
    { id: 2, name: 'Bruno', source: 'Landing', status: 'Qualificado' },
    { id: 3, name: 'Caio', source: 'Indicação', status: 'Em negociação' },
    { id: 4, name: 'Duda', source: 'Instagram', status: 'Ganho' },
    { id: 5, name: 'Eva', source: 'WhatsApp', status: 'Perdido' },
    { id: 6, name: 'Felipe', source: 'Landing', status: 'Novo' },
    { id: 7, name: 'Gabi', source: 'Indicação', status: 'Qualificado' },
    { id: 8, name: 'Hugo', source: 'Instagram', status: 'Em negociação' },
    { id: 9, name: 'Iris', source: 'WhatsApp', status: 'Ganho' },
    { id: 10, name: 'João', source: 'Landing', status: 'Perdido' },
    { id: 11, name: 'Karla', source: 'Indicação', status: 'Novo' },
    { id: 12, name: 'Leo', source: 'Instagram', status: 'Qualificado' },
])

// schema UI (controlado pelo painel de config)
const schemaUI = ref<Record<string, any>>({})

// sempre que o boardBy mudar, atualiza o schema base
watch(
    boardBy,
    (val) => {
        const fresh = useLeadSchema({ boardBy: val })
        const old = schemaUI.value || {}
        const next: Record<string, any> = {}

        Object.entries(fresh).forEach(([k, cfg]) => {
            next[k] = {
                ...(cfg as any),
                hidden: old[k]?.hidden ?? (cfg as any).hidden,
            }
        })

        schemaUI.value = next
    },
    { immediate: true }
)

// filtros/ordenadores do painel
const filters = ref<any[]>([])
const sorters = ref<any[]>([])

// lista filtrada
const filteredLeads = computed(() => {
    let list = [...leads.value]

    // busca texto
    const term = q.value.trim().toLowerCase()
    if (term) {
        list = list.filter(l =>
            [l.name, l.source, l.status]
                .filter(Boolean)
                .some(v => v!.toString().toLowerCase().includes(term))
        )
    }

    // filtro por origem
    if (selectedSource.value) {
        list = list.filter(l => l.source === selectedSource.value)
    }

    // filtro por status
    if (selectedStatus.value) {
        list = list.filter(l => l.status === selectedStatus.value)
    }

    // filtros avançados
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
            const av = (a as any)?.[field], bv = (b as any)?.[field]
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

function onCreate() {
    const id = Date.now()
    leads.value.unshift({
        id,
        name: 'Novo lead',
        source: 'WhatsApp',
        status: 'Novo',
    })
}

function onUpdate({ id, patch }: { id: number; patch: any }) {
    const idx = leads.value.findIndex(l => l.id === id)
    if (idx === -1) return
    leads.value[idx] = { ...leads.value[idx], ...patch }
}

function onEdit(lead: any) {
    console.log('edit lead', lead)
}

function onDelete(idOrLead: any) {
    const id = typeof idOrLead === 'object' ? idOrLead.id : idOrLead
    leads.value = leads.value.filter(l => l.id !== id)
}

function applyConfig(payload: { schema?: any; filters?: any[]; sorters?: any[] }) {
    if (payload.schema) schemaUI.value = payload.schema
    if (payload.filters) filters.value = payload.filters
    if (payload.sorters) sorters.value = payload.sorters
}
</script>

<template>
    <section class="p-4">
        <NxPageHeader title="Leads" v-model:view="viewMode" v-model:search="q" v-model:groupBy="boardBy"
            :group-by-options="groupByOptions" :schema="schemaUI" :filters="filters" :sorters="sorters"
            :show-search="true" :show-view-switcher="true" :show-config="true" :show-reload="false" :show-logout="false"
            search-placeholder="Buscar por nome, origem ou status…" @apply-config="applyConfig">
            <!-- filtros rápidos -->
            <template #filters>
                <div class="d-flex flex-wrap gap-2">
                    <select v-model="selectedSource" class="form-select form-select-sm" style="min-width: 150px;">
                        <option :value="null">Origem (todas)</option>
                        <option v-for="s in sourcesList" :key="s" :value="s">
                            {{ s }}
                        </option>
                    </select>

                    <select v-model="selectedStatus" class="form-select form-select-sm" style="min-width: 150px;">
                        <option :value="null">Status (todos)</option>
                        <option v-for="s in statusList" :key="s" :value="s">
                            {{ s }}
                        </option>
                    </select>
                </div>
            </template>

            <!-- ações -->
            <template #actions>
                <NxButton :iconOnly="true" size="sm" variant="outline" tone="neutral" title="Novo lead" icon="plus"
                    @click="onCreate" />
            </template>
        </NxPageHeader>

        <div class="p-0">
            <!-- BOARD (ViewBoard padrão do sistema) -->
            <ViewBoard v-if="viewMode === 'board'" :rows="filteredLeads" :schema="schemaUI" :group-by="boardBy"
                @edit="onEdit" @delete="onDelete" />

            <!-- TABELA -->
            <OmniTable v-else :items="filteredLeads" :schema="schemaUI" editable @update="onUpdate" @edit="onEdit"
                @delete="onDelete" />
        </div>
    </section>
</template>
