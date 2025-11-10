<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()

async function signOut() {
    await auth.logout()
    return navigateTo('/login')
}
</script>

<template>
    <button class="btn btn-sm btn-outline-danger" @click="signOut">
        Sair
    </button>
</template>
