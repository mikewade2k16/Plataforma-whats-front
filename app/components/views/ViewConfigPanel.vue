<template>
    <Teleport to="body">
        <div v-if="open" class="vcp-wrap" @mousedown.self="$emit('update:open', false)">
            <div class="vcp-panel" @mousedown.stop>
                <div class="vcp-header">
                    <strong>Configurar visualização</strong>
                    <button class="btn btn-sm btn-outline-light" @click="$emit('update:open', false)">Fechar</button>
                </div>

                <!-- Visibilidade das colunas -->
                <section class="vcp-sec">
                    <div class="vcp-title">Visibilidade da propriedade</div>
                    <div class="vcp-grid">
                        <label v-for="(cfg, key) in localSchema" :key="key" class="vcp-row">
                            <input type="checkbox" v-model="localSchema[key].hidden" @change="toggleHidden(key)" />
                            <span class="ms-2">{{ cfg.label || key }}</span>
                        </label>
                    </div>
                </section>

                <!-- Filtros (mínimo viável) -->
                <section class="vcp-sec">
                    <div class="vcp-title">Filtros</div>
                    <div v-for="(f, i) in localFilters" :key="i" class="d-flex gap-2 mb-2">
                        <select v-model="f.field" class="form-select form-select-sm" style="width: 160px">
                            <option :value="''" disabled>Campo…</option>
                            <option v-for="(cfg, key) in localSchema" :key="key" :value="key">{{ cfg.label || key }}
                            </option>
                        </select>
                        <select v-model="f.op" class="form-select form-select-sm" style="width: 140px">
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
                        <select v-model="s.field" class="form-select form-select-sm" style="width: 180px">
                            <option :value="''" disabled>Campo…</option>
                            <option v-for="(cfg, key) in localSchema" :key="key" :value="key">{{ cfg.label || key }}
                            </option>
                        </select>
                        <select v-model="s.dir" class="form-select form-select-sm" style="width: 120px">
                            <option value="asc">Asc</option>
                            <option value="desc">Desc</option>
                        </select>
                        <button class="btn btn-sm btn-outline-danger" @click="removeSorter(i)">Remover</button>
                    </div>
                    <button class="btn btn-sm btn-outline-light" @click="addSorter">+ Adicionar ordem</button>
                </section>

                <div class="d-flex justify-content-end gap-2 mt-3">
                    <button class="btn btn-sm btn-outline-light" @click="$emit('update:open', false)">Cancelar</button>
                    <button class="btn btn-sm btn-primary" @click="apply">Aplicar</button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

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

// cópias locais editáveis
const localSchema = reactive<Record<string, any>>({})
const localFilters = reactive<any[]>([])
const localSorters = reactive<any[]>([])

function syncLocals() {
    Object.keys(localSchema).forEach(k => delete (localSchema as any)[k])
    Object.entries(props.schema || {}).forEach(([k, v]) => (localSchema as any)[k] = { ...v })

    localFilters.splice(0)
    props.filters?.forEach(f => localFilters.push({ ...f }))

    localSorters.splice(0)
    props.sorters?.forEach(s => localSorters.push({ ...s }))
}
watch(() => props.open, (v) => v && syncLocals(), { immediate: true })

function toggleHidden(key: string) {
    localSchema[key].hidden = !!localSchema[key].hidden
}
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
.vcp-wrap {
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: rgba(0, 0, 0, .35);
    display: grid;
    place-items: center;
}

.vcp-panel {
    width: min(920px, 94vw);
    max-height: 88vh;
    overflow: auto;
    background: #11191f;
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, .45);
}

.vcp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px
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
