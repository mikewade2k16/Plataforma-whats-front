// app/stores/chat.ts
import { defineStore } from 'pinia'

export type ChatChannel = 'whatsapp' | 'instagram' | 'facebook' | 'other'
export type ChatStatus = 'open' | 'pending' | 'closed'

export interface Conversation {
    id: number
    contactName: string
    contactAvatar?: string | null
    lastMessage: string
    lastMessageAt: string // ISO
    unreadCount: number
    channel: ChatChannel
    status: ChatStatus
    assignedTo?: string | null // nome do atendente
    tags?: string[]
}

export interface Message {
    id: number
    conversationId: number
    direction: 'in' | 'out' // in = cliente, out = atendente
    text: string
    createdAt: string // ISO
    userName?: string // nome do atendente (multiusuário)
    status?: 'sent' | 'delivered' | 'read'
}

interface Filters {
    search: string
    channel: 'all' | ChatChannel
    status: 'all' | ChatStatus
}

interface ChatState {
    conversations: Conversation[]
    messages: Record<number, Message[]>
    activeConversationId: number | null
    filters: Filters
    loading: boolean
}

export const useChatStore = defineStore('chat', {
    state: (): ChatState => ({
        conversations: [],
        messages: {},
        activeConversationId: null,
        filters: {
            search: '',
            channel: 'all',
            status: 'all',
        },
        loading: false,
    }),

    getters: {
        activeConversation(state): Conversation | null {
            return (
                state.conversations.find(c => c.id === state.activeConversationId) ?? null
            )
        },

        filteredConversations(state): Conversation[] {
            let list = [...state.conversations]

            // filtro de busca (nome + última mensagem)
            if (state.filters.search.trim()) {
                const q = state.filters.search.trim().toLowerCase()
                list = list.filter(
                    c =>
                        c.contactName.toLowerCase().includes(q) ||
                        c.lastMessage.toLowerCase().includes(q),
                )
            }

            if (state.filters.channel !== 'all') {
                list = list.filter(c => c.channel === state.filters.channel)
            }

            if (state.filters.status !== 'all') {
                list = list.filter(c => c.status === state.filters.status)
            }

            // ordena por data da última mensagem (desc)
            list.sort(
                (a, b) =>
                    new Date(b.lastMessageAt).getTime() -
                    new Date(a.lastMessageAt).getTime(),
            )

            return list
        },

        activeMessages(state): Message[] {
            if (!state.activeConversationId) return []
            return state.messages[state.activeConversationId] ?? []
        },
    },

    actions: {
        setFilters(partial: Partial<Filters>) {
            this.filters = { ...this.filters, ...partial }
        },

        setActiveConversation(id: number) {
            this.activeConversationId = id
        },

        // Mock inicial pra jogar algo na tela
        seedMockData() {
            if (this.conversations.length) return

            const now = new Date()
            const iso = (offsetMinutes: number) =>
                new Date(now.getTime() - offsetMinutes * 60000).toISOString()

            this.conversations = [
                // 1–3: os originais
                {
                    id: 1,
                    contactName: 'Maria Silva',
                    lastMessage: 'Perfeito, obrigada! 🙏',
                    lastMessageAt: iso(5),
                    unreadCount: 0,
                    channel: 'whatsapp',
                    status: 'open',
                    assignedTo: 'Jéssica',
                    tags: ['VIP', 'Cliente'],
                    contactAvatar: null,
                },
                {
                    id: 2,
                    contactName: '@joao.insta',
                    lastMessage: 'Esse modelo ainda tem no tamanho M? Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,',
                    lastMessageAt: iso(15),
                    unreadCount: 3,
                    channel: 'instagram',
                    status: 'open',
                    assignedTo: 'Tony',
                    tags: ['Novo lead'],
                    contactAvatar: null,
                },
                {
                    id: 3,
                    contactName: 'Cliente Black',
                    lastMessage: 'Podemos falar amanhã de manhã?',
                    lastMessageAt: iso(60),
                    unreadCount: 0,
                    channel: 'whatsapp',
                    status: 'pending',
                    assignedTo: 'Equipe',
                    tags: ['Pérola Black'],
                    contactAvatar: null,
                },

                // 4–25: extras pra testar scroll
                {
                    id: 4,
                    contactName: 'Carlos Pereira',
                    lastMessage: 'Consegue me enviar o orçamento atualizado?',
                    lastMessageAt: iso(20),
                    unreadCount: 1,
                    channel: 'whatsapp',
                    status: 'open',
                    assignedTo: 'Jéssica',
                    tags: ['Orçamento'],
                    contactAvatar: null,
                },
                {
                    id: 5,
                    contactName: '@cliente.riomar',
                    lastMessage: 'Gostei daquele anel com pedra verde 💚',
                    lastMessageAt: iso(25),
                    unreadCount: 0,
                    channel: 'instagram',
                    status: 'pending',
                    assignedTo: 'Tony',
                    tags: ['Interesse', 'Anel'],
                    contactAvatar: null,
                },
                {
                    id: 6,
                    contactName: 'Lucas Santos',
                    lastMessage: 'Pode separar pra eu passar na loja mais tarde?',
                    lastMessageAt: iso(35),
                    unreadCount: 2,
                    channel: 'whatsapp',
                    status: 'open',
                    assignedTo: 'Equipe',
                    tags: ['Retirada em loja'],
                    contactAvatar: null,
                },
                {
                    id: 7,
                    contactName: 'Fernanda Rocha',
                    lastMessage: 'Quero trocar o tamanho da pulseira.',
                    lastMessageAt: iso(45),
                    unreadCount: 0,
                    channel: 'facebook',
                    status: 'pending',
                    assignedTo: 'Jéssica',
                    tags: ['Troca'],
                    contactAvatar: null,
                },
                {
                    id: 8,
                    contactName: 'Bruno Andrade',
                    lastMessage: 'Tem como fazer um kit presente?',
                    lastMessageAt: iso(70),
                    unreadCount: 1,
                    channel: 'whatsapp',
                    status: 'open',
                    assignedTo: 'Tony',
                    tags: ['Kit presente'],
                    contactAvatar: null,
                },
                {
                    id: 9,
                    contactName: 'Carla - Indicação da Maria',
                    lastMessage: 'A Maria me indicou vocês, amei as fotos 😍',
                    lastMessageAt: iso(90),
                    unreadCount: 0,
                    channel: 'instagram',
                    status: 'open',
                    assignedTo: 'Jéssica',
                    tags: ['Indicação'],
                    contactAvatar: null,
                },
                {
                    id: 10,
                    contactName: 'Cliente Black 2',
                    lastMessage: 'Vocês ainda estão com a condição da Black?',
                    lastMessageAt: iso(120),
                    unreadCount: 4,
                    channel: 'whatsapp',
                    status: 'open',
                    assignedTo: 'Equipe',
                    tags: ['Pérola Black', 'Campanha'],
                    contactAvatar: null,
                },
                {
                    id: 11,
                    contactName: 'Patrícia Lima',
                    lastMessage: 'Consegue mandar as opções de colar mais delicadas?',
                    lastMessageAt: iso(140),
                    unreadCount: 0,
                    channel: 'whatsapp',
                    status: 'pending',
                    assignedTo: 'Jéssica',
                    tags: ['Colar', 'Delicado'],
                    contactAvatar: null,
                },
                {
                    id: 12,
                    contactName: 'Eduardo / Presente esposa',
                    lastMessage: 'É pra presente de aniversário, pode me ajudar?',
                    lastMessageAt: iso(160),
                    unreadCount: 1,
                    channel: 'instagram',
                    status: 'open',
                    assignedTo: 'Tony',
                    tags: ['Presente', 'Aniversário'],
                    contactAvatar: null,
                },
                {
                    id: 13,
                    contactName: 'Luana Freitas',
                    lastMessage: 'Qual o prazo pra entrega em Aracaju?',
                    lastMessageAt: iso(180),
                    unreadCount: 0,
                    channel: 'whatsapp',
                    status: 'pending',
                    assignedTo: 'Equipe',
                    tags: ['Entrega'],
                    contactAvatar: null,
                },
                {
                    id: 14,
                    contactName: 'Cliente Site',
                    lastMessage: 'Finalizei a compra mas não recebi confirmação.',
                    lastMessageAt: iso(200),
                    unreadCount: 2,
                    channel: 'other',
                    status: 'open',
                    assignedTo: 'Equipe',
                    tags: ['Site', 'Suporte'],
                    contactAvatar: null,
                },
                {
                    id: 15,
                    contactName: 'Mariana Castro',
                    lastMessage: 'Quero algo mais minimalista pro dia a dia.',
                    lastMessageAt: iso(220),
                    unreadCount: 0,
                    channel: 'instagram',
                    status: 'closed',
                    assignedTo: 'Jéssica',
                    tags: ['Minimalista'],
                    contactAvatar: null,
                },
                {
                    id: 16,
                    contactName: 'João Pedro',
                    lastMessage: 'Vocês fazem gravação no anel?',
                    lastMessageAt: iso(240),
                    unreadCount: 0,
                    channel: 'whatsapp',
                    status: 'open',
                    assignedTo: 'Tony',
                    tags: ['Gravação'],
                    contactAvatar: null,
                },
                {
                    id: 17,
                    contactName: 'Cliente Pós-venda',
                    lastMessage: 'Só pra dizer que amei a experiência de vocês 💛',
                    lastMessageAt: iso(260),
                    unreadCount: 0,
                    channel: 'whatsapp',
                    status: 'closed',
                    assignedTo: 'Equipe',
                    tags: ['Pós-venda'],
                    contactAvatar: null,
                },
                {
                    id: 18,
                    contactName: 'Bruna - Orçamento casamento',
                    lastMessage: 'Queria ver alianças com acabamento fosco.',
                    lastMessageAt: iso(280),
                    unreadCount: 1,
                    channel: 'instagram',
                    status: 'open',
                    assignedTo: 'Jéssica',
                    tags: ['Alianças', 'Casamento'],
                    contactAvatar: null,
                },
                {
                    id: 19,
                    contactName: 'Felipe Santos',
                    lastMessage: 'Consegue me avisar quando chegar a nova coleção?',
                    lastMessageAt: iso(300),
                    unreadCount: 0,
                    channel: 'whatsapp',
                    status: 'pending',
                    assignedTo: 'Equipe',
                    tags: ['Lista de espera'],
                    contactAvatar: null,
                },
                {
                    id: 20,
                    contactName: 'Cliente Corporativo',
                    lastMessage: 'Estamos vendo brindes pra um evento da empresa.',
                    lastMessageAt: iso(320),
                    unreadCount: 3,
                    channel: 'other',
                    status: 'open',
                    assignedTo: 'Tony',
                    tags: ['Corporativo', 'Brinde'],
                    contactAvatar: null,
                },
                {
                    id: 21,
                    contactName: 'Gabriela Ramos',
                    lastMessage: 'Vocês têm opção de pulseira infantil?',
                    lastMessageAt: iso(340),
                    unreadCount: 0,
                    channel: 'facebook',
                    status: 'open',
                    assignedTo: 'Jéssica',
                    tags: ['Infantil'],
                    contactAvatar: null,
                },
                {
                    id: 22,
                    contactName: 'Cliente Black 3',
                    lastMessage: 'Quero ver as opções da lista Black desse ano.',
                    lastMessageAt: iso(360),
                    unreadCount: 2,
                    channel: 'whatsapp',
                    status: 'open',
                    assignedTo: 'Equipe',
                    tags: ['Pérola Black'],
                    contactAvatar: null,
                },
                {
                    id: 23,
                    contactName: 'Rafa / Indicação da irmã',
                    lastMessage: 'Minha irmã comprou com vocês e amou!',
                    lastMessageAt: iso(380),
                    unreadCount: 0,
                    channel: 'instagram',
                    status: 'pending',
                    assignedTo: 'Tony',
                    tags: ['Indicação'],
                    contactAvatar: null,
                },
                {
                    id: 24,
                    contactName: 'Cliente Evento',
                    lastMessage: 'Vocês participaram do evento no shopping, né?',
                    lastMessageAt: iso(400),
                    unreadCount: 1,
                    channel: 'whatsapp',
                    status: 'open',
                    assignedTo: 'Equipe',
                    tags: ['Evento'],
                    contactAvatar: null,
                },
                {
                    id: 25,
                    contactName: 'Ana Paula',
                    lastMessage: 'Obrigada pelo atendimento de hoje, foi ótimo 💫',
                    lastMessageAt: iso(420),
                    unreadCount: 0,
                    channel: 'whatsapp',
                    status: 'closed',
                    assignedTo: 'Jéssica',
                    tags: ['Feedback'],
                    contactAvatar: null,
                },
            ]

            // Mensagens de exemplo
            this.messages[1] = [
                {
                    id: 1,
                    conversationId: 1,
                    direction: 'in',
                    text: 'Oi, tudo bem? Queria saber sobre a coleção nova.',
                    createdAt: iso(40),
                },
                {
                    id: 2,
                    conversationId: 1,
                    direction: 'out',
                    text: 'Oi, Maria! Tudo bem e você? 😊 Posso te mandar algumas opções aqui.',
                    createdAt: iso(35),
                    userName: 'Jéssica',
                    status: 'read',
                },
                {
                    id: 3,
                    conversationId: 1,
                    direction: 'in',
                    text: 'Perfeito, obrigada! 🙏',
                    createdAt: iso(5),
                },
            ]

            this.messages[2] = [
                {
                    id: 4,
                    conversationId: 2,
                    direction: 'in',
                    text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum ',
                    createdAt: iso(15),
                },
            ]

            this.messages[3] = [
                {
                    id: 5,
                    conversationId: 3,
                    direction: 'in',
                    text: 'Podemos falar amanhã de manhã?',
                    createdAt: iso(60),
                },
            ]
        },


        sendMessage(text: string, userName = 'Atendente') {
            if (!this.activeConversationId || !text.trim()) return

            const convId = this.activeConversationId
            const list = this.messages[convId] ?? []

            const newMsg: Message = {
                id: Date.now(),
                conversationId: convId,
                direction: 'out',
                text: text.trim(),
                createdAt: new Date().toISOString(),
                userName,
                status: 'sent',
            }

            this.messages[convId] = [...list, newMsg]

            // Atualiza resumo da conversa (última msg + data + unread = 0)
            const idx = this.conversations.findIndex(c => c.id === convId)
            if (idx !== -1) {
                const conv = this.conversations[idx]
                this.conversations[idx] = {
                    ...conv,
                    lastMessage: newMsg.text,
                    lastMessageAt: newMsg.createdAt,
                    unreadCount: conv.unreadCount, // aqui você ajusta depois conforme regra
                }
            }

            // 👉 FUTURO: aqui entra chamada de API (POST /messages)
        },
    },
})
