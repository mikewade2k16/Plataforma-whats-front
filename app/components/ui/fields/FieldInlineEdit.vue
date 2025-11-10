<!-- app/components/ui/fields/FieldInlineEdit.vue -->
<script setup lang="ts">
import { ref, computed, isRef, toValue, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps<{
    value: any
    component: any
    componentProps?: any
    row?: any
    fieldKey?: string
}>()

const emit = defineEmits<{ (e: 'update', v: any): void }>()

const cfg = computed(() => props.componentProps?.config || {})

// placeholder elegante
const placeholder = computed(() => cfg.value.placeholder || 'Selecione...')

// options normalizadas (se existirem)
const options = computed<{ value: any; label: string }[]>(() => {
    const src = cfg.value?.options
    const list = isRef(src) ? toValue(src) : src
    return Array.isArray(list)
        ? list.map((o: any) =>
            (typeof o === 'string' || typeof o === 'number')
                ? { value: o, label: String(o) }
                : o
        )
        : []
})

// helper: id -> label
function findLabel(v: any) {
    const hit = options.value.find(o => String(o.value) === String(v))
    return hit?.label ?? (v ?? '')
}

const isEmpty = computed(() => {
    const v = props.value
    return (
        v === null ||
        v === undefined ||
        v === '' ||
        (Array.isArray(v) && v.length === 0)
    )
})

// formata datas tipo Notion: "5 de outubro de 2025"
// dentro de <script setup> do FieldInlineEdit.vue

// formata datas tipo Notion: "5 de outubro de 2025"
function formatDate(value: any): string {
    if (!value) return ''
    const s = String(value)

    // caso padrão vindo do input date: "YYYY-MM-DD"
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (m) {
        const [, y, mo, d] = m
        // aqui criamos a data usando ano/mes/dia locais
        const date = new Date(Number(y), Number(mo) - 1, Number(d))
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    // fallback pra outros formatos (se algum endpoint devolver ISO diferente)
    const date = new Date(s)
    if (Number.isNaN(date.getTime())) return s
    return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}


// texto para mostrar no modo leitura
const displayText = computed(() => {
    // custom formatter opcional
    if (typeof cfg.value.display === 'function') {
        return cfg.value.display(props.value, props.row)
    }

    // datas
    if (cfg.value.type === 'date' && props.value) {
        return formatDate(props.value)
    }

    if (Array.isArray(props.value)) {
        return props.value.map(findLabel).join(', ')
    }
    if (options.value.length) {
        return findLabel(props.value)
    }
    return props.value ?? ''
})

// ------- edição controlada (com cópia local) -------
const editing = ref(false)
const local = ref<any>(props.value)
const initial = ref<any>(props.value)
const pendingCancel = ref(false)

watch(
    () => props.value,
    (v) => {
        if (!editing.value) {
            local.value = v
            initial.value = v
        }
    }
)

// refs para foco e click-outside
const wrapperRef = ref<HTMLElement | null>(null)
const innerRef = ref<any>(null)

function focusInner() {
    nextTick(() => {
        const inner = innerRef.value
        if (!inner) return

        let el: any = null
        if (inner instanceof HTMLElement) {
            el = inner
        } else if (inner.$el instanceof HTMLElement) {
            el = inner.$el
        }

        if (!el) return

        const focusable = el.matches?.('input,select,textarea,button,[tabindex]')
            ? el
            : el.querySelector?.('input,select,textarea,button,[tabindex]')

        if (focusable && typeof focusable.focus === 'function') {
            focusable.focus()
        }
    })
}

function start() {
    editing.value = true
    pendingCancel.value = false
    initial.value = props.value
    local.value = props.value
    focusInner()
}

function onInnerInput(v: any) {
    local.value = v
}

function commit() {
    if (!editing.value) return
    editing.value = false
    pendingCancel.value = false
    if (local.value !== initial.value) {
        emit('update', local.value)
    }
}

function cancel() {
    if (!editing.value) return
    local.value = initial.value
    pendingCancel.value = true
    editing.value = false
}

function onBlur() {
    // se veio de ESC, não commitar
    if (pendingCancel.value) {
        pendingCancel.value = false
        return
    }
    commit()
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        commit()
    } else if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault()
        e.stopPropagation()
        cancel()
    }
}

// click fora → commit
function handleDocumentClick(e: MouseEvent) {
    const wrap = wrapperRef.value
    if (!wrap || !editing.value) return
    if (!wrap.contains(e.target as Node)) {
        commit()
    }
}

watch(editing, (on) => {
    if (!process.client) return
    if (on) {
        document.addEventListener('mousedown', handleDocumentClick, true)
    } else {
        document.removeEventListener('mousedown', handleDocumentClick, true)
    }
})

onBeforeUnmount(() => {
    if (process.client) {
        document.removeEventListener('mousedown', handleDocumentClick, true)
    }
})
</script>

<template>
    <div class="fi-wrap" ref="wrapperRef">
        <!-- MODO LEITURA -->
        <div v-if="!editing" class="fi-display" tabindex="0" @click="start" @keydown.enter.prevent.stop="start">
            <template v-if="!isEmpty">
                <slot name="display" :value="value" :label="displayText">
                    {{ displayText }}
                </slot>
            </template>
            <small v-else class="fi-placeholder">{{ placeholder }}</small>
        </div>

        <!-- MODO EDIÇÃO -->
        <component v-else ref="innerRef" :is="component" v-bind="componentProps" :modelValue="local"
            @update:modelValue="onInnerInput" @blur="onBlur" @keydown="onKeydown" />
    </div>
</template>

<style scoped>
.fi-wrap {
    padding: 2px 0;
}

.fi-display {
    all: unset;
    display: block;
    width: 100%;
    cursor: text;
    border-radius: 6px;
    padding: 2px 4px;
}

.fi-display:hover,
.fi-display:focus-visible {
    background: rgba(255, 255, 255, .03);
    outline: 1px dashed rgba(255, 255, 255, .18);
}

.fi-placeholder {
    color: #9aa3ad;
    opacity: .9;
    font-size: .75rem;
}
</style>
