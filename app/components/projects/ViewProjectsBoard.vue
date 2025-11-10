<template>
    <div class="row g-3">
        <div v-for="p in items" :key="p.id" class="col-12 col-md-6 col-lg-4">
            <NxCard>
                <h5 class="mb-1">{{ p.name }}</h5>
                <small class="text-muted">Cliente: {{ p.client?.nome || '—' }}</small><br />
                <small class="text-muted">Responsável: {{ p.user?.name || '—' }}</small>
                <p class="mt-2 small">{{ p.description }}</p>
                <div class="d-flex justify-content-end gap-2">
                    <NxButton size="sm" tone="neutral" @click="$emit('edit', p)">Editar</NxButton>
                    <NxButton size="sm" tone="danger" @click="$emit('delete', p.id)">Excluir</NxButton>
                </div>
            </NxCard>
        </div>
    </div>
</template>

<script setup lang="ts">
import NxCard from '@/components/card/NxCard.vue'
import NxButton from '@/components/buttons/NxButton.vue'
defineProps<{ items: any[] }>()
defineEmits(['edit', 'delete'])
</script>
