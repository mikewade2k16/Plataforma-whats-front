<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
definePageMeta({ layout: 'auth', middleware: 'guest' })

const auth = useAuthStore()
const email = ref('')
const msg = ref('')

const onSubmit = async () => {
    if (!email.value) return
    try {
        await auth.forgot(email.value)
        msg.value = 'Se o e-mail existir, enviaremos um link de recuperação.'
    } catch (e: any) {
        msg.value = e?.data?.message || 'Não foi possível processar agora.'
    }
}
</script>

<template>
    <form class="vstack gap-3" @submit.prevent="onSubmit">
        <h1 class="h4 mb-2">Recuperar senha</h1>
        <p class="text-muted">Informe seu e-mail para receber o link.</p>

        <div>
            <label class="form-label">E-mail</label>
            <input v-model.trim="email" type="email" class="form-control" required />
        </div>

        <button class="btn btn-primary" :disabled="auth.loading">
            <span v-if="auth.loading" class="spinner-border spinner-border-sm me-2" />
            Enviar link
        </button>

        <p v-if="msg" class="small mt-3" :class="msg.includes('Não') ? 'text-danger' : 'text-success'">{{ msg }}</p>
        <p class="mb-0 small mt-2">
            <NuxtLink to="/login">Voltar ao login</NuxtLink>
        </p>
    </form>
</template>
