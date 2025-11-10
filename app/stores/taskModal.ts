// stores/taskModal.ts
import { defineStore } from 'pinia'
type ModalMode = 'center' | 'side'

export const useTaskModal = defineStore('taskModal', {
    state: () => ({
        open: false,
        taskId: null as number | null,
        minimized: false,
        mode: (process.client ? (localStorage.getItem('taskModalMode') as ModalMode) : 'center') || 'center' as ModalMode,
    }),
    actions: {
        show(id: number, mode?: ModalMode) {
            if (mode) this.setMode(mode)
            this.taskId = id
            this.minimized = false
            this.open = true
        },
        close() { this.open = false; this.taskId = null },
        minimize() { this.minimized = true },
        setMode(m: ModalMode) {
            this.mode = m
            if (process.client) localStorage.setItem('taskModalMode', m)
        },
        toggleMode() { this.setMode(this.mode === 'center' ? 'side' : 'center') }
    }
})
