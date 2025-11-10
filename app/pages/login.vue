<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
definePageMeta({ layout: 'auth', middleware: 'guest' })

const auth = useAuthStore()
const form = reactive({ email: '', password: '' })
const show = ref(false)

const onSubmit = async () => {
    if (!form.email || !form.password) return
    try {
        await auth.login(form)
        // se usuário não aprovado, manda pra pending
        if (!auth.isApproved) return navigateTo('/pending-approval')
        return navigateTo('/')
    } catch { }
}
</script>

<template>
    <form class="vstack gap-3" @submit.prevent="onSubmit">
        <h4 class="text-center mb-1 mt-0">Entrar</h4>
        <p class=" text-center text-muted mb-2 mt-0">Acesse sua conta.</p>

        <div class="d-flex flex-column mb-2">
            <label class="form-label mb-1">E-mail</label>
            <input v-model.trim="form.email" type="email" class="form-control" required />
        </div>

        <div class="d-flex flex-column mb-2">
            <label class="form-label mb-1">Senha</label>
            <div class="input-group w-100">
                <input :type="show ? 'text' : 'password'" v-model="form.password" class="form-control" required
                    minlength="6" />
                <button style="margin-left: 5px;" class="btn btn-outline-secondary ml-5" type="button"
                    @click="show = !show">
                    {{ show ? 'Ocultar' : 'Mostrar' }}
                </button>
            </div>
        </div>
        <div class="d-flex flex-column">
            <button class="btn btn-primary mb-2" :disabled="auth.loading">
                <span v-if="auth.loading" class="spinner-border spinner-border-sm me-2" />
                Entrar
            </button>
            <NuxtLink to="/forgot-password" class="small">Esqueci minha senha</NuxtLink>

        </div>

        <p class="mb-0 small">Novo por aqui? <NuxtLink to="/register">Crie sua conta</NuxtLink>
        </p>

        <p v-if="auth.error" class="text-danger small mt-2">{{ auth.error }}</p>
    </form>
</template>

<style scoped lang="scss">
@use "~/assets/scss/_tokens.scss" as *;

.form-control {
    width: 100% !important;
    background: transparent !important;
    border-radius: 5px;
    min-height: 30px;
    border: 1px solid var(--nx-primary);
    box-shadow: none;
    color: var(--nx-fg);

    &:focus {
        box-shadow: none !important;
        border: 1px solid var(--nx-primary) !important;
    }
}
</style>
