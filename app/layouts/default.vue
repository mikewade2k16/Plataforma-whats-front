<script setup lang="ts">
import NxHeader from '~/components/layout/NxHeader.vue'
import NxSidebar from '~/components/layout/NxSidebar.vue'
</script>

<template>
    <div class="nx-shell">
        <NxSidebar />
        <div class="nx-main">
            <NxHeader />
            <main class="nx-content">
                <NuxtPage />
            </main>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "~/assets/scss/_tokens.scss" as *;

.nx-shell {
    display: flex;
    min-height: 100dvh;
    background: var(--nx-bg);
}

.nx-main {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.nx-content {
    padding: 1rem;

    @media (min-width: 992px) {
        padding: 1.25rem 1.5rem;
    }

    /* cards base */
    :where(.nx-card, .card) {
        background: var(--nx-surface);
        border: 1px solid var(--nx-border);
        border-radius: $nx-radius-lg;
    }
}

.nx-content{
  padding: clamp(.75rem, 1.5vw, 1.5rem);
}

</style>
