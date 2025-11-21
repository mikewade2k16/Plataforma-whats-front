<template>
    <!-- ===== MODO GENÉRICO (Leads / Projects / etc.) ===== -->
    <div v-if="mode === 'generic'" class="omni-board d-flex gap-3" id="generic-board">
        <div v-for="col in genericColumnsLocal" :key="col.id" class="omni-board-column-wrapper">
            <div class="omni-board-header p-2 fw-bold d-flex align-items-center gap-2">
                <span class="badge bg-success-subtle text-success-emphasis">
                    {{ col.label }}
                </span>
                <span class="text-muted small">
                    {{ col.items.length }}
                </span>
            </div>

            <!-- D&D de cards dentro da coluna -->
            <draggable v-model="col.items" :group="{ name: 'generic-' + groupField, pull: false, put: false }"
                item-key="id" class="omni-board-column" :animation="150" @change="onGenericDndChange">
                <template #item="{ element: item }">
                    <div class="board-card card mb-2" :data-item-id="item.id">
                        <!-- header do card -->
                        <div class="card-header d-flex justify-content-between align-items-start py-2 px-3">
                            <strong class="small">
                                {{ item.name || 'Sem título' }}
                            </strong>

                            <div class="d-flex gap-1">
                                <NxButton size="sm" variant="outline" tone="primary" icon="edit-2" iconOnly
                                    title="Editar" @click.stop="$emit('edit', item)" />

                                <NxButton size="sm" variant="outline" tone="danger" icon="trash-2" iconOnly
                                    title="Excluir" @click.stop="$emit('delete', item.id)" />
                            </div>
                        </div>

                        <!-- body: campos conforme schema, com inline-edit -->
                        <div class="card-body py-2 px-3">
                            <div v-for="(cfg, key) in visibleSchemaGeneric" :key="key" class="text-muted small mb-1">
                                <span class="fw-bold">{{ cfg.label || key }}:</span>

                                <!-- se o campo é editável, usa FieldInlineEdit -->
                                <span class="ms-1">
                                    <FieldInlineEdit v-if="cfg.editable !== false" :value="item[key]"
                                        :component="resolveGenericFieldComponent(cfg)"
                                        :component-props="{ config: cfg }"
                                        @update="val => emitGenericUpdate(item, key, val)" />

                                    <!-- se não for editável, mostra texto simples -->
                                    <span v-else>
                                        {{ formatValueGeneric(item[key]) }}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </template>
            </draggable>

            <div v-if="!col.items.length" class="text-muted small px-2 pb-2">
                Sem registros
            </div>
        </div>
    </div>

    <!-- ===== MODO TASKS (board completo com stores, DnD etc.) ===== -->
    <div v-else class="omni-board d-flex gap-3" id="tasks">
        <draggable v-model="columnsLocal" item-key="id" class="d-flex gap-3" :group="{ name: 'columns' }"
            :animation="150" :filter="'.dnd-ignore'" :preventOnFilter="false" @change="onColumnsChange">
            <template #item="{ element: col }">
                <div class="omni-board-column-wrapper">
                    <div class="omni-board-header p-2 fw-bold d-flex align-items-center gap-2">
                        <template v-if="editingId === col.id">
                            <input v-model.trim="renameBuffer" class="form-control form-control-sm dnd-ignore"
                                style="max-width:220px" @keydown.enter.prevent="confirmRename(col)"
                                @keydown.esc.prevent="cancelRename()" @blur="confirmRename(col)" autofocus />
                        </template>

                        <template v-else>
                            <span class="badge bg-success-subtle text-success-emphasis">
                                {{ col.name }}
                            </span>
                            <span class="text-muted small">{{ countTasks(col.id) }}</span>

                            <NxButton class="ms-auto" size="sm" variant="outline" tone="primary" icon="plus" iconOnly
                                title="Nova tarefa" @click="emitCreate(col.id)" />

                            <NxButton class="dnd-ignore" size="sm" variant="outline" tone="neutral" icon="more-vertical"
                                iconOnly title="Opções da coluna" dropdown dropdownType="menu" placement="bottom-end">
                                <template #menu>
                                    <div class="d-flex flex-column gap-1" style="min-width:200px">
                                        <button class="btn btn-sm btn-light text-start dnd-ignore"
                                            @click.stop="startRename(col)">
                                            Renomear
                                        </button>
                                        <button class="btn btn-sm btn-light text-start dnd-ignore"
                                            @click.stop="confirmDelete('move', col.id)">
                                            Mover páginas e excluir grupo…
                                        </button>
                                        <button class="btn btn-sm btn-danger text-start dnd-ignore"
                                            @click.stop="confirmDelete('cascade', col.id)">
                                            Excluir grupo e páginas…
                                        </button>
                                    </div>
                                </template>
                            </NxButton>
                        </template>
                    </div>

                    <BoardColumn :column="{ id: col.id, name: col.name }" :tasks="tasksByColumn(col.id)"
                        :all-columns="columns" :users="dir.users" :clients="dir.clients" :schema="schemaProp"
                        @update="onUpdate" @remove="onRemove" @toggle-archive="onToggleArchive"
                        @reorder-tasks="onTasksReordered" @move-task="onTaskMoved" />
                </div>
            </template>
        </draggable>

        <NxButton variant="outline" tone="neutral" class="align-self-start" @click="createColumn">
            + Novo grupo
        </NxButton>

        <ToastCenter ref="toastRef" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import draggable from 'vuedraggable'
import NxButton from '@/components/buttons/NxButton.vue'
import BoardColumn from '@/components/board/BoardColumn.vue'
import ToastCenter from '@/components/ToastCenter.vue'
import { useTasksStore } from '@/stores/tasks'
import { useColumnsStore } from '@/stores/columns'
import { useDirectoryStore } from '@/stores/directory'

import FieldInlineEdit from '@/components/ui/fields/FieldInlineEdit.vue'
import FieldText from '@/components/ui/fields/FieldText.vue'
import FieldSelect from '@/components/ui/fields/FieldSelect.vue'
import FieldSwitch from '@/components/ui/fields/FieldSwitch.vue'
import FieldDate from '@/components/ui/fields/FieldDate.vue'

const props = defineProps<{
    /** lista já filtrada/ordenada para modo genérico (Leads, Projects, etc). Se vazio → modo tasks */
    rows?: any[]
    /** schema para cards genéricos (e para controle de visibilidade no board de tasks) */
    schema?: Record<string, any>
    /** campo para agrupar no modo genérico (ex: 'status', 'source') */
    groupBy?: string
}>()

const emit = defineEmits<{
    (e: 'edit', row: any): void
    (e: 'delete', id: number | string): void
    (e: 'update', payload: { id: number | string; patch: Record<string, any> }): void
}>()

const schemaProp = computed(() => props.schema || {})

/* ====== MODO (generic x tasks) ====== */
const mode = computed<'generic' | 'tasks'>(() =>
    props.rows && props.rows.length ? 'generic' : 'tasks',
)

/* ====== MODO GENÉRICO ====== */
const baseRows = computed(() => props.rows || [])
const groupField = computed(() => props.groupBy || 'status')

const visibleSchemaGeneric = computed<Record<string, any>>(() => {
    if (!props.schema) return {}

    const entries = Object.entries(props.schema).filter(([key, cfgAny]) => {
        const cfg: any = cfgAny || {}

        if (cfg.hidden) return false
        if (key === groupField.value) return false
        if (cfg.views && cfg.views.board === false) return false

        return true
    })

    return Object.fromEntries(entries)
})

/** colunas calculadas a partir de rows (agrupamento) */
const genericColumns = computed(() => {
    const groups: Record<string, { id: string; label: string; items: any[] }> = {}

    for (const row of baseRows.value) {
        const raw = row[groupField.value] ?? 'Sem status'
        const key = String(raw)

        if (!groups[key]) {
            groups[key] = {
                id: key,
                label: key,
                items: [],
            }
        }

        groups[key].items.push(row)
    }

    return Object.values(groups)
})

/** cópia local das colunas genéricas para permitir D&D sem mexer no computed */
const genericColumnsLocal = ref<any[]>([])

watch(
    genericColumns,
    cols => {
        genericColumnsLocal.value = cols.map(c => ({
            ...c,
            items: [...c.items],
        }))
    },
    { immediate: true, deep: true },
)

/** formatação simples para campos não editáveis no modo genérico */
function formatValueGeneric(v: any) {
    if (v == null || v === '') return '—'
    if (v instanceof Date) return v.toLocaleDateString()
    return String(v)
}

/** resolve qual componente de campo usar no modo genérico */
function resolveGenericFieldComponent(cfg: any) {
    switch (cfg?.type) {
        case 'select':
            return FieldSelect
        case 'switch':
            return FieldSwitch
        case 'date':
            return FieldDate
        default:
            return FieldText
    }
}

/** emite update no mesmo formato da tabela */
function emitGenericUpdate(row: any, key: string, val: any) {
    emit('update', { id: row.id, patch: { [key]: val } })
}

/** callback do D&D genérico (por enquanto só visual; depois podemos emitir reorder) */
function onGenericDndChange(_evt: any) {
    // futuro: se quiser salvar ordenação, emitir um evento aqui
}

/* ====== MODO TASKS (como estava antes) ====== */
const dir = useDirectoryStore()
const tasksStore = useTasksStore()
const columnsStore = useColumnsStore()
const { items: columns } = storeToRefs(columnsStore)

const baseTasks = computed(() =>
    mode.value === 'tasks' ? tasksStore.list : [],
)

function countTasks(columnId: number) {
    if (mode.value !== 'tasks') return 0
    return baseTasks.value.filter(
        t => ((t as any).column_id ?? t.column?.id ?? 0) === columnId,
    ).length
}

const columnsLocal = ref<any[]>([])
const sourceColumns = computed(() =>
    mode.value === 'tasks' ? columns.value : [],
)

watch(
    sourceColumns,
    v => {
        columnsLocal.value = JSON.parse(JSON.stringify(v || []))
    },
    { immediate: true, deep: true },
)

function onColumnsChange() {
    if (mode.value !== 'tasks') return
    columnsStore.reorderLocal(columnsLocal.value)
}

async function createColumn() {
    if (mode.value !== 'tasks') return
    await columnsStore.createOptimistic('Novo grupo')
}

function tasksByColumn(columnId: number) {
    if (mode.value !== 'tasks') return []
    return baseTasks.value
        .filter(
            t => ((t as any).column_id ?? t.column?.id ?? 0) === columnId,
        )
        .sort(
            (a: any, b: any) =>
                (a.order_position ?? 0) - (b.order_position ?? 0),
        )
}

function emitCreate(columnId: number) {
    if (mode.value !== 'tasks') return
    tasksStore.createOptimistic({
        name: 'Nova tarefa',
        column_id: columnId,
        description: null,
        comment: null,
        file: null,
        priority: '',
        archived: 0,
        start_date: null,
        due_date: null,
        last_started: null,
        user_id: null,
        client_id: null,
        campaign_id: null,
        type_task: null,
        number: null,
        involved_users: null,
        timer_status: 0,
        time_spent: 0,
    })
}

function onUpdate({ id, patch }: { id: number; patch: Record<string, any> }) {
    if (mode.value !== 'tasks') return
    tasksStore.updateOptimistic(id, patch)
}

async function onRemove(id: number) {
    if (mode.value !== 'tasks') return
    await tasksStore.removeOptimistic(id)
}

async function onToggleArchive(_task: any) {
    // implementar depois se necessário
}

function onTasksReordered(payload: { columnId: number; orderedIds: number[] }) {
    if (mode.value !== 'tasks') return
    tasksStore.applyLocalReorder(payload.columnId, payload.orderedIds)
}

function onTaskMoved(payload: {
    taskId: number
    fromColumnId: number
    toColumnId: number
    toIndex: number
    orderedIdsInSource: number[]
    orderedIdsInTarget: number[]
}) {
    if (mode.value !== 'tasks') return
    tasksStore.applyLocalMove(
        payload.taskId,
        payload.toColumnId,
        payload.toIndex,
        payload.orderedIdsInTarget,
        payload.fromColumnId,
    )
}

/* rename */
const editingId = ref<number | null>(null)
const renameBuffer = ref('')
let previousName = ''

function startRename(col: any) {
    editingId.value = col.id
    renameBuffer.value = col.name
    previousName = col.name
}

function cancelRename() {
    editingId.value = null
    renameBuffer.value = previousName
}

async function confirmRename(col: any) {
    const name = renameBuffer.value?.trim()
    const original = previousName
    editingId.value = null
    if (!name || name === original) return
    await columnsStore.renameOptimistic(col.id, name)
}

/* toast */
const toastRef = ref<InstanceType<typeof ToastCenter> | null>(null)
function confirmDelete(modeDelete: 'move' | 'cascade', columnId: number) {
    toastRef.value?.openConfirm(modeDelete, columnId)
}
</script>

<style scoped>
.omni-board-column-wrapper {
    min-width: 280px;
}

.omni-board-header {
    border-bottom: 1px solid rgba(255, 255, 255, .06);
}

.board-card .card-header {
    padding: .5rem .75rem;
}

.board-card .card-body {
    padding: .5rem .75rem;
}
</style>
