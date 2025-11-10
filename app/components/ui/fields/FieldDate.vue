<!-- app/components/ui/fields/FieldDate.vue -->
<template>
    <input type="date" class="form-control form-control-sm" v-model="model" @blur="ev => emit('blur', ev)"
        @keydown="ev => emit('keydown', ev)" />
</template>

<script setup lang="ts">
const model = defineModel<string | null>({ default: null })
const emit = defineEmits<{
    (e: 'blur', ev: FocusEvent): void
    (e: 'keydown', ev: KeyboardEvent): void
}>()
</script>
