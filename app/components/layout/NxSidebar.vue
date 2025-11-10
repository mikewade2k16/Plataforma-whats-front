<script setup lang="ts">
import NxButton from '~/components/buttons/NxButton.vue'
import * as Lucide from 'lucide-vue-next'
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from '#imports'
import { useSidebarCollapsed } from '~/composables/useSidebar'
import { useUiSettings, type NavItem } from '~/composables/useUiSettings'

const collapsed = useSidebarCollapsed()
const route = useRoute()

const {
    navApplied,
    iconNumOpen, iconNumClosed,
    iconSubNumOpen, iconSubNumClosed,
    iconStrokeOpenNum, iconStrokeClosedNum,
} = useUiSettings()

/** mobile detection */
const isMobile = ref(false)
let mq: MediaQueryList | null = null
function updateMobile(e?: MediaQueryList | MediaQueryListEvent) {
    isMobile.value = e ? e.matches : window.matchMedia('(max-width: 992px)').matches
}
onMounted(() => {
    mq = window.matchMedia('(max-width: 992px)')
    updateMobile(mq)
    mq.addEventListener?.('change', updateMobile)
    window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
    mq?.removeEventListener?.('change', updateMobile)
    window.removeEventListener('keydown', onKey)
})
function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && !collapsed.value && isMobile.value) collapsed.value = true
}
watch([collapsed, isMobile], () => {
    if (process.client) document.documentElement.style.overflow = (!collapsed.value && isMobile.value) ? 'hidden' : ''
})
function toggle() { collapsed.value = !collapsed.value }

/** helpers Lucide */
function kebabToPascal(name: string) {
    return name.replace(/^lucide:/, '').split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}
function lucideComp(name?: string) {
    if (!name) return null
    const key = kebabToPascal(name.includes(':') ? name.split(':')[1] : name)
    // @ts-ignore
    return (Lucide as any)[key] || null
}

/** ativo */
function isActive(to?: string) {
    return !!(to && route.path.startsWith(to))
}

/** tamanho/stroke por estado (desktop colapsado X aberto; mobile sempre aberto) */
function sizes(kind: 'item' | 'sub' | 'chev') {
    const isClosed = collapsed.value && !isMobile.value
    const size =
        kind === 'item'
            ? (isClosed ? iconNumClosed.value : iconNumOpen.value)
            : (isClosed ? iconSubNumClosed.value : iconSubNumOpen.value)
    const stroke = isClosed ? iconStrokeClosedNum.value : iconStrokeOpenNum.value
    return { size, stroke }
}

/** dropdown aberto/fechado por label+index */
const openSet = ref<Set<string>>(new Set())
function keyFor(item: NavItem, idx: number, prefix = '') {
    return `${prefix}${item.label}-${idx}`
}
function toggleGroup(key: string) {
    const s = new Set(openSet.value)
    s.has(key) ? s.delete(key) : s.add(key)
    openSet.value = s
}
function syncOpenByRoute() {
    const set = new Set<string>()
    const check = (items: NavItem[], keyPrefix = '') => {
        items.forEach((it, idx) => {
            const key = `${keyPrefix}${it.label}-${idx}`
            if (it.children?.length) {
                const hasActive = it.children.some(c => c.to && route.path.startsWith(c.to))
                if (hasActive) set.add(key)
                check(it.children, key + '/')
            }
        })
    }
    check(navApplied.value)
    openSet.value = set
}
onMounted(syncOpenByRoute)
watch(() => route.path, syncOpenByRoute)
</script>

<template>
    <div v-if="isMobile && !collapsed" class="nx-backdrop" role="button" aria-label="Fechar navegação"
        @click="collapsed = true" />

    <aside class="nx-sidebar" :class="{ '-collapsed': collapsed }" aria-label="Navegação lateral">
        <div class="nx-sidebar__inner">
            <!-- HEADER -->
            <div class="nx-sidebar__header">
                <NuxtLink to="/" class="nx-brand" :class="{ '-center': collapsed && !isMobile }" aria-label="Início">
                    <span class="nx-brand__logo">N</span>
                    <strong v-show="!collapsed || isMobile" class="nx-brand__text">Nexo <span>One</span></strong>
                </NuxtLink>
                <NxButton :iconOnly="true" variant="ghost" tone="primary" :title="collapsed ? 'Expandir' : 'Recolher'"
                    :icon="isMobile ? (collapsed ? 'menu' : 'x') : (collapsed ? 'chevron-right' : 'chevron-left')"
                    @click="toggle" />
            </div>

            <!-- NAV -->
            <nav class="nx-nav" role="navigation">
                <div class="nx-nav__group">
                    <div class="nx-nav__title" v-show="!collapsed || isMobile">Main</div>

                    <template v-for="(item, i) in navApplied" :key="keyFor(item, i)">
                        <!-- link simples -->
                        <NuxtLink v-if="!item.children" :to="item.to!" class="nx-nav__link"
                            :class="[{ 'is-active': isActive(item.to) }, { '-stack': collapsed && !isMobile }]"
                            @click="isMobile && (collapsed = true)">
                            <i class="nx-nav__icon">
                                <component :is="lucideComp(item.icon)" v-if="lucideComp(item.icon)"
                                    :size="sizes('item').size" :stroke-width="sizes('item').stroke" />
                            </i>
                            <span class="nx-nav__label" v-show="!collapsed || isMobile">{{ item.label }}</span>
                            <small class="nx-nav__caption" v-if="collapsed && !isMobile">{{ item.label }}</small>
                        </NuxtLink>

                        <!-- dropdown inline -->
                        <div v-else class="nx-nav__collapsible" :class="{ '-stack': collapsed && !isMobile }">
                            <button type="button" class="nx-nav__link -button"
                                :class="{ 'is-open': openSet.has(keyFor(item, i)) }"
                                @click="toggleGroup(keyFor(item, i))">
                                <i class="nx-nav__icon">
                                    <component :is="lucideComp(item.icon)" v-if="lucideComp(item.icon)"
                                        :size="sizes('item').size" :stroke-width="sizes('item').stroke" />
                                </i>
                                <span class="nx-nav__label" v-show="!collapsed || isMobile">{{ item.label }}</span>
                                <small class="nx-nav__caption" v-if="collapsed && !isMobile">{{ item.label }}</small>
                                <i class="nx-nav__chev" aria-hidden="true">
                                    <component
                                        :is="lucideComp(openSet.has(keyFor(item, i)) ? 'chevron-down' : 'chevron-right')"
                                        :size="sizes('sub').size" :stroke-width="sizes('sub').stroke" />
                                </i>
                            </button>

                            <transition name="nx-accordion">
                                <ul v-show="openSet.has(keyFor(item, i))" class="nx-subnav" role="list">
                                    <li v-for="(child, ci) in item.children"
                                        :key="keyFor(child, ci, keyFor(item, i) + '/')">
                                        <NuxtLink :to="child.to!" class="nx-subnav__link"
                                            :class="{ 'is-active': isActive(child.to) }"
                                            @click="isMobile && (collapsed = true)">
                                            <i class="nx-subnav__icon">
                                                <component :is="lucideComp(child.icon)" v-if="lucideComp(child.icon)"
                                                    :size="sizes('sub').size" :stroke-width="sizes('sub').stroke" />
                                            </i>
                                            <span class="nx-subnav__label">{{ child.label }}</span>
                                        </NuxtLink>
                                    </li>
                                </ul>
                            </transition>
                        </div>
                    </template>
                </div>
            </nav>
        </div>
    </aside>
</template>

<style  lang="scss">
@use "~/assets/scss/_tokens.scss" as *;

/* z-index local */
$z-drawer: $z-overlay + 1;

.nx-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .45);
    backdrop-filter: saturate(120%) blur(2px);
    z-index: $z-overlay;
}

/* mux das variáveis "current" por estado */
.nx-sidebar {
    --nx-sb-font-current: var(--nx-sb-font-open);
    --nx-sb-caption-font-current: var(--nx-sb-caption-font-open);
    --nx-sb-title-font-current: var(--nx-sb-title-font-open);
    --nx-sb-sub-font-current: var(--nx-sb-sub-font-open);

    --nx-sb-icon-current: var(--nx-sb-icon-open);
    --nx-sb-icon-sub-current: var(--nx-sb-icon-sub-open);
    --nx-sb-icon-stroke-current: var(--nx-sb-icon-stroke-open);

    --nx-sb-item-pad-y-current: var(--nx-sb-item-pad-y-open);
    --nx-sb-item-pad-x-current: var(--nx-sb-item-pad-x-open);
    --nx-sb-gap-current: var(--nx-sb-gap-open);
    --nx-sb-radius-current: var(--nx-sb-radius-open);
    --nx-sb-sub-indent-current: var(--nx-sb-sub-indent-open);
}

.nx-sidebar.-collapsed {
    --nx-sb-font-current: var(--nx-sb-font-closed);
    --nx-sb-caption-font-current: var(--nx-sb-caption-font-closed);
    --nx-sb-title-font-current: var(--nx-sb-title-font-closed);
    --nx-sb-sub-font-current: var(--nx-sb-sub-font-closed);

    --nx-sb-icon-current: var(--nx-sb-icon-closed);
    --nx-sb-icon-sub-current: var(--nx-sb-icon-sub-closed);
    --nx-sb-icon-stroke-current: var(--nx-sb-icon-stroke-closed);

    --nx-sb-item-pad-y-current: var(--nx-sb-item-pad-y-closed);
    --nx-sb-item-pad-x-current: var(--nx-sb-item-pad-x-closed);
    --nx-sb-gap-current: var(--nx-sb-gap-closed);
    --nx-sb-radius-current: var(--nx-sb-radius-closed);
    --nx-sb-sub-indent-current: var(--nx-sb-sub-indent-closed);
}

/* Shell */
.nx-sidebar {
    position: sticky;
    top: 0;
    height: 100dvh;
    box-sizing: border-box;
    overflow: hidden;
    flex: 0 0 auto;
    inline-size: var(--nx-sb-w);
    //width: auto;
    background: var(--nx-surface);
    border-right: 1px solid var(--nx-border);
    transition: inline-size $nx-dur $nx-ease;

    &.-collapsed {
        inline-size: var(--nx-sb-w-collapsed);
    }

    @media (max-width: 992px) {
        position: fixed;
        left: 0;
        top: 0;
        z-index: $z-drawer;
        inline-size: var(--nx-sb-w-mob);
        transform: translateX(0);
        box-shadow: $nx-shadow-pop;
        transition: transform $nx-dur $nx-ease;

        &.-collapsed {
            transform: translateX(-100%);
        }
    }
}

.nx-sidebar__inner {
    padding: 0 .75rem 1rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
}

.nx-sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .25rem .25rem .5rem;
    margin-bottom: .25rem;
    border-bottom: 1px solid var(--nx-border);
    height: 68px;
}

.nx-brand {
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    text-decoration: none;
    color: var(--nx-fg);

    &.-center {
        justify-content: center;
        width: 100%;
    }
}

.nx-brand__logo {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: var(--nx-primary);
    color: #042227;
    display: grid;
    place-items: center;
    font-weight: 900;
}

.nx-brand__text {
    font-weight: 800;
    letter-spacing: .2px;
}

.nx-brand__text span {
    color: var(--nx-primary);
}

.nx-nav {
    padding-top: .5rem;
    overflow: auto;
    height: 100%;
}

.nx-nav__title {
    font-size: var(--nx-sb-title-font-current);
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--nx-muted);
    margin: .5rem .5rem .5rem .75rem;
}

.nx-nav__link {
    display: flex;
    align-items: center;
    gap: var(--nx-sb-gap-current);
    padding: var(--nx-sb-item-pad-y-current) var(--nx-sb-item-pad-x-current);
    margin: .15rem 0;
    color: var(--nx-fg);
    text-decoration: none;
    border-radius: var(--nx-sb-radius-current);
    transition: background $nx-dur $nx-ease, color $nx-dur $nx-ease, padding $nx-dur $nx-ease, gap $nx-dur $nx-ease;
    min-inline-size: 0;
    font-size: var(--nx-sb-font-current);

    &:hover {
        background: rgba(255, 255, 255, .06);
    }

    &.is-active {
        background: rgba(18, 178, 193, .18);
        color: var(--nx-primary);
    }

    .nx-nav__icon {
        width: var(--nx-sb-icon-current);
        height: var(--nx-sb-icon-current);
        display: grid;
        place-items: center;

        :deep(svg) {
            stroke-width: var(--nx-sb-icon-stroke-current);
        }
    }

    &.-stack {
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: .35rem;
        padding: var(--nx-sb-item-pad-y-current) 0;

        .nx-nav__label {
            display: none;
        }

        .nx-nav__caption {
            display: block;
            font-size: var(--nx-sb-caption-font-current);
            line-height: 1;
            color: var(--nx-muted);
            text-align: center;
            max-width: calc(var(--nx-sb-w-collapsed) - 18px);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    &.-button {
        width: 100%;
        background: transparent !important;
        border: 0;
        text-align: left;
        cursor: pointer;

        &:has(.nx-subnav__link.is-active){
            background: var(--nx-primary) !important;
        }

        .nx-nav__chev {
            margin-left: auto;
            opacity: .85;
        }
    }
}

.nx-nav__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.nx-nav__caption {
    display: none;
}

.nx-nav__collapsible {
    &.-stack {
        .nx-nav__link.-button {
            flex-direction: column;
            align-items: center;
            gap: .35rem;
            padding: var(--nx-sb-item-pad-y-current) 0;

            .nx-nav__label {
                display: none;
            }
        }
    }
}

.nx-subnav {
    list-style: none;
    padding: 0;
    margin: .25rem 0 .25rem calc(var(--nx-sb-sub-indent-current) + var(--nx-sb-item-pad-x-current));

    .nx-subnav__link {
        display: flex;
        align-items: center;
        gap: .5rem;
        padding: .4rem .6rem;
        margin: .1rem 0;
        text-decoration: none;
        color: var(--nx-fg);
        border-radius: var(--nx-sb-radius-current);
        font-size: var(--nx-sb-sub-font-current);

        &:hover {
            background: rgba(255, 255, 255, .06);
        }

        &.is-active {
            color: var(--nx-primary);
            background: rgba(18, 178, 193, .14);
        }

        .nx-subnav__icon {
            width: var(--nx-sb-icon-sub-current);
            height: var(--nx-sb-icon-sub-current);
            display: grid;
            place-items: center;

            :deep(svg) {
                stroke-width: var(--nx-sb-icon-stroke-current);
            }
        }
    }
}

/* accordion */
.nx-accordion-enter-from,
.nx-accordion-leave-to {
    opacity: 0;
    max-height: 0;
}

.nx-accordion-enter-to,
.nx-accordion-leave-from {
    opacity: 1;
    max-height: 400px;
}

.nx-accordion-enter-active,
.nx-accordion-leave-active {
    transition: all $nx-dur $nx-ease;
}

/* fade dos textos (título/label) */
.nx-nav__title,
.nx-nav__link span {
    transition: opacity $nx-dur $nx-ease, max-width $nx-dur $nx-ease, margin $nx-dur $nx-ease;
    white-space: nowrap;
    overflow: hidden;
    display: inline-block;
}

.nx-sidebar.-collapsed :where(.nx-nav__title, .nx-nav__link span) {
    opacity: 0;
    max-width: 0;
    margin-left: 0 !important;
}
</style>
