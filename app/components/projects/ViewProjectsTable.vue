<template>
    <table class="table table-striped table-dark table-sm align-middle">
        <thead>
            <tr>
                <th>Nome</th>
                <th>Cliente</th>
                <th>Usuário</th>
                <th>Status</th>
                <th>Data</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="p in items" :key="p.id">
                <td>{{ p.name }}</td>
                <td>{{ p.client?.nome }}</td>
                <td>{{ p.user?.name }}</td>
                <td>{{ p.status }}</td>
                <td>{{ p.date_project }}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-light me-2" @click="$emit('edit', p)">Editar</button>
                    <button class="btn btn-sm btn-outline-danger" @click="$emit('delete', p.id)">Excluir</button>
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script setup lang="ts">
defineProps<{ items: any[] }>()
defineEmits(['edit', 'delete'])
</script>
