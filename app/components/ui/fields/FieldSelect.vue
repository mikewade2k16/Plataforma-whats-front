<script setup lang="ts">
import { ref, watch, onMounted, isRef, toValue, computed } from 'vue'
import NxBadge from '@/components/ui/NxBadge.vue'
import NxButton from '@/components/buttons/NxButton.vue'

type Option = { value: string | number; label: string }
type OptionApiConfig = {
    baseUrl: string            // ex: '/api/admin/clients'
    labelField?: string        // ex: 'name' (default)
    updateMethod?: string      // default: 'PUT'
    deleteMethod?: string      // default: 'DELETE'
}

const props = defineProps<{ config: any; fieldKey?: string }>()
const model = defineModel<any>({ default: null })

const emit = defineEmits<{
    (e: 'blur', ev: FocusEvent): void
    (e: 'keydown', ev: KeyboardEvent): void
}>()

const rootRef = ref<HTMLElement | null>(null)

/** single x multi */
const multiple = computed(() => !!props.config?.multiple)

/** options normalizados */
const options = ref<Option[]>([])
const loadFromConfig = () => {
    const src = props.config?.options
    const list = isRef(src) ? toValue(src) : src
    options.value = Array.isArray(list)
        ? list.map((o: any) =>
            (typeof o === 'string' || typeof o === 'number')
                ? { value: o, label: String(o) }
                : o
        )
        : []
}
onMounted(loadFromConfig)
watch(
    () => (isRef(props.config?.options) ? toValue(props.config?.options) : props.config?.options),
    loadFromConfig,
    { deep: true }
)

/** placeholder */
const placeholder = computed(() => props.config?.placeholder || 'Selecione...')

/** *_id → número */
const wantsNumber = computed(() =>
    props.config?.valueType === 'number' ||
    props.config?.cast === 'number' ||
    (props.fieldKey || '').endsWith('_id')
)

/** config API opcional */
const optionApi = computed<OptionApiConfig | null>(() => {
    const raw = props.config?.optionApi
    if (!raw || typeof raw !== 'object') return null
    if (!raw.baseUrl) return null
    return {
        baseUrl: raw.baseUrl,
        labelField: raw.labelField || 'name',
        updateMethod: raw.updateMethod || 'PUT',
        deleteMethod: raw.deleteMethod || 'DELETE'
    }
})

/** permissão de editar opções */
const canRename = computed(
    () => !!props.config?.onRenameOption || !!optionApi.value
)
const canDelete = computed(
    () => !!props.config?.onDeleteOption || !!optionApi.value
)
const canEditOption = computed(
    () => canRename.value || canDelete.value
)

/** dropdown + busca */
const open = ref(false)
const search = ref('')

/** helpers de valor */
const currentArray = computed<any[]>(() => {
    if (!multiple.value) return []
    if (Array.isArray(model.value)) return model.value
    if (model.value === null || model.value === undefined || model.value === '') return []
    return [model.value]
})

function normalizeVal(v: any) {
    return wantsNumber.value ? Number(v) : v
}

/** selecionados */
const selectedOptions = computed<Option[]>(() => {
    if (!multiple.value) {
        const val = model.value
        if (val === null || val === undefined || val === '') return []
        const opt = options.value.find(o => String(o.value) === String(val))
        return opt ? [opt] : []
    }
    const arr = currentArray.value
    return options.value.filter(o =>
        arr.some(v => String(v) === String(o.value))
    )
})

/** filtro pela busca */
const filteredOptions = computed<Option[]>(() => {
    const term = search.value.trim().toLowerCase()
    if (!term) return options.value
    return options.value.filter(o =>
        o.label.toLowerCase().includes(term)
    )
})

/** ordem no painel: selecionados primeiro */
const sortedOptions = computed<Option[]>(() => {
    const base = filteredOptions.value
    if (!selectedOptions.value.length) return base
    const ids = new Set(selectedOptions.value.map(o => String(o.value)))
    const rest = base.filter(o => !ids.has(String(o.value)))
    const selectedInBase = selectedOptions.value.filter(o =>
        base.some(b => String(b.value) === String(o.value))
    )
    return [...selectedInBase, ...rest]
})

function isSelected(opt: Option) {
    if (!multiple.value) {
        return String(model.value ?? '') === String(opt.value)
    }
    return currentArray.value.some(v => String(v) === String(opt.value))
}

/** abrir ao focar: 1 clique no InlineEdit */
function onFocus() {
    open.value = true
}

/** toggle pelo “input externo” */
function toggleOpen() {
    open.value = !open.value
}

/** seleção */
function selectSingle(opt: Option) {
    const same = String(model.value ?? '') === String(opt.value)
    if (same && props.config?.allowClear !== false) {
        model.value = null
    } else {
        model.value = wantsNumber.value ? Number(opt.value) : opt.value
    }
    // fecha somente se o campo pedir explicitamente
    if (props.config?.closeOnSelect) {
        open.value = false
    }
}

function toggleMulti(opt: Option) {
    const val = normalizeVal(opt.value)
    const set = new Set(currentArray.value ?? [])
    if (Array.from(set).some(x => String(x) === String(val))) {
        set.forEach(x => { if (String(x) === String(val)) set.delete(x) })
    } else {
        set.add(val)
    }
    model.value = Array.from(set)
}

function handleOptionClick(opt: Option) {
    if (multiple.value) toggleMulti(opt)
    else selectSingle(opt)
}

/** criação de novas opções (inline, sem prompt) */
const allowCreate = computed(() => props.config?.allowCreate !== false)
const createLabel = computed(() => {
    const term = search.value.trim()
    if (term) return `Criar "${term}"`
    return props.config?.createLabel || 'Adicionar nova opção...'
})

async function handleCreate() {
    if (!allowCreate.value) return
    const label = search.value.trim()
    if (!label) return

    const existing = options.value.find(o => o.label.toLowerCase() === label.toLowerCase())
    if (existing) {
        handleOptionClick(existing)
        search.value = ''
        return
    }

    const value = props.config?.createValueFn ? props.config.createValueFn(label) : label
    const newOpt: Option = { value, label }

    // callback opcional pro lado de fora
    if (typeof props.config?.onCreateOption === 'function') {
        await props.config.onCreateOption(newOpt)
    }

    options.value = [...options.value, newOpt]

    if (multiple.value) {
        toggleMulti(newOpt)
    } else {
        model.value = wantsNumber.value ? Number(value) : value
    }

    search.value = ''
}

/** rename/delete helpers */
async function doApiRename(opt: Option, newLabel: string) {
    const api = optionApi.value
    if (!api) return
    const body: any = { [api.labelField!]: newLabel }
    await $fetch(`${api.baseUrl}/${opt.value}`, {
        method: api.updateMethod,
        body
    })
}

async function doApiDelete(opt: Option) {
    const api = optionApi.value
    if (!api) return
    await $fetch(`${api.baseUrl}/${opt.value}`, {
        method: api.deleteMethod
    })
}

async function renameOption(opt: Option) {
    if (!canRename.value) return
    const initial = opt.label
    const next = window.prompt('Renomear opção', initial)
    if (!next || next.trim() === initial) return
    const newLabel = next.trim()

    // callback externa primeiro
    if (typeof props.config?.onRenameOption === 'function') {
        await props.config.onRenameOption(opt, newLabel)
    } else if (optionApi.value) {
        await doApiRename(opt, newLabel)
    }

    // atualiza localmente
    options.value = options.value.map(o =>
        String(o.value) === String(opt.value) ? { ...o, label: newLabel } : o
    )
}

async function deleteOption(opt: Option) {
    if (!canDelete.value) return
    const ok = window.confirm(`Excluir a opção "${opt.label}"?`)
    if (!ok) return

    if (typeof props.config?.onDeleteOption === 'function') {
        await props.config.onDeleteOption(opt)
    } else if (optionApi.value) {
        await doApiDelete(opt)
    }

    // remove das options e do model
    options.value = options.value.filter(o => String(o.value) !== String(opt.value))

    if (multiple.value) {
        const arr = currentArray.value.filter(v => String(v) !== String(opt.value))
        model.value = arr
    } else if (String(model.value ?? '') === String(opt.value)) {
        model.value = null
    }
}

/** eventos pro InlineEdit (Enter / ESC) */
function onKeydown(e: KeyboardEvent) {
    emit('keydown', e)
}

function onSearchKeydown(e: KeyboardEvent) {
    // backspace no multi sem texto → remove último selecionado
    if (multiple.value && e.key === 'Backspace' && !search.value && currentArray.value.length) {
        const arr = [...currentArray.value]
        arr.pop()
        model.value = arr
    }
    emit('keydown', e)
}

/** blur pro InlineEdit */
function onFocusOut(ev: FocusEvent) {
    const root = rootRef.value
    const next = ev.relatedTarget as Node | null
    if (root && next && root.contains(next)) return
    open.value = false
    emit('blur', ev)
}
</script>

<template>
    <div class="nx-select" ref="rootRef" tabindex="0" @focus="onFocus" @keydown="onKeydown" @focusout="onFocusOut">
        <!-- CONTROL “fechado” (parece input) -->
        <div class="nx-select-control" @click.stop="toggleOpen">
            <template v-if="selectedOptions.length">
                <div class="nx-select-control-chips">
                    <NxBadge v-for="opt in selectedOptions" :key="String(opt.value)" tone="primary">
                        {{ opt.label }}
                    </NxBadge>
                </div>
            </template>
            <span v-else class="nx-select-placeholder">{{ placeholder }}</span>

            <span class="nx-select-caret">▾</span>
        </div>

        <!-- DROPDOWN -->
        <div v-if="open" class="nx-select-menu">
            <!-- TOPO: chips + input (Notion-like) -->
            <div class="nx-select-top">
                <template v-if="selectedOptions.length">
                    <span v-for="opt in selectedOptions" :key="`top-${String(opt.value)}`" class="nx-select-top-chip">
                        {{ opt.label }}
                    </span>
                </template>
                <input v-model="search" type="text" class="nx-select-top-input" placeholder="Procurar opção..."
                    @keydown="onSearchKeydown" />
            </div>

            <!-- HINT -->
            <div class="nx-select-hint">
                {{ props.config?.hint || 'Selecione uma opção ou crie uma' }}
            </div>

            <!-- MEIO: lista de opções -->
            <div class="nx-select-options">
                <div v-for="opt in sortedOptions" :key="String(opt.value)" class="nx-select-option">
                    <!-- só o badge seleciona -->
                    <div class="nx-select-pill" @click.stop="handleOptionClick(opt)">
                        <NxBadge :tone="isSelected(opt) ? 'primary' : 'neutral'">
                            {{ opt.label }}
                        </NxBadge>
                    </div>

                    <!-- menu da opção (renomear / excluir) -->
                    <div v-if="canEditOption" class="nx-select-option-actions">
                        <NxButton size="sm" variant="outline" tone="neutral" icon="more-vertical" iconOnly dropdown
                            dropdownType="menu" placement="bottom-end" class="nx-select-option-menu" @click.stop>
                            <template #menu>
                                <button v-if="canRename" type="button" class="dropdown-item"
                                    @click.stop="renameOption(opt)">
                                    Renomear
                                </button>
                                <button v-if="canDelete" type="button" class="dropdown-item text-danger"
                                    @click.stop="deleteOption(opt)">
                                    Excluir
                                </button>
                            </template>
                        </NxButton>
                    </div>
                </div>

                <div v-if="!sortedOptions.length" class="nx-select-empty">
                    Nenhuma opção encontrada
                </div>
            </div>

            <!-- BOTTOM: criar nova opção (usando o texto digitado) -->
            <div v-if="allowCreate && search.trim().length" class="nx-select-create" role="button"
                @click.stop="handleCreate">
                {{ createLabel }}
            </div>
        </div>
    </div>
</template>

<style scoped>
.nx-select {
    position: relative;
    width: 100%;
}

/* parece input */
.nx-select-control {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .25rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, .1);
    padding: 2px 6px;
    background: transparent;
    font-size: .8rem;
    cursor: text;
}

.nx-select-control-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
}

.nx-select-placeholder {
    color: #9aa3ad;
    font-size: .75rem;
}

.nx-select-caret {
    font-size: .65rem;
    opacity: .8;
}

/* DROPDOWN */
.nx-select-menu {
    position: absolute;
    inset-inline: 0;
    margin-top: 4px;
    background: #111827;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, .12);
    box-shadow: 0 12px 30px rgba(0, 0, 0, .45);
    z-index: 40;
    padding: 8px 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

/* topo: chips + input */
.nx-select-top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    padding: 4px 4px;
    border-radius: 6px;
    background: #020617;
}

.nx-select-top-chip {
    background: rgba(148, 163, 184, .2);
    border-radius: 999px;
    padding: 1px 6px;
    font-size: .72rem;
}

.nx-select-top-input {
    flex: 1 1 80px;
    min-width: 80px;
    background: transparent;
    border: none;
    padding: 2px 0;
    font-size: .8rem;
    color: inherit;
    outline: none;
}

.nx-select-hint {
    font-size: .75rem;
    color: #9ca3af;
}

/* opções */
.nx-select-options {
    max-height: 240px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.nx-select-option {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 6px;
    padding: 2px 2px;
}

.nx-select-option:hover {
    background: rgba(255, 255, 255, .04);
}

.nx-select-pill {
    cursor: pointer;
}

.nx-select-option-actions {
    margin-left: 4px;
}

.nx-select-option-menu {
    opacity: .6;
}

.nx-select-option:hover .nx-select-option-menu {
    opacity: 1;
}

.nx-select-empty {
    font-size: .75rem;
    color: #9ca3af;
    padding: 4px 2px;
}

/* criar nova opção */
.nx-select-create {
    margin-top: 4px;
    width: 100%;
    padding: 4px 2px;
    font-size: .78rem;
    color: #a5b4fc;
    cursor: pointer;
    border-radius: 6px;
}

.nx-select-create:hover {
    background: rgba(129, 140, 248, .12);
}
</style>
