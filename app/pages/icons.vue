<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Icon } from '@iconify/vue'
import lucide from '@iconify-json/lucide/icons.json'
import simple from '@iconify-json/simple-icons/icons.json'
import NxButton from '~/components/buttons/NxButton.vue'

type Tab = 'ui' | 'brand'
const tab = ref<Tab>('ui')
const q = ref('')

/* Controles visuais */
const size = ref(22)            // 12–40
const stroke = ref(0.5)         // 0.25–3 (UI)
const color = ref('#12b2c1')

/* Dados base */
const uiIcons = (lucide as any).icons || {}
const brandIcons = (simple as any).icons || {}
const uiAll = Object.keys(uiIcons)
const brandAll = Object.keys(brandIcons)

/* Pseudo-categorias por palavra-chave (exemplo inicial; amplie à vontade) */
const pseudoCats = [
    { key: 'All', words: [] },
    { key: 'Arrows', words: ['arrow'] },
    { key: 'Align', words: ['align'] },
    { key: 'Files', words: ['file', 'folder', 'clipboard', 'doc'] },
    { key: 'User & People', words: ['user', 'users', 'person', 'profile'] },
    { key: 'Media', words: ['play', 'pause', 'video', 'mic', 'camera'] },
    { key: 'UI', words: ['menu', 'x', 'plus', 'minus', 'search', 'settings', 'bell', 'star', 'heart'] }
]
const uiCat = ref('All')
const brandCat = ref('All') // normalmente All; Simple Icons não tem categorías

/* Filtro de nomes (busca + pseudo-categoria) */
function withPseudoCategory(list: string[], category: string) {
    if (category === 'All') return list
    const rule = pseudoCats.find(c => c.key === category)
    if (!rule || rule.words.length === 0) return list
    return list.filter(n => rule.words.some(w => n.includes(w)))
}
const filteredUi = computed(() => {
    const s = q.value.trim().toLowerCase()
    const base = withPseudoCategory(uiAll, uiCat.value)
    return s ? base.filter(n => n.includes(s)) : base
})
const filteredBrand = computed(() => {
    const s = q.value.trim().toLowerCase()
    const base = withPseudoCategory(brandAll, brandCat.value) // útil se você quiser agrupar marcas por “x/twitter”, etc.
    return s ? base.filter(n => n.includes(s)) : base
})

/* --- Virtual grid --- */
const container = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const viewportH = ref(0)
const width = ref(0)

/* Tamanho do item (fixo) – ajuste conforme seu design */
const ITEM_H = computed(() => {
    const s = Number(size.value) || 22
    return Math.max(90, s + 70)   // 70 = botão outline + espaçamentos + label
})
const GAP = 16

const cols = computed(() => {
    const w = width.value || 1
    // cards com ~140px (ajuste se quiser mais/menos colunas)
    const est = Math.max(1, Math.floor((w + GAP) / (140 + GAP)))
    return est
})

const list = computed(() => (tab.value === 'ui' ? filteredUi.value : filteredBrand.value))
const rows = computed(() => Math.ceil(list.value.length / cols.value))
 const totalH = computed(() => rows.value * (ITEM_H.value + GAP))

/* Índices visíveis (com buffer) */
const startRow = computed(() => Math.max(0, Math.floor(scrollTop.value / (ITEM_H.value + GAP)) - 3))
 const endRow = computed(() => Math.min(rows.value, Math.ceil((scrollTop.value + viewportH.value) / (ITEM_H.value + GAP)) + 3))

const startIndex = computed(() => startRow.value * cols.value)
const endIndex = computed(() => Math.min(list.value.length, endRow.value * cols.value))
const slice = computed(() => list.value.slice(startIndex.value, endIndex.value))

/* Posição do slice: usamos padding-top para empurrar os itens ao lugar “virtual” */
const padTop = computed(() => startRow.value * (ITEM_H.value + GAP))

/* Observadores de scroll/resize */
function onScroll() {
    if (!container.value) return
    scrollTop.value = container.value.scrollTop
    viewportH.value = container.value.clientHeight
}
function onResize() {
    if (!container.value) return
    width.value = container.value.clientWidth
    viewportH.value = container.value.clientHeight
}
onMounted(() => {
    onResize()
    container.value?.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
})
onBeforeUnmount(() => {
    container.value?.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
})
watch([tab, q, uiCat, brandCat], () => { scrollTop.value = 0; if (container.value) container.value.scrollTop = 0 })

/* Copiar nome curto */
async function copyShort(n: string) {
    try { await navigator.clipboard.writeText(n); toast(`Copiado: ${n}`) }
    catch { toast('Não foi possível copiar') }
}

/* Toast simples */
const toastMsg = ref<string | null>(null); let t: any
function toast(msg: string) { clearTimeout(t); toastMsg.value = msg; t = setTimeout(() => toastMsg.value = null, 1200) }
</script>

<template>
    <div class="container py-3" style="height: calc(100vh - 80px); display:flex; flex-direction:column;">
        <!-- Barra de controles -->
        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <h1 class="h6 m-0">Ícones</h1>

            <div class="btn-group ms-2" role="group">
                <button class="btn btn-sm btn-outline-light" :class="{ active: tab === 'ui' }" @click="tab = 'ui'">UI
                    (Lucide)</button>
                <button class="btn btn-sm btn-outline-light" :class="{ active: tab === 'brand' }"
                    @click="tab = 'brand'">Brand
                    (Simple Icons)</button>
            </div>

            <!-- Pseudo-categorias -->
            <select v-if="tab === 'ui'" v-model="uiCat" class="form-select form-select-sm ms-2" style="width:auto;">
                <option v-for="c in pseudoCats" :key="c.key" :value="c.key">{{ c.key }}</option>
            </select>
            <select v-else v-model="brandCat" class="form-select form-select-sm ms-2" style="width:auto;">
                <option v-for="c in pseudoCats" :key="'b-' + c.key" :value="c.key">{{ c.key }}</option>
            </select>

            <input class="form-control form-control-sm ms-auto" style="width: 260px" type="search" placeholder="Buscar…"
                v-model="q">
        </div>

        <!-- Controles visuais -->
        <div class="row g-3 align-items-center mb-3">
            <div class="col-auto small text-muted">Tamanho</div>
            <div class="col-auto"><input type="range" min="8" max="60" step="1" v-model.number="size"></div>
            <div class="col-auto"><code>{{ size }}px</code></div>

            <div class="col-auto small text-muted">Stroke (UI)</div>
            <div class="col-auto"><input type="range" min="0.25" max="5" step="0.25" v-model.number="stroke"
                    :disabled="tab === 'brand'"></div>
            <div class="col-auto"><code v-if="tab === 'ui'">{{ stroke }}</code><code v-else>—</code></div>

            <div class="col-auto small text-muted">Cor</div>
            <div class="col-auto"><input type="color" v-model="color"
                    style="height:28px;width:40px;padding:0;border:0;background:transparent"></div>
            <div class="col-auto"><code>{{ color }}</code></div>
        </div>

        <!-- Área rolável com virtualização -->
        <div ref="container" class="icons-viewport">
            <div :style="{ height: totalH + 'px', position: 'relative' }">
                <div :style="{ position: 'absolute', top: padTop + 'px', left: 0, right: 0 }">
                    <!-- grid manual por colunas calculadas -->
                    <div class="row g-3" :style="{ marginRight: 0, marginLeft: 0 }">
                        <div v-for="(n, i) in slice" :key="(tab === 'ui' ? 'ui-' : 'brand-') + n + '-' + i" class="col"
                            :style="{
                                flex: `0 0 ${100 / cols}%`,
                                maxWidth: `${100 / cols}%`,
                                height: ITEM_H + 'px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column'
                            }">
                            <NxButton variant="outline" tone="primary" :iconOnly="true" :icon="n"
                                :iconKind="tab === 'ui' ? 'ui' : 'brand'" :iconSize="size" :iconColor="color"
                                :iconStroke="stroke" @click="copyShort(n)" :title="n" />
                            <div class="small mt-2 text-muted text-truncate" style="max-width: 120px;" :title="n">{{ n
                            }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="toastMsg" class="nx-toast">{{ toastMsg }}</div>
    </div>
</template>

<style scoped>
.container {
    color: var(--nx-fg);
}

/* viewport fixa a altura e permite virtualização */
.icons-viewport {
    position: relative;
    overflow: auto;
    flex: 1 1 auto;
    border: 1px solid var(--nx-border);
    border-radius: 12px;
    background: var(--nx-surface);
    padding: 8px;
}

/* APLICA O STROKE nos SVGs do Iconify (Lucide) atravessando o escopo */
:deep(.iconify svg),
:deep(.iconify svg *) {
    stroke-width: var(--nx-icon-stroke) !important;
    /* opcionalmente garantir stroke com a cor atual (Lucide já usa currentColor) */
    /* stroke: currentColor; */
}

.nx-toast {
    position: fixed;
    right: 16px;
    bottom: 16px;
    background: #0b2b32;
    color: #d8f7fb;
    border: 1px solid rgba(255, 255, 255, .12);
    border-radius: 10px;
    padding: .5rem .75rem;
}
</style>
