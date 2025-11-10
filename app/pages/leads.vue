<script setup lang="ts">
import { ref } from 'vue'
import NxButton from '~/components/buttons/NxButton.vue'

const q = ref('')
const rows = ref(Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: ['Ana', 'Bruno', 'Caio', 'Duda', 'Eva', 'Felipe', 'Gabi', 'Hugo', 'Iris', 'João', 'Karla', 'Leo'][i],
    source: ['WhatsApp', 'Landing', 'Indicação', 'Instagram'][i % 4],
    status: ['Novo', 'Qualificado', 'Em negociação', 'Ganho', 'Perdido'][i % 5],
})))
</script>

<template>
    <div class="container-fluid">
        <div class="nx-card p-3 mb-3">
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <div class="flex-grow-1" style="min-width:220px;">
                    <div class="nx-search" style="position:relative;">
                        <i class="nx-search__icon"
                            style="position:absolute;left:.6rem;top:50%;transform:translateY(-50%);opacity:.7;">
                            <Icon name="lucide:search" />
                        </i>
                        <input v-model="q" class="form-control" type="search" placeholder="Buscar leads…"
                            style="padding-left:2rem;" />
                    </div>
                </div>
                <NxButton icon="plus">Novo lead</NxButton>
                <NxButton variant="outline" tone="primary" icon="filter">Filtros</NxButton>
                <NxButton variant="ghost" tone="primary" icon="download">Exportar</NxButton>
            </div>
        </div>

        <div class="nx-card p-0">
            <div class="table-responsive">
                <table class="table m-0">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Origem</th>
                            <th>Status</th>
                            <th class="text-end">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="r in rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))" :key="r.id">
                            <td>{{ r.name }}</td>
                            <td>{{ r.source }}</td>
                            <td>
                                <span class="badge" :class="{
                                    'text-bg-primary': r.status === 'Novo',
                                    'text-bg-success': r.status === 'Ganho',
                                    'text-bg-warning': r.status === 'Em negociação',
                                    'text-bg-secondary': r.status === 'Qualificado',
                                    'text-bg-danger': r.status === 'Perdido'
                                }">{{ r.status }}</span>
                            </td>
                            <td class="text-end">
                                <NxButton :iconOnly="true" variant="ghost" tone="primary" icon="edit" title="Editar" />
                                <NxButton :iconOnly="true" variant="ghost" tone="primary" icon="trash-2"
                                    title="Excluir" />
                                <NxButton :iconOnly="true" variant="outline" tone="primary" icon="more-vertical"
                                    title="Mais" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
