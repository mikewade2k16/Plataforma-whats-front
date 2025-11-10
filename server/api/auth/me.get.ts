import { proxyToLaravel } from '../../../server/utils/proxyLaravel'

export default defineEventHandler(async (event) => {
  const user = await proxyToLaravel(event, '/api/me', { method: 'GET' })
  return user
})
