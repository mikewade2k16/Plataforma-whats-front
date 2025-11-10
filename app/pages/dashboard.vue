<script setup lang="ts">
import NxButton from '~/components/buttons/NxButton.vue'

definePageMeta({ middleware: ['auth', 'approved'] })
</script>

<template>
    <div class="container-fluid">
        <div class="row g-3">
            <div class="col-12 col-xxl-8">
                <div class="nx-card p-3">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <h2 class="h5 m-0">Resumo</h2>
                        <NxButton variant="outline" tone="primary" icon="download" iconPos="left">Exportar</NxButton>
                    </div>
                    <p class="text-muted m-0">Gráfico/visão geral (placeholder).</p>
                    <div
                        style="height:260px;background:rgba(255,255,255,.04);border:1px dashed var(--nx-border);border-radius:12px;">
                    </div>
                </div>
            </div>

            <div class="col-12 col-xxl-4">
                <div class="nx-card p-3">
                    <h2 class="h6 mb-3">Atalhos</h2>
                    <div class="d-flex flex-wrap gap-2">
                        <NxButton icon="plus" iconPos="left">Novo Ticket</NxButton>
                        <NxButton variant="outline" tone="primary" icon="users">Novo Lead</NxButton>
                        <NxButton variant="ghost" tone="primary" icon="calendar">Agenda</NxButton>
                    </div>
                </div>
            </div>

            <div class="col-12 col-xl-6">
                <div class="nx-card p-3">
                    <h2 class="h6 mb-3">Últimos tickets</h2>
                    <ul class="m-0" style="list-style:none;padding:0;">
                        <li v-for="i in 6" :key="i" class="d-flex justify-content-between align-items-center py-2"
                            style="border-top:1px solid var(--nx-border);">
                            <div class="d-flex align-items-center gap-2">
                                <NxButton :avatar="{ initials: 'AN' }" variant="outline" tone="primary">Ana</NxButton>
                                <div>
                                    <div>Ticket #{{ 1200 + i }} • WhatsApp</div>
                                    <small class="text-muted">há {{ i }}h</small>
                                </div>
                            </div>
                            <NxButton :iconOnly="true" variant="ghost" tone="primary" icon="more-vertical"
                                title="Ações" />
                        </li>
                    </ul>
                </div>
            </div>

            <div class="col-12 col-xl-6">
                <div class="nx-card p-3">
                    <h2 class="h6 mb-3">Agenda do dia</h2>
                    <p class="text-muted m-0">Placeholder de agenda.</p>
                    <div
                        style="height:220px;background:rgba(255,255,255,.04);border:1px dashed var(--nx-border);border-radius:12px;">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
