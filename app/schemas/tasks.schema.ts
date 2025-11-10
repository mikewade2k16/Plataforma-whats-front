// Tipos de apoio
export type TaskViewKind = 'board' | 'table' | 'calendar' | 'chart'
export type TaskFieldKey =
    | 'id' | 'column_id' | 'client_id' | 'campaign_id' | 'user_id' | 'name' | 'start_date'
    | 'type_task' | 'number' | 'description' | 'comment' | 'due_date' | 'priority' | 'file'
    | 'created_at' | 'updated_at' | 'archived' | 'order_position' | 'involved_users'
    | 'timer_status' | 'last_started' | 'time_spent'

// Metadados por campo
export interface TaskFieldSchema {
    key: TaskFieldKey
    label: string
    type: 'text' | 'select' | 'multiselect' | 'date' | 'int' | 'bool'
    // visibilidade padrão por view
    visible: Partial<Record<TaskViewKind, boolean>>
    // extras que a OmniTable/fields entendem
    valueType?: 'number' | 'string'
    options?: any            // pode ser ref/computed/array
    placeholder?: string
}

// === TODOS OS CAMPOS DA TABELA `tasks` ===
export const TASK_FIELDS: TaskFieldSchema[] = [
    { key: 'id', label: '#', type: 'int', visible: { table: true } },
    { key: 'column_id', label: 'Coluna', type: 'select', visible: { table: true } },
    { key: 'client_id', label: 'Cliente', type: 'select', visible: { board: true, table: true } },
    { key: 'campaign_id', label: 'Campanha', type: 'select', visible: { table: true } },
    { key: 'user_id', label: 'Responsável', type: 'select', visible: { board: true, table: true } },
    { key: 'name', label: 'Título', type: 'text', visible: { board: true, table: true, calendar: true } },
    { key: 'start_date', label: 'Início', type: 'date', visible: { board: true, table: true, calendar: true } },
    { key: 'type_task', label: 'Tipo', type: 'select', visible: { table: true } },
    { key: 'number', label: 'Número', type: 'int', visible: { table: true } },
    { key: 'description', label: 'Descrição', type: 'text', visible: { table: true } },
    { key: 'comment', label: 'Comentário', type: 'text', visible: { table: true } },
    { key: 'due_date', label: 'Prazo', type: 'date', visible: { board: true, table: true, calendar: true } },
    { key: 'priority', label: 'Prioridade', type: 'select', visible: { board: true, table: true } },
    { key: 'file', label: 'Arquivo', type: 'text', visible: { table: true } },
    { key: 'created_at', label: 'Criado em', type: 'date', visible: { table: true } },
    { key: 'updated_at', label: 'Atualizado em', type: 'date', visible: { table: true } },
    { key: 'archived', label: 'Arquivada?', type: 'bool', visible: { table: true } },
    { key: 'order_position', label: 'Ordem', type: 'int', visible: { table: true } },
    { key: 'involved_users', label: 'Envolvidos', type: 'multiselect', visible: { table: true } },
    { key: 'timer_status', label: 'Timer', type: 'int', visible: { table: true } },
    { key: 'last_started', label: 'Timer iniciou', type: 'date', visible: { table: true } },
    { key: 'time_spent', label: 'Tempo gasto', type: 'int', visible: { table: true } },
]

// utilitários
export const FIELD_MAP = Object.fromEntries(TASK_FIELDS.map(f => [f.key, f]))

// visibilidade padrão por view
export function defaultVisible(key: TaskFieldKey, view: TaskViewKind) {
    return !!FIELD_MAP[key]?.visible?.[view]
}

// monta schema para OmniTable (respeita overrides da view ativa)
export function buildTableSchema(overrides: Record<string, boolean> = {}) {
    // OmniTable espera um objeto { [key]: { label, type, hidden, ... } }
    const schema: Record<string, any> = {}
    for (const f of TASK_FIELDS) {
        schema[f.key] = {
            label: f.label,
            type: f.type === 'bool' ? 'switch' :
                f.type === 'multiselect' ? 'multiselect' :
                    f.type === 'select' ? 'select' :
                        f.type === 'date' ? 'date' :
                            'text',
            hidden: overrides[f.key] === false ? false : !(f.visible.table ?? false), // se override === false, força mostrar
            valueType: f.valueType,
            options: f.options,
            placeholder: f.placeholder,
        }
    }
    return schema
}

// helper p/ Board
export function isVisibleOnBoard(key: TaskFieldKey, overrides: Record<string, boolean> = {}) {
    if (overrides[key] !== undefined) return overrides[key]
    return defaultVisible(key, 'board')
}
