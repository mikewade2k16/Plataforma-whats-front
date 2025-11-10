<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ (e: 'close'): void }>();
function close() { open.value = false; emit('close'); }
</script>

<template>
    <teleport to="body">
        <div v-if="open" class="nx-overlay" @click.self="close">
            <div class="nx-modal" role="dialog" aria-modal="true">
                <header class="nx-modal__hd">
                    <slot name="header" />
                </header>
                <div class="nx-modal__bd">
                    <slot />
                </div>
                <footer class="nx-modal__ft">
                    <slot name="footer" />
                </footer>
                <button class="nx-modal__close" @click="close" aria-label="Fechar">×</button>
            </div>
        </div>
    </teleport>
</template>

<style scoped lang="scss">
.nx-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .45);
    display: grid;
    place-items: center;
    z-index: $z-modal;
}

.nx-modal {
    width: min(640px, 92vw);
    background: var(--nx-surface-2);
    border: 1px solid var(--nx-border);
    border-radius:#{$nx-radius-lg};
    box-shadow: $nx-shadow-pop;
    padding: 1rem 1rem 0;
    position: relative;
}

.nx-modal__ft {
    padding: 1rem 0;
    display: flex;
    justify-content: flex-end;
    gap: .5rem;
}

.nx-modal__close {
    position: absolute;
    right: .5rem;
    top: .25rem;
    border: 0;
    background: transparent;
    color: var(--nx-muted);
    font-size: 1.6rem;
    cursor: pointer;
}
</style>
