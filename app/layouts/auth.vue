<template>
    <div class=" min-vh-100 d-flex align-items-center justify-content-center ">
        <div class="container" style="max-width: 460px;">
            <div class="text-center mb-3">
                <!-- opcional: seu logo 
                <NuxtLink to="/" class="text-decoration-none">
                    <strong class="text-dark">Omnibase</strong>
                </NuxtLink>
                -->
            </div>

            <div class="card shadow-sm border-0">
                <div class="card-body p-4 p-md-4">
                    <slot />
                </div>
            </div>

            <p class="text-center text-muted small mt-3 mb-0">
                © {{ year }} — Seu Projeto
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<style scoped lang="scss">
@use "~/assets/scss/_tokens.scss" as *;

.form-control{
    width: 100% !important;
    background: transparent !important;
}
.body-auth{
   // background:  ;
}

.card{
    background:  var(--nx-surface) ;
}
</style>
