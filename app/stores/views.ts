import { defineStore } from 'pinia'
import type { TaskFieldKey, TaskViewKind } from '@/schemas/tasks.schema'

type Op = 'is' | 'not' | 'contains' | 'gt' | 'lt' | 'is_set' | 'not_set'
export interface TaskFilter { field: TaskFieldKey; op: Op; value?: any }
export interface TaskSort { field: TaskFieldKey; dir: 'asc' | 'desc' }
export interface PropertyVisibility { [key: string]: boolean } // TaskFieldKey -> visible?

export interface TaskView {
    id: string
    name: string
    kind: TaskViewKind
    projectId: number
    // (deixados prontos pra uso futuro por view)
    filters: TaskFilter[]
    sorts: TaskSort[]
    properties: PropertyVisibility
}

function keyViews(pid: number) { return `views:tasks:${pid}` }
function keyGlobals(pid: number) { return `views:tasks:${pid}:globals` }

function defaults(projectId: number): TaskView[] {
    return [
        { id: 'board-default', name: 'Quadro', kind: 'board', projectId, filters: [], sorts: [], properties: {} },
        { id: 'table-default', name: 'Tabela', kind: 'table', projectId, filters: [], sorts: [], properties: {} },
        { id: 'cal-default', name: 'Calendário', kind: 'calendar', projectId, filters: [], sorts: [], properties: {} },
        { id: 'chart-default', name: 'Gráfico', kind: 'chart', projectId, filters: [], sorts: [], properties: {} },
    ]
}

export const useViewsStore = defineStore('views', {
    state: () => ({
        projectId: 2 as number,
        items: [] as TaskView[],
        activeId: 'board-default' as string,
        // 🔥 filtros gerais (válidos para todas as visualizações)
        globalFilters: [] as TaskFilter[],
    }),
    getters: {
        active(state) { return state.items.find(v => v.id === state.activeId) as TaskView },
    },
    actions: {
        hydrate(projectId?: number) {
            if (projectId) this.projectId = projectId
            const raw = localStorage.getItem(keyViews(this.projectId))
            this.items = raw ? JSON.parse(raw) : defaults(this.projectId)
            const g = localStorage.getItem(keyGlobals(this.projectId))
            this.globalFilters = g ? JSON.parse(g) : []
            if (!this.items.find(v => v.id === this.activeId)) this.activeId = this.items[0].id
        },
        persist() { localStorage.setItem(keyViews(this.projectId), JSON.stringify(this.items)) },
        persistGlobals() { localStorage.setItem(keyGlobals(this.projectId), JSON.stringify(this.globalFilters)) },

        setActive(id: string) { this.activeId = id },
        create(kind: TaskViewKind) {
            const id = `${kind}-${Date.now()}`
            this.items.push({ id, name: 'Nova', kind, projectId: this.projectId, filters: [], sorts: [], properties: {} })
            this.activeId = id; this.persist()
        },
        rename(id: string, name: string) { const v = this.items.find(x => x.id === id); if (v) { v.name = name; this.persist() } },
        remove(id: string) {
            const i = this.items.findIndex(x => x.id === id); if (i >= 0) { this.items.splice(i, 1); if (this.activeId === id && this.items[0]) this.activeId = this.items[0].id; this.persist() }
        },
        updateProperties(id: string, props: PropertyVisibility) {
            const v = this.items.find(x => x.id === id); if (v) { v.properties = { ...v.properties, ...props }; this.persist() }
        },
        setGlobalFilters(filters: TaskFilter[]) { this.globalFilters = filters; this.persistGlobals() },
    }
})
