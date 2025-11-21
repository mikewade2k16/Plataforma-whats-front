<template>
    <teleport to="body">
        <div v-show="wrapShow" class="tm-wrap" :class="{ 'tm-side': mode === 'side' }">
            <div class="tm-backdrop"></div>

            <div v-if="open" ref="panel" class="tm-panel" :class="panelClass" @mousedown.stop>
                <!-- HEADER (idêntico ao TaskModal) -->
                <div class="tm-header">
                    <div class="tm-title"><strong>Configurar visualização</strong></div>
                    <div class="tm-actions">
                        <div class="tm-menu">
                            <button class="icon-btn" @click="menuOpen = !menuOpen" title="Visualização">
                                <i class="i-gear"></i>
                            </button>
                            <div v-if="menuOpen" class="tm-pop" @mousedown.stop>
                                <div class="tm-pop-title">Visualização</div>
                                <label class="tm-option" @click="setModeAndClose('side')">
                                    <input type="radio" name="cfgview" :checked="mode === 'side'"> Modo lado a lado
                                </label>
                                <label class="tm-option" @click="setModeAndClose('center')">
                                    <input type="radio" name="cfgview" :checked="mode === 'center'"> Modo centralizado
                                </label>
                            </div>
                        </div>
                        <button class="icon-btn" @click="minimized = !minimized" title="Minimizar">
                            <i class="i-min"></i>
                        </button>
                        <button class="icon-btn" @click="$emit('update:open', false)" title="Fechar (Esc)">
                            <i class="i-x"></i>
                        </button>
                    </div>
                </div>

                <!-- BODY -->
                <div class="tm-body" :class="{ 'tm-min': minimized }">
                    <!-- Visibilidade -->
                    <section class="vcp-sec">
                        <div class="vcp-title">Visibilidade da propriedade</div>
                        <div class="vcp-grid">
                            <label v-for="(cfg, key) in localSchema" :key="key" class="vcp-row">
                                <FieldSwitch :model-value="!cfg.hidden"
                                    @update:model-value="val => (localSchema[key].hidden = !val)" />
                                <span class="ms-2">{{ cfg.label || key }}</span>
                            </label>
                        </div>
                    </section>

                    <!-- Filtros -->
                    <section class="vcp-sec">
                        <div class="vcp-title">Filtros</div>
                        <div v-for="(f, i) in localFilters" :key="i" class="d-flex gap-2 mb-2">
                            <select v-model="f.field" class="form-select form-select-sm" style="width:160px">
                                <option :value="''" disabled>Campo…</option>
                                <option v-for="(cfg, key) in localSchema" :key="key" :value="key">{{ cfg.label || key }}
                                </option>
                            </select>
                            <select v-model="f.op" class="form-select form-select-sm" style="width:140px">
                                <option value="is">é</option>
                                <option value="contains">contém</option>
                                <option value="gt">&gt;</option>
                                <option value="lt">&lt;</option>
                                <option value="is_set">está definido</option>
                            </select>
                            <input v-model="f.value" class="form-control form-control-sm" placeholder="valor" />
                            <button class="btn btn-sm btn-outline-danger" @click="removeFilter(i)">Remover</button>
                        </div>
                        <button class="btn btn-sm btn-outline-light" @click="addFilter">+ Adicionar filtro</button>
                    </section>

                    <!-- Ordenação -->
                    <section class="vcp-sec">
                        <div class="vcp-title">Ordenar</div>
                        <div v-for="(s, i) in localSorters" :key="i" class="d-flex gap-2 mb-2">
                            <select v-model="s.field" class="form-select form-select-sm" style="width:180px">
                                <option :value="''" disabled>Campo…</option>
                                <option v-for="(cfg, key) in localSchema" :key="key" :value="key">{{ cfg.label || key }}
                                </option>
                            </select>
                            <select v-model="s.dir" class="form-select form-select-sm" style="width:120px">
                                <option value="asc">Asc</option>
                                <option value="desc">Desc</option>
                            </select>
                            <button class="btn btn-sm btn-outline-danger" @click="removeSorter(i)">Remover</button>
                        </div>
                        <button class="btn btn-sm btn-outline-light" @click="addSorter">+ Adicionar ordem</button>
                    </section>

                    <div class="d-flex justify-content-end gap-2 mt-3">
                        <button class="btn btn-sm btn-outline-light"
                            @click="$emit('update:open', false)">Cancelar</button>
                        <button class="btn btn-sm btn-primary" @click="apply">Aplicar</button>
                    </div>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import FieldSwitch from '@/components/ui/fields/FieldSwitch.vue'

const props = defineProps<{
    open: boolean
    schema: Record<string, any>
    filters: any[]
    sorters: any[]
}>()

const emit = defineEmits<{
    (e: 'update:open', v: boolean): void
    (e: 'apply', payload: { schema: any; filters: any[]; sorters: any[] }): void
}>()

/* ======= Modal chrome compatível com TaskModal ======= */
const wrapShow = ref(false)
const minimized = ref(false)
const menuOpen = ref(false)
const mode = ref<'center' | 'side'>((process.client ? (localStorage.getItem('config_modal_mode') as any) : 'center') || 'center')

const state = ref<'closed' | 'opening' | 'open' | 'closing'>('closed')
const panel = ref<HTMLElement | null>(null)
const panelClass = computed(() => ({
    'tm-open': state.value === 'open',
    'tm-opening': state.value === 'opening',
    'tm-closing': state.value === 'closing',
    'tm-min': minimized.value,
}))
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
const doubleRaf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

watch(() => props.open, async v => {
    if (v) {
        wrapShow.value = true
        state.value = 'opening'
        await nextTick(); await doubleRaf()
        state.value = 'open'
    } else {
        if (state.value === 'closed') return
        state.value = 'closing'
        await wait(260)
        wrapShow.value = false
        state.value = 'closed'
    }
})

function setModeAndClose(m: 'center' | 'side') {
    mode.value = m
    if (process.client) localStorage.setItem('config_modal_mode', m)
    menuOpen.value = false
}

/* ESC para fechar */
function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && props.open) emit('update:open', false) }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

/* ======= Estado editável ======= */
const localSchema = reactive<Record<string, any>>({})
const localFilters = reactive<any[]>([])
const localSorters = reactive<any[]>([])

function syncLocals() {
    Object.keys(localSchema).forEach(k => delete (localSchema as any)[k])
    Object.entries(props.schema || {}).forEach(([k, v]) => (localSchema as any)[k] = { ...v })

    localFilters.splice(0); props.filters?.forEach(f => localFilters.push({ ...f }))
    localSorters.splice(0); props.sorters?.forEach(s => localSorters.push({ ...s }))
}
watch(() => props.open, v => v && syncLocals(), { immediate: true })

function addFilter() { localFilters.push({ field: '', op: 'is', value: '' }) }
function removeFilter(i: number) { localFilters.splice(i, 1) }
function addSorter() { localSorters.push({ field: '', dir: 'asc' }) }
function removeSorter(i: number) { localSorters.splice(i, 1) }

function apply() {
    emit('apply', {
        schema: JSON.parse(JSON.stringify(localSchema)),
        filters: JSON.parse(JSON.stringify(localFilters)),
        sorters: JSON.parse(JSON.stringify(localSorters)),
    })
}
</script>

<style scoped>
/* reaproveitando exatamente as classes do TaskModal */
.tm-wrap {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: grid;
    place-items: center;
    pointer-events: none;
}

.tm-backdrop {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.tm-side {
    place-items: stretch end;
}

.tm-panel {
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
    transition: opacity .26s cubic-bezier(.22, .61, .36, 1), transform .26s cubic-bezier(.22, .61, .36, 1), filter .26s ease;
}

.tm-panel.tm-opening,
.tm-panel.tm-open {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: none
}

.tm-panel.tm-closing {
    opacity: 0;
    transform: translateY(8px) scale(.985);
    filter: saturate(.9) blur(.25px)
}

.tm-panel.tm-min {
    transform: translateY(18px) scale(.97);
    opacity: .92
}

.tm-side .tm-panel {
    width: min(40vw, 96vw);
    max-height: 100vh;
    height: 100vh;
    border-radius: 0;
    transform: translateX(24px);
    transition: opacity .26s ease, transform .26s cubic-bezier(.22, .61, .36, 1)
}

.tm-side .tm-panel.tm-opening,
.tm-side .tm-panel.tm-open {
    opacity: 1;
    transform: translateX(0)
}

.tm-side .tm-panel.tm-closing {
    opacity: 0;
    transform: translateX(24px)
}

/* header e menu */
.tm-header {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, .08)
}

.tm-title {
    flex: 1 1 auto
}

.tm-actions {
    display: flex;
    align-items: center;
    gap: .25rem
}

.icon-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, .18);
    border-radius: 10px;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center
}

.i-gear::before {
    content: "⚙";
    font-size: 14px
}

.i-min::before {
    content: "▁";
    font-size: 14px
}

.i-x::before {
    content: "✕";
    font-size: 14px
}

.tm-menu {
    position: relative
}

.tm-pop {
    position: absolute;
    right: 0;
    top: 38px;
    min-width: 220px;
    background: #0e141a;
    border: 1px solid rgba(255, 255, 255, .12);
    border-radius: 12px;
    padding: .5rem;
    box-shadow: 0 8px 30px rgba(0, 0, 0, .35);
    z-index: 2
}

.tm-pop-title {
    font-size: .8rem;
    opacity: .7;
    margin-bottom: .25rem
}

.tm-option {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .35rem .4rem;
    border-radius: 8px;
    cursor: pointer
}

.tm-option:hover {
    background: rgba(255, 255, 255, .06)
}

/* corpo da config */
.tm-body {
    padding: 1rem;
    overflow: auto;
    max-height: calc(88vh - 54px)
}

.vcp-sec {
    margin-top: 12px
}

.vcp-title {
    font-size: .9rem;
    opacity: .8;
    margin-bottom: 6px
}

.vcp-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(180px, 1fr));
    gap: 6px
}

.vcp-row {
    display: flex;
    align-items: center;
    padding: 4px 6px;
    border-radius: 8px
}

.vcp-row:hover {
    background: rgba(255, 255, 255, .05)
}
</style>
