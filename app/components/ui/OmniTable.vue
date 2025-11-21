<template>
    <div class="table-crow">
        <!-- Cabeçalho -->
        <div class="table-header">
            <div v-for="(cfg, key) in visibleColumns" :key="key" class="item item-header" :class="key">
                {{ cfg.label }}
            </div>
            <div class="item item-options">Opções</div>
        </div>

        <!-- Corpo -->
        <div class="table-body">
            <div v-for="row in items" :key="row.id" class="table-row" :class="{ 'archived-task': row.archived }">
                <div v-for="(cfg, key) in visibleColumns" :key="key" class="item item-field" :data-column="key">
                    <FieldInlineEdit :row="row" :field-key="key" :value="row[key]" :editable="editable"
                        :component="resolveFieldComponent(cfg)" :component-props="{ config: cfg, fieldKey: key }"
                        @update="val => emitUpdate(row, key, val)" />
                </div>

                <div class="item item-options">
                    <!-- ABRIR MODAL -->
                    <button class="btn btn-icon btn-outline-light" title="Abrir" @click="modal.show(row.id)">
                        <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24"
                            fill="currentColor">
                            <path d="M19 3H5a2 2 0 0 0-2 2v6h2V5h14v14h-6v2h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
                            <path d="M11 21H3v-8h2v4.586l9.293-9.293 1.414 1.414L6.414 19H11v2z" />
                        </svg>
                    </button>

                    <!-- Arquivar -->
                    <button class="btn btn-icon btn-warning" title="Arquivar"
                        @click="$emit('archive', row.id)">…</button>

                    <!-- Excluir -->
                    <button class="btn btn-icon btn-danger" title="Excluir" @click="$emit('delete', row.id)">…</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTaskModal } from '@/stores/taskModal'   // ⬅️ IMPORT
import {
    FieldInlineEdit, FieldText, FieldSelect, FieldSwitch, FieldImage, FieldMultiSelect,
} from './fields'

const props = defineProps<{ items: any[]; schema: Record<string, any>; editable?: boolean }>()
const emit = defineEmits(['update', 'archive', 'delete'])

const modal = useTaskModal() // ⬅️ FIX: evita undefined no @click

const visibleColumns = computed(() =>
    Object.fromEntries(Object.entries(props.schema).filter(([_, v]) => !v.hidden))
)

const resolveFieldComponent = (cfg: any) => {
    switch (cfg.type) {
        case 'select': return FieldSelect
        case 'multiselect': return FieldMultiSelect
        case 'switch': return FieldSwitch
        case 'image': return FieldImage
        default: return FieldText
    }
}

const emitUpdate = (row: any, key: string, val: any) => {
    emit('update', { id: row.id, patch: { [key]: val } })
}
</script>

<style scoped lang="scss">
/* (igual ao seu) */
.table-crow {
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow: hidden
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    position: sticky;
    top: 0;
    backdrop-filter: blur(5px);
    padding: .75rem 1rem;
    z-index: 5
}

.table-header .item {
    flex: 1;
    text-align: left;
    font-weight: 600;
    font-size: .9rem;
    padding: .5rem
}

.table-header .item-options {
    flex: 0 0 100px;
    text-align: right
}

.table-body {
    display: flex;
    flex-direction: column;
    width: 100%
}

.table-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background .25s ease;
    padding: .5rem 1rem
}

.table-row.archived-task {
    opacity: .5
}

.item-field {
    flex: 1;
    padding: .4rem .6rem;
    font-size: .9rem;
    word-break: break-word
}

.item-options {
    flex: 0 0 100px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: .4rem
}

.btn-icon {
    border: none;
    background: transparent;
    transition: .25s
}

.btn-icon:hover {
    transform: scale(1.1)
}

.btn-icon.btn-danger:hover {
    color: red
}
</style>
