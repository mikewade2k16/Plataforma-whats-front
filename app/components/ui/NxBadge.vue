<template>
    <span class="nx-badge" :class="toneClass">
        <slot />
    </span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    tone?: 'neutral' | 'primary' | 'success' | 'warn' | 'danger'
}>(), { tone: 'neutral' })

const toneClass = computed(() => ({
    'is-neutral': props.tone === 'neutral',
    'is-primary': props.tone === 'primary',
    'is-success': props.tone === 'success',
    'is-warn': props.tone === 'warn',
    'is-danger': props.tone === 'danger',
}))
</script>

<style scoped>
.nx-badge {
    display: inline-block;
    padding: .15rem .5rem;
    border-radius: 999px;
    font-size: .75rem;
    border: 1px solid rgba(255, 255, 255, .2);
    opacity: .9
}

.is-neutral {
    background: rgba(255, 255, 255, .08)
}

.is-primary {
    background: rgba(18, 178, 193, .12);
    border-color: rgba(18, 178, 193, .4)
}

.is-success {
    background: rgba(0, 200, 150, .12);
    border-color: rgba(0, 200, 150, .4)
}

.is-warn {
    background: rgba(230, 180, 0, .12);
    border-color: rgba(230, 180, 0, .4)
}

.is-danger {
    background: rgba(235, 80, 80, .12);
    border-color: rgba(235, 80, 80, .4)
}
</style>
