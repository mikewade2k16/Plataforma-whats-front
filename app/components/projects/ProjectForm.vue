<template>
    <NxModal v-model="show" title="Novo Projeto">
        <form @submit.prevent="save">
            <div class="grid gap-2">
                <NxInput v-model="form.name" label="Nome do projeto" required />
                <NxInput v-model="form.status" label="Status" />
                <NxInput v-model="form.type_project" label="Tipo" />
                <NxInput v-model="form.category" label="Categoria" />
                <NxInput v-model="form.segment" label="Segmento" />
                <NxInput v-model="form.goal" label="Objetivo" />
                <NxInput v-model="form.date_project" label="Data" type="date" />
                <NxInput v-model="form.description" label="Descrição" type="textarea" />
            </div>
            <div class="text-end mt-3">
                <NxButton tone="primary" type="submit">Salvar</NxButton>
            </div>
        </form>
    </NxModal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import NxModal from '@/components/modal/NxModal.vue'
import NxInput from '@/components/inpus/NxInput.vue'
import NxButton from '@/components/buttons/NxButton.vue'
import { useProjectsStore } from '@/stores/projects'

const show = ref(false)
const projects = useProjectsStore()
const form = reactive({
    name: '',
    client_id: 1,
    user_id: 1,
    status: '',
    type_project: '',
    category: '',
    segment: '',
    goal: '',
    description: '',
    date_project: ''
})

const save = async () => {
    await projects.create(form)
    show.value = false
    Object.keys(form).forEach(k => (form[k] = ''))
}

defineExpose({ show })
</script>
