<template>
    <teleport to="body">
        <div class="ms-wrap" v-show="wrapShow" :class="{ 'ms-side': mode === 'side' }">
            <div class="ms-backdrop"></div>

            <div ref="panel" class="ms-panel" :class="panelClass" @mousedown.stop>
                <div class="ms-header">
                    <div class="ms-title">
                        <slot name="title"><strong>{{ title }}</strong></slot>
                    </div>
                    <div class="ms-actions">
                        <slot name="actions"></slot>
                        <button class="icon-btn" @click="emitClose" title="Fechar"><i class="i-x"></i></button>
                    </div>
                </div>

                <div class="ms-body">
                    <slot />
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
    open: boolean
    mode?: 'center' | 'side'
    title?: string
}>(), {
    mode: 'center',
    title: ''
})
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>()

const wrapShow = ref(false)
const state = ref<'closed' | 'opening' | 'open' | 'closing'>('closed')
const ANIM_MS = 260
const panel = ref<HTMLElement | null>(null)

const panelClass = computed(() => ({
    'ms-open': state.value === 'open',
    'ms-opening': state.value === 'opening',
    'ms-closing': state.value === 'closing',
}))

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
const doubleRaf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

function emitClose() { emit('update:open', false) }
function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && props.open) emitClose() }

watch(() => props.open, async v => {
    if (v) {
        wrapShow.value = true
        state.value = 'opening'
        await nextTick(); await doubleRaf()
        state.value = 'open'
    } else {
        if (state.value === 'closed') return
        state.value = 'closing'
        await wait(ANIM_MS)
        wrapShow.value = false
        state.value = 'closed'
    }
}, { immediate: true })

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped lang="scss">
.ms-wrap {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: grid;
    place-items: center;
    pointer-events: none;
}

.ms-backdrop {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.ms-side {
    place-items: stretch end;
}

.ms-panel {
    pointer-events: auto;
    width: min(920px, 92vw);
    max-height: 88vh;
    background: #11191f;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, .45);
    opacity: 0;
    transform: translateY(8px) scale(.96);
    filter: saturate(.96) blur(.2px);
    transition: opacity .26s cubic-bezier(.22, .61, .36, 1),
        transform .26s cubic-bezier(.22, .61, .36, 1),
        filter .26s ease;
}

.ms-panel.ms-opening,
.ms-panel.ms-open {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: none;
}

.ms-panel.ms-closing {
    opacity: 0;
    transform: translateY(8px) scale(.985);
    filter: saturate(.9) blur(.25px);
}

.ms-side .ms-panel {
    width: min(40vw, 96vw);
    max-height: 100vh;
    height: 100vh;
    border-radius: 0;
    transform: translateX(24px);
    transition: opacity .26s ease, transform .26s cubic-bezier(.22, .61, .36, 1);
}

.ms-side .ms-panel.ms-opening,
.ms-side .ms-panel.ms-open {
    opacity: 1;
    transform: translateX(0);
}

.ms-side .ms-panel.ms-closing {
    opacity: 0;
    transform: translateX(24px);
}

.ms-header {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, .08);
}

.ms-title {
    flex: 1 1 auto;
}

.ms-actions {
    display: flex;
    align-items: center;
    gap: .25rem;
}

.icon-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, .18);
    border-radius: 10px;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
}

.i-x::before {
    content: "✕";
    font-size: 14px;
}

.ms-body {
    padding: 1rem;
    overflow: auto;
    max-height: calc(88vh - 54px);
}

.ms-side .ms-body {
    max-height: calc(100vh - 54px);
}
</style>
