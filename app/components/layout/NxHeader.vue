<script setup lang="ts">
import NxButton from '~/components/buttons/NxButton.vue'
import LogoutButton from '~/components/buttons/LogoutButton.vue'
import { useSidebarCollapsed } from '~/composables/useSidebar'
import { useTheme } from '~/composables/useTheme'
import AuthExpiryBadge from '~/components/dev/AuthExpiryBadge.vue'
import DevAuthControls from '~/components/dev/DevAuthControls.vue'

const collapsed = useSidebarCollapsed()
function toggleSidebar() { collapsed.value = !collapsed.value }

const { theme, toggleTheme } = useTheme()
</script>

<template>
    <header class="nx-header">
        <div class="nx-header__left">
            <NxButton :iconOnly="true" variant="ghost" tone="primary" icon="menu" title="Menu" @click="toggleSidebar" />
            <NuxtLink to="/" class="nx-logo">Nexo <span>One</span></NuxtLink>

            <LogoutButton />
        </div>

        <div class="nx-header__center">
            <AuthExpiryBadge />
             <DevAuthControls />
            <div class="nx-search">
                <i class="nx-search__icon">
                    <Icon name="lucide:search" />
                </i>
                <input type="search" placeholder="Buscar…" />
            </div>
        </div>

        <div class="nx-header__right">
            <NxButton :iconOnly="true" variant="ghost" tone="primary" :icon="theme === 'dark' ? 'sun' : 'moon'"
                title="Tema" @click="toggleTheme" />
            <NxButton :iconOnly="true" variant="ghost" tone="primary" icon="bell" title="Notificações" :badge="3" />
            <NxButton :iconOnly="true" variant="ghost" tone="primary" icon="settings" title="Configurações" />
            <NxButton variant="outline" tone="primary" :avatar="{ initials: 'AN' }">Ana</NxButton>
        </div>
    </header>
</template>

<style scoped lang="scss">
@use "~/assets/scss/_tokens.scss" as *;

.nx-header {
    position: sticky;
    top: 0;
    z-index: $z-sticky;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    align-items: center;
    height: 64px;
    padding: 0 1rem;
    background: var(--nx-surface);
    border-bottom: 1px solid var(--nx-border);
}

.nx-header__right {
    justify-content: center;
    align-items: center;
    display: flex;
}

/* …resto do header… */
@media (max-width: 1200px) {
    .nx-search {
        min-width: 280px;
    }
}

@media (max-width: 992px) {
    .nx-header {
        gap: .6rem;
        padding: 0 .75rem;
    }

    .nx-search {
        min-width: 220px;
    }

    .nx-header__right :deep(.nx-btn.is-icon-only) {
        padding: .5rem;
    }
}

@media (max-width: 576px) {

    /* iPhone SE / pequenos */
    .nx-search {
        display: none;
    }

    /* esconde busca no topo para ganhar espaço */
    .nx-header {
        grid-template-columns: auto 1fr auto;
    }
}
</style>
