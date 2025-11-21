// schemas/leadSchema.ts
type BoardBy = 'status' | 'source'

export function useLeadSchema(opts?: { boardBy?: BoardBy }) {
    const boardBy = opts?.boardBy ?? 'status'

    const STATUS_OPTIONS = [
        { value: 'Novo', label: 'Novo', color: 'primary' },
        { value: 'Qualificado', label: 'Qualificado', color: 'secondary' },
        { value: 'Em negociação', label: 'Em negociação', color: 'warning' },
        { value: 'Ganho', label: 'Ganho', color: 'success' },
        { value: 'Perdido', label: 'Perdido', color: 'danger' },
    ]

    const SOURCE_OPTIONS = [
        { value: 'WhatsApp', label: 'WhatsApp' },
        { value: 'Landing', label: 'Landing' },
        { value: 'Indicação', label: 'Indicação' },
        { value: 'Instagram', label: 'Instagram' },
    ]

    return {
        name: {
            label: 'Nome',
            type: 'text',
            required: true,
            sortable: true,
        },
        source: {
            label: 'Origem',
            type: 'select',
            options: SOURCE_OPTIONS,
            sortable: true,
            boardColumn: boardBy === 'source',
        },
        status: {
            label: 'Status',
            type: 'select',
            options: STATUS_OPTIONS,
            sortable: true,
            boardColumn: boardBy === 'status',
        },
        created_at: {
            label: 'Criado em',
            type: 'date',
            hideOnBoard: true,
        },
    }
}
