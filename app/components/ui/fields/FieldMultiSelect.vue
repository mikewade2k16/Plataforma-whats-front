<!-- app/components/ui/fields/FieldMultiSelect.vue -->
<script setup lang="ts">
import { ref, watch, onMounted, isRef, toValue, computed } from 'vue'
import NxBadge from '@/components/ui/NxBadge.vue'
import NxButton from '@/components/buttons/NxButton.vue'

const props = defineProps<{ config: any }>()
const model = defineModel<any[]>({ default: [] })

const emit = defineEmits<{
    (e: 'blur', ev: FocusEvent): void
    (e: 'keydown', ev: KeyboardEvent): void
}>()

const rootRef = ref<HTMLElement | null>(null)

/** options normalizados */
const options = ref<{ value: number | string; label: string }[]>([])
const load = () => {
    const src = props.config?.options
    const list = isRef(src) ? toValue(src) : src
    options.value = Array.isArray(list)
        ? list.map((o: any) =>
            typeof o === 'string' || typeof o === 'number'
                ? { value: o, label: String(o) }
                : o
        )
        : []
}
onMounted(load)
watch(
    () => (isRef(props.config?.options) ? toValue(props.config?.options) : props.config?.options),
    load,
    { deep: true }
)

const wantsNumber = computed(() => props.config?.valueType === 'number' || props.config?.cast === 'number')
const placeholder = computed(() => props.config?.placeholder || 'Selecione...')

const open = ref(false)

function toggleOpen() {
    open.value = !open.value
}

function normalizeVal(val: any) {
    return wantsNumber.value ? Number(val) : val
}

function isSelected(val: any) {
    const v = normalizeVal(val)
    return (model.value ?? []).some(x => String(x) === String(v))
}

function toggleOption(opt: { value: any; label: string }) {
    const v = normalizeVal(opt.value)
    const set = new Set(model.value ?? [])
    if (Array.from(set).some(x => String(x) === String(v))) {
        set.forEach(x => { if (String(x) === String(v)) set.delete(x) })
    } else {
        set.add(v)
    }
    model.value = Array.from(set)
}

const selectedOptions = computed(() =>
    options.value.filter(o => isSelected(o.value))
)

/** criação de novas opções */
const allowCreate = computed(() =>
    props.config?.allowCreate && typeof props.config?.onCreateOption === 'function'
)
const createLabel = computed(() => props.config?.createLabel || 'Adicionar nova opção...')

function handleCreate() {
    if (!allowCreate.value) return
    const label = window.prompt(props.config?.createPrompt || 'Nova opção')
    if (!label) return
    const value = props.config?.createValueFn ? props.config.createValueFn(label) : label
    const newOpt = { value, label }
    options.value = [...options.value, newOpt]
    toggleOption(newOpt)
    props.config?.onCreateOption?.(newOpt)
}

/** eventos para InlineEdit */
function onKeydown(e: KeyboardEvent) {
    emit('keydown', e)
}

function onFocusOut(ev: FocusEvent) {
    const root = rootRef.value
    const next = ev.relatedTarget as Node | null
    if (root && next && root.contains(next)) return
    open.value = false
    emit('blur', ev)
}
</script>

<template>
    <div class="nx-ms" ref="rootRef" tabindex="0" @keydown="onKeydown" @focusout="onFocusOut">
        <!-- linha 1: valor atual (chips) -->
        <button type="button" class="nx-ms-control" @click.stop="toggleOpen">
            <div class="nx-ms-chips" v-if="selectedOptions.length">
                <NxBadge v-for="opt in selectedOptions" :key="String(opt.value)" tone="primary">
                    {{ opt.label }}
                </NxBadge>
            </div>
            <span v-else class="nx-ms-placeholder">{{ placeholder }}</span>
            <span class="nx-ms-caret">▾</span>
        </button>

        <!-- painel -->
        <div v-if="open" class="nx-ms-menu">
            <!-- linha 2: lista de opções -->
            <div class="nx-ms-options">
                <button v-for="opt in options" :key="String(opt.value)" type="button" class="nx-ms-option"
                    @click.stop="toggleOption(opt)">
                    <NxBadge :tone="isSelected(opt.value) ? 'primary' : 'neutral'">
                        {{ opt.label }}
                    </NxBadge>

                    <NxButton size="sm" variant="outline" tone="neutral" icon="more-vertical" iconOnly
                        class="nx-ms-option-menu" />
                </button>
            </div>

            <!-- linha 3: criar nova -->
            <button v-if="allowCreate" type="button" class="nx-ms-create" @click.stop="handleCreate">
                {{ createLabel }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.nx-ms {
    position: relative;
    width: 100%;
}

.nx-ms-control {
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
}

.nx-ms-placeholder {
    color: #9aa3ad;
    font-size: .75rem;
}

.nx-ms-caret {
    font-size: .65rem;
    opacity: .8;
}

.nx-ms-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
}

.nx-ms-menu {
    position: absolute;
    inset-inline: 0;
    margin-top: 4px;
    background: #111827;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, .12);
    box-shadow: 0 12px 30px rgba(0, 0, 0, .45);
    z-index: 40;
    padding: 6px 4px;
}

.nx-ms-options {
    max-height: 240px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.nx-ms-option {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 6px;
    border: none;
    background: transparent;
    padding: 2px 4px;
    cursor: pointer;
}

.nx-ms-option:hover {
    background: rgba(255, 255, 255, .04);
}

.nx-ms-option-menu {
    opacity: .6;
}

.nx-ms-option:hover .nx-ms-option-menu {
    opacity: 1;
}

.nx-ms-create {
    margin-top: 4px;
    width: 100%;
    border: none;
    background: transparent;
    padding: 4px 6px;
    text-align: left;
    font-size: .78rem;
    color: #a5b4fc;
    cursor: pointer;
    border-radius: 6px;
}

.nx-ms-create:hover {
    background: rgba(129, 140, 248, .12);
}
</style>
