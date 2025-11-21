<template>
    <div ref="rootRef" class="emoji-picker">
        <!-- Tabs topo (Emoji / GIFs / Figurinhas) -->
        <div class="emoji-picker__top-tabs">
            <button v-for="tab in topTabs" :key="tab.id" type="button" class="emoji-picker__top-tab"
                :class="{ 'is-active': tab.id === activeTopTab }" @click="activeTopTab = tab.id">
                {{ tab.label }}
            </button>
        </div>

        <!-- Por enquanto só a aba Emoji está ativa -->
        <div v-if="activeTopTab === 'emoji'" class="emoji-picker__body">
            <!-- Busca -->
            <div class="emoji-picker__search">
                <input v-model="search" type="text" class="emoji-picker__search-input" placeholder="Pesquisar emojis" />
            </div>

            <div class="emoji-picker__scroll">
                <!-- Recentes -->
                <section v-if="!search && recentToShow.length" class="emoji-picker__section" data-cat="recent">
                    <header class="emoji-picker__section-header">Recentes</header>
                    <div class="emoji-picker__row">
                        <button v-for="emoji in recentToShow" :key="'recent-' + emoji" type="button"
                            class="emoji-picker__btn" @click="selectEmoji(emoji)">
                            {{ emoji }}
                        </button>
                    </div>
                </section>

                <!-- Categorias OU resultados de busca -->
                <section v-for="cat in filteredCategories" :key="cat.id" class="emoji-picker__section"
                    :data-cat="cat.id">
                    <header class="emoji-picker__section-header">
                        {{ cat.label }}
                    </header>
                    <div :class="[
                        search && cat.id === 'search'
                            ? 'emoji-picker__row'
                            : 'emoji-picker__grid'
                    ]">
                        <button v-for="emoji in cat.emojis" :key="cat.id + '-' + emoji" type="button"
                            class="emoji-picker__btn" @click="selectEmoji(emoji)">
                            {{ emoji }}
                        </button>
                    </div>
                </section>

                <div v-if="search && !filteredCategories.length" class="emoji-picker__no-results">
                    Nenhum emoji encontrado para "{{ search }}".
                </div>
            </div>

            <!-- Barra de categorias (rodapé, tipo Whats) -->
            <div v-if="!search" class="emoji-picker__category-tabs">
                <button v-for="cat in categoriesWithIcons" :key="'nav-' + cat.id" type="button"
                    class="emoji-picker__category-tab" :class="{ 'is-active': cat.id === activeCategoryNav }"
                    @click="scrollToCategory(cat.id)">
                    {{ cat.icon }}
                </button>
            </div>
        </div>

        <!-- GIFs / Figurinhas (placeholder visual) -->
        <div v-else class="emoji-picker__disabled-tab">
            <p>Em breve {{ activeTopTab === 'gifs' ? 'GIFs' : 'Figurinhas' }} 😉</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

const props = defineProps<{
    recent?: string[]
}>()

const emit = defineEmits<{
    (e: 'select', emoji: string): void
    (e: 'update:recent', recent: string[]): void
}>()

const rootRef = ref<HTMLElement | null>(null)

/* ======= Top tabs (Emoji / GIFs / Figurinhas) ======= */
const topTabs = [
    { id: 'emoji', label: 'Emoji' },
    { id: 'gifs', label: 'GIFs' },
    { id: 'stickers', label: 'Figurinhas' },
] as const

const activeTopTab = ref<'emoji' | 'gifs' | 'stickers'>('emoji')

/* ======= Dataset de categorias ======= */
type EmojiCategory = {
    id: string;
    label: string;
    icon: string;
    emojis: string[];
}

const defaultCategories: EmojiCategory[] = [
    {
        id: 'people',
        label: 'Smileys e pessoas',
        icon: '😊',
        emojis: [
            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️',
            '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗',
            '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓',
            '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕',
            '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤',
            '😡', '😠'
        ],
    },
    {
        id: 'nature',
        label: 'Animais e natureza',
        icon: '🌿',
        emojis: [
            '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
            '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊',
            '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇'
        ],
    },
    {
        id: 'objects',
        label: 'Objetos',
        icon: '💡',
        emojis: [
            '💡', '🔦', '🏮', '📦', '📫', '📬', '📱', '💻', '⌨️', '🖱️',
            '🖨️', '🕹️', '💽', '💾', '💿', '📀', '📷', '📹', '🎥', '📺'
        ],
    },
]

const categories = computed(() => defaultCategories)

/* ======= Índice simples pra busca ======= */
/**
 * Isso aqui é um mini-índice de produção: emoji + keywords em PT.
 * Depois, quando plugar uma lib de emoji, é só gerar esse índice a partir dela.
 */
const emojiIndex = [
    { emoji: '😀', keywords: ['sorriso', 'feliz', 'alegre'] },
    { emoji: '😂', keywords: ['risada', 'engraçado', 'rindo'] },
    { emoji: '🤣', keywords: ['morrer de rir', 'risada'] },
    { emoji: '😍', keywords: ['apaixonado', 'amor', 'coração', 'olhos'] },
    { emoji: '🥰', keywords: ['carinho', 'amor', 'corações'] },
    { emoji: '😘', keywords: ['beijo', 'amor'] },
    { emoji: '😢', keywords: ['triste', 'chorar'] },
    { emoji: '😭', keywords: ['chorando', 'muito triste'] },
    { emoji: '😡', keywords: ['raiva', 'bravo'] },
    { emoji: '👏', keywords: ['palmas', 'aplausos'] },
    { emoji: '🙏', keywords: ['oração', 'reze', 'obrigado'] },
    { emoji: '👍', keywords: ['joinha', 'ok', 'beleza'] },
    { emoji: '🔥', keywords: ['fogo', 'quente', 'top'] },
    { emoji: '❤️', keywords: ['coração', 'amor'] },
    { emoji: '🐶', keywords: ['cachorro', 'dog'] },
    { emoji: '🐱', keywords: ['gato', 'cat'] },
    { emoji: '💻', keywords: ['computador', 'pc', 'trabalho'] },
    { emoji: '📱', keywords: ['celular', 'telefone', 'whatsapp'] },
    { emoji: '💡', keywords: ['ideia', 'luz', 'insight'] },
]

/* ======= Busca ======= */
const search = ref('')

const filteredCategories = computed<EmojiCategory[]>(() => {
    const term = search.value.trim().toLowerCase()
    if (!term) return categories.value

    const matchesSet = new Set<string>()
    for (const item of emojiIndex) {
        if (item.keywords.some(k => k.includes(term))) {
            matchesSet.add(item.emoji)
        }
    }

    const matches = Array.from(matchesSet)
    if (!matches.length) return []

    return [
        {
            id: 'search',
            label: 'Resultados',
            icon: '🔍',
            emojis: matches,
        },
    ]
})

/* ======= Recentes ======= */
const recentLocal = ref<string[]>(props.recent || [])

const recentToShow = computed(() => recentLocal.value.slice(0, 12))

function selectEmoji(emoji: string) {
    emit('select', emoji)

    const arr = [emoji, ...recentLocal.value.filter(e => e !== emoji)].slice(0, 32)
    recentLocal.value = arr
    emit('update:recent', arr)
}

/* ======= Navegação por categoria (rodapé) ======= */
const activeCategoryNav = ref<string>('people')

const categoriesWithIcons = computed(() =>
    categories.value.map(cat => ({
        id: cat.id,
        icon: cat.icon,
    })),
)

function scrollToCategory(id: string) {
    activeCategoryNav.value = id
    nextTick(() => {
        const root = rootRef.value
        if (!root) return
        const el = root.querySelector<HTMLElement>(
            `.emoji-picker__section[data-cat="${id}"]`,
        )
        if (!el) return
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
}
</script>

<style scoped lang="scss">
.emoji-picker {
    width: 360px;
    max-height: 380px;
    background: #04161b; // depois troca por var(--nx-surface-strong)
    color: #fff;
    border-radius: 10px;
    padding: 6px 6px 4px;
    display: flex;
    flex-direction: column;
    font-size: 13px;
}

/* Top tabs */
.emoji-picker__top-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 6px;
}

.emoji-picker__top-tab {
    flex: 1;
    border: none;
    background: transparent;
    color: #aaa;
    padding: 4px 0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;

    &.is-active {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
    }
}

/* Busca */
.emoji-picker__search {
    margin-bottom: 6px;
}

.emoji-picker__search-input {
    width: 100%;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: #050d10;
    color: #fff;
    padding: 4px 8px;
    font-size: 12px;
    outline: none;
}

/* Área rolável */
.emoji-picker__scroll {
    flex: 1;
    overflow-y: auto;
    padding: 4px 2px;
}

.emoji-picker__section {
    margin-bottom: 8px;
}

.emoji-picker__section-header {
    font-weight: 500;
    color: #ccc;
    margin-bottom: 4px;
}

.emoji-picker__row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.emoji-picker__grid {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 4px;
}

/* Botão de emoji */
.emoji-picker__btn {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
    padding: 2px;
    border-radius: 4px;
    text-align: center;

    &:hover {
        background: rgba(255, 255, 255, 0.12);
    }
}

/* Barra de categorias */
.emoji-picker__category-tabs {
    display: flex;
    justify-content: space-between;
    gap: 4px;
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.16);
}

.emoji-picker__category-tab {
    flex: 1;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 3px 0;
    font-size: 16px;
    border-radius: 6px;

    &.is-active {
        background: rgba(255, 255, 255, 0.18);
    }
}

/* Sem resultados */
.emoji-picker__no-results {
    padding: 6px 4px;
    font-size: 12px;
    color: #ccc;
}

/* Placeholder de GIFs/Figurinhas */
.emoji-picker__disabled-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #aaa;
    font-size: 12px;
    padding: 8px;
    text-align: center;
}
</style>
