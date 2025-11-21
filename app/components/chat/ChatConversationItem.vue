<template>
    <div class="chat-conversation-item w-100 text-start " :class="{ 'chat-conversation-item--active': active }"
        role="button" tabindex="0" @click="handleClick" @keydown.enter.prevent="handleClick"
        @keydown.space.prevent="handleClick">
        <div class="d-flex gap-2 align-items-center w-100">
            <!-- Avatar simples / iniciais -->
            <div class="chat-conversation-item__avatar  d-flex align-items-center justify-content-center">
                <span class="fw-semibold">
                    {{ getInitials(conversation.contactName) }}
                </span>
            </div>

            <div class="flex-grow-1" style="overflow-x: hidden;">
                <div class="d-flex justify-content-between align-items-center w-100">
                    <div class="contact-name">
                        {{ conversation.contactName }}
                    </div>
                    <small class="last-msg  ms-2">
                        {{ formatTime(conversation.lastMessageAt) }}
                    </small>

                </div>

                <div class="text-truncate small text-muted chat-conversation-item__last-message">
                    {{ conversation.lastMessage }}

                    <!-- Não lidas -->
                    <div v-if="conversation.unreadCount > 0" class=" msgs-not-reads">
                        <span class="badge rounded-pill bg-success-subtle text-success fw-semibold">
                            {{ conversation.unreadCount }}
                        </span>
                    </div>
                </div>

                <div class="d-flex align-items-center gap-1 mt-1 flex-wrap">
                    <span class="badge rounded-pill bg-light text-muted text-capitalize">
                        {{ conversation.channel }}
                    </span>

                    <span v-if="conversation.status !== 'open'"
                        class="badge rounded-pill bg-outline-secondary text-muted text-capitalize">
                        {{ conversation.status }}
                    </span>

                    <span v-if="conversation.assignedTo" class="badge rounded-pill bg-outline-secondary text-muted">
                        {{ conversation.assignedTo }}
                    </span>
                </div>
            </div>


        </div>
    </div>
</template>

<script setup lang="ts">
import type { Conversation } from '~/stores/chat'

const props = defineProps<{
    conversation: Conversation
    active?: boolean
}>()

const emit = defineEmits<{
    (e: 'select', id: number): void
}>()

function handleClick() {
    emit('select', props.conversation.id)
}

function getInitials(name: string): string {
    if (!name) return '?'
    const parts = name.split(' ').filter(Boolean)
    if (!parts.length) return '?'
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (
        parts[0].charAt(0).toUpperCase() +
        parts[parts.length - 1].charAt(0).toUpperCase()
    )
}

function formatTime(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    })
}
</script>

<style scoped lang="scss">
@use "~/assets/scss/_tokens.scss" as *;

.chat-conversation-item {
    cursor: pointer;
    border-radius: 12px;
    transition: background-color 0.15s ease;
    // background: var(--nx-primary-200);
    background: transparent !important;
    padding: 8px 12px;
    width: 95% !important;

    &+& {
        margin-top: 2px;
    }

    &:hover {
        background: var(--nx-primary-200) !important;
    }
}

.chat-conversation-item__avatar {
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
    min-height: 36px !important;
    border-radius: 50%;
    background-color: var(--nx-bg);
    font-size: 0.8rem;
}

.chat-conversation-item__last-message {
    position: relative;
    font-size: .8rem;
    color: var(--nx-muted);

    /* faz o texto caber em 1 linha e cortar com "..." */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    /* reserva espaço pro círculo de não lidas */
    padding-right: 22px;
}

.msgs-not-reads {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    font-size: .7rem;
    background: var(--nx-muted);
    width: 15px;
    height: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
}

.contact-name {
    font-size: .9rem;
}

.last-msg {
    color: #fff;
}

.badge {
    font-size: .6rem;
    padding: 2px 4px;
}
</style>
