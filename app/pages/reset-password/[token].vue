<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
definePageMeta({ layout: 'auth', middleware: 'guest' })

const route = useRoute()
const token = computed(() => String(route.params.token || ''))
const auth = useAuthStore()
const form = reactive({ password: '', confirm: '' })
const msg = ref('')

const onSubmit = async () => {
    if (!form.password || form.password.length < 6) {
        msg.value = 'A senha deve ter ao menos 6 caracteres.'; return
    }
    if (form.password !== form.confirm) {
        msg.value = 'As senhas não coincidem.'; return
    }
    try {
        await auth.reset({ token: token.value, password: form.password, password_confirmation: form.confirm })
        msg.value = 'Senha redefinida com sucesso. Você já pode entrar.'
        setTimeout(() => navigateTo('/login'), 1200)
    } catch (e: any) {
        msg.value = e?.data?.message || 'Falha ao redefinir senha.'
    }
}
</script>

<template>
    <form class="vstack gap-3" @submit.prevent="onSubmit">
        <h1 class="h4 mb-2">Definir nova senha</h1>

        <div>
            <label class="form-label">Nova senha</label>
            <input v-model.trim="form.password" type="password" class="form-control" required minlength="6" />
        </div>

        <div>
            <label class="form-label">Confirmar senha</label>
            <input v-model.trim="form.confirm" type="password" class="form-control" required minlength="6" />
        </div>

        <button class="btn btn-primary" :disabled="auth.loading">
            <span v-if="auth.loading" class="spinner-border spinner-border-sm me-2" />
            Redefinir
        </button>

        <p v-if="msg" class="small mt-3" :class="msg.includes('Falha') ? 'text-danger' : 'text-success'">{{ msg }}</p>
    </form>
</template>
