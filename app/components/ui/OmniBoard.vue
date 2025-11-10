<template>
    <div class="row g-3 omni-board">
        <div v-for="item in items" :key="item.id" class="col-12 col-md-6 col-lg-4">
            <div class="card h-100 p-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <strong>{{ item.name || 'Sem título' }}</strong>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-light" @click="$emit('edit', item)">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" @click="$emit('delete', item.id)">🗑️</button>
                    </div>
                </div>

                <div v-for="(cfg, key) in visibleColumns" :key="key" class="mb-2 small">
                    <label class="fw-bold">{{ cfg.label }}:</label>
                    <FieldInlineEdit :value="item[key]" :editable="editable" :component="resolveFieldComponent(cfg)"
                        :component-props="{ config: cfg }" @update="val => emitUpdate(item, key, val)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FieldInlineEdit, FieldText, FieldSelect, FieldSwitch, FieldImage } from './fields'

const props = defineProps<{
    items: any[]
    schema: Record<string, any>
    editable?: boolean
}>()

const emit = defineEmits(['update', 'edit', 'delete'])

const visibleColumns = computed(() =>
    Object.fromEntries(Object.entries(props.schema).filter(([_, v]) => !v.hidden))
)

const resolveFieldComponent = (cfg: any) => {
    switch (cfg.type) {
        case 'select': return FieldSelect
        case 'switch': return FieldSwitch
        case 'image': return FieldImage
        default: return FieldText
    }
}

const emitUpdate = (row: any, key: string, val: any) => {
    emit('update', { id: row.id, patch: { [key]: val } })
}
</script>
