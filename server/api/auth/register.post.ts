import { readBody } from 'h3'
import { getAuthConfig } from '../../../server/utils/authSession'
import { writeToken } from '../../../server/utils/authSession'

export default defineEventHandler(async (event) => {
    const payload = await readBody(event)
    const { baseURL } = getAuthConfig()

    const res: any = await $fetch(new URL('/api/register', baseURL).toString(), {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: payload,
    })

    // se a tua API fizer auto-login no register e devolver token:
    if (res?.access_token) writeToken(event, res)

    return res?.user ? { user: res.user } : { ok: true }
})
