<template>
    <div class="omni-board-column" :data-column-id="column.id">
        <draggable v-model="localTasks" item-key="id" :group="{ name: 'tasks', pull: true, put: true }" :animation="150"
            :filter="'.dnd-ignore'" :preventOnFilter="false" class="kanban-body" :data-column-id="column.id"
            @change="onDndChange">
            <!-- ✅ OBRIGATÓRIO: slot item -->
            <template #item="{ element: t }">
                <BoardCard :task="t" :column-name="column.name" :all-columns="allColumns" :users="users"
                    :clients="clients" @update="(patch) => emit('update', { id: t.id, patch })"
                    @remove="() => emit('remove', t.id)" @toggle-archive="() => emit('toggle-archive', t)" />

            </template>
        </draggable>


        <div v-if="!localTasks?.length" class="text-muted small px-2">Sem tarefas</div>
    </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import BoardCard from '@/components/board/BoardCard.vue'

const props = defineProps<{
    column: { id: number; name: string }
    tasks: any[]
    allColumns?: Array<{ id: number; name: string }>
    users?: Array<{ id: number | string; name: string }>
    clients?: Array<{ id: number | string; name: string }>
}>()

const emit = defineEmits<{
    (e: 'update', payload: { id: number; patch: Record<string, any> }): void
    (e: 'remove', id: number): void
    (e: 'toggle-archive', task: any): void
    // novos
    (e: 'reorder-tasks', payload: { columnId: number; orderedIds: number[] }): void
    (e: 'move-task', payload: {
        taskId: number
        fromColumnId: number
        toColumnId: number
        toIndex: number
        orderedIdsInSource: number[]
        orderedIdsInTarget: number[]
    }): void
}>()

const allColumns = computed(() => props.allColumns ?? [])

const localTasks = ref<any[]>([])
watch(() => props.tasks, v => { localTasks.value = [...v] }, { immediate: true })

function onDndChange(evt: any) {
    // Sortable fornece evt.from (origem) e evt.to (destino)
    const fromColId = Number(evt?.from?.dataset?.columnId) || props.column.id
    const toColId = Number(evt?.to?.dataset?.columnId) || props.column.id

    // Reordenou dentro da MESMA coluna (evt.moved)
    if (evt.moved) {
        emit('reorder-tasks', {
            columnId: toColId,
            orderedIds: localTasks.value.map(t => t.id)
        })
    }

    // Saiu DAQUI (evt.removed) → reindexa a coluna de origem
    if (evt.removed) {
        emit('reorder-tasks', {
            columnId: fromColId,
            orderedIds: (evt.from as HTMLElement)
                ?.querySelectorAll?.('[data-task-id]')
                ? Array.from((evt.from as HTMLElement).querySelectorAll('[data-task-id]')).map(el => Number((el as HTMLElement).dataset.taskId))
                : []
        })
    }

    // Entrou AQUI (evt.added) → move + reindex da coluna destino
    if (evt.added) {
        const toIndex = evt.added.newIndex
        const task = evt.added.element
        emit('move-task', {
            taskId: task.id,
            fromColumnId: fromColId,
            toColumnId: toColId,
            toIndex,
            orderedIdsInSource: [], // opcional (a origem já emite 'reorder-tasks')
            orderedIdsInTarget: localTasks.value.map(t => t.id)
        })
    }
}


</script>
