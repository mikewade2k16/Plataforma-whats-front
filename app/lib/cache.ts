// util simples pra salvar/ler objetos no IndexedDB
import { get, set, del } from 'idb-keyval'

export async function cacheSet<T>(key: string, value: T) {
    try { await set(key, value) } catch { }
}
export async function cacheGet<T>(key: string): Promise<T | null> {
    try { return (await get(key)) as T ?? null } catch { return null }
}
export async function cacheDel(key: string) {
    try { await del(key) } catch { }
}
