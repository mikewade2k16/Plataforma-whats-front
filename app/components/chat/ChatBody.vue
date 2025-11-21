<template>
    <div ref="bodyRef" class="chat-main__body flex-grow-1 overflow-auto px-3 py-3">
        <template v-if="activeConversation">
            <div v-for="msg in messages" :key="msg.id" class="chat-message-row mb-2"
                :class="msg.direction === 'out' ? 'is-out' : 'is-in'">
                <div class="chat-message-row__inner d-flex" :class="msg.direction === 'out'
                    ? 'justify-content-end'
                    : 'justify-content-start'">
                    <div class="chat-message-row__bubble-wrapper">
                        <!-- Botão de ações (só aparece no hover) -->
                        <div class="chat-message-row__actions">
                            <!-- botão de 3 pontinhos -->
                            <button type="button" class="chat-message-row__menu-btn" @click.stop="toggleMenu(msg.id)">
                                ⋮
                            </button>

                            <!-- menu próprio -->
                            <div v-if="openMenuId === msg.id" class="chat-msg-menu" @click.stop>
                                <button type="button" class="chat-msg-menu__item" @click.stop="handleReply(msg)">
                                    Responder
                                </button>
                                <button type="button" class="chat-msg-menu__item" @click.stop="handleCopy(msg)">
                                    Copiar
                                </button>
                                <button type="button" class="chat-msg-menu__item" @click.stop="handleForward(msg)">
                                    Encaminhar
                                </button>
                                <button type="button" class="chat-msg-menu__item chat-msg-menu__item--danger"
                                    @click.stop="handleDelete(msg)">
                                    Apagar
                                </button>
                            </div>
                        </div>

                        <!-- Bolha -->
                        <div class="chat-bubble" :class="{
                            'chat-bubble--out': msg.direction === 'out',
                            'chat-bubble--in': msg.direction === 'in',
                        }">
                            <!-- Nome do atendente na msg de saída -->
                            <div v-if="msg.direction === 'out' && msg.userName"
                                class="small text-muted mb-1 chat-bubble__from">
                                {{ msg.userName }}
                            </div>

                            <!-- Bloco de resposta (só aparece se existir replyTo) -->
                            <div v-if="msg.replyTo" class="chat-bubble__reply">
                                <div class="chat-bubble__reply-author">
                                    {{ msg.replyTo.author || 'Contato' }}
                                </div>
                                <div class="chat-bubble__reply-text">
                                    {{ msg.replyTo.text }}
                                </div>
                            </div>

                            <!-- Texto principal – preserva quebras e espaços -->
                            <pre class="chat-bubble__text">{{ msg.text }}</pre>

                            <!-- Meta (hora, status) -->
                            <div class="chat-bubble__meta small text-muted mt-1">
                                {{ formatTime(msg.createdAt) }}
                                <span v-if="msg.status" class="ms-1">
                                    • {{ msg.status }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <div v-else class="h-100 d-flex align-items-center justify-content-center text-muted">
            <span>Escolha uma conversa para começar o atendimento.</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import type { Conversation, Message } from '~/stores/chat'

interface ReplyInfo {
    author?: string
    text?: string
}

type ChatMessage = Message & {
    replyTo?: ReplyInfo | null
}

const props = defineProps<{
    activeConversation: Conversation | null
    messages: ChatMessage[]
    formatTime: (iso: string) => string
}>()

const emit = defineEmits<{
    (e: 'reply', msg: ChatMessage): void
    (e: 'copy', msg: ChatMessage): void
    (e: 'forward', msg: ChatMessage): void
    (e: 'delete', msg: ChatMessage): void
    (e: 'select', msg: ChatMessage): void
}>()

const bodyRef = ref<HTMLDivElement | null>(null)
const openMenuId = ref<number | null>(null)

/* ===== scroll ===== */
function scrollToBottom() {
    const el = bodyRef.value
    if (!el) return
    el.scrollTop = el.scrollHeight
}

watch(
    () => [props.activeConversation?.id, props.messages.length],
    () => {
        nextTick(scrollToBottom)
    },
)

onMounted(() => {
    nextTick(scrollToBottom)
    window.addEventListener('click', onGlobalClick)
})

onBeforeUnmount(() => {
    window.removeEventListener('click', onGlobalClick)
})

function onGlobalClick() {
    openMenuId.value = null
}

/* ===== menu ===== */
function toggleMenu(id: number) {
    openMenuId.value = openMenuId.value === id ? null : id
}

function closeMenu() {
    openMenuId.value = null
}

/* ===== Ações do menu ===== */
function handleReply(msg: ChatMessage) {
    emit('reply', msg)
    closeMenu()
}

function handleCopy(msg: ChatMessage) {
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(msg.text).catch(err => {
            console.error('Erro ao copiar mensagem:', err)
        })
    }
    emit('copy', msg)
    closeMenu()
}

function handleForward(msg: ChatMessage) {
    emit('forward', msg)
    closeMenu()
}

function handleDelete(msg: ChatMessage) {
    emit('delete', msg)
    closeMenu()
}

function handleSelect(msg: ChatMessage) {
    emit('select', msg)
    closeMenu()
}

defineExpose({ scrollToBottom })
</script>

<style scoped lang="scss">
.chat-main__body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
}

/* Linha da mensagem */
.chat-message-row {
    position: relative;
}

.chat-message-row__inner {
    width: 100%;
}

.chat-message-row__bubble-wrapper {
    position: relative;
    max-width: 80%;
}

/* Área das ações */
.chat-message-row__actions {
    position: absolute;
    top: -6px;
    left: -26px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
}

.chat-message-row.is-in .chat-message-row__actions {
    right: auto;
    left: -26px;
}

/* mostra apenas no hover da linha */
.chat-message-row:hover .chat-message-row__actions {
    opacity: 1;
    pointer-events: auto;
}

/* Botão ⋮ */
.chat-message-row__menu-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    padding: 0;
    color: rgba(255, 255, 255, 0.7);
}

/* Menu do dropdown */
.chat-msg-menu {
    position: absolute;
    top: 0;
    right: 0;
    transform: translateY(-100%);
    background: #111;
    border-radius: 8px;
    padding: 4px 0;
    min-width: 180px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    z-index: 10;
}

.chat-message-row.is-in .chat-msg-menu {
    right: auto;
    left: 0;
}

.chat-msg-menu__item {
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    padding: 6px 10px;
    font-size: 0.8rem;
    color: #fff;
    cursor: pointer;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
    }

    &--danger {
        color: #ff6b6b;
    }
}

/* Bolhas */
.chat-bubble {
    max-width: 100%;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    font-size: 0.9rem;
    background: #1c1c1c;
    display: inline-flex;
    flex-direction: column;
    gap: 2px;

    &__from {
        opacity: 0.75;
    }

    &__text {
        margin: 0;
        white-space: pre-wrap;
        /* preserva \n e espaços */
        word-break: break-word;
    }

    &__meta {
        font-size: 0.75rem;
        align-self: flex-end;
        opacity: 0.8;
    }

    &__reply {
        border-left: 3px solid rgba(255, 255, 255, 0.4);
        padding-left: 6px;
        margin-bottom: 4px;
        font-size: 0.8rem;
        opacity: 0.85;
    }

    &__reply-author {
        font-weight: 600;
        margin-bottom: 2px;
    }

    &__reply-text {
        font-size: 0.78rem;
    }

    &--in {
        background: var(--nx-surface-soft, #0f3a3f);
        border-bottom-left-radius: 2px;
    }

    &--out {
        background: var(--nx-primary-400, #03685c);
        color: #fff;
        border-bottom-right-radius: 2px;

        .text-muted {
            color: #ececec !important;
        }
    }
}
</style>
