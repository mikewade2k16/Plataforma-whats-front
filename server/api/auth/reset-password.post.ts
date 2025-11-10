import { readBody } from 'h3'
import { getAuthConfig } from '../../../server/utils/authSession'

export default defineEventHandler(async (event) => {
    const payload = await readBody(event)
    const { baseURL } = getAuthConfig()

    const res: any = await $fetch(new URL('/api/reset-password', baseURL).toString(), {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: payload,
    })
    return res
})
