<template>
    <div v-if="open" class="nxm-backdrop" @click="onBackdrop">
        <div class="nxm-dialog" role="dialog" aria-modal="true" @click.stop>
            <header class="nxm-header">
                <strong class="nxm-title">
                    <slot name="title">Detalhes</slot>
                </strong>
                <button class="btn btn-sm btn-outline-light" @click="$emit('close')">✕</button>
            </header>

            <section class="nxm-body">
                <slot />
            </section>

            <footer v-if="$slots.footer" class="nxm-footer">
                <slot name="footer" />
            </footer>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean; closeOnBackdrop?: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'close'): void }>()

const open = computed({
    get: () => props.modelValue,
    set: v => emit('update:modelValue', v)
})
const onBackdrop = () => {
    if (props.closeOnBackdrop !== false) { emit('close'); open.value = false }
}
</script>

<style scoped>
.nxm-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050
}

.nxm-dialog {
    width: min(920px, 95vw);
    max-height: 90vh;
    overflow: auto;
    background: #1b1b1b;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, .4)
}

.nxm-header,
.nxm-footer {
    padding: .75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, .1)
}

.nxm-footer {
    border-top: 1px solid rgba(255, 255, 255, .1);
    border-bottom: none
}

.nxm-title {
    font-size: 1rem
}

.nxm-body {
    padding: 1rem
}
</style>
