// Data Saver mode — respects SA students' limited prepaid data budgets
// Priority: user preference > navigator.connection.saveData > default (off)

const KEY = 'varsityos_data_saver'

export function getDataSaverEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(KEY)
  if (stored !== null) return stored === 'true'
  // Auto-detect if browser reports Save-Data header preference
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  return nav.connection?.saveData ?? false
}

export function setDataSaverEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, String(enabled))
  window.dispatchEvent(new CustomEvent('varsityos:datasaver', { detail: { enabled } }))
}

export function toggleDataSaver(): boolean {
  const next = !getDataSaverEnabled()
  setDataSaverEnabled(next)
  return next
}

// Hook for components to subscribe to changes
export function onDataSaverChange(cb: (enabled: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => cb((e as CustomEvent<{ enabled: boolean }>).detail.enabled)
  window.addEventListener('varsityos:datasaver', handler)
  return () => window.removeEventListener('varsityos:datasaver', handler)
}
