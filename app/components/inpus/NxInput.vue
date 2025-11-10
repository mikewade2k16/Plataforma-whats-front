<script setup lang="ts">
const model = defineModel<string | number>({ default: '' });
const props = withDefaults(defineProps<{
    label?: string; type?: string; placeholder?: string;
    error?: string; hint?: string; required?: boolean;
}>(), { type: 'text' });
const id = useId();
</script>

<template>
    <label class="nx-field">
        <span v-if="label" class="nx-field__label">
            {{ label }} <span v-if="required" aria-hidden="true" style="opacity:.6">*</span>
        </span>
        <input :id="id" class="nx-input" :type="type" :placeholder="placeholder" v-model="model" :aria-invalid="!!error"
            :aria-describedby="error ? `${id}-err` : undefined" />
        <small v-if="hint && !error" class="nx-field__hint">{{ hint }}</small>
        <small v-if="error" class="nx-field__error" :id="`${id}-err`">{{ error }}</small>
    </label>
</template>

<style scoped lang="scss">
.nx-field {
    display: flex;
    flex-direction: column;
    gap: .35rem;
}

.nx-field__label {
    font-weight: 600;
    color: var(--nx-muted);
}

.nx-input {
    background: var(--nx-surface);
    color: var(--nx-fg);
    border: 1px solid var(--nx-border);
    border-radius: #{$nx-radius-md};
    padding: .65rem .8rem;
    outline: none;
    transition: border-color $nx-dur $nx-ease, box-shadow $nx-dur $nx-ease;

    &:focus {
        border-color: var(--nx-primary);
        box-shadow: 0 0 0 3px rgba(18, 178, 193, .2);
    }

    &[aria-invalid="true"] {
        border-color: var(--nx-danger);
    }
}

.nx-field__hint {
    color: var(--nx-muted);
}

.nx-field__error {
    color: var(--nx-danger);
}
</style>
