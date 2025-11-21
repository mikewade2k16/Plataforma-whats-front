<template>
    <OmniTable :items="rows" :schema="schemaComputed" :editable="true" @update="onUpdate"
        @archive="id => $emit('archive', id)" @delete="id => $emit('delete', id)" />
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import OmniTable from '@/components/ui/OmniTable.vue'
import { useViewsStore } from '@/stores/views'
import { buildTableSchema } from '@/schemas/tasks.schema'

const props = defineProps<{ rows: any[]; schema?: Record<string, any> }>()
defineEmits(['update', 'archive', 'delete'])

const views = useViewsStore()
const fallbackSchema = computed(() => buildTableSchema(views.active?.properties || {}))
const schemaComputed = computed(() => props.schema || fallbackSchema.value)

function onUpdate(payload: { id: number; patch: Record<string, any> }) {
    ; (getCurrentInstance() as any).emit('update', payload)
}
</script>
