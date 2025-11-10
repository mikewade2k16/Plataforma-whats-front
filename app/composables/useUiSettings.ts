// composables/useUiSettings.ts
import { reactive, ref, computed, watchEffect } from 'vue'

/** --------- SIDEBAR: valores padrão (OPEN vs CLOSED) --------- */
const defaultsSidebar = {
    // Larguras
    w: '240px',
    wCollapsed: '80px',
    wMob: '280px',

    // TIPOGRAFIA - aberto
    fontOpen: '14px',
    captionFontOpen: '11px',
    titleFontOpen: '12px',
    subFontOpen: '13px',

    // TIPOGRAFIA - fechado
    fontClosed: '12px',
    captionFontClosed: '11px',
    titleFontClosed: '11px',
    subFontClosed: '12px',

    // ÍCONES - aberto
    iconOpen: '18px',
    iconSubOpen: '16px',
    iconStrokeOpen: '1',

    // ÍCONES - fechado
    iconClosed: '16px',
    iconSubClosed: '14px',
    iconStrokeClosed: '1',

    // LAYOUT - aberto
    itemPadYOpen: '.55rem',
    itemPadXOpen: '.7rem',
    gapOpen: '.75rem',
    radiusOpen: '12px',
    subIndentOpen: '20px',

    // LAYOUT - fechado
    itemPadYClosed: '.55rem',
    itemPadXClosed: '0',
    gapClosed: '.45rem',
    radiusClosed: '12px',
    subIndentClosed: '16px',
}

/** --------- NAV: exemplo inicial (draft/applied) --------- */
export type NavItem = { to?: string; icon: string; label: string; children?: NavItem[] }

const defaultNav: NavItem[] = [
    { to: '/dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
    { to: '/leads', icon: 'users', label: 'Chats' },
    { to: '/whatsapp', icon: 'message-square', label: 'Whatsapp' },
    { to: '/projects', icon: 'message-square', label: 'Projetos' },
    { to: '/tasks', icon: 'message-square', label: 'Tarefas' },
    { to: '/users', icon: 'message-square', label: 'Usuários' },
    { to: '/clients', icon: 'message-square', label: 'Clientes' },
    {
        icon: 'folder',
        label: 'DevTools',
        children: [
            { to: '/settings/sidebar', icon: 'settings', label: 'Configurações' },
            { to: '/icons', icon: 'message-square', label: 'Ícones' },
            { to: '/buttons', icon: 'message-square', label: 'Botões' },
        ],
    },
]

let _state: any

export function useUiSettings() {
    if (_state) return _state

    // ---- SIDEBAR: estado aplicado e draft para o preview ----
    const sidebarApplied = reactive({ ...defaultsSidebar })
    const sidebarDraft = reactive({ ...defaultsSidebar })

    // ---- NAV: aplicado e draft ----
    const navApplied = ref<NavItem[]>(JSON.parse(JSON.stringify(defaultNav)))
    const navDraft = ref<NavItem[]>(JSON.parse(JSON.stringify(defaultNav)))

    // ------ aplica vars CSS no :root (aplicado) ------
    function applySidebarToRoot() {
        if (!process.client) return
        applySidebarToEl(document.documentElement, sidebarApplied)
    }

    // ------ aplica vars CSS em um contêiner (preview) ------
    function applySidebarToEl(el: HTMLElement, src: typeof sidebarApplied) {
        const r = el.style
        // Larguras
        r.setProperty('--nx-sb-w', src.w)
        r.setProperty('--nx-sb-w-collapsed', src.wCollapsed)
        r.setProperty('--nx-sb-w-mob', src.wMob)

        // Tipografia (open/closed)
        r.setProperty('--nx-sb-font-open', src.fontOpen)
        r.setProperty('--nx-sb-caption-font-open', src.captionFontOpen)
        r.setProperty('--nx-sb-title-font-open', src.titleFontOpen)
        r.setProperty('--nx-sb-sub-font-open', src.subFontOpen)

        r.setProperty('--nx-sb-font-closed', src.fontClosed)
        r.setProperty('--nx-sb-caption-font-closed', src.captionFontClosed)
        r.setProperty('--nx-sb-title-font-closed', src.titleFontClosed)
        r.setProperty('--nx-sb-sub-font-closed', src.subFontClosed)

        // Ícones (open/closed)
        r.setProperty('--nx-sb-icon-open', src.iconOpen)
        r.setProperty('--nx-sb-icon-sub-open', src.iconSubOpen)
        r.setProperty('--nx-sb-icon-stroke-open', src.iconStrokeOpen)

        r.setProperty('--nx-sb-icon-closed', src.iconClosed)
        r.setProperty('--nx-sb-icon-sub-closed', src.iconSubClosed)
        r.setProperty('--nx-sb-icon-stroke-closed', src.iconStrokeClosed)

        // Layout (open/closed)
        r.setProperty('--nx-sb-item-pad-y-open', src.itemPadYOpen)
        r.setProperty('--nx-sb-item-pad-x-open', src.itemPadXOpen)
        r.setProperty('--nx-sb-gap-open', src.gapOpen)
        r.setProperty('--nx-sb-radius-open', src.radiusOpen)
        r.setProperty('--nx-sb-sub-indent-open', src.subIndentOpen)

        r.setProperty('--nx-sb-item-pad-y-closed', src.itemPadYClosed)
        r.setProperty('--nx-sb-item-pad-x-closed', src.itemPadXClosed)
        r.setProperty('--nx-sb-gap-closed', src.gapClosed)
        r.setProperty('--nx-sb-radius-closed', src.radiusClosed)
        r.setProperty('--nx-sb-sub-indent-closed', src.subIndentClosed)
    }

    // manter aplicado no :root ao boot
    watchEffect(() => applySidebarToRoot())

    // reset
    function resetSidebar() {
        Object.assign(sidebarDraft, { ...defaultsSidebar })
    }

    // aplicar draft -> aplicado (e opcionalmente persistir depois)
    function applyDraftToApp() {
        Object.assign(sidebarApplied, JSON.parse(JSON.stringify(sidebarDraft)))
        navApplied.value = JSON.parse(JSON.stringify(navDraft.value))
        applySidebarToRoot()
        // TODO: persistir em Pinia/localStorage/API
    }

    // helpers numéricos para Lucide
    const iconNumOpen = computed(() => parseInt(sidebarApplied.iconOpen, 10) || 18)
    const iconNumClosed = computed(() => parseInt(sidebarApplied.iconClosed, 10) || 16)
    const iconSubNumOpen = computed(() => parseInt(sidebarApplied.iconSubOpen, 10) || 16)
    const iconSubNumClosed = computed(() => parseInt(sidebarApplied.iconSubClosed, 10) || 14)
    const iconStrokeOpenNum = computed(() => Number(sidebarApplied.iconStrokeOpen) || 1)
    const iconStrokeClosedNum = computed(() => Number(sidebarApplied.iconStrokeClosed) || 1)

    // ----------------- EDITOR DE LINKS (draft) -----------------
    function addItem(item?: Partial<NavItem>) {
        navDraft.value.push({
            to: item?.to,
            icon: item?.icon || 'circle',
            label: item?.label || 'Novo link',
            children: item?.children ? [...item.children] : undefined,
        })
    }

    function removeItem(index: number) {
        navDraft.value.splice(index, 1)
    }

    function toggleDropdown(index: number) {
        const it = navDraft.value[index]
        if (!it) return
        if (it.children && it.children.length) {
            // já é dropdown -> volta a link simples
            delete it.children
        } else {
            // vira dropdown com 1 filho exemplo
            it.children = [{ to: '/novo', icon: 'dot', label: 'Novo sublink' }]
            delete it.to
        }
    }

    function addChild(parentIndex: number) {
        const p = navDraft.value[parentIndex]
        if (!p) return
        if (!p.children) p.children = []
        p.children.push({ to: '/novo', icon: 'dot', label: 'Novo sublink' })
    }

    function removeChild(parentIndex: number, childIndex: number) {
        const p = navDraft.value[parentIndex]
        if (!p?.children) return
        p.children.splice(childIndex, 1)
        if (p.children.length === 0) delete p.children
    }

    _state = {
        // sidebar
        sidebarApplied,
        sidebarDraft,
        applySidebarToEl,
        applyDraftToApp,
        resetSidebar,

        // nav
        navApplied,
        navDraft,
        addItem,
        removeItem,
        toggleDropdown,
        addChild,
        removeChild,

        // icon sizes (aplicado) — sidebar usa estes
        iconNumOpen,
        iconNumClosed,
        iconSubNumOpen,
        iconSubNumClosed,
        iconStrokeOpenNum,
        iconStrokeClosedNum,
    }

    return _state as typeof _state
}
