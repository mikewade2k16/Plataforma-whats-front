<!-- components/chat/ChatMessageInput.vue -->
<template>
    <div class="chat-input d-flex gap-2">
        <!-- EMOJIS -->
        <NxButton size="sm" variant="ghost" icon="smile" iconOnly dropdown dropdownType="menu" placement="top-start"
            :offset="4" tone="neutral">
            <template #menu>
                <div class="chat-input__emoji-panel">
                    <ChatEmojiPicker :recent="recentEmojis" @select="onEmojiClick"
                        @update:recent="val => (recentEmojis = val)" />
                </div>
            </template>
        </NxButton>

        <!-- ANEXO -->
        <NxButton size="sm" variant="ghost" icon="paperclip" iconOnly dropdown dropdownType="menu" placement="top-start"
            :offset="4" tone="neutral">
            <template #menu>
                <div class="chat-input__attach-menu">
                    <button v-for="opt in attachmentOptions" :key="opt.type" type="button"
                        class="chat-input__attach-item" @click="onSelectAttachment(opt.type)">
                        <span class="chat-input__attach-icon">
                            {{ opt.icon }}
                        </span>
                        <span class="chat-input__attach-text">
                            <span class="title">{{ opt.label }}</span>
                            <span class="desc">{{ opt.description }}</span>
                        </span>
                    </button>
                </div>
            </template>
        </NxButton>

        <!-- CAMPO DE TEXTO (só ele cresce) -->
        <div class="flex-grow-1 chat-input__textarea-wrap">
            <textarea ref="textareaRef" class="chat-input__textarea" :placeholder="placeholder" :disabled="disabled"
                rows="1" :value="modelValue" @input="onInput" @keydown="onKeydown"></textarea>
        </div>

        <!-- ENVIAR -->
        <NxButton size="sm" variant="ghost" icon="send" iconOnly tone="primary"
            :disabled="disabled || !modelValue.trim()" @click="handleSend" />
    </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import NxButton from '~/components/buttons/NxButton.vue'
import ChatEmojiPicker from '~/components/chat/ChatEmojiPicker.vue'

const props = defineProps<{
    modelValue: string
    disabled?: boolean
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'send', value: string): void
    (e: 'attachment', type: 'image' | 'document'): void
    (e: 'emoji', value: string): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const maxHeight = 200

function resize() {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${newHeight}px`
}

function onInput(e: Event) {
    const target = e.target as HTMLTextAreaElement
    const value = target.value
    emit('update:modelValue', value)
    nextTick(resize)
}

/* ===== Enter / Ctrl+Enter ===== */
function insertNewline() {
    const el = textareaRef.value
    if (!el) return
    const value = props.modelValue ?? ''
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const newValue = value.slice(0, start) + '\n' + value.slice(end)
    emit('update:modelValue', newValue)
    nextTick(() => {
        const pos = start + 1
        if (textareaRef.value) {
            textareaRef.value.selectionStart = pos
            textareaRef.value.selectionEnd = pos
        }
        resize()
    })
}

function handleSend() {
    if (props.disabled) return
    const raw = props.modelValue ?? ''

    // bloqueia msg só com espaços / quebras
    if (!raw.replace(/\s+/g, '').length) return

    // envia o texto EXATAMENTE como está
    emit('send', raw)
}

function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'Enter') return

    if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        insertNewline()
        return
    }

    e.preventDefault()
    handleSend()
}

/* ===== Anexos / Emojis mantêm o mesmo ===== */
const attachmentOptions = [
    {
        type: 'image' as const,
        icon: '🖼️',
        label: 'Fotos e vídeos',
    },
    {
        type: 'document' as const,
        icon: '📄',
        label: 'Documentos',
    },
]

function onSelectAttachment(type: 'image' | 'document') {
    emit('attachment', type)
}

const recentEmojis = ref<string[]>([])

function onEmojiClick(emoji: string) {
    emit('emoji', emoji)
    const value = (props.modelValue || '') + emoji
    emit('update:modelValue', value)
    nextTick(resize)
}

onMounted(() => {
    nextTick(resize)
})

watch(
    () => props.modelValue,
    () => {
        nextTick(resize)
    },
)
</script>


<style scoped lang="scss">
.chat-input {
    background-color: #202020; // ideal trocar por var(--nx-surface-strong)
    border-radius: 8px;
    padding: 4px 8px;
    align-items: flex-end;
}

/* só a textarea cresce */
.chat-input__textarea-wrap {
    max-height: 200px;
    overflow-y: auto;
}

.chat-input__textarea {
    width: 100%;
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    color: inherit;
    font-size: 0.95rem;
    line-height: 1.4;
    max-height: 200px;
    padding: 4px 0;
}

/* deixar os ícones compactos */
:deep(.nx-btn.is-icon-only) {
    padding: 0.35rem;
}

/* ===== menu de anexos (lista vertical tipo Whats) ===== */
.chat-input__attach-menu {
    display: flex;
    flex-direction: column;
    min-width: 260px;
    // background: #111; // var(--nx-surface-strong)
    border-radius: 10px;
    padding: 6px;
}

.chat-input__attach-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    border-radius: 8px;
    border: none;
    background: transparent !important;
    color: #fff;
    text-align: left;
    cursor: pointer;
    font-size: 0.8rem;

    &:hover {
        background: rgba(255, 255, 255, 0.06);
    }
}

.chat-input__attach-icon {
    font-size: 1.2rem;
    width: 24px;
    text-align: center;
}

.chat-input__attach-text {
    display: flex;
    flex-direction: column;

    .title {
        font-weight: 500;
    }

    .desc {
        font-size: 0.7rem;
        opacity: 0.7;
    }
}

/* painel de emoji dentro do dropdown */
.chat-input__emoji-panel {
    /* NxButton já posiciona, aqui a gente só garante que nada estoure */
}
</style>
