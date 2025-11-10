export interface Project {
    id: number
    name: string
    client_id: number
    user_id: number
    status: string
    type_project: string
    category: string
    segment: string
    goal: string
    description: string
    date_project: string
    client?: { id: number; nome: string }
    user?: { id: number; name: string }
    _temp?: boolean
    _error?: boolean
    _opId?: string
}
