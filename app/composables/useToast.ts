// composables/useToast.ts
type ToastLevel = 'info' | 'success' | 'warning' | 'error'
type ToastInput = { title?: string; msg: string; level?: ToastLevel; ttlMs?: number }

export function useToast() {
    // estado global (Nuxt) – persiste entre páginas
    const list = useState<{ id: string; title?: string; msg: string; level: ToastLevel; ttl: number }[]>(
        'nx:toasts', () => []
    )

    function push(t: ToastInput) {
        const id = Math.random().toString(36).slice(2)
        const item = { id, title: t.title, msg: t.msg, level: t.level ?? 'info', ttl: Date.now() + (t.ttlMs ?? 3500) }
        list.value.push(item)
        // auto-remove
        setTimeout(() => {
            const i = list.value.findIndex(x => x.id === id)
            if (i !== -1) list.value.splice(i, 1)
        }, t.ttlMs ?? 3500)
    }

    return {
        list,
        info: (msg: string, ttlMs = 3500) => push({ msg, level: 'info', ttlMs }),
        success: (msg: string, ttlMs = 3500) => push({ msg, level: 'success', ttlMs }),
        warn: (msg: string, ttlMs = 3500) => push({ msg, level: 'warning', ttlMs }),
        error: (msg: string, ttlMs = 3500) => push({ msg, level: 'error', ttlMs }),
        push,
    }
}
