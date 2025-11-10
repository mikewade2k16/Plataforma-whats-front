// app/schemas/projectSchema.ts
import { useProjectsStore } from '@/stores/projects'

export const useProjectSchema = () => {
    const projects = useProjectsStore()
    return {
        name: { label: 'Nome', type: 'text', editable: true },
        client_id: { label: 'Cliente', type: 'select', editable: true, options: projects.clientsOptions, displayKey: 'client_label' },
        user_id: { label: 'Usuário', type: 'select', editable: true, options: projects.usersOptions, displayKey: 'user_label' },
        members: { label: 'Membros', type: 'multiselect', editable: true, options: projects.usersOptions, cast: 'number' },
        status: {
            label: 'Status', type: 'select', editable: true, options: [
                { value: 'not_started', label: 'Não iniciado' },
                { value: 'raw', label: 'Rascunho' },
                { value: 'started', label: 'Iniciado' },
                { value: 'in_progress', label: 'Em progresso' },
                { value: 'completed', label: 'Concluído' },
            ]
        },
        visibility: {
            label: 'Visibilidade', type: 'select', editable: true, options: [
                { value: 'public', label: 'Público' },
                { value: 'private', label: 'Privado' },
            ]
        },
        date_project: { label: 'Data', type: 'text', editable: true },
        category: { label: 'Categoria', type: 'text', editable: true },
        segment: { label: 'Segmento', type: 'text', editable: true },
        goal: { label: 'Meta', type: 'text', editable: true },
        description: { label: 'Descrição', type: 'text', editable: true },
    } as Record<string, any>
}
