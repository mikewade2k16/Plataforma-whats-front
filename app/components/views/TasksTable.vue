<template>
    <OmniTable :items="rows" :schema="tableSchema" :editable="true" @update="onUpdate"
        @archive="id => $emit('archive', id)" @delete="id => $emit('delete', id)" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import OmniTable from '@/components/ui/OmniTable.vue'
import { useViewsStore } from '@/stores/views'
import { buildTableSchema } from '@/schemas/tasks.schema'
import { useTaskModal } from '@/stores/taskModal'  
const modal = useTaskModal() 

const props = defineProps<{ rows: any[] }>()
defineEmits(['update', 'archive', 'delete'])

const views = useViewsStore()
const tableSchema = computed(() => buildTableSchema(views.active?.properties || {}))

function onUpdate(payload: { id: number; patch: Record<string, any> }) {
    // repassa pra página
    // (não chamamos store aqui pra manter um único ponto de escrita)
    ; (getCurrentInstance() as any).emit('update', payload)
}
</script>
