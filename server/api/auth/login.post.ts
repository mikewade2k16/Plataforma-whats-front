import { readBody } from 'h3'
import { writeToken, clearToken } from '../../../server/utils/authSession'
import { getAuthConfig } from '../../../server/utils/authSession'

export default defineEventHandler(async (event) => {
    const payload = await readBody(event)
    const { baseURL } = getAuthConfig()

    const res: any = await $fetch(new URL('/api/login', baseURL).toString(), {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: payload,
    })

    if (res?.access_token) writeToken(event, res)
    else clearToken(event)

    // retorno enxuto pro front (user + meta se quiser)
    return { user: res?.user, expires_in: res?.expires_in ?? null }
})
