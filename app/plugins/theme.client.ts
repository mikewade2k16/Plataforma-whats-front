export default defineNuxtPlugin(() => {
    const { theme, setTheme } = useTheme()
    setTheme(theme.value) // aplica no <html> via data-theme
})
