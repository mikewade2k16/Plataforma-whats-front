<template>
    <div class="omni-board d-flex gap-3" id="tasks">
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
                            <span class="badge bg-success-subtle text-success-emphasis">{{ col.name }}</span>
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

const props = defineProps<{
    rows?: any[]                      // lista já filtrada/ordenada (opcional)
    schema?: Record<string, any>      // overrides de visibilidade p/ cards
}>()

const schemaProp = computed(() => props.schema || {})

const dir = useDirectoryStore()
const tasksStore = useTasksStore()
const columnsStore = useColumnsStore()
const { items: columns } = storeToRefs(columnsStore)

const baseTasks = computed(() => (props.rows && props.rows.length ? props.rows : tasksStore.list))

function countTasks(columnId: number) {
    return baseTasks.value.filter(t => ((t as any).column_id ?? t.column?.id ?? 0) === columnId).length
}

const columnsLocal = ref<any[]>([])
watch(columns, v => { columnsLocal.value = JSON.parse(JSON.stringify(v)) }, { immediate: true, deep: true })
function onColumnsChange() { columnsStore.reorderLocal(columnsLocal.value) }

async function createColumn() { await columnsStore.createOptimistic('Novo grupo') }

function tasksByColumn(columnId: number) {
    return baseTasks.value
        .filter(t => ((t as any).column_id ?? t.column?.id ?? 0) === columnId)
        .sort((a: any, b: any) => (a.order_position ?? 0) - (b.order_position ?? 0))
}

function emitCreate(columnId: number) {
    tasksStore.createOptimistic({
        name: 'Nova tarefa', column_id: columnId, description: null, comment: null, file: null, priority: '',
        archived: 0, start_date: null, due_date: null, last_started: null, user_id: null, client_id: null,
        campaign_id: null, type_task: null, number: null, involved_users: null, timer_status: 0, time_spent: 0
    })
}

function onUpdate({ id, patch }: { id: number; patch: Record<string, any> }) { tasksStore.updateOptimistic(id, patch) }
async function onRemove(id: number) { await tasksStore.removeOptimistic(id) }
async function onToggleArchive(_task: any) { /* implementar c/ back depois */ }

function onTasksReordered(payload: { columnId: number; orderedIds: number[] }) {
    tasksStore.applyLocalReorder(payload.columnId, payload.orderedIds)
}
function onTaskMoved(payload: { taskId: number; fromColumnId: number; toColumnId: number; toIndex: number; orderedIdsInSource: number[]; orderedIdsInTarget: number[] }) {
    tasksStore.applyLocalMove(payload.taskId, payload.toColumnId, payload.toIndex, payload.orderedIdsInTarget, payload.fromColumnId)
}

/* rename */
const editingId = ref<number | null>(null)
const renameBuffer = ref(''); let previousName = ''
function startRename(col: any) { editingId.value = col.id; renameBuffer.value = col.name; previousName = col.name }
function cancelRename() { editingId.value = null; renameBuffer.value = previousName }
async function confirmRename(col: any) {
    const name = renameBuffer.value?.trim(); const original = previousName
    editingId.value = null; if (!name || name === original) return
    await columnsStore.renameOptimistic(col.id, name)
}

/* toast */
const toastRef = ref<InstanceType<typeof ToastCenter> | null>(null)
function confirmDelete(mode: 'move' | 'cascade', columnId: number) { toastRef.value?.openConfirm(mode, columnId) }
</script>

<style scoped>
.omni-board-column-wrapper {
    min-width: 280px
}

.omni-board-header {
    border-bottom: 1px solid rgba(255, 255, 255, .06)
}

.btn-board-icon {
    padding: .25rem .5rem
}
</style>