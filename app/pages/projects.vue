<template>
    <section class="p-4">

        <div class="d-flex align-items-center gap-3 mb-3">
            <h2 class="m-0">Projects</h2>

            <button class="btn btn-sm btn-outline-success" @click="onCreate">
                + Novo Projeto
            </button>

            <button class="btn btn-sm btn-outline-light" @click="toggleView">
                {{ viewMode === 'table' ? 'Ver Board' : 'Ver Tabela' }}
            </button>
        </div>

        <component :is="viewMode === 'table' ? OmniTable : OmniBoard" :items="projects.items" :schema="projectSchema"
            editable @update="onUpdate" @edit="onEdit" @delete="projects.remove" />
    </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import OmniTable from '@/components/ui/OmniTable.vue'
import OmniBoard from '@/components/ui/OmniBoard.vue'
import { useProjectSchema } from '@/schemas/projectSchema'

const projects = useProjectsStore()
const viewMode = ref<'table' | 'board'>('table')

const projectSchema = computed(() => useProjectSchema()) // ← schema reativo (usa options do store)

const toggleView = () => (viewMode.value = viewMode.value === 'table' ? 'board' : 'table')
const onUpdate = ({ id, patch }: any) => projects.update(id, patch)
const onEdit = (p: any) => console.log('edit', p)

const onCreate = async () => {
    await projects.create({
        name: 'Novo Projeto',
        status: 'not_started',
        visibility: 'public',
        date_project: new Date().toISOString().slice(0, 10),
        // client_id será inferido pela store
    })
}

onMounted(() => projects.load())
</script>
