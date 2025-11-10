<!-- app/components/modals/TaskModal.vue -->
<template>
    <teleport to="body">
        <div class="tm-wrap" v-show="wrapShow" :class="{ 'tm-side': mode === 'side' }">
            <!-- Backdrop apenas visual (cliques passam por ele) -->
            <div class="tm-backdrop"></div>

            <div v-if="task" :key="modal.taskId" ref="panel" class="tm-panel" :class="panelClass">
                <!-- HEADER -->
                <div class="tm-header">
                    <div class="tm-title">
                        <FieldInlineEdit :value="task?.name" :component="FieldText"
                            :componentProps="{ config: { placeholder: 'Título' } }"
                            @update="v => patch({ name: (v ?? '').toString() })" />
                    </div>

                    <div class="tm-actions">
                        <div class="tm-menu">
                            <button class="icon-btn" @click="menuOpen = !menuOpen" title="Visualização">
                                <i class="i-gear"></i>
                            </button>
                            <div v-if="menuOpen" class="tm-pop" @mousedown.stop>
                                <div class="tm-pop-title">Visualização</div>
                                <label class="tm-option" @click="setModeAndClose('side')">
                                    <input type="radio" name="tmview" :checked="mode === 'side'"> Modo lado a lado
                                </label>
                                <label class="tm-option" @click="setModeAndClose('center')">
                                    <input type="radio" name="tmview" :checked="mode === 'center'"> Modo centralizado
                                </label>
                            </div>
                        </div>

                        <button class="icon-btn" @click="minimize" title="Minimizar"><i class="i-min"></i></button>
                        <button class="icon-btn" @click="requestClose" title="Fechar (Esc)"><i class="i-x"></i></button>
                    </div>
                </div>

                <!-- BODY -->
                <div class="tm-body">
                    <div class="tm-col">
                        <div class="tm-field">
                            <div class="tm-label">Cliente</div>
                            <FieldInlineEdit :row="task" field-key="client_id" :value="task?.client_id"
                                :component="FieldSelect"
                                :componentProps="{ config: { placeholder: 'Selecione o cliente', options: clientsOptions, valueType: 'number' } }"
                                @update="v => patch({ client_id: v || null })" />
                        </div>

                        <div class="tm-field">
                            <div class="tm-label">Responsável</div>
                            <FieldInlineEdit :row="task" field-key="user_id" :value="task?.user_id"
                                :component="FieldSelect"
                                :componentProps="{ config: { placeholder: 'Selecione o responsável', options: usersOptions, valueType: 'number' } }"
                                @update="v => patch({ user_id: v || null })" />
                        </div>

                        <div class="tm-row">
                            <div class="tm-field w-50">
                                <div class="tm-label">Início</div>
                                <FieldInlineEdit :value="task?.start_date" :component="FieldDate"
                                    :componentProps="{ config: { placeholder: 'Início' } }"
                                    @update="v => patch({ start_date: v || null })" />
                            </div>
                            <div class="tm-field w-50">
                                <div class="tm-label">Prazo</div>
                                <FieldInlineEdit :value="task?.due_date" :component="FieldDate"
                                    :componentProps="{ config: { placeholder: 'Prazo' } }"
                                    @update="v => patch({ due_date: v || null })" />
                            </div>
                        </div>

                        <div class="tm-field">
                            <div class="tm-label">Prioridade</div>
                            <FieldInlineEdit :row="task" field-key="priority" :value="task?.priority"
                                :component="FieldSelect"
                                :componentProps="{ config: { placeholder: 'Defina a prioridade', options: priorityOptions } }"
                                @update="v => patch({ priority: v || '' })" />
                        </div>

                        <div class="tm-field">
                            <div class="tm-label">Tipo</div>
                            <FieldInlineEdit :row="task" field-key="type_task" :value="task?.type_task"
                                :component="FieldSelect"
                                :componentProps="{ config: { placeholder: 'Selecione o tipo', options: typeTaskOptions } }"
                                @update="v => patch({ type_task: v || null })" />
                        </div>

                        <div class="tm-field">
                            <div class="tm-label">Envolvidos</div>
                            <FieldInlineEdit :row="task" field-key="involved_users" :value="involvedUsersArray"
                                :component="FieldSelect"
                                :componentProps="{ config: { placeholder: 'Adicionar envolvidos', options: usersOptions, multiple: true } }"
                                @update="v => patch({ involved_users: toCsv(v as any[]) })" />
                        </div>

                        <div class="tm-field">
                            <div class="tm-label">Comentário</div>
                            <FieldInlineEdit :value="task?.comment" :component="FieldText"
                                :componentProps="{ config: { placeholder: 'Adicione um comentário' } }"
                                @update="v => patch({ comment: v || null })" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useTaskModal } from '@/stores/taskModal'
import FieldInlineEdit from '@/components/ui/fields/FieldInlineEdit.vue'
import FieldText from '@/components/ui/fields/FieldText.vue'
import FieldSelect from '@/components/ui/fields/FieldSelect.vue'
import FieldDate from '@/components/ui/fields/FieldDate.vue'

const props = defineProps<{ task: any | null; users?: any; clients?: any }>()
const emit = defineEmits<{ (e: 'update', patch: Record<string, any>): void }>()
const patch = (p: Record<string, any>) => emit('update', p)

/* store + flags */
const modal = useTaskModal()
const { open, mode } = storeToRefs(modal)
const visible = computed(() => open.value)
const wrapShow = ref(false)
const menuOpen = ref(false)

/* animação */
const state = ref<'closed' | 'opening' | 'open' | 'closing'>('closed')
const ANIM_MS = 260
const panel = ref<HTMLElement | null>(null)
const panelClass = computed(() => ({
    'tm-open': state.value === 'open',
    'tm-opening': state.value === 'opening',
    'tm-closing': state.value === 'closing',
    'tm-min': modal.minimized,
}))

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
const doubleRaf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

function requestClose() { modal.close() }
function minimize() { modal.minimize() }
function setModeAndClose(m: 'center' | 'side') {
    modal.setMode(m)
    localStorage.setItem('task_modal_mode', m)
    menuOpen.value = false
}

/* abrir/fechar com animação estável */
watch(visible, async v => {
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
})

/* ESC */
function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && open.value) requestClose() }

/* -------- CLICK GLOBAL (capture) — comportamento Notion --------
   - dentro do painel => ignora
   - clicou numa .board-card => mantém aberto, troca task
   - outro lugar => fecha
   O backdrop não intercepta cliques (pointer-events: none), então
   o evento alcança os elementos da página.
---------------------------------------------------------------- */
function onGlobalPointerDown(e: PointerEvent) {
    if (!open.value) return
    const target = e.target as HTMLElement
    if (panel.value?.contains(target)) return

    const card = target.closest('.board-card') as HTMLElement | null
    if (card) {
        const idAttr = card.getAttribute('data-task-id')
        const nextId = Number(idAttr)
        if (Number.isFinite(nextId)) {
            modal.show(nextId)    // troca conteúdo, mantém aberto
            e.preventDefault()
            e.stopPropagation()
            return
        }
    }
    // clicou fora de tudo que interessa => fecha
    requestClose()
}

onMounted(() => {
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onGlobalPointerDown, true) // capture
})
onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey)
    document.removeEventListener('pointerdown', onGlobalPointerDown, true)
})

/* normalização de listas (evita map em não-array) */
function asArray<T = any>(x: any): T[] {
    if (Array.isArray(x)) return x
    if (x && Array.isArray(x.data)) return x.data
    if (x && typeof x === 'object') return Object.values(x) as T[]
    return []
}
const toOptions = <T,>(arr: T[], getV: (t: T) => any, getL: (t: T) => string) =>
    asArray(arr).map((t: any) => ({ value: getV(t), label: getL(t) }))

const usersOptions = computed(() =>
    toOptions(asArray(props.users ?? []), u => u.id, u => u.name ?? u.nick ?? u.email ?? String(u.id))
)
const clientsOptions = computed(() =>
    toOptions(asArray(props.clients ?? []), c => c.id, c => c.name ?? String(c.id))
)

/* opções fixas */
const priorityOptions = [
    { value: '1', label: 'Baixa' }, { value: '2', label: 'Média' }, { value: '3', label: 'Alta' }
]
const typeTaskOptions = [
    { value: 'design', label: 'Design' }, { value: 'vídeo', label: 'Vídeo' },
    { value: 'filme', label: 'Filme' }, { value: 'copy', label: 'Copy' }, { value: '3D', label: '3D' }
]

/* involved users csv <-> array */
const involvedUsersArray = computed<any[]>(() => {
    const raw = props.task?.involved_users
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    return String(raw).split(',').map(s => s.trim()).filter(Boolean)
})
const toCsv = (arr: any[]) => (arr && arr.length ? arr.join(',') : null)
</script>

<style scoped lang="scss">
.tm-wrap {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: grid;
    place-items: center;
    /* NÃO bloquear cliques na página -> modal decide no listener global */
    pointer-events: none;
}

.tm-backdrop {
    position: absolute;
    inset: 0;
   // background: rgba(0, 0, 0, .38);
    /* apenas visual */
    pointer-events: none;
}

.tm-side {
    place-items: stretch end;
}

.tm-panel {
    pointer-events: auto;
    /* painel interativo */
    width: min(920px, 92vw);
    max-height: 88vh;
    background: #11191f;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, .45);

    /* Apple-like zoom (center) */
    opacity: 0;
    transform: translateY(8px) scale(.96);
    filter: saturate(.96) blur(.2px);
    transition:
        opacity .26s cubic-bezier(.22, .61, .36, 1),
        transform .26s cubic-bezier(.22, .61, .36, 1),
        filter .26s ease;

    &.tm-opening,
    &.tm-open {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: none;
    }

    &.tm-closing {
        opacity: 0;
        transform: translateY(8px) scale(.985);
        filter: saturate(.9) blur(.25px);
    }

    &.tm-min {
        transform: translateY(18px) scale(.97);
        opacity: .92
    }
}

/* Sheet lateral */
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

/* Header / Menu */
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
    z-index: 2;
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

/* Body / fields */
.tm-body {
    padding: 1rem;
    overflow: auto;
    max-height: calc(88vh - 54px)
}

.tm-row {
    display: flex;
    gap: .75rem
}

.tm-col {
    display: flex;
    flex-direction: column;
    gap: .75rem
}

.tm-field .tm-label {
    font-size: .8rem;
    color: #aab6c2;
    margin-bottom: .25rem
}

.w-50 {
    width: 50%
}
</style>
