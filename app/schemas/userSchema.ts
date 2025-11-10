import { useUsersStore } from '@/stores/users'

export const useUserSchema = () => {
    const users = useUsersStore()

    return {
        id: { label: 'ID', type: 'text', hidden: true },

        name: { label: 'Nome', type: 'text', editable: true },
        nick: { label: 'Apelido', type: 'text', editable: true },
        email: { label: 'E-mail', type: 'text', editable: true },
        phone: { label: 'Telefone', type: 'text', editable: true },
        client_id: { label: 'Cliente', type: 'select', editable: true, options: users.clientsOptions, displayKey: 'client_label' },

        level: {
            label: 'Nível', type: 'select', editable: true, options: [
                { value: 'admin', label: 'Admin' },
                { value: 'manager', label: 'Manager' },
                { value: 'marketing', label: 'Marketing' },
                { value: 'finance', label: 'Finance' },
            ]
        },

        status: {
            label: 'Status', type: 'select', editable: true, options: [
                { value: 'active', label: 'Ativo' },
                { value: 'inactive', label: 'Inativo' },
            ]
        },

        user_type: {
            label: 'Tipo', type: 'select', editable: true, options: [
                { value: 'client', label: 'Cliente' },
                { value: 'admin', label: 'Admin' },
            ]
        },

        profile_image: { label: 'Foto', type: 'text', editable: true },
        last_login: { label: 'Último login', type: 'text', editable: false },
        email_verified_at: { label: 'Email verificado', type: 'text', editable: false },

        preferences: { label: 'Prefs', type: 'text', editable: true },

        // segurança: manter visíveis no schema mas hidden na tabela
        password: { label: 'Senha', type: 'text', editable: true, hidden: true },
        remember_token: { label: 'Token', type: 'text', editable: false, hidden: true },

        created_at: { label: 'Criado', type: 'text', editable: false, hidden: true },
        updated_at: { label: 'Atualizado', type: 'text', editable: false, hidden: true },
    } as Record<string, any>
}
