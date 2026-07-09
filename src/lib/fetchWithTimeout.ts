// Wrap fetch with an abort timeout. On a stalled prepaid/2G/EDGE connection a
// half-open request never settles, so a plain `fetch()` hangs forever and strands
// loading spinners / "Saving…" buttons (their `finally` never runs). This aborts
// after `timeoutMs` and rejects (AbortError), so callers' catch/finally reset the UI.
// Uses AbortController + setTimeout (universally supported, incl. old Android WebView).
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 10000,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: init.signal ?? controller.signal })
  } finally {
    clearTimeout(timer)
  }
}
