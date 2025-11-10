<template>
    <div class="vx-switch d-flex align-items-center gap-2">
        <div class="btn-group">
            <button v-for="v in resolvedViews" :key="v.key" class="btn btn-sm"
                :class="modelValue === v.key ? 'btn-primary' : 'btn-outline-light'"
                @click="$emit('update:modelValue', v.key)" :title="v.label">
                <span v-if="v.icon" class="me-1">{{ v.icon }}</span>{{ v.label }}
            </button>
        </div>

        <button class="btn btn-sm btn-outline-light" @click="$emit('open-config')">
            Configurar
        </button>
    </div>
</template>

<script setup lang="ts">
type ViewKey = 'board' | 'table' | 'chart' | 'calendar'

const props = withDefaults(defineProps<{
    modelValue: ViewKey
    views?: { key: ViewKey; label: string; icon?: string }[]
}>(), {
    views: () => ([
        { key: 'board', label: 'Quadro', icon: '▦' },
        { key: 'table', label: 'Tabela', icon: '▤' },
        { key: 'chart', label: 'Gráfico', icon: '◔' },
        { key: 'calendar', label: 'Calendário', icon: '▣' },
    ])
})

defineEmits<{
    (e: 'update:modelValue', v: ViewKey): void
    (e: 'open-config'): void
}>()

const resolvedViews = props.views
</script>

<style scoped>
.vx-switch .btn-group .btn {
    min-width: 92px
}
</style>
