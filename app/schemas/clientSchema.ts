export const useClientSchema = () => {
    return {
        id: { label: 'ID', type: 'text', hidden: true },
        nome: { label: 'Nome', type: 'text', editable: true },
        cpf: { label: 'CPF', type: 'text', editable: true },
        email: { label: 'E-mail', type: 'text', editable: true },
        data_nasc: { label: 'Nascimento', type: 'text', editable: true },
        rg: { label: 'RG', type: 'text', editable: true },
        org_exp: { label: 'Org. Exp.', type: 'text', editable: true },
        contato_1: { label: 'Contato 1', type: 'text', editable: true },
        contato_2: { label: 'Contato 2', type: 'text', editable: true },
        endereco: { label: 'Endereço', type: 'text', editable: true },
        cep: { label: 'CEP', type: 'text', editable: true },
        referencia: { label: 'Referência', type: 'text', editable: true },
        user_id: { label: 'User ID', type: 'text', editable: true },

        comp_residence: { label: 'Comp. Residência', type: 'text', editable: true },
        selfie: { label: 'Selfie', type: 'text', editable: true },
        comp_instalacao: { label: 'Comp. Instalação', type: 'text', editable: true },

        uf: { label: 'UF', type: 'text', editable: true },
        cidade: { label: 'Cidade', type: 'text', editable: true },
        bairro: { label: 'Bairro', type: 'text', editable: true },
        numero: { label: 'Número', type: 'text', editable: true },
        complemento: { label: 'Compl.', type: 'text', editable: true },

        forma_pagamento: { label: 'Forma Pagto', type: 'text', editable: true },
        outros_form_pag: { label: 'Outros Pagto', type: 'text', editable: true },

        created_at: { label: 'Criado', type: 'text', editable: false, hidden: true },
        updated_at: { label: 'Atualizado', type: 'text', editable: false, hidden: true },
    } as Record<string, any>
}
