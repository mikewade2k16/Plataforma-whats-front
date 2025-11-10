<!-- components/buttons/NxButton.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Icon as IconifyIcon } from '@iconify/vue'
import * as Lucide from 'lucide-vue-next'

type Variant = 'solid' | 'outline' | 'ghost'
type Tone = 'primary' | 'neutral' | 'success' | 'warn' | 'danger'
type Size = 'sm' | 'md' | 'lg'
type IconKind = 'ui' | 'brand'
type IconPos = 'left' | 'right'
type DropdownType = 'inline' | 'menu' | 'sheet-right'
type Placement =
    | 'bottom-start' | 'bottom-end'
    | 'top-start' | 'top-end'
    | 'right-start' | 'right-end'
    | 'left-start' | 'left-end'

const props = withDefaults(defineProps<{
    variant?: Variant
    tone?: Tone
    size?: Size
    loading?: boolean
    disabled?: boolean
    ariaDisabled?: boolean
    badge?: number | string
    avatar?: { src?: string; initials?: string }
    iconOnly?: boolean
    title?: string
    as?: 'button' | 'a' | 'div'
    href?: string
    target?: string
    rel?: string

    // Ícones
    icon?: string
    iconKind?: IconKind
    iconPos?: IconPos
    iconStroke?: number | string
    iconSize?: number | string
    iconColor?: string

    // Dropdown
    dropdown?: boolean
    dropdownType?: DropdownType
    placement?: Placement
    matchWidth?: boolean
    offset?: number
    closeOnClickOutside?: boolean
    teleport?: boolean

    /** DnD: por padrão não inicia drag. Use :allowDrag="true" se quiser permitir. */
    allowDrag?: boolean
}>(), {
    variant: 'solid',
    tone: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    ariaDisabled: false,
    iconOnly: false,
    as: 'button',

    iconKind: 'ui',
    iconPos: 'left',
    iconStroke: 1,
    iconSize: 18,

    dropdown: false,
    dropdownType: 'menu',      // <- padrão agora
    placement: 'bottom-start',
    matchWidth: false,
    offset: 8,
    closeOnClickOutside: true,
    teleport: true,

    allowDrag: false
})

const emit = defineEmits<{
    (e: 'click', ev: MouseEvent): void
    (e: 'open-change', open: boolean): void
}>()

const wrap = ref<HTMLElement | null>(null) // wrapper relativo (âncora)
const root = ref<HTMLElement | null>(null) // botão
const open = ref(false)

const isDisabled = computed(() => props.disabled || props.loading || props.ariaDisabled)

/* ====== Ícones ====== */
function kebabToPascal(name: string) {
    return name.replace(/^lucide:/, '')
        .split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}
const lucideComp = computed(() => {
    if (!props.icon || props.iconKind !== 'ui') return null
    const key = kebabToPascal(props.icon.includes(':') ? props.icon.split(':')[1] : props.icon)
    // @ts-ignore
    return (Lucide as any)[key] || null
})
const iconifyName = computed(() => {
    if (!props.icon) return null
    if (props.iconKind === 'brand') {
        return props.icon.includes(':') ? props.icon : `simple-icons:${props.icon}`
    }
    return props.icon.includes(':') ? props.icon : `lucide:${props.icon}`
})

/* ====== Interações ====== */
function onClick(e: MouseEvent) {
    if (props.dropdown) {
        open.value = !open.value
        emit('open-change', open.value)
        return
    }
    if (isDisabled.value) { e.preventDefault(); e.stopPropagation(); return }
    emit('click', e)
}
function close() {
    if (!open.value) return
    open.value = false
    emit('open-change', false)
}
function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
}
function onDocClick(e: MouseEvent) {
    if (!props.closeOnClickOutside || !open.value) return
    const w = wrap.value
    if (!w) return
    if (!w.contains(e.target as Node)) close()
}

onMounted(() => {
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('mousedown', onDocClick)
})
onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('mousedown', onDocClick)
})
</script>

<template>
    <!-- Âncora relativa + dnd-ignore por padrão -->
    <span ref="wrap" class="nx-btn-wrap" :class="{ 'dnd-ignore': !allowDrag }">
        <!-- BOTÃO -->
        <component ref="root" :is="as" class="nx-btn" :class="[`v-${variant}`, `t-${tone}`, `s-${size}`, {
            'is-loading': loading, 'is-icon-only': iconOnly, 'is-aria-disabled': ariaDisabled
        }]" :disabled="as === 'button' ? isDisabled : undefined" :href="as === 'a' ? href : undefined"
            :target="as === 'a' ? target : undefined" :rel="as === 'a' ? rel : undefined"
            :aria-disabled="as === 'a' ? String(isDisabled) : undefined" :title="iconOnly ? title : undefined"
            @click="onClick">
            <!-- Avatar -->
            <span v-if="avatar" class="nx-btn__avatar" aria-hidden="true">
                <img v-if="avatar.src" :src="avatar.src" alt="" />
                <span v-else class="nx-btn__avatar-initials">{{ avatar.initials }}</span>
            </span>

            <!-- Ícone ESQ -->
            <span v-if="(icon && iconPos === 'left') || $slots['icon-left']" class="nx-btn__icon -left">
                <component v-if="icon && iconPos === 'left' && lucideComp" :is="lucideComp" class="nx-icon"
                    :size="Number(iconSize)" :color="iconColor" :stroke-width="Number(iconStroke)" />
                <IconifyIcon v-else-if="icon && iconPos === 'left' && iconifyName" class="nx-icon" :icon="iconifyName"
                    :style="{
                        width: (typeof iconSize === 'number' ? iconSize + 'px' : iconSize),
                        height: (typeof iconSize === 'number' ? iconSize + 'px' : iconSize),
                        color: iconColor || undefined
                    }" />
                <slot v-else name="icon-left" />
            </span>

            <!-- Label -->
            <span v-if="$slots.default && !iconOnly" class="nx-btn__label">
                <slot />
            </span>

            <!-- Ícone DIR -->
            <span v-if="(icon && iconPos === 'right') || $slots['icon-right']" class="nx-btn__icon -right">
                <component v-if="icon && iconPos === 'right' && lucideComp" :is="lucideComp" class="nx-icon"
                    :size="Number(iconSize)" :color="iconColor" :stroke-width="Number(iconStroke)" />
                <IconifyIcon v-else-if="icon && iconPos === 'right' && iconifyName" class="nx-icon" :icon="iconifyName"
                    :style="{
                        width: (typeof iconSize === 'number' ? iconSize + 'px' : iconSize),
                        height: (typeof iconSize === 'number' ? iconSize + 'px' : iconSize),
                        color: iconColor || undefined
                    }" />
                <slot v-else name="icon-right" />
            </span>

            <span v-if="badge !== undefined" class="nx-btn__badge" aria-hidden="true">{{ badge }}</span>
            <span v-if="dropdown" class="nx-btn__caret" aria-hidden="true">▾</span>
            <span v-if="loading" class="nx-btn__spinner" aria-hidden="true"></span>

            <!-- DROPDOWN INLINE (mesmo container do botão) -->
            <div v-if="dropdown && open && dropdownType === 'inline'" class="nx-btn__menu-inline" role="menu"
                @click.stop>
                <slot name="menu" />
            </div>
        </component>

        <!-- DROPDOWN MENU ABSOLUTO (ancorado no WRAP) -->
        <div v-if="dropdown && open && dropdownType === 'menu'" class="nx-btn__menu-abs" role="menu"
            :data-placement="placement"
            :style="{ '--dd-offset': (Number(offset) || 0) + 'px', minWidth: matchWidth && root ? root.getBoundingClientRect().width + 'px' : undefined }"
            @click.stop>
            <slot name="menu" />
        </div>

        <!-- SHEET RIGHT (teleport) -->
        <teleport to="body" v-if="dropdown && open && dropdownType === 'sheet-right'">
            <div class="nx-sheet__backdrop" @click="close"></div>
            <aside class="nx-sheet -right" role="dialog" aria-modal="true">
                <div class="nx-sheet__header">
                    <button class="nx-sheet__close" @click="close">✕</button>
                </div>
                <div class="nx-sheet__body">
                    <slot name="menu" />
                </div>
            </aside>
        </teleport>
    </span>
</template>

<style scoped lang="scss">
@use "~/assets/scss/_tokens.scss" as *;

/* --- wrapper relativo e bloqueio de drag por padrão --- */
.nx-btn-wrap {
    position: relative;
    display: inline-block;
}

/* ========================= BOTÃO ========================= */
.nx-btn {
    --pad-y: .6rem;
    --pad-x: 1rem;
    --radius:#{$nx-radius-md};

    position: relative;
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    padding: var(--pad-y) var(--pad-x);
    border-radius: var(--radius);
    border: 1px solid transparent;
    background: var(--nx-surface);
    color: var(--nx-fg);
    cursor: pointer;
    transition: transform $nx-dur $nx-ease, background $nx-dur $nx-ease, border-color $nx-dur $nx-ease, color $nx-dur $nx-ease;

    &.is-aria-disabled {
        opacity: .55;
        cursor: not-allowed;
        pointer-events: auto;
    }

    &.s-sm {
        --pad-y: .4rem;
        --pad-x: .7rem;
    }

    &.s-lg {
        --pad-y: .8rem;
        --pad-x: 1.2rem;
    }

    /* variantes */
    &.v-solid.t-primary {
        background: var(--nx-primary);
        color: #042227;
    }

    &.v-outline.t-primary {
        background: transparent !important;
        border-color: var(--nx-primary);
        color: var(--nx-primary);
    }

    &.v-ghost.t-primary {
        background: transparent !important;
        color: var(--nx-primary);
    }

    &.t-neutral {
        background: var(--nx-surface) !important;
        color: var(--nx-fg) !important;
        border-color: var(--nx-border) !important;
    }

    &:hover:not(.is-loading):not(:disabled) {
        transform: translateY(-1px);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &.is-icon-only {
        padding: .55rem;
    }

    &:disabled {
        opacity: .55;
        cursor: not-allowed;
    }

    .nx-icon {
        width: auto;
        height: auto;
    }

    .nx-btn__icon {
        display: inline-grid;
        place-items: center;
        line-height: 0;
    }

    .nx-btn__label {
        white-space: nowrap;
    }

    .nx-btn__spinner {
        width: 1em;
        height: 1em;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, .45);
        border-top-color: currentColor;
        animation: spin 1s linear infinite;
    }

    .nx-btn__badge {
        position: absolute;
        top: -6px;
        right: -6px;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        border-radius: 999px;
        background: #ff5a5f !important;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        display: grid;
        place-items: center;
        border: 2px solid var(--nx-bg) !important;
    }

    .nx-btn__avatar {
        width: 20px;
        height: 20px;
        border-radius: 999px;
        overflow: hidden;
        background: var(--nx-surface-2) !important;
    }

    .nx-btn__avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .nx-btn__avatar-initials {
        font-size: 12px;
        line-height: 20px;
        text-align: center;
        display: block;
    }

    .nx-btn__caret {
        margin-left: .25rem;
        opacity: .8;
    }

    /* dropdown inline (dentro do botão) */
    .nx-btn__menu-inline {
        position: absolute;
        top: calc(100% + .35rem);
        left: 0;
        background: var(--nx-surface);
        border: 1px solid var(--nx-border);
        border-radius:#{$nx-radius-md};
        box-shadow: $nx-shadow-pop;
        padding: .35rem;
        z-index: $z-overlay;
        min-width: 180px;
    }
}

.nx-btn {
    position: relative;
    overflow: visible;
}

/* ========================= MENU ABSOLUTO ========================= */
.nx-btn__menu-abs {
    position: absolute;
    z-index: $z-overlay;
    background: var(--nx-surface);
    border: 1px solid var(--nx-border);
    border-radius: #{$nx-radius-md};
    box-shadow: $nx-shadow-pop;
    padding: .35rem;

    &[data-placement="bottom-start"] {
        top: calc(100% + var(--dd-offset, 8px));
        left: 0;
        right: auto;
    }

    &[data-placement="bottom-end"] {
        top: calc(100% + var(--dd-offset, 8px));
        right: 0;
        left: auto;
    }

    &[data-placement="top-start"] {
        bottom: calc(100% + var(--dd-offset, 8px));
        left: 0;
        top: auto;
        right: auto;
    }

    &[data-placement="top-end"] {
        bottom: calc(100% + var(--dd-offset, 8px));
        right: 0;
        left: auto;
        top: auto;
    }

    &[data-placement="right-start"] {
        left: calc(100% + var(--dd-offset, 8px));
        top: 0;
        bottom: auto;
    }

    &[data-placement="right-end"] {
        left: calc(100% + var(--dd-offset, 8px));
        bottom: 0;
        top: auto;
    }

    &[data-placement="left-start"] {
        right: calc(100% + var(--dd-offset, 8px));
        top: 0;
        left: auto;
        bottom: auto;
    }

    &[data-placement="left-end"] {
        right: calc(100% + var(--dd-offset, 8px));
        bottom: 0;
        left: auto;
        top: auto;
    }
}

/* ===== Deep: stroke dos SVGs do Iconify (Lucide) ===== */
:deep(.nx-icon svg),
:deep(.nx-icon svg *) {
    stroke-width: var(--nx-icon-stroke, 1) !important;
}

:deep(.nx-icon svg [stroke-linecap]) {
    stroke-linecap: round;
}

:deep(.nx-icon svg [stroke-linejoin]) {
    stroke-linejoin: round;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* ===== Sheet Right ===== */
.nx-sheet__backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .45);
    backdrop-filter: saturate(120%) blur(2px);
    z-index: $z-overlay;
}

.nx-sheet {
    position: fixed;
    top: 0;
    bottom: 0;
    width: 360px;
    background: var(--nx-surface);
    border-left: 1px solid var(--nx-border);
    box-shadow: $nx-shadow-pop;
    z-index: $z-overlay + 1;
    display: flex;
    flex-direction: column;
    transition: transform $nx-dur $nx-ease;
}

.nx-sheet.-right {
    right: 0;
    transform: translateX(0);
}

.nx-sheet__header {
    display: flex;
    justify-content: flex-end;
    padding: .5rem;
    border-bottom: 1px solid var(--nx-border);
}

.nx-sheet__close {
    background: transparent;
    border: 0;
    color: var(--nx-fg);
    cursor: pointer;
    font-size: 18px;
}

.nx-sheet__body {
    padding: 1rem;
    overflow: auto;
}
</style>
