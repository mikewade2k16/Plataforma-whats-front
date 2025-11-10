// composables/useSidebar.ts
export const useSidebarCollapsed = () =>
  useState<boolean>('nxSidebarCollapsed', () => false)
