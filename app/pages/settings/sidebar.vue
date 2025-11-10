<script setup lang="ts">
import NxButton from '~/components/buttons/NxButton.vue'
import { onMounted, ref, nextTick } from 'vue'
import { useUiSettings } from '~/composables/useUiSettings'
import * as Lucide from 'lucide-vue-next'

const {
    sidebarDraft, sidebarApplied,
    applySidebarToEl, applyDraftToApp, resetSidebar,
    navDraft, addItem, removeItem, toggleDropdown, addChild, removeChild
} = useUiSettings()

// preview controls
const previewCollapsed = ref(false)
const previewWidth = ref(1024)  // simular viewport
const previewRoot = ref<HTMLElement | null>(null)

// aplica draft no container do preview
async function refreshPreviewVars() {
    await nextTick()
    const el = previewRoot.value
    if (!el) return

    // helper pra setar var no elemento
    const set = (k: string, v: string | number) => el.style.setProperty(k, String(v))

    const d = sidebarDraft
    const isClosed = previewCollapsed.value

    // Larguras (sempre iguais ao draft)
    set('--nx-sb-w', d.w)
    set('--nx-sb-w-collapsed', d.wCollapsed)
    set('--nx-sb-w-mob', d.wMob)

    // Tipografia (troca entre aberto/fechado)
    set('--nx-sb-font', isClosed ? d.fontClosed : d.fontOpen)
    set('--nx-sb-caption-font', isClosed ? d.captionFontClosed : d.captionFontOpen)
    set('--nx-sb-title-font', isClosed ? d.titleFontClosed : d.titleFontOpen)
    set('--nx-sb-sub-font', isClosed ? d.subFontClosed : d.subFontOpen)

    // Ícones (container) + stroke
    set('--nx-sb-icon', isClosed ? d.iconClosed : d.iconOpen)
    set('--nx-sb-icon-sub', isClosed ? d.iconSubClosed : d.iconSubOpen)
    set('--nx-sb-icon-stroke', isClosed ? d.iconStrokeClosed : d.iconStrokeOpen)

    // Layout
    set('--nx-sb-item-pad-y', isClosed ? d.itemPadYClosed : d.itemPadYOpen)
    set('--nx-sb-item-pad-x', isClosed ? d.itemPadXClosed : d.itemPadXOpen)
    set('--nx-sb-gap', isClosed ? d.gapClosed : d.gapOpen)
    set('--nx-sb-radius', isClosed ? d.radiusClosed : d.radiusOpen)
    set('--nx-sb-sub-indent', isClosed ? d.subIndentClosed : d.subIndentOpen)
}

onMounted(refreshPreviewVars)
watch([sidebarDraft, previewCollapsed], refreshPreviewVars, { deep: true })


// helpers
function px(n: number) { return `${n}px` }

function lucideComp(name?: string) {
    if (!name) return null
    const key = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
    // @ts-ignore
    return (Lucide as any)[key] || null
}

// === sizes iguais ao sidebar real (reagem ao colapsado do preview) ===
const pvIconSize = computed(() =>
    parseInt(previewCollapsed.value ? sidebarDraft.iconClosed : sidebarDraft.iconOpen, 10) || 18
)
const pvIconSubSize = computed(() =>
    parseInt(previewCollapsed.value ? sidebarDraft.iconSubClosed : sidebarDraft.iconSubOpen, 10) || 16
)
const pvStroke = computed(() =>
    Number(previewCollapsed.value ? sidebarDraft.iconStrokeClosed : sidebarDraft.iconStrokeOpen) || 1
)
// opcional: chevron um tiquinho menor
const pvChevSize = computed(() => Math.max(12, (pvIconSize.value - 2)))
</script>

<template>
    <div class="container py-3 settings-sidebar">
        <div class="row">
            <div class=" col-md-6">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <h1 class="h5 m-0">Configurações do Sidebar</h1>
                    <div class="d-flex gap-2">
                        <NxButton variant="outline" tone="primary" icon="rotate-ccw" @click="resetSidebar">Restaurar
                            padrão
                        </NxButton>
                        <NxButton variant="solid" tone="primary" icon="check" @click="applyDraftToApp">Aplicar no app
                        </NxButton>
                    </div>
                </div>

                <!-- ====== CONTROLES DE LARGURA ====== -->
                <div class="nx-card p-3 mb-4">
                    <h2 class="h6 mb-3">Larguras</h2>
                    <div class="row g-3">
                        <div class="col-12 col-md-4">
                            <label class="form-label">Largura (desktop aberto)</label>
                            <input type="range" min="150" max="400" step="2" :value="parseInt(sidebarDraft.w)"
                                @input="sidebarDraft.w = px(($event.target as HTMLInputElement).valueAsNumber); refreshPreviewVars()" />
                            <div><code>{{ sidebarDraft.w }}</code></div>
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">Largura colapsado (desktop)</label>
                            <input type="range" min="40" max="200" step="1" :value="parseInt(sidebarDraft.wCollapsed)"
                                @input="sidebarDraft.wCollapsed = px(($event.target as HTMLInputElement).valueAsNumber); refreshPreviewVars()" />
                            <div><code>{{ sidebarDraft.wCollapsed }}</code></div>
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">Largura (mobile)</label>
                            <input type="range" min="180" max="420" step="2" :value="parseInt(sidebarDraft.wMob)"
                                @input="sidebarDraft.wMob = px(($event.target as HTMLInputElement).valueAsNumber); refreshPreviewVars()" />
                            <div><code>{{ sidebarDraft.wMob }}</code></div>
                        </div>
                    </div>
                </div>

                <!-- ====== TIPOGRAFIA (ABERTO/FECHADO) ====== -->
                <div class="nx-card p-3 mb-4">
                    <h2 class="h6 mb-3">Tipografia</h2>
                    <div class="row g-3">
                        <div class="col-12"><strong>Aberto</strong></div>
                        <div class="col-6 col-md-3">
                            <label class="form-label">Item</label>
                            <input type="number" min="8" max="40" class="form-control"
                                :value="parseInt(sidebarDraft.fontOpen)"
                                @input="sidebarDraft.fontOpen = px(+$event.target.value); refreshPreviewVars()" />
                        </div>
                        <div class="col-6 col-md-3">
                            <label class="form-label">Caption (colapsado usa caption)</label>
                            <input type="number" min="8" max="32" class="form-control"
                                :value="parseInt(sidebarDraft.captionFontOpen)"
                                @input="sidebarDraft.captionFontOpen = px(+$event.target.value); refreshPreviewVars()" />
                        </div>
                        <div class="col-6 col-md-3">
                            <label class="form-label">Título grupo</label>
                            <input type="number" min="8" max="40" class="form-control"
                                :value="parseInt(sidebarDraft.titleFontOpen)"
                                @input="sidebarDraft.titleFontOpen = px(+$event.target.value); refreshPreviewVars()" />
                        </div>
                        <div class="col-6 col-md-3">
                            <label class="form-label">Subitem</label>
                            <input type="number" min="8" max="25" class="form-control"
                                :value="parseInt(sidebarDraft.subFontOpen)"
                                @input="sidebarDraft.subFontOpen = px(+$event.target.value); refreshPreviewVars()" />
                        </div>

                        <div class="col-12 mt-3"><strong>Fechado</strong></div>
                        <div class="col-6 col-md-3">
                            <label class="form-label">Item</label>
                            <input type="number" min="8" max="40" class="form-control"
                                :value="parseInt(sidebarDraft.fontClosed)"
                                @input="sidebarDraft.fontClosed = px(+$event.target.value); refreshPreviewVars()" />
                        </div>
                        <div class="col-6 col-md-3">
                            <label class="form-label">Caption</label>
                            <input type="number" min="8" max="32" class="form-control"
                                :value="parseInt(sidebarDraft.captionFontClosed)"
                                @input="sidebarDraft.captionFontClosed = px(+$event.target.value); refreshPreviewVars()" />
                        </div>
                        <div class="col-6 col-md-3">
                            <label class="form-label">Título grupo</label>
                            <input type="number" min="8" max="40" class="form-control"
                                :value="parseInt(sidebarDraft.titleFontClosed)"
                                @input="sidebarDraft.titleFontClosed = px(+$event.target.value); refreshPreviewVars()" />
                        </div>
                        <div class="col-6 col-md-3">
                            <label class="form-label">Subitem</label>
                            <input type="number" min="8" max="25" class="form-control"
                                :value="parseInt(sidebarDraft.subFontClosed)"
                                @input="sidebarDraft.subFontClosed = px(+$event.target.value); refreshPreviewVars()" />
                        </div>
                    </div>
                </div>

                <!-- ====== ÍCONES (ABERTO/FECHADO) ====== -->
                <div class="nx-card p-3 mb-4">
                    <h2 class="h6 mb-3">Ícones</h2>
                    <div class="row g-3">
                        <div class="col-12"><strong>Aberto</strong></div>
                        <div class="col-4">
                            <label class="form-label">Tamanho (item)</label>
                            <input type="number" min="8" max="40" class="form-control"
                                :value="parseInt(sidebarDraft.iconOpen)"
                                @input="sidebarDraft.iconOpen = px(+$event.target.value); refreshPreviewVars()" />
                        </div>
                        <div class="col-4">
                            <label class="form-label">Tamanho (subitem)</label>
                            <input type="number" min="8" max="30" class="form-control"
                                :value="parseInt(sidebarDraft.iconSubOpen)"
                                @input="sidebarDraft.iconSubOpen = px(+$event.target.value); refreshPreviewVars()" />
                        </div>
                        <div class="col-4">
                            <label class="form-label">Stroke</label>
                            <input type="number" min="0.5" max="3" step="0.25" class="form-control"
                                :value="Number(sidebarDraft.iconStrokeOpen)"
                                @input="sidebarDraft.iconStrokeOpen = String(+$event.target.value); refreshPreviewVars()" />
                        </div>

                        <div class="col-12 mt-3"><strong>Fechado</strong></div>
                        <div class="col-4">
                            <label class="form-label">Tamanho (item)</label>
                            <input type="number" min="8" max="40" class="form-control"
                                :value="parseInt(sidebarDraft.iconClosed)"
                                @input="sidebarDraft.iconClosed = px(+$event.target.value); refreshPreviewVars()" />
                        </div>
                        <div class="col-4">
                            <label class="form-label">Tamanho (subitem)</label>
                            <input type="number" min="8" max="30" class="form-control"
                                :value="parseInt(sidebarDraft.iconSubClosed)"
                                @input="sidebarDraft.iconSubClosed = px(+$event.target.value); refreshPreviewVars()" />
                        </div>
                        <div class="col-4">
                            <label class="form-label">Stroke</label>
                            <input type="number" min="0.5" max="3" step="0.25" class="form-control"
                                :value="Number(sidebarDraft.iconStrokeClosed)"
                                @input="sidebarDraft.iconStrokeClosed = String(+$event.target.value); refreshPreviewVars()" />
                        </div>
                    </div>
                </div>

                <!-- ====== LAYOUT (ABERTO/FECHADO) ====== -->
                <div class="nx-card p-3 mb-4">
                    <h2 class="h6 mb-3">Layout do item</h2>
                    <div class="row g-3">
                        <div class="col-12"><strong>Aberto</strong></div>
                        <div class="col-3"><label class="form-label">Padding Y</label><input type="text"
                                class="form-control" v-model="sidebarDraft.itemPadYOpen"
                                @input="refreshPreviewVars()" />
                        </div>
                        <div class="col-3"><label class="form-label">Padding X</label><input type="text"
                                class="form-control" v-model="sidebarDraft.itemPadXOpen"
                                @input="refreshPreviewVars()" />
                        </div>
                        <div class="col-3"><label class="form-label">Gap</label><input type="text" class="form-control"
                                v-model="sidebarDraft.gapOpen" @input="refreshPreviewVars()" /></div>
                        <div class="col-3"><label class="form-label">Radius</label><input type="text"
                                class="form-control" v-model="sidebarDraft.radiusOpen" @input="refreshPreviewVars()" />
                        </div>
                        <div class="col-3"><label class="form-label">Recuo Subnav</label><input type="text"
                                class="form-control" v-model="sidebarDraft.subIndentOpen"
                                @input="refreshPreviewVars()" />
                        </div>

                        <div class="col-12 mt-3"><strong>Fechado</strong></div>
                        <div class="col-3"><label class="form-label">Padding Y</label><input type="text"
                                class="form-control" v-model="sidebarDraft.itemPadYClosed"
                                @input="refreshPreviewVars()" />
                        </div>
                        <div class="col-3"><label class="form-label">Padding X</label><input type="text"
                                class="form-control" v-model="sidebarDraft.itemPadXClosed"
                                @input="refreshPreviewVars()" />
                        </div>
                        <div class="col-3"><label class="form-label">Gap</label><input type="text" class="form-control"
                                v-model="sidebarDraft.gapClosed" @input="refreshPreviewVars()" /></div>
                        <div class="col-3"><label class="form-label">Radius</label><input type="text"
                                class="form-control" v-model="sidebarDraft.radiusClosed"
                                @input="refreshPreviewVars()" /></div>
                        <div class="col-3"><label class="form-label">Recuo Subnav</label><input type="text"
                                class="form-control" v-model="sidebarDraft.subIndentClosed"
                                @input="refreshPreviewVars()" />
                        </div>
                    </div>
                </div>

                <!-- ====== EDITOR DE LINKS (DRAFT) ====== -->
                <div class="nx-card p-3 mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h2 class="h6 m-0">Links do Sidebar (Preview)</h2>
                        <NxButton variant="outline" tone="primary" icon="plus" @click="addItem()">Adicionar link
                        </NxButton>
                    </div>

                    <div class="editor-links">
                        <div v-for="(item, i) in navDraft" :key="'draft-' + i" class="link-item">
                            <div class="row g-2 align-items-end">
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Ícone (lucide)</label>
                                    <input class="form-control" v-model="item.icon"
                                        placeholder="ex: layout-dashboard" />
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Rótulo</label>
                                    <input class="form-control" v-model="item.label" />
                                </div>
                                <div class="col-12 col-md-3" v-if="!item.children">
                                    <label class="form-label">Link (to)</label>
                                    <input class="form-control" v-model="item.to" placeholder="/rota" />
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Tipo</label>
                                    <div class="d-flex gap-2">
                                        <NxButton size="sm" :variant="item.children ? 'solid' : 'outline'"
                                            tone="primary" icon="menu" @click="toggleDropdown(i)">Dropdown</NxButton>
                                        <NxButton size="sm" :variant="!item.children ? 'solid' : 'outline'"
                                            tone="primary" icon="link" @click="toggleDropdown(i)">Link</NxButton>
                                        <NxButton size="sm" variant="outline" tone="danger" icon="trash-2"
                                            @click="removeItem(i)">Remover</NxButton>
                                    </div>
                                </div>
                            </div>

                            <!-- Sublinks -->
                            <div v-if="item.children" class="mt-3 ps-3 border-start">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <strong>Sublinks</strong>
                                    <NxButton size="sm" variant="outline" tone="primary" icon="plus"
                                        @click="addChild(i)">
                                        Adicionar sublink</NxButton>
                                </div>
                                <div v-for="(child, ci) in item.children" :key="'ch-' + i + '-' + ci"
                                    class="row g-2 align-items-end mb-2">
                                    <div class="col-12 col-md-3">
                                        <label class="form-label">Ícone</label>
                                        <input class="form-control" v-model="child.icon"
                                            placeholder="ex: message-square" />
                                    </div>
                                    <div class="col-12 col-md-3">
                                        <label class="form-label">Rótulo</label>
                                        <input class="form-control" v-model="child.label" />
                                    </div>
                                    <div class="col-12 col-md-3">
                                        <label class="form-label">Link (to)</label>
                                        <input class="form-control" v-model="child.to" placeholder="/rota" />
                                    </div>
                                    <div class="col-12 col-md-3">
                                        <NxButton size="sm" variant="outline" tone="danger" icon="trash-2"
                                            @click="removeChild(i, ci)">Remover</NxButton>
                                    </div>
                                </div>
                            </div>

                            <hr class="my-3" />
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <!-- ====== PREVIEW ISOLADO ====== -->
                <div class="nx-card p-0 overflow-hidden">
                    <div class="p-3 d-flex align-items-center gap-3 border-bottom">
                        <strong class="me-2">Preview</strong>
                        <label class="form-check-label d-flex align-items-center gap-2">
                            <input class="form-check-input" type="checkbox" v-model="previewCollapsed"> Colapsado
                            (desktop)
                        </label>
                        <div class="d-flex align-items-center gap-2 ms-auto">
                            <span class="small text-muted">Viewport</span>
                            <input type="range" min="360" max="1440" step="20" v-model.number="previewWidth" />
                            <code>{{ previewWidth }}px</code>
                        </div>
                        <NxButton size="sm" variant="outline" tone="primary" icon="refresh-cw"
                            @click="refreshPreviewVars">
                            Recarregar vars</NxButton>
                    </div>

                    <!-- container isolado do preview -->
                    <div class="sb-preview-viewport" :style="{ width: previewWidth + 'px' }">
                        <div ref="previewRoot" class="sb-preview-root">
                            <div class="nx-shell">
                                <div class="nx-sidebar" :class="{ '-collapsed': previewCollapsed }">
                                    <div class="nx-sidebar__inner">
                                        <div class="nx-sidebar__header">
                                            <div class="nx-brand">
                                                <span class="nx-brand__logo">N</span>
                                                <strong class="nx-brand__text">Nexo <span>One</span></strong>
                                            </div>
                                            <button class="btn btn-sm btn-outline-light">Toggle</button>
                                        </div>

                                        <nav class="nx-nav">
                                            <div class="nx-nav__group">
                                                <div class="nx-nav__title">Preview</div>
                                                <div v-for="(item, i) in navDraft" :key="'pv-' + i">
                                                    <div v-if="!item.children" class="nx-nav__link">
                                                        <i class="nx-nav__icon">
                                                            <component :is="lucideComp(item.icon)"
                                                                v-if="lucideComp(item.icon)" :size="pvIconSize"
                                                                :stroke-width="pvStroke" />
                                                        </i>
                                                        <span class="nx-nav__label">{{ item.label }}</span>
                                                    </div>
                                                    <div v-else class="nx-nav__collapsible">
                                                        <div class="nx-nav__link -button">
                                                            <!-- trigger de dropdown -->
                                                            <i class="nx-nav__icon">
                                                                <component :is="lucideComp(item.icon)"
                                                                    v-if="lucideComp(item.icon)" :size="pvIconSize"
                                                                    :stroke-width="pvStroke" />
                                                            </i>
                                                            <span class="nx-nav__label">{{ item.label }}</span>
                                                            <i class="nx-nav__chev">
                                                                <component :is="lucideComp('chevron-down')"
                                                                    :size="pvChevSize" :stroke-width="pvStroke" />
                                                            </i>
                                                        </div>
                                                        <ul class="nx-subnav">
                                                            <li v-for="(c, ci) in item.children"
                                                                :key="'pv-c-' + i + '-' + ci">
                                                                <div class="nx-subnav__link">
                                                                    <i class="nx-subnav__icon">
                                                                        <component :is="lucideComp(c.icon)"
                                                                            :size="pvIconSubSize"
                                                                            :stroke-width="pvStroke" />
                                                                    </i>
                                                                    <span class="nx-subnav__label">{{ c.label }}</span>
                                                                </div>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </nav>
                                    </div>
                                </div>
                                <div class="nx-main">
                                    <header class="p-3 border-bottom">Header</header>
                                    <main class="p-3">Conteúdo de exemplo…</main>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>





    </div>
</template>

<style scoped>
.settings-sidebar .nx-card {
    background: var(--nx-surface);
    border: 1px solid var(--nx-border);
    border-radius: 12px;
}

.sb-preview-viewport {
    overflow: auto;
    border-top: 1px solid var(--nx-border);
    background: var(--nx-bg);
    margin: 0 auto;
}

.sb-preview-root {
    /* as vars do draft são aplicadas aqui via JS */
}

/* ==== Preview: mini-clone dos estilos da sidebar real ==== */
.sb-preview-viewport {
    overflow: auto;
    border-top: 1px solid var(--nx-border);
    background: var(--nx-bg);
    margin: 0 auto;
}

.sb-preview-root .nx-shell {
    display: flex;
    min-height: 420px;
    background: var(--nx-bg);
}

.sb-preview-root .nx-sidebar {
    inline-size: var(--nx-sb-w);
    transition: inline-size var(--nx-dur, .22s) var(--nx-ease, cubic-bezier(.2, .6, .2, 1));
    background: var(--nx-surface);
    border-right: 1px solid var(--nx-border);
    overflow: hidden;
}

.sb-preview-root .nx-sidebar.-collapsed {
    inline-size: var(--nx-sb-w-collapsed);
}

.sb-preview-root .nx-sidebar__inner {
    padding: .5rem .75rem 1rem;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.sb-preview-root .nx-sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .25rem .25rem .5rem;
    margin-bottom: .25rem;
    border-bottom: 1px solid var(--nx-border);
}

.sb-preview-root .nx-brand {
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    color: var(--nx-fg);
    text-decoration: none;
}

.sb-preview-root .nx-brand__logo {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: var(--nx-primary);
    color: #042227;
    display: grid;
    place-items: center;
    font-weight: 900;
}

.sb-preview-root .nx-brand__text {
    font-weight: 800;
    letter-spacing: .2px;
}

.sb-preview-root .nx-brand__text span {
    color: var(--nx-primary);
}

.sb-preview-root .nx-nav {
    padding-top: .5rem;
    overflow: auto;
}

.sb-preview-root .nx-nav__title {
    font-size: var(--nx-sb-title-font);
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--nx-muted);
    margin: .5rem .5rem .5rem .75rem;
}

.sb-preview-root .nx-nav__link {
    display: flex;
    align-items: center;
    gap: var(--nx-sb-gap);
    padding: var(--nx-sb-item-pad-y) var(--nx-sb-item-pad-x);
    margin: .15rem 0;
    color: var(--nx-fg);
    text-decoration: none;
    border-radius: var(--nx-sb-radius);
    min-inline-size: 0;
    font-size: var(--nx-sb-font);
    transition: background var(--nx-dur, .22s) var(--nx-ease, cubic-bezier(.2, .6, .2, 1)), color var(--nx-dur, .22s) var(--nx-ease, cubic-bezier(.2, .6, .2, 1));
    background: transparent;
}

.sb-preview-root .nx-nav__link:hover {
    background: rgba(255, 255, 255, .06);
}

.sb-preview-root .nx-nav__link.is-active {
    background: rgba(18, 178, 193, .18);
    color: var(--nx-primary);
}

.sb-preview-root .nx-nav__icon {
    width: var(--nx-sb-icon);
    height: var(--nx-sb-icon);
    display: grid;
    place-items: center;
}

.sb-preview-root .nx-nav__icon :deep(svg) {
    stroke-width: var(--nx-sb-icon-stroke);
}

.sb-preview-root .nx-nav__link.-button {
    width: 100%;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
}

.sb-preview-root .nx-nav__chev {
    margin-left: auto;
    opacity: .85;
}

.sb-preview-root .nx-nav__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sb-preview-root .nx-nav__caption {
    display: none;
}

.sb-preview-root .nx-nav__link.-stack {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .35rem;
    padding: var(--nx-sb-item-pad-y) 0;
}

.sb-preview-root .nx-nav__link.-stack .nx-nav__label {
    display: none;
}

.sb-preview-root .nx-nav__link.-stack .nx-nav__caption {
    display: block;
    font-size: var(--nx-sb-caption-font);
    line-height: 1;
    color: var(--nx-muted);
    text-align: center;
    max-width: calc(var(--nx-sb-w-collapsed) - 18px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sb-preview-root .nx-nav__collapsible.-stack .nx-nav__link.-button {
    flex-direction: column;
    align-items: center;
    gap: .35rem;
    padding: var(--nx-sb-item-pad-y) 0;
}

.sb-preview-root .nx-nav__collapsible.-stack .nx-nav__link.-button .nx-nav__label {
    display: none;
}

.sb-preview-root .nx-subnav {
    list-style: none;
    padding: 0;
    margin: .25rem 0 .25rem calc(var(--nx-sb-sub-indent) + var(--nx-sb-item-pad-x));
}

.sb-preview-root .nx-subnav__link {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .4rem .6rem;
    margin: .1rem 0;
    text-decoration: none;
    color: var(--nx-fg);
    border-radius: var(--nx-sb-radius);
    font-size: var(--nx-sb-sub-font);
}

.sb-preview-root .nx-subnav__link:hover {
    background: rgba(255, 255, 255, .06);
}

.sb-preview-root .nx-subnav__icon {
    width: var(--nx-sb-icon-sub);
    height: var(--nx-sb-icon-sub);
    display: grid;
    place-items: center;
}

.sb-preview-root .nx-subnav__icon :deep(svg) {
    stroke-width: var(--nx-sb-icon-stroke);
}

/* coluna direita fake */
.sb-preview-root .nx-main {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-width: 0;
}
</style>
