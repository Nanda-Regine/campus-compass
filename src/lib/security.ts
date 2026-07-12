/**
 * Security utilities — server + client safe, zero external dependencies.
 * Used by middleware, API routes, and withAuth wrapper.
 */

// ── Input sanitization ────────────────────────────────────────────────────────

/** Strip HTML tags, control characters, and enforce max length */
export function sanitizeText(input: unknown, maxLen = 1000): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/\p{Cc}/gu, '')                         // Unicode control chars (C0 + C1)
    .replace(/<[^>]*>/g, '')                          // HTML tags
    .replace(/&(?:lt|gt|amp|quot|apos|#\d+|#x[\da-f]+);/gi, ' ') // HTML entities
    .trim()
    .slice(0, maxLen)
}

/** Allow-list HTML sanitizer — only b/i/strong/em/p/br/ul/li/a(href) survive */
export function sanitizeHtml(input: string, maxLen = 5000): string {
  const allowedTags = /^(b|i|strong|em|p|br|ul|ol|li|h[1-6]|blockquote|code|pre)$/i
  const allowedAttr = /^(href|title|class)$/i

  return input
    .slice(0, maxLen)
    .replace(/<(\/?)(\w+)([^>]*)>/g, (_m, slash, tag, attrs) => {
      if (!allowedTags.test(tag)) return ''
      if (tag.toLowerCase() === 'a' && !slash) {
        const href = attrs.match(/href\s*=\s*["']([^"'<>]*)["']/i)?.[1] ?? ''
        // Block javascript: and data: hrefs
        if (/^(javascript|data|vbscript):/i.test(href.trim())) return ''
        return `<a href="${href}" rel="noopener noreferrer" target="_blank">`
      }
      // Strip unknown attributes from allowed tags
      const safeAttrs = attrs.replace(/(\w+)\s*=\s*["'][^"']*["']/g, (m: string, attr: string) =>
        allowedAttr.test(attr) ? m : ''
      )
      return `<${slash}${tag}${safeAttrs}>`
    })
}

/** Validate email format (RFC-5321 compliant, max 320 chars) */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false
  if (email.length > 320) return false
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email)
}

/** Sanitize a filename — strip path separators and null bytes */
export function sanitizeFilename(name: unknown, maxLen = 255): string {
  if (typeof name !== 'string') return 'file'
  return name
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\p{Cc}/gu, '')
    .trim()
    .slice(0, maxLen) || 'file'
}

/** Truncate and sanitize a user-supplied string for safe inclusion in a log message */
export function sanitizeForLog(input: unknown, maxLen = 200): string {
  const s = typeof input === 'string' ? input : JSON.stringify(input)
  return s
    .replace(/\p{Cc}/gu, ' ')  // control chars → space prevents log injection
    .slice(0, maxLen)
}

// ── CSRF protection ───────────────────────────────────────────────────────────

/**
 * Validate the Origin header against the Host to prevent CSRF.
 * Server-to-server requests (no Origin header) are always allowed.
 * Returns true if the request is safe.
 */
export function checkCsrfOrigin(request: Request): boolean {
  const method = request.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true

  const origin = request.headers.get('origin')
  if (!origin) return true // server-to-server, no browser Origin

  const host = request.headers.get('host')
  if (!host) return false

  try {
    const originHost = new URL(origin).host
    return originHost === host
  } catch {
    return false
  }
}

// ── Error handling ────────────────────────────────────────────────────────────

/**
 * Serialize an error safely for client responses.
 * NEVER includes stack traces or secrets.
 */
export function safeError(err: unknown): string {
  if (err instanceof Error) {
    return err.message
      .slice(0, 200)
      .replace(/sk-[a-zA-Z0-9_-]{10,}/g, '[KEY]')        // Anthropic keys
      .replace(/sbp_[a-zA-Z0-9]{10,}/g, '[KEY]')          // Supabase PAT
      .replace(/eyJ[a-zA-Z0-9_-]{20,}/g, '[TOKEN]')       // JWT-like tokens
      .replace(/\b(\d{1,3}\.){3}\d{1,3}\b/g, '[IP]')      // IP addresses
  }
  return 'An unexpected error occurred'
}

// ── Request identity ──────────────────────────────────────────────────────────

/** Extract or generate a request trace ID */
export function getReqId(request: Request): string {
  const existing = request.headers.get('x-request-id')
  if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing
  return crypto.randomUUID()
}

// ── Threat detection ──────────────────────────────────────────────────────────

const THREAT_PATTERNS: RegExp[] = [
  /<script[\s>]/i,                                      // XSS script tag
  /javascript\s*:/i,                                    // XSS javascript: URI
  /on(?:error|load|click|focus|blur|change|submit|mouse\w+|key\w+)\s*=/i, // event handlers
  /data\s*:\s*(?:text\/html|application)/i,             // data: URI XSS
  /\.\.[/\\]/,                                          // path traversal
  /%2e%2e[%2f%5c]/i,                                    // URL-encoded traversal
  /union\s+(?:all\s+)?select/i,                         // SQL injection
  /(?:or|and)\s+['"\d].+[=<>]/i,                       // SQLi condition
  /;\s*(?:drop|delete|truncate|update)\s+/i,            // destructive SQL
  /(?:exec|execute|sp_executesql)\s*\(/i,               // SQL execution
  /169\.254\.169\.254/,                                 // AWS IMDS SSRF
  /metadata\.google\.internal/i,                        // GCP metadata SSRF
  /169\.254\.170\.2/,                                   // ECS metadata SSRF
  /\bfile\s*:\/\//i,                                    // file:// LFI
]

/** Returns true if the input contains a known attack pattern */
export function isMaliciousPayload(input: string): boolean {
  return THREAT_PATTERNS.some(p => p.test(input))
}

/** Recursively scan all string values in a JSON body for malicious patterns */
export function scanBody(body: unknown, depth = 0): boolean {
  if (depth > 5) return false
  if (typeof body === 'string') return isMaliciousPayload(body)
  if (Array.isArray(body)) return body.some(v => scanBody(v, depth + 1))
  if (body && typeof body === 'object') {
    return Object.values(body as Record<string, unknown>).some(v => scanBody(v, depth + 1))
  }
  return false
}

// ── Payload size guard ────────────────────────────────────────────────────────

/** Throw if Content-Length exceeds maxBytes (default 1 MB) */
export function assertPayloadSize(
  contentLength: string | null,
  maxBytes = 1_048_576
): void {
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    throw Object.assign(
      new Error(`Payload too large (limit: ${maxBytes} bytes)`),
      { status: 413 }
    )
  }
}

// ── Rate limit key ────────────────────────────────────────────────────────────

/** Deterministic rate limit key — truncated userId, no other PII */
export function rlKey(userId: string, action: string): string {
  return `rl:${action}:${userId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 36)}`
}

// ── Structured security log ───────────────────────────────────────────────────

export type SecurityEvent =
  | 'csrf_blocked'
  | 'payload_too_large'
  | 'malicious_payload'
  | 'auth_failed'
  | 'rate_limited'
  | 'path_traversal'
  | 'unauthorized_admin'
  | 'arcjet_error'
  | 'middleware_session_error'

export function logSecurityEvent(
  event: SecurityEvent,
  meta: Record<string, string | number | boolean | null>
): void {
  console.warn(
    JSON.stringify({
      level: 'security',
      event,
      timestamp: new Date().toISOString(),
      ...meta,
    })
  )
}
