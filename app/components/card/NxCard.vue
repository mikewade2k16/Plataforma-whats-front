<script setup lang="ts">
const props = withDefaults(defineProps<{ elevated?: boolean; interactive?: boolean; }>(), {
    elevated: false, interactive: false
});
</script>

<template>
    <section class="nx-card" :class="[{ 'is-elevated': elevated, 'is-interactive': interactive }]">
        <header class="nx-card__hd" v-if="$slots.header">
            <slot name="header" />
        </header>
        <div class="nx-card__bd">
            <slot />
        </div>
        <footer class="nx-card__ft" v-if="$slots.footer">
            <slot name="footer" />
        </footer>
    </section>
</template>

<style scoped lang="scss">
.nx-card {
    background: var(--nx-surface);
    border: 1px solid var(--nx-border);
    border-radius: #{$nx-radius-lg};
    padding: 1rem;
    transition: box-shadow $nx-dur $nx-ease, transform $nx-dur $nx-ease, border-color $nx-dur $nx-ease;

    &.is-elevated {
        box-shadow: $nx-shadow-card;
    }

    &.is-interactive:hover {
        transform: translateY(-2px);
        border-color: var(--nx-primary);
    }
}

.nx-card__hd {
    margin-bottom: .5rem;
    font-weight: 600;
}

.nx-card__ft {
    margin-top: .75rem;
}
</style>
