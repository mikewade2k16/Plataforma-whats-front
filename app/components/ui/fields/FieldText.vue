<!-- app/components/ui/fields/FieldText.vue -->
<template>
    <input type="text" class="form-control form-control-sm" v-model="model" />
</template>

<script setup lang="ts">
const model = defineModel()
</script>
