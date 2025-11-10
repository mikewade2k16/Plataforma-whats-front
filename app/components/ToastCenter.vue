<script setup lang="ts">
import { useTasksStore } from '@/stores/tasks'
import { useColumnsStore } from '@/stores/columns'

const tasksStore = useTasksStore()
const columnsStore = useColumnsStore()

const confirmState = reactive({
    open: false as boolean,
    mode: 'move' as 'move' | 'cascade',
    columnId: 0,
    targetId: 0,
})

function openConfirm(mode: 'move' | 'cascade', columnId: number) {
    confirmState.mode = mode
    confirmState.columnId = columnId
    const firstOther = columnsStore.items.find(c => c.id !== columnId)?.id
    confirmState.targetId = firstOther ?? 0
    confirmState.open = true
}

async function onConfirm() {
    const { mode, columnId, targetId } = confirmState
    confirmState.open = false
    await columnsStore.removeColumn({
        id: columnId,
        mode,
        targetColumnId: mode === 'move' ? targetId : undefined,
    })
}

// fecha com ESC
function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') confirmState.open = false
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

defineExpose({ openConfirm })
</script>

<template>
    <Teleport to="body">
        <div v-if="confirmState.open" class="nx-toast-center" @click.self="confirmState.open = false">
            <div class="nx-toast-card">
                <div class="title">
                    {{ confirmState.mode === 'move'
                        ? 'Excluir grupo e mover páginas'
                        : 'Excluir grupo e páginas (permanente)' }}
                </div>

                <p v-if="confirmState.mode === 'move'" class="mb-2">
                    {{ tasksStore.countByColumn(confirmState.columnId) }} páginas serão movidas para:
                </p>

                <div v-if="confirmState.mode === 'move'" class="mb-3">
                    <select v-model.number="confirmState.targetId" class="form-select">
                        <option v-for="c in columnsStore.items" :key="c.id" :value="c.id"
                            :disabled="c.id === confirmState.columnId">
                            {{ c.name }}
                        </option>
                    </select>
                </div>

                <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-light" @click="confirmState.open = false">Cancelar</button>
                    <button class="btn" :class="confirmState.mode === 'move' ? 'btn-primary' : 'btn-danger'"
                        @click="onConfirm">
                        {{ confirmState.mode === 'move' ? 'Mover & Excluir' : 'Excluir definitivamente' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
/* (seu CSS igual) */
.nx-toast-center {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, .25);
    z-index: 9999
}

.nx-toast-card {
    width: min(520px, 92vw);
    background: var(--nx-surface);
    border: 1px solid var(--nx-border);
    border-radius: 14px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, .35);
    padding: 16px
}

.title {
    font-weight: 700;
    margin-bottom: 8px
}

.btn-primary {
    background: var(--nx-primary);
    color: #042227;
    border: 1px solid var(--nx-primary)
}

.btn-danger {
    background: #ef4444;
    color: #fff;
    border: 1px solid #ef4444
}

.btn-light {
    background: var(--nx-surface-2);
    border: 1px solid var(--nx-border)
}

.form-select {
    width: 100%
}
</style>
