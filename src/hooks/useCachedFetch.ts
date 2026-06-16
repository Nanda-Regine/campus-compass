import { useState, useEffect } from 'react'

// Fetch from `endpoint` on mount, cache result in localStorage under `key`.
// Re-runs when `key` changes (key encodes all inputs that affect the result).
// Pass key=null to disable (e.g. when required data is not yet available).
export function useCachedFetch<T>(
  key: string | null,
  fetchFn: () => Promise<T | null>,
): { data: T | null; loading: boolean } {
  const [data, setData]       = useState<T | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!key) return
    let cached: string | null = null
    try { cached = localStorage.getItem(key) } catch { /* private browsing */ }
    if (cached) {
      try { setData(JSON.parse(cached)); return } catch { /* corrupted — refetch */ }
    }
    setLoading(true)
    fetchFn()
      .then(result => {
        if (result !== null) {
          setData(result)
          try { localStorage.setItem(key, JSON.stringify(result)) } catch { /* quota full */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  // fetchFn captures current props via closure; key is the semantic dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { data, loading }
}
