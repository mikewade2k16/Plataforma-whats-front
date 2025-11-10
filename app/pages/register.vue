<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
definePageMeta({ layout: 'auth', middleware: 'guest' })

const auth = useAuthStore()
const form = reactive({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
})

const msg = ref('')

const onSubmit = async () => {
    if (!form.name || !form.email || !form.password) return
    try {
        const res: any = await auth.register(form)
        // se API não loga no register → mandar pro login
        if (!res?.user) {
            msg.value = 'Conta criada! Aguarde aprovação e faça login quando receber confirmação.'
            setTimeout(() => navigateTo('/login'), 1200)
            return
        }
        // Se logou mas está pendente:
        return navigateTo('/pending-approval')
    } catch (e: any) {
        msg.value = e?.data?.message || e?.message || 'Falha no cadastro'
    }
}
</script>

<template>
    <form class="vstack gap-3" @submit.prevent="onSubmit">
        <h1 class="h4 mb-2">Criar conta</h1>
        <p class="text-muted mb-3">Leva menos de 1 minuto.</p>

        <div>
            <label class="form-label">Nome</label>
            <input v-model.trim="form.name" type="text" class="form-control" required />
        </div>

        <div>
            <label class="form-label">E-mail</label>
            <input v-model.trim="form.email" type="email" class="form-control" required />
        </div>

        <div>
            <label class="form-label">Senha</label>
            <input v-model.trim="form.password" type="password" class="form-control" required minlength="6" />
        </div>

        <div>
            <label class="form-label">Confirmar senha</label>
            <input v-model.trim="form.password_confirmation" type="password" class="form-control" required
                minlength="6" />
        </div>

        <button class="btn btn-primary" :disabled="auth.loading">
            <span v-if="auth.loading" class="spinner-border spinner-border-sm me-2" />
            Cadastrar
        </button>

        <p class="mb-0 small mt-3">Já tem conta? <NuxtLink to="/login">Entrar</NuxtLink>
        </p>
        <p v-if="msg" class="small mt-2" :class="msg.includes('Falha') ? 'text-danger' : 'text-success'">{{ msg }}</p>
    </form>
</template>
