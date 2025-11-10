<template>
    <section class="p-4">
        <div class="d-flex align-items-center gap-3 mb-3">
            <h2 class="m-0">Clients</h2>
            <button class="btn btn-sm btn-outline-success" @click="onCreate">+ Novo Cliente</button>
            <button class="btn btn-sm btn-outline-light" @click="toggleView">
                {{ viewMode === 'table' ? 'Ver Board' : 'Ver Tabela' }}
            </button>
        </div>

        <component :is="viewMode === 'table' ? OmniTable : OmniBoard" :items="clients.items" :schema="schema" editable
            @update="onUpdate" @delete="clients.remove" />
    </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import OmniTable from '@/components/ui/OmniTable.vue'
import OmniBoard from '@/components/ui/OmniBoard.vue'
import { useClientsStore } from '@/stores/clients'
import { useClientSchema } from '@/schemas/clientSchema'

definePageMeta({ middleware: ['auth', 'approved'] })

const clients = useClientsStore()
const viewMode = ref<'table' | 'board'>('table')
const schema = computed(() => useClientSchema())

const toggleView = () => (viewMode.value = viewMode.value === 'table' ? 'board' : 'table')
const onUpdate = ({ id, patch }: any) => clients.update(id, patch)
const onCreate = async () => {
    await clients.create({ nome: 'Novo Cliente', email: `cliente${Date.now()}@teste.com` })
}

onMounted(() => clients.load())
</script>
