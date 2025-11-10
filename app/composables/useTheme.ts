export type NxTheme = 'light' | 'dark'

const STORAGE_KEY = 'nx-theme'

export function useTheme() {
    const theme = useState<NxTheme>('nxTheme', () => {
        // preferência salva
        if (process.client) {
            const saved = localStorage.getItem(STORAGE_KEY) as NxTheme | null
            if (saved === 'light' || saved === 'dark') return saved
            // preferência do sistema
            const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
            return prefersDark ? 'dark' : 'light'
        }
        return 'light'
    })

    const setTheme = (t: NxTheme) => {
        theme.value = t
        if (process.client) {
            const el = document.documentElement
            if (t === 'dark') el.setAttribute('data-theme', 'dark')
            else el.removeAttribute('data-theme')
            localStorage.setItem(STORAGE_KEY, t)
        }
    }

    const toggleTheme = () => setTheme(theme.value === 'dark' ? 'light' : 'dark')

    return { theme, setTheme, toggleTheme }
}
