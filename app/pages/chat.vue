<template>
  <div class="chat-page nx-card container-fluid py-0 h-100">
    <div class="row h-100">
      <!-- COLUNA ESQUERDA – LISTA DE CONVERSAS -->
      <div class="col-md-3 h-100">
        <aside class="chat-sidebar h-100 d-flex flex-column">
          <!-- Header + filtros -->
          <div class="chat-sidebar__header">
            <div class="content p-3">
              <div class="d-flex justify-content-between align-items-center mb-2 gap-2">
                <h5 class="mb-0">Conversas</h5>
                <NxButton size="sm" variant="ghost">
                  Filtros
                </NxButton>
              </div>

              <!-- Busca -->
              <div class="mb-2 w-100">
                <input v-model="search" type="text" class="form-control w-100"
                  placeholder="Buscar por nome ou mensagem..." />
              </div>

              <!-- Filtros de canal / status -->
              <div class="d-flex gap-2">
                <select v-model="channel" class="form-select form-select-sm">
                  <option v-for="opt in channelOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>

                <select v-model="status" class="form-select form-select-sm">
                  <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Lista de conversas -->
          <div class="chat-sidebar__list">
            <ChatConversationItem v-for="conv in filteredConversations" :key="conv.id" :conversation="conv"
              :active="conv.id === activeConversationId" @select="selectConversation" />

            <div v-if="!filteredConversations.length" class="text-center text-muted small p-3">
              Nenhuma conversa encontrada.
            </div>
          </div>
        </aside>
      </div>

      <!-- COLUNA CENTRAL – CHAT -->
      <div class="col-md-6 h-100 chat-msg">
        <section class="chat-main h-100 d-flex flex-column">
          <!-- Header da conversa -->
          <div class="chat-main__header px-3 py-2 d-flex align-items-center justify-content-between">
            <div v-if="activeConversation" class="d-flex align-items-center gap-2">
              <div class="chat-main__avatar rounded-circle d-flex align-items-center justify-content-center">
                <span class="fw-semibold">
                  {{ getInitials(activeConversation.contactName) }}
                </span>
              </div>

              <div>
                <div class="fw-semibold">
                  {{ activeConversation.contactName }}
                </div>
                <div class="small text-muted d-flex align-items-center gap-1">
                  <span class="text-capitalize">
                    {{ activeConversation.channel }}
                  </span>
                  <span>•</span>
                  <span class="text-capitalize">
                    {{ activeConversation.status }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="text-muted small">
              Selecione uma conversa na lista ao lado.
            </div>

            <div class="d-flex gap-2">
              <NxButton size="sm" variant="ghost">
                Encerrar
              </NxButton>
              <NxButton size="sm" variant="outline">
                Transferir
              </NxButton>
            </div>
          </div>

          <!-- Corpo da conversa (novo componente) -->
          <ChatBody :active-conversation="activeConversation" :messages="activeMessages" :format-time="formatTime" />

          <!-- Rodapé / input de mensagem -->
          <div class="chat-main__footer px-3">
            <ChatMessageInput v-model="draft" :disabled="!activeConversation" placeholder="Escreva uma mensagem..."
              @send="handleSend" @attachment="handleAttachment"
              @emoji="emoji => console.log('emoji escolhido', emoji)" />
          </div>
        </section>
      </div>

      <!-- COLUNA DIREITA – DETALHES -->
      <div class="col-md-3 h-100">
        <aside class="chat-details h-100 d-flex flex-column">
          <div class="border-bottom px-3 py-2">
            <h6 class="mb-0">Detalhes</h6>
          </div>

          <div v-if="activeConversation" class="p-3 small overflow-auto">
            <div class="mb-3">
              <div class="fw-semibold mb-1">Contato</div>
              <div>{{ activeConversation.contactName }}</div>
            </div>

            <div class="mb-3">
              <div class="fw-semibold mb-1">Canal</div>
              <div class="text-capitalize">
                {{ activeConversation.channel }}
              </div>
            </div>

            <div class="mb-3">
              <div class="fw-semibold mb-1">Status</div>
              <div class="text-capitalize">
                {{ activeConversation.status }}
              </div>
            </div>

            <div class="mb-3">
              <div class="fw-semibold mb-1">Responsável</div>
              <div>{{ activeConversation.assignedTo || 'Não atribuído' }}</div>
            </div>

            <div class="mb-3" v-if="activeConversation.tags?.length">
              <div class="fw-semibold mb-1">Tags</div>
              <div class="d-flex flex-wrap gap-1">
                <span v-for="tag in activeConversation.tags" :key="tag" class="badge rounded-pill bg-light text-muted">
                  {{ tag }}
                </span>
              </div>
            </div>

            <div class="mb-3">
              <div class="fw-semibold mb-1">Notas internas</div>
              <textarea v-model="internalNotes" rows="3" class="form-control form-control-sm"
                placeholder="Adicione observações sobre esse contato..."></textarea>
            </div>

            <div class="mb-3">
              <div class="fw-semibold mb-1">Histórico rápido</div>
              <ul class="list-unstyled mb-0">
                <li class="text-muted">• 3 atendimentos anteriores</li>
                <li class="text-muted">• Último atendimento há 2 dias</li>
              </ul>
            </div>
          </div>

          <div v-else class="p-3 text-muted small">
            Selecione uma conversa para ver os detalhes do contato.
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '~/stores/chat'

import ChatConversationItem from '~/components/chat/ChatConversationItem.vue'
import ChatMessageInput from '~/components/chat/ChatMessageInput.vue'
import ChatBody from '~/components/chat/ChatBody.vue'
import NxButton from '~/components/buttons/NxButton.vue'

const chatStore = useChatStore()

const { filteredConversations, activeConversation, activeMessages } =
  storeToRefs(chatStore)

const activeConversationId = computed(() => chatStore.activeConversationId)

// filtros
const search = computed({
  get: () => chatStore.filters.search,
  set: value => chatStore.setFilters({ search: value }),
})

const channel = computed({
  get: () => chatStore.filters.channel,
  set: value => chatStore.setFilters({ channel: value as any }),
})

const status = computed({
  get: () => chatStore.filters.status,
  set: value => chatStore.setFilters({ status: value as any }),
})

const draft = ref('')
const internalNotes = ref('')

const channelOptions = [
  { label: 'Todos canais', value: 'all' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Outros', value: 'other' },
]

const statusOptions = [
  { label: 'Todos status', value: 'all' },
  { label: 'Abertos', value: 'open' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Encerrados', value: 'closed' },
]

function selectConversation(id: number) {
  chatStore.setActiveConversation(id)
}

function handleSend(text: string) {
  if (!activeConversation.value) return

  // aqui ele já vem exatamente como digitado
  // mas vamos garantir que não é só espaço/quebra
  if (!text.replace(/\s+/g, '').length) return

  chatStore.sendMessage(text, 'Atendente')
  draft.value = ''
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

function handleAttachment(payload: { type: 'image' | 'document'; files: File[] }) {
  console.log('upload', payload.type, payload.files)
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  chatStore.seedMockData()
  document.body.classList.add('is-chat-page')
})

onBeforeUnmount(() => {
  document.body.classList.remove('is-chat-page')
})
</script>



<style scoped lang="scss">
.chat-msg {
  background: var(--nx-bg);
  margin: 0 !important;
}

/* CHAT PAGE: vira um flex container de altura fixa */
.chat-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px - 1.8rem); // mesmo cálculo que você já usava
  max-height: calc(100vh - 64px - 1.8rem);
  overflow: hidden; // nada dentro daqui empurra o body
}

/* A row ocupa 100% da altura do chat-page */
.chat-page>.row {
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
}

/* SIDEBAR ESQUERDA */
.chat-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  position: relative !important;



  &::after {
    content: ' ';
    position: absolute;
    width: 100%;
    height: 15px;
    bottom: 0;
    background: linear-gradient(to bottom, transparent, var(--nx-bg));
    // background: red;
  }
}

.chat-main__header {
  //background: var(--nx-primary-200);
  position: relative;

  &::before {
    content: ' ';
    position: absolute;
    width: 100%;
    height: 35px;
    bottom: -35px;
    left: 0;
    background: linear-gradient(to top, transparent, var(--nx-bg));
    //background: red;
  }
}

.chat-main__footer {
  position: relative;

  &::after {
    content: ' ';
    position: absolute;
    width: 100%;
    height: 25px;
    top: -25px;
    left: 0;
    background: linear-gradient(to bottom, transparent, var(--nx-bg));
    // background: red;
  }
}

.chat-sidebar__header {
  position: relative;
  padding: 0px;

  &::before {
    content: ' ';
    position: absolute;
    width: 100%;
    height: 25px;
    bottom: -15px;
    background: linear-gradient(to top, transparent, var(--nx-bg));
    // background: red;
  }
}

.chat-sidebar__list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 15px 0px !important;
  justify-content: center;
  align-items: center;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;



  // overflow-x: hidden !important
}

/* COLUNA CENTRAL */
.chat-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.chat-main__header,
.chat-main__footer {
  flex: 0 0 auto; // ficam sempre visíveis
}

.chat-main__body {
  flex: 1 1 auto; // cresce e ganha scroll
  min-height: 0;
  overflow-y: auto;
}

.chat-main__avatar {
  width: 40px;
  height: 40px;
  font-size: 0.9rem;
}



/* COLUNA DIREITA */
.chat-details {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* o bloco com p-3 small overflow-auto vira a área rolável */
.chat-details>.p-3.small {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}


.chat-conversation-item {
  cursor: pointer;
  border-radius: 12px;
  transition: background-color 0.15s ease;
  background: var(--nx-primary-200);
  padding: 8px 12px;
  max-width: 100%; // <--- garante que o card não estoure a coluna

  &+& {
    margin-top: 2px;
  }

  &:hover {
    // background-color: var(--bs-light);
  }

  &--active {
    // background-color: var(--bs-primary-bg-subtle);
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

/* ===== Última mensagem bem encaixada ===== */
.chat-conversation-item__last-message {
  position: relative;
  margin-top: 2px;
  font-size: .8rem;
  color: var(--nx-muted);

  /* 1 linha com “...” e espaço pro badge de não lidas */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 22px; // espaço pro .msgs-not-reads
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

.badge {
  font-size: .6rem;
  padding: 2px 4px;
}

/* Aplica nas duas áreas roláveis */
.chat-sidebar__list,
.chat-main__body {
  /* Firefox */
  scrollbar-width: thin; // fino
  scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
}

/* WebKit (Chrome, Edge, etc.) */
.chat-sidebar__list::-webkit-scrollbar,
.chat-main__body::-webkit-scrollbar {
  width: 8px;
  /* largura da barra vertical */
  height: 8px;
  /* altura da barra horizontal, se tiver */
}

/* trilho (fundo) */
.chat-sidebar__list::-webkit-scrollbar-track,
.chat-main__body::-webkit-scrollbar-track {
  background: transparent; // fundo transparente
}

/* “thumb” (a parte que arrasta) */
.chat-sidebar__list::-webkit-scrollbar-thumb,
.chat-main__body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18); // combina bem com fundo escuro
  border-radius: 999px;
  border: 2px solid transparent; // dá uma afinada visual
}

/* hover: fica um pouco mais marcada */
.chat-sidebar__list::-webkit-scrollbar-thumb:hover,
.chat-main__body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.28);
}

.col-md-3,
.col-md-6 {
  padding: 0 0rem !important;
}
</style>
<style lang="scss">
body.is-chat-page {
  overflow-y: hidden;
}
</style>
