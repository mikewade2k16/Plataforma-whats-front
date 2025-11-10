<script setup lang="ts">
const pending = ref(false)
const err = ref<string>('')

const { secondsLeft, expiresAt, expiresAtISO } = useAuthStatus()

const mm = computed(() => Math.floor((secondsLeft?.value ?? 0) / 60))
const ss = computed(() => String((secondsLeft?.value ?? 0) % 60).padStart(2, '0'))

function fmtTime(ts?: number | null) {
    if (!ts || ts <= 0) return '—'
    try { return new Date(ts).toLocaleTimeString() } catch { return '—' }
}

async function forceRefresh() {
    try {
        const res: any = await $fetch('/api/auth/refresh', { method: 'POST' })
        // <- se o BFF não mandou headers, usa o body
        useAuthStatus().setFromBody(res)
        // opcional: se seu auth store tiver setter direto
        if (typeof res?.expires_at === 'number') useAuthStore().setExpiresAt(res.expires_at)
        else if (typeof res?.expires_in === 'number') useAuthStore().setExpiresAt(Date.now() + res.expires_in * 1000)

        useToast().success('Sessão renovada')
    } catch (e: any) {
        useToast().error(e?.data?.message || 'Falha ao renovar a sessão')
    }
}


</script>

<template>
    <div class="dev-auth-controls">
        <div class="row1">
            <span class="pill">
                ⏳ <b>{{ mm }}</b>:{{ ss }}
            </span>
            <span class="sep">•</span>
            <span class="pill">
                expira em: <b>{{ fmtTime(expiresAt) }}</b>
            </span>
        </div>

        <div class="row2">
            <button class="btn btn-primary" :disabled="pending" @click="forceRefresh">
                {{ pending ? 'Atualizando…' : 'Forçar refresh agora' }}
            </button>
            <small v-if="expiresAtISO" class="iso">({{ expiresAtISO }})</small>
        </div>

        <p v-if="err" class="err">{{ err }}</p>
    </div>
</template>

<style scoped>
.dev-auth-controls {
    position: fixed;
    right: 12px;
    bottom: 16px;
    z-index: 9998;
    background: rgba(0, 0, 0, .6);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, .15);
    padding: 10px 12px;
    border-radius: 12px;
    min-width: 260px;
    backdrop-filter: saturate(120%) blur(2px);
    font: 12px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
}

.row1 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    flex-wrap: wrap;
}

.row2 {
    display: flex;
    align-items: center;
    gap: 8px;
}

.pill {
    background: rgba(255, 255, 255, .08);
    padding: 4px 8px;
    border-radius: 999px;
}

.sep {
    opacity: .65
}

.btn {
    font: inherit;
    padding: 6px 10px;
    border-radius: 8px;
    cursor: pointer;
    border: 1px solid transparent;
}

.btn-primary {
    background: var(--nx-primary, #12b2c1);
    color: #042227;
    border-color: var(--nx-primary, #12b2c1);
}

.btn[disabled] {
    opacity: .6;
    cursor: not-allowed
}

.iso {
    opacity: .7
}

.err {
    color: #ffb4b4;
    margin-top: 6px
}
</style>
