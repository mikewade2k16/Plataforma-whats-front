<template>
    <section class="p-4">
        <div class="d-flex align-items-center gap-3 mb-3">
            <h2 class="m-0">Users</h2>
            <button class="btn btn-sm btn-outline-success" @click="onCreate">+ Novo Usuário</button>
            <button class="btn btn-sm btn-outline-light" @click="toggleView">
                {{ viewMode === 'table' ? 'Ver Board' : 'Ver Tabela' }}
            </button>
        </div>

        <component :is="viewMode === 'table' ? OmniTable : OmniBoard" :items="users.items" :schema="schema" editable
            @update="onUpdate" @delete="users.remove" />
    </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import OmniTable from '@/components/ui/OmniTable.vue'
import OmniBoard from '@/components/ui/OmniBoard.vue'
import { useUsersStore } from '@/stores/users'
import { useUserSchema } from '@/schemas/userSchema'

definePageMeta({ middleware: ['auth', 'approved'] })

const users = useUsersStore()
const viewMode = ref<'table' | 'board'>('table')
const schema = computed(() => useUserSchema())

const toggleView = () => (viewMode.value = viewMode.value === 'table' ? 'board' : 'table')
const onUpdate = ({ id, patch }: any) => users.update(id, patch)

const onCreate = async () => {
    await users.create({
        name: 'Novo Usuário',
        email: `user${Date.now()}@teste.com`,
        status: 'active',
        level: 'manager',
    })
}

onMounted(async () => {
    await users.load()
})
</script>
