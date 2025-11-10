<template>
    <div class="board-card card" :data-task-id="task.id" @click="onCardClick">
        <!-- HEADER -->
        <div class="card-header d-flex align-items-center justify-content-between gap-2">
            <FieldInlineEdit v-if="show('name')" class="flex-grow-1" :value="task.name" :component="FieldText"
                :componentProps="{ config: fields.name }" @update="v => emitUpdate({ name: (v ?? '').toString() })" />

            <div class="d-flex gap-2">
                <NxButton class="btn-board btn-delete" size="sm" variant="outline" tone="danger" icon="trash-2" iconOnly
                    title="Excluir" @click="$emit('remove')" />
                <NxButton class="btn-board btn-archive" size="sm" variant="outline" tone="neutral" icon="archive"
                    iconOnly title="Arquivar" @click="$emit('toggle-archive')" />
            </div>
        </div>

        <!-- BODY -->
        <div class="card-body d-flex flex-column gap-2">
            <FieldInlineEdit v-if="show('user_id')" :row="task" field-key="user_id" :value="task.user_id"
                :component="FieldSelect" :componentProps="{ config: fields.user_id }"
                @update="v => emitUpdate({ user_id: v || null })" />

            <FieldInlineEdit v-if="show('client_id')" :row="task" field-key="client_id" :value="task.client_id"
                :component="FieldSelect" :componentProps="{ config: fields.client_id }"
                @update="v => emitUpdate({ client_id: v || null })" />

            <div class="d-flex gap-2">
                <FieldInlineEdit v-if="show('start_date')" class="w-50" :value="task.start_date" :component="FieldDate"
                    :componentProps="{ config: fields.start_date }"
                    @update="v => emitUpdate({ start_date: v || null })" />
                <FieldInlineEdit v-if="show('due_date')" class="w-50" :value="task.due_date" :component="FieldDate"
                    :componentProps="{ config: fields.due_date }" @update="v => emitUpdate({ due_date: v || null })" />
            </div>

            <FieldInlineEdit v-if="show('priority')" :row="task" field-key="priority" :value="task.priority"
                :component="FieldSelect" :componentProps="{ config: fields.priority }"
                @update="v => emitUpdate({ priority: v || '' })" />

            <FieldInlineEdit v-if="show('type_task')" :row="task" field-key="type_task" :value="task.type_task"
                :component="FieldSelect" :componentProps="{ config: fields.type_task }"
                @update="v => emitUpdate({ type_task: v || null })" />

            <FieldInlineEdit v-if="show('involved_users')" :row="task" field-key="involved_users"
                :value="involvedUsersArray" :component="FieldSelect" :componentProps="{ config: fields.involved_users }"
                @update="v => emitUpdate({ involved_users: toCsv(v as any[]) })" />

            <FieldInlineEdit v-if="show('comment')" :value="task.comment" :component="FieldText"
                :componentProps="{ config: fields.comment }" @update="v => emitUpdate({ comment: v || null })" />

            <FieldInlineEdit v-if="show('column_id') && allColumns?.length" :value="task.column_id ?? task.column?.id"
                :component="FieldSelect" :componentProps="{ config: fields.column_id }"
                @update="v => emitUpdate({ column_id: v })" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NxButton from '@/components/buttons/NxButton.vue'
import FieldInlineEdit from '@/components/ui/fields/FieldInlineEdit.vue'
import FieldText from '@/components/ui/fields/FieldText.vue'
import FieldSelect from '@/components/ui/fields/FieldSelect.vue'
import FieldDate from '@/components/ui/fields/FieldDate.vue'

import { useTaskModal } from '@/stores/taskModal'
import { useViewsStore } from '@/stores/views'
import { isVisibleOnBoard } from '@/schemas/tasks.schema'


const props = defineProps<{
    task: any
    columnName: string
    allColumns?: Array<{ id: number; name: string }>
    users?: Array<{ id: number; name: string }>
    clients?: Array<{ id: number; name: string }>
    schema?: Record<string, any>          // ⬅️ NOVO
}>()

const show = (key: string) => !props.schema || props.schema[key]?.hidden !== true

const emit = defineEmits<{
    (e: 'update', patch: Record<string, any>): void
    (e: 'remove'): void
    (e: 'toggle-archive'): void
}>()

/** visibilidade da view ativa (Board) */
const views = useViewsStore()
const visible = (key: any) => isVisibleOnBoard(key, views.active?.properties || {})

/** opções (pode vir de store ou props externas) */
const usersOptions = computed(() =>
    (props.users ?? []).map(u => ({ value: u.id, label: u.name }))
)
const clientsOptions = computed(() =>
    (props.clients ?? []).map(c => ({ value: c.id, label: c.name }))
)

const priorityOptions = [
    { value: '1', label: 'Baixa' },
    { value: '2', label: 'Média' },
    { value: '3', label: 'Alta' }
]

const typeTaskOptions = [
    { value: 'design', label: 'Design' },
    { value: 'vídeo', label: 'Vídeo' },
    { value: 'filme', label: 'Filme' },
    { value: 'copy', label: 'Copy' },
    { value: '3D', label: '3D' }
]

// configs para FieldInlineEdit
const columnOptions = computed(() =>
    (props.allColumns ?? []).map(c => ({ value: c.id, label: c.name }))
)

const fields = {
    name: { label: 'Título', type: 'text', placeholder: 'Nome da tarefa' },
    user_id: {
        label: 'Responsável',
        type: 'select',
        placeholder: 'Selecione o responsável',
        options: usersOptions,
        valueType: 'number'
    },
    client_id: {
        label: 'Cliente',
        type: 'select',
        placeholder: 'Selecione o cliente',
        options: clientsOptions,
        valueType: 'number'
    },
    start_date: { label: 'Início', type: 'date', placeholder: 'Início' },
    due_date: { label: 'Prazo', type: 'date', placeholder: 'Prazo' },
    priority: {
        label: 'Prioridade',
        type: 'select',
        placeholder: 'Defina a prioridade',
        options: priorityOptions
    },
    type_task: {
        label: 'Tipo',
        type: 'select',
        placeholder: 'Selecione o tipo',
        options: typeTaskOptions
    },
    involved_users: {
        label: 'Envolvidos',
        type: 'select',
        multiple: true,
        placeholder: 'Adicionar envolvidos',
        options: usersOptions
    },
    comment: { label: 'Comentário', type: 'text', placeholder: 'Adicione um comentário' },
    column_id: {
        label: 'Coluna',
        type: 'select',
        placeholder: 'Mover para…',
        options: columnOptions,
        valueType: 'number'
    }
}

function emitUpdate(patch: Record<string, any>) {
    emit('update', patch)
}

/** involved_users: back salva longtext; aqui manipulamos como array de ids */
const involvedUsersArray = computed<any[]>(() => {
    const raw = props.task.involved_users
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    return String(raw).split(',').map(s => s.trim()).filter(Boolean)
})

const toCsv = (arr: any[]) => (arr && arr.length ? arr.join(',') : null)

/** abrir modal ao clicar no card (ignora cliques em controles internos) */
const modal = useTaskModal()
function onCardClick(e: MouseEvent) {
    const el = e.target as HTMLElement
    if (el.closest('button,input,select,textarea,[data-no-open]')) return
    modal.show(props.task.id)
}
</script>

<style scoped>
.board-card .card-header {
    padding: .5rem .75rem;
}

.board-card .card-body {
    padding: .75rem;
}
</style>
