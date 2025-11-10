import { proxyToLaravel } from '../../../utils/proxyLaravel'
import { getQuery, setHeader } from 'h3'

type LaravelPage<T> = {
    data: T[]
    meta?: { current_page?: number; last_page?: number; per_page?: number | string; total?: number }
}

export default defineEventHandler(async (event) => {
    const q = getQuery(event)
    const cfg = useRuntimeConfig()

    const projectId =
        (q.project_id ? String(q.project_id) : undefined) ??
        (cfg.public?.defaultProjectId ? String(cfg.public.defaultProjectId) : undefined)

    if (!projectId) {
        throw createError({ statusCode: 400, statusMessage: 'project_id é obrigatório' })
    }

    const PER_PAGE = Number(q.per_page ?? 500)
    const MAX_PAGES = 50
    const MAX_ITEMS = 10_000

    let page = 1
    const all: any[] = []
    let lastPageSeen: number | null = null
    const seenFirstItemIds = new Set<number | string>()

    while (page <= MAX_PAGES && all.length < MAX_ITEMS) {
        const res: any = await proxyToLaravel(event, '/api/admin/tasks', {
            method: 'GET',
            query: { page, per_page: PER_PAGE, project_id: projectId }
        })

        let items: any[] = []
        let currentPage: number | undefined
        let lastPage: number | undefined

        if (Array.isArray(res)) {
            items = res
            currentPage = 1
            lastPage = 1
        } else {
            const body = res as LaravelPage<any> | any
            if (Array.isArray(body?.data?.data)) items = body.data.data
            else if (Array.isArray(body?.data)) items = body.data

            currentPage = Number(body?.meta?.current_page ?? NaN)
            lastPage = Number(body?.meta?.last_page ?? NaN)
        }

        const firstId = items?.[0]?.id
        if (firstId !== undefined && seenFirstItemIds.has(firstId)) break
        if (firstId !== undefined) seenFirstItemIds.add(firstId)

        if (!items?.length) break
        all.push(...items)

        if (!Number.isFinite(currentPage) || !Number.isFinite(lastPage)) break
        if (lastPageSeen !== null && currentPage === lastPageSeen) break
        lastPageSeen = currentPage!
        if (currentPage! >= lastPage!) break
        page++
    }

    setHeader(event, 'X-Items-Total', String(all.length))
    setHeader(event, 'X-Project-Id', String(projectId))
    return { data: all }
})
