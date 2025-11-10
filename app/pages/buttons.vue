<script setup lang="ts">
import { ref } from 'vue'
import NxButton from '~/components/buttons/NxButton.vue'
import NxInput from '~/components/inpus/NxInput.vue'
import NxCard from '~/components/card/NxCard.vue'
import NxModal from '~/components/modal/NxModal.vue'

const modalOpen = ref(false)
</script>

<template>
    <div class="container py-4">
        <h1 class="mb-4">Buttons Showcase</h1>

        <!-- Texto apenas -->
        <section class="mb-5">
            <h2 class="h5 mb-3">Texto apenas</h2>
            <div class="row g-3">
                <div class="col-auto">
                    <NxButton>Primário</NxButton>
                </div>
                <div class="col-auto">
                    <NxButton variant="outline" tone="primary">Outline</NxButton>
                </div>
                <div class="col-auto">
                    <NxButton variant="ghost" tone="primary">Ghost</NxButton>
                </div>
                <div class="col-auto">
                    <NxButton tone="neutral">Neutro</NxButton>
                </div>
                <div class="col-auto">
                    <NxButton :loading="true">Loading…</NxButton>
                </div>
                <div class="col-auto">
                    <NxButton :disabled="true">Disabled</NxButton>
                </div>
            </div>
        </section>

        <!-- Ícone + Texto -->
        <section class="mb-5">
            <h2 class="h5 mb-3">Ícone + Texto</h2>
            <div class="row g-3">
                <div class="col-auto">
                    <NxButton icon="plus">Novo ticket</NxButton>
                </div>
                <div class="col-auto">
                    <NxButton variant="outline" tone="primary" icon="download" iconPos="right">Exportar</NxButton>
                </div>
                <div class="col-auto">
                    <NxButton tone="neutral" icon="settings">Configurações</NxButton>
                </div>
            </div>
        </section>

        <!-- Ícone apenas -->
        <section class="mb-5">
            <h2 class="h5 mb-3">Ícone apenas</h2>
            <div class="row g-3">
                <div class="col-auto">
                    <NxButton :iconOnly="true" title="Editar" icon="edit" />
                </div>
                <div class="col-auto">
                    <NxButton :iconOnly="true" variant="outline" tone="primary" title="Mais opções"
                        icon="more-vertical" />
                </div>
                <div class="col-auto">
                    <NxButton :iconOnly="true" :badge="3" title="Notificações" icon="bell" />
                </div>
                <div class="col-auto">
                    <NxButton as="a" href="https://wa.me/5599999999999" target="_blank" rel="noopener" :iconOnly="true"
                        title="WhatsApp" icon="whatsapp" iconKind="brand" />
                </div>
            </div>
        </section>

        <!-- Badge e Avatar -->
        <section class="mb-5">
            <h2 class="h5 mb-3">Com contagem (badge) e Avatar</h2>
            <div class="row g-3">
                <div class="col-auto">
                    <NxButton :badge="12" icon="inbox">Caixa de entrada</NxButton>
                </div>
                <div class="col-auto">
                    <NxButton :avatar="{ initials: 'AN' }">Atendente: Ana</NxButton>
                </div>
                <div class="col-auto">
                    <NxButton :avatar="{ src: 'https://i.pravatar.cc/40?img=5' }" variant="outline" tone="primary">
                        Equipe: João</NxButton>
                </div>
            </div>
        </section>

        <!-- Links -->
        <section class="mb-5">
            <h2 class="h5 mb-3">Links</h2>
            <div class="row g-3">
                <div class="col-auto">
                    <NxButton as="a" href="/inbox" icon="mail">Abrir Inbox (link interno)</NxButton>
                </div>
                <div class="col-auto">
                    <NxButton as="a" href="https://nexohub.app/docs" target="_blank" rel="noopener" variant="outline"
                        tone="primary" icon="book-open">
                        Documentação (externo)
                    </NxButton>
                </div>
                <div class="col-auto">
                    <NxButton as="a" href="/export" :ariaDisabled="true" icon="download">Exportar (indisponível)
                    </NxButton>
                </div>
            </div>
        </section>

        <!-- ===================== DROPDOWNS ===================== -->

        <!-- 1) Inline (compat com o que você já usava) -->
        <section class="mb-5">
            <h2 class="h5 mb-2">Dropdown inline (compat)</h2>
            <div class="row g-3">
                <div class="col-auto">
                    <NxButton dropdown dropdownType="inline" icon="chevron-down" iconPos="right">
                        Ações
                        <template #menu>
                            <ul class="dropdown-menu-custom">
                                <li><button class="dropdown-item-custom">Transferir</button></li>
                                <li><button class="dropdown-item-custom">Encerrar</button></li>
                                <li><button class="dropdown-item-custom">Arquivar</button></li>
                            </ul>
                        </template>
                    </NxButton>
                </div>
                <div class="col-auto">
                    <NxButton dropdown dropdownType="inline" variant="outline" tone="primary" icon="chevron-down"
                        iconPos="right">
                        Mais
                        <template #menu>
                            <ul class="dropdown-menu-custom">
                                <li><button class="dropdown-item-custom">Editar</button></li>
                                <li><button class="dropdown-item-custom">Duplicar</button></li>
                                <li><button class="dropdown-item-custom text-danger">Excluir</button></li>
                            </ul>
                        </template>
                    </NxButton>
                </div>
            </div>
        </section>

        <!-- 2) Menu absoluto: Notificações (cartão) -->
        <section class="mb-5">
            <h2 class="h5 mb-2">Dropdown menu absoluto (Notificações)</h2>
            <NxButton :iconOnly="true" icon="bell" :badge="4" tone="neutral" variant="outline" dropdown
                dropdownType="menu" placement="bottom-end">
                <template #menu>
                    <div style="width:360px" class="p-2">
                        <div class="nx-card p-2">
                            <div class="d-flex align-items-center justify-content-between mb-2">
                                <strong>Notifications</strong>
                                <span class="badge bg-primary">5 Unread</span>
                            </div>

                            <div class="d-flex gap-2 align-items-start py-2 border-bottom">
                                <img src="https://i.pravatar.cc/40?img=32" class="rounded-circle" width="36"
                                    height="36" />
                                <div class="flex-grow-1">
                                    <strong>Sonia Agarwal</strong>
                                    <div class="text-success">Approval</div>
                                    <small class="text-muted">7 mins ago</small>
                                </div>
                                <button class="btn btn-sm btn-link text-muted">🗑️</button>
                            </div>

                            <div class="d-flex gap-2 align-items-start py-2">
                                <img src="https://i.pravatar.cc/40?img=12" class="rounded-circle" width="36"
                                    height="36" />
                                <div class="flex-grow-1">
                                    <strong>Rajesh Kumar</strong>
                                    <div class="text-warning">Urgent Request</div>
                                    <small class="text-muted">3 hours ago</small>
                                </div>
                                <button class="btn btn-sm btn-link text-muted">🗑️</button>
                            </div>
                        </div>
                        <button class="btn btn-primary w-100 mt-2">View All</button>
                    </div>
                </template>
            </NxButton>
        </section>

        <!-- 3) Menu absoluto: Perfil e Idiomas -->
        <section class="mb-5">
            <h2 class="h5 mb-2">Dropdown menu absoluto (Perfil & Idiomas)</h2>
            <div class="d-flex flex-wrap gap-3">
                <!-- Perfil -->
                <NxButton :avatar="{ src: 'https://i.pravatar.cc/40?img=5' }" tone="neutral" variant="outline" dropdown
                    dropdownType="menu" placement="bottom-end" :matchWidth="true">
                    <template #menu>
                        <div class="px-2 py-2" style="min-width:240px">
                            <div class="mb-2">
                                <strong>Ashwin Seth</strong><br />
                                <small class="text-muted">ashwinseth@mail.com</small>
                            </div>
                            <a class="dropdown-link" href="#"><span>👤</span> My Profile</a>
                            <a class="dropdown-link" href="#"><span>📫</span> Mail Inbox <b
                                    class="badge bg-success ms-auto">06</b></a>
                            <a class="dropdown-link" href="#"><span>⚙️</span> Account Settings</a>
                            <hr />
                            <a class="dropdown-link text-danger" href="#"><span>↩️</span> Sign Out</a>
                        </div>
                    </template>
                </NxButton>

                <!-- Idiomas -->
                <NxButton icon="globe" tone="neutral" variant="outline" dropdown dropdownType="menu"
                    placement="bottom-start">
                    <template #menu>
                        <ul class="list-unstyled m-0" style="min-width:200px">
                            <li><a class="dropdown-link active" href="#">🇺🇸 English</a></li>
                            <li><a class="dropdown-link" href="#">🇪🇸 Spanish</a></li>
                            <li><a class="dropdown-link" href="#">🇫🇷 French</a></li>
                            <li><a class="dropdown-link" href="#">🇩🇪 German</a></li>
                            <li><a class="dropdown-link" href="#">🇮🇹 Italian</a></li>
                            <li><a class="dropdown-link" href="#">🇷🇺 Russian</a></li>
                        </ul>
                    </template>
                </NxButton>
            </div>
        </section>

        <!-- 4) Sheet lateral (Switcher) -->
        <section class="mb-5">
            <h2 class="h5 mb-2">Sheet lateral (Switcher)</h2>
            <NxButton icon="settings" tone="neutral" variant="outline" dropdown dropdownType="sheet-right">
                <template #menu>
                    <h4 class="mb-3">Switcher</h4>
                    <p class="text-muted mb-2">Theme Styles / Theme Colors</p>
                    <div class="d-flex gap-2 flex-wrap">
                        <button class="swatch" style="--c:#5b5bd6"></button>
                        <button class="swatch" style="--c:#1fb0c5"></button>
                        <button class="swatch" style="--c:#46a758"></button>
                        <button class="swatch" style="--c:#f59e0b"></button>
                        <button class="swatch" style="--c:#ef4444"></button>
                    </div>
                    <hr />
                    <button class="btn btn-primary w-100">Apply</button>
                </template>
            </NxButton>
        </section>
    </div>
</template>

<style scoped>
/* exemplos simples de conteúdo do menu */
.dropdown-menu-custom {
    list-style: none;
    margin: .25rem 0 0 0;
    padding: .35rem;
    min-width: 180px;
    background: var(--nx-surface);
    border: 1px solid var(--nx-border);
    border-radius: 12px;
    box-shadow: 0 10px 28px rgba(0, 0, 0, .22);
}

.dropdown-item-custom {
    width: 100%;
    text-align: left;
    background: transparent;
    color: var(--nx-fg);
    border: 0;
    padding: .5rem .6rem;
    border-radius: 8px;
    cursor: pointer;
}

.dropdown-item-custom:hover {
    background: rgba(255, 255, 255, .06);
}

.text-danger {
    color: #ff5a5f;
}

.dropdown-link {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .5rem .6rem;
    border-radius: 8px;
    color: var(--nx-fg);
    text-decoration: none;
}

.dropdown-link:hover {
    background: rgba(255, 255, 255, .06);
}

.dropdown-link.active {
    background: rgba(18, 178, 193, .18);
    color: var(--nx-primary);
}

.swatch {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 2px solid var(--nx-border);
    background: var(--c);
}
</style>
