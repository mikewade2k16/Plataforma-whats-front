<!-- app/components/ui/fields/FieldImage.vue -->
<template>
    <div class="d-flex align-items-center gap-2">
        <img v-if="preview" :src="preview" class="img-thumbnail" style="max-height: 60px" alt="Imagem" />
        <input type="file" class="form-control form-control-sm" @change="onChange" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const model = defineModel<string | null>({ default: null })
const preview = ref<string | null>(model.value || null)

const onChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
        preview.value = ev.target?.result as string
        model.value = preview.value         // <- só atualiza quando carregou
    }
    reader.readAsDataURL(file)
}
</script>
