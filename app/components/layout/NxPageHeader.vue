<template>
    <header class="nx-page-header d-flex flex-wrap align-items-center gap-2 mb-3">
        <!-- Título -->
        <h2 class="m-0">{{ title }}</h2>

        <!-- Filtros específicos da página -->
        <slot name="filters" />

        <!-- Busca -->
        <div v-if="showSearch" class="flex-grow-1" style="min-width: 220px;">
            <div class="nx-search position-relative">
                <i class="nx-search__icon position-absolute"
                    style="left:.6rem;top:50%;transform:translateY(-50%);opacity:.7;">
                    <Icon name="lucide:search" />
                </i>
                <input v-model="searchModel" class="form-control" type="search" :placeholder="searchPlaceholder"
                    style="padding-left:2rem;" />
            </div>
        </div>

        <!-- Switcher de visualização (usa NxButton) -->
        <div v-if="showViewSwitcher" class="d-flex flex-wrap gap-1 ms-auto">
            <NxButton size="sm" :variant="viewModel === 'board' ? 'solid' : 'outline'" tone="neutral"
                icon="layout-dashboard" @click="viewModel = 'board'">
                Quadro
            </NxButton>

            <NxButton size="sm" :variant="viewModel === 'table' ? 'solid' : 'outline'" tone="neutral" icon="table-2"
                @click="viewModel = 'table'">
                Tabela
            </NxButton>

            <!-- se quiser voltar gráfico e calendário depois, é só descomentar -->
            <!--
            <NxButton size="sm" :variant="viewModel === 'chart' ? 'solid' : 'outline'" tone="neutral" icon="pie-chart"
                @click="viewModel = 'chart'">
                Gráfico
            </NxButton>

            <NxButton size="sm" :variant="viewModel === 'calendar' ? 'solid' : 'outline'" tone="neutral"
                icon="calendar-days" @click="viewModel = 'calendar'">
                Calendário
            </NxButton>
            -->
        </div>

        <!-- Botão Configurar (abre modal embutido) -->
        <NxButton v-if="showConfig && schema" :iconOnly="true" size="sm" variant="outline" tone="neutral"
            title="Configurar" icon="sliders-horizontal" @click="openConfig" />

        <!-- Ações extras da página (Novo lead, Exportar etc.) -->
        <slot name="actions" />

        <!-- Botões opcionais de recarregar / logout -->
        <NxButton v-if="showReload" size="sm" variant="outline" tone="light" icon="refresh-ccw"
            @click="$emit('reload')">
            Recarregar
        </NxButton>

        <LogoutButton v-if="showLogout" />
    </header>

    <!-- Painel de configuração de visualização (ex-ViewConfigPanel) -->
    <teleport to="body">
        <div v-show="wrapShow" class="tm-wrap" :class="{ 'tm-side': mode === 'side' }">
            <!-- clicar no backdrop fecha o modal -->
            <div class="tm-backdrop" @click="closeConfig"></div>

            <div v-if="configOpen" ref="panel" class="tm-panel" :class="panelClass" @mousedown.stop @click.stop>
                <!-- HEADER do painel -->
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
                                    <input type="radio" name="cfgview" :checked="mode === 'side'">
                                    Modo lado a lado
                                </label>
                                <label class="tm-option" @click="setModeAndClose('center')">
                                    <input type="radio" name="cfgview" :checked="mode === 'center'">
                                    Modo centralizado
                                </label>
                            </div>
                        </div>
                        <button class="icon-btn" @click="minimized = !minimized" title="Minimizar">
                            <i class="i-min"></i>
                        </button>
                        <button class="icon-btn" @click="closeConfig" title="Fechar (Esc)">
                            <i class="i-x"></i>
                        </button>
                    </div>
                </div>

                <!-- BODY -->
                <div class="tm-body" :class="{ 'tm-min': minimized }">
                    <!-- Agrupar por (Board por status/origem/etc) -->
                    <section v-if="groupByOptionsComputed.length" class="vcp-sec">
                        <div class="vcp-title">Agrupar por</div>
                        <select v-model="groupByModel" class="form-select form-select-sm" style="max-width:220px">
                            <option v-for="opt in groupByOptionsComputed" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                    </section>

                    <!-- Visibilidade -->
                    <section class="vcp-sec">
                        <div class="vcp-title">Visibilidade da propriedade</div>
                        <div class="vcp-grid">
                            <label v-for="(cfg, key) in localSchema" :key="key"
                                class="vcp-row flex-column align-items-start">
                                <!-- switch principal (liga/desliga geral) -->
                                <div class="d-flex align-items-center">
                                    <FieldSwitch :model-value="!cfg.hidden"
                                        @update:model-value="val => (localSchema[key].hidden = !val)" />
                                    <span class="ms-2">{{ cfg.label || key }}</span>
                                </div>

                                <!-- visibilidade por tipo de visualização -->
                                <div class="mt-1 ms-4 d-flex gap-3 small text-muted">
                                    <label class="d-flex align-items-center gap-1">
                                        <input type="checkbox" class="form-check-input form-check-input-sm"
                                            :checked="!cfg.views || cfg.views.board !== false"
                                            @change="onToggleViewVisibility(key, 'board', $event)" />
                                        <span>Quadro</span>
                                    </label>

                                    <label class="d-flex align-items-center gap-1">
                                        <input type="checkbox" class="form-check-input form-check-input-sm"
                                            :checked="!cfg.views || cfg.views.table !== false"
                                            @change="onToggleViewVisibility(key, 'table', $event)" />
                                        <span>Tabela</span>
                                    </label>
                                </div>
                            </label>
                        </div>
                    </section>


                    <!-- Filtros -->
                    <section class="vcp-sec">
                        <div class="vcp-title">Filtros</div>
                        <div v-for="(f, i) in localFilters" :key="i" class="d-flex gap-2 mb-2">
                            <select v-model="f.field" class="form-select form-select-sm" style="width:160px">
                                <option :value="''" disabled>Campo…</option>
                                <option v-for="(cfg, key) in localSchema" :key="key" :value="key">
                                    {{ cfg.label || key }}
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
                            <button class="btn btn-sm btn-outline-danger" @click="removeFilter(i)">
                                Remover
                            </button>
                        </div>
                        <button class="btn btn-sm btn-outline-light" @click="addFilter">
                            + Adicionar filtro
                        </button>
                    </section>

                    <!-- Ordenação -->
                    <section class="vcp-sec">
                        <div class="vcp-title">Ordenar</div>
                        <div v-for="(s, i) in localSorters" :key="i" class="d-flex gap-2 mb-2">
                            <select v-model="s.field" class="form-select form-select-sm" style="width:180px">
                                <option :value="''" disabled>Campo…</option>
                                <option v-for="(cfg, key) in localSchema" :key="key" :value="key">
                                    {{ cfg.label || key }}
                                </option>
                            </select>
                            <select v-model="s.dir" class="form-select form-select-sm" style="width:120px">
                                <option value="asc">Asc</option>
                                <option value="desc">Desc</option>
                            </select>
                            <button class="btn btn-sm btn-outline-danger" @click="removeSorter(i)">
                                Remover
                            </button>
                        </div>
                        <button class="btn btn-sm btn-outline-light" @click="addSorter">
                            + Adicionar ordem
                        </button>
                    </section>

                    <div class="d-flex justify-content-end gap-2 mt-3">
                        <button class="btn btn-sm btn-outline-light" @click="closeConfig">
                            Fechar
                        </button>
                        <!-- Aplicar continua existindo, mas tudo já é aplicado automaticamente -->
                        <button class="btn btn-sm btn-primary" @click="applyConfig">
                            Aplicar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
import {
    computed,
    reactive,
    ref,
    watch,
    nextTick,
    onMounted,
    onBeforeUnmount,
} from 'vue'
import NxButton from '@/components/buttons/NxButton.vue'
import LogoutButton from '@/components/buttons/LogoutButton.vue'
import FieldSwitch from '@/components/ui/fields/FieldSwitch.vue'

type ViewMode = 'board' | 'table' | 'chart' | 'calendar'

const props = withDefaults(defineProps<{
    title: string
    view?: ViewMode
    search?: string
    searchPlaceholder?: string
    showViewSwitcher?: boolean
    showSearch?: boolean
    showConfig?: boolean
    showReload?: boolean
    showLogout?: boolean
    schema?: Record<string, any> | null
    filters?: any[]
    sorters?: any[]
    groupBy?: string
    groupByOptions?: Array<{ value: string; label: string }>
}>(), {
    view: 'board',
    search: '',
    searchPlaceholder: 'Buscar…',
    showViewSwitcher: true,
    showSearch: true,
    showConfig: true,
    showReload: true,
    showLogout: true,
    schema: null,
    filters: () => [],
    sorters: () => [],
    groupBy: '',
    groupByOptions: () => [],
})

const emit = defineEmits<{
    (e: 'update:view', v: ViewMode): void
    (e: 'update:search', v: string): void
    (e: 'apply-config', payload: { schema: any; filters: any[]; sorters: any[] }): void
    (e: 'update:groupBy', v: string): void
    (e: 'reload'): void
    (e: 'logout'): void
}>()

/* v-model:view */
const viewModel = computed<ViewMode>({
    get: () => props.view ?? 'board',
    set: v => emit('update:view', v),
})

/* v-model:search */
const searchModel = computed<string>({
    get: () => props.search ?? '',
    set: v => emit('update:search', v),
})

/* v-model:groupBy (Board por ...) */
const groupByModel = computed<string>({
    get: () => props.groupBy || '',
    set: v => emit('update:groupBy', v),
})
const groupByOptionsComputed = computed(
    () => props.groupByOptions ?? []
)

/* ========= Config Panel ========= */
const configOpen = ref(false)
const wrapShow = ref(false)
const minimized = ref(false)
const menuOpen = ref(false)
const mode = ref<'center' | 'side'>(
    (process.client ? (localStorage.getItem('config_modal_mode') as any) : 'center') || 'center',
)

const state = ref<'closed' | 'opening' | 'open' | 'closing'>('closed')
const panel = ref<HTMLElement | null>(null)

const panelClass = computed(() => ({
    'tm-open': state.value === 'open',
    'tm-opening': state.value === 'opening',
    'tm-closing': state.value === 'closing',
    'tm-min': minimized.value,
}))

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const doubleRaf = () =>
    new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
    )

// estado local editável
const localSchema = reactive<Record<string, any>>({})
const localFilters = reactive<any[]>([])
const localSorters = reactive<any[]>([])

function syncLocals() {
    // schema
    Object.keys(localSchema).forEach(k => delete (localSchema as any)[k])

    Object.entries(props.schema || {}).forEach(([k, v]) => {
        const cfg: any = v || {}
            ; (localSchema as any)[k] = {
                ...cfg,
                // clona views se existir (board/table)
                views: cfg.views ? { ...cfg.views } : undefined,
            }
    })

    // filtros
    localFilters.splice(0)
        ; (props.filters || []).forEach(f => localFilters.push({ ...f }))

    // sorters
    localSorters.splice(0)
        ; (props.sorters || []).forEach(s => localSorters.push({ ...s }))
}

watch(configOpen, async v => {
    if (v) {
        syncLocals()
        wrapShow.value = true
        state.value = 'opening'
        await nextTick()
        await doubleRaf()
        state.value = 'open'
    } else {
        if (state.value === 'closed') return
        state.value = 'closing'
        await wait(260)
        wrapShow.value = false
        state.value = 'closed'
    }
})

function openConfig() {
    if (!props.schema) return
    configOpen.value = true
}

function closeConfig() {
    configOpen.value = false
    menuOpen.value = false
}

function setModeAndClose(m: 'center' | 'side') {
    mode.value = m
    if (process.client) {
        localStorage.setItem('config_modal_mode', m)
    }
    menuOpen.value = false
}

/* atalhos de teclado */
function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && configOpen.value) {
        closeConfig()
    }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

/* helpers do painel */
function addFilter() {
    localFilters.push({ field: '', op: 'is', value: '' })
}
function removeFilter(i: number) {
    localFilters.splice(i, 1)
}
function addSorter() {
    localSorters.push({ field: '', dir: 'asc' })
}
function removeSorter(i: number) {
    localSorters.splice(i, 1)
}

function buildPayload() {
    return {
        schema: JSON.parse(JSON.stringify(localSchema)),
        filters: JSON.parse(JSON.stringify(localFilters)),
        sorters: JSON.parse(JSON.stringify(localSorters)),
    }
}

function applyConfig() {
    emit('apply-config', buildPayload())
    closeConfig()
}

/* ====== Aplicar automaticamente sempre que mudar algo ====== */
let applyTimer: ReturnType<typeof setTimeout> | null = null
function scheduleAutoApply() {
    if (!configOpen.value) return
    if (applyTimer) clearTimeout(applyTimer)
    applyTimer = setTimeout(() => {
        emit('apply-config', buildPayload())
    }, 150)
}

function ensureViewsEntry(field: string) {
    if (!localSchema[field]) return
    if (!localSchema[field].views) {
        // garante estrutura reactiva
        ; (localSchema[field] as any).views = { board: true, table: true }
    }
}

function onToggleViewVisibility(field: string, view: 'board' | 'table', ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked
    ensureViewsEntry(field)
        ; (localSchema[field].views as any)[view] = checked
}


watch(localSchema, scheduleAutoApply, { deep: true })
watch(localFilters, scheduleAutoApply, { deep: true })
watch(localSorters, scheduleAutoApply, { deep: true })
</script>

<style scoped>
.nx-page-header {
    padding: .25rem .5rem;
}

/* ====== estilos do painel ====== */
.tm-wrap {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: grid;
    place-items: center;
    /* precisa capturar clique no backdrop */
    pointer-events: auto;
}

.tm-backdrop {
    position: absolute;
    inset: 0;
    background: transparent;
    /* recebe clique para fechar */
    pointer-events: auto;
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
    transition:
        opacity .26s cubic-bezier(.22, .61, .36, 1),
        transform .26s cubic-bezier(.22, .61, .36, 1),
        filter .26s ease;
}

.tm-panel.tm-opening,
.tm-panel.tm-open {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: none;
}

.tm-panel.tm-closing {
    opacity: 0;
    transform: translateY(8px) scale(.985);
    filter: saturate(.9) blur(.25px);
}

.tm-panel.tm-min {
    transform: translateY(18px) scale(.97);
    opacity: .92;
}

.tm-side .tm-panel {
    width: min(40vw, 96vw);
    max-height: 100vh;
    height: 100vh;
    border-radius: 0;
    transform: translateX(24px);
    transition:
        opacity .26s ease,
        transform .26s cubic-bezier(.22, .61, .36, 1);
}

.tm-side .tm-panel.tm-opening,
.tm-side .tm-panel.tm-open {
    opacity: 1;
    transform: translateX(0);
}

.tm-side .tm-panel.tm-closing {
    opacity: 0;
    transform: translateX(24px);
}

/* header e menu */
.tm-header {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, .08);
}

.tm-title {
    flex: 1 1 auto;
}

.tm-actions {
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

.i-gear::before {
    content: "⚙";
    font-size: 14px;
}

.i-min::before {
    content: "▁";
    font-size: 14px;
}

.i-x::before {
    content: "✕";
    font-size: 14px;
}

.tm-menu {
    position: relative;
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
    z-index: 2;
}

.tm-pop-title {
    font-size: .8rem;
    opacity: .7;
    margin-bottom: .25rem;
}

.tm-option {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .35rem .4rem;
    border-radius: 8px;
    cursor: pointer;
}

.tm-option:hover {
    background: rgba(255, 255, 255, .06);
}

/* corpo da config */
.tm-body {
    padding: 1rem;
    overflow: auto;
    max-height: calc(88vh - 54px);
}

.vcp-sec {
    margin-top: 12px;
}

.vcp-title {
    font-size: .9rem;
    opacity: .8;
    margin-bottom: 6px;
}

.vcp-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(180px, 1fr));
    gap: 6px;
}

.vcp-row {
    display: flex;
    align-items: center;
    padding: 4px 6px;
    border-radius: 8px;
}

.vcp-row:hover {
    background: rgba(255, 255, 255, .05);
}
</style>
