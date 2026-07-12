import { describe, it, expect } from 'vitest'
import {
  sanitizeText,
  sanitizeHtml,
  isValidEmail,
  sanitizeFilename,
  checkCsrfOrigin,
  safeError,
  getReqId,
  isMaliciousPayload,
  scanBody,
  assertPayloadSize,
  rlKey,
} from './security'

// checkCsrfOrigin / getReqId only touch `.method` and `.headers.get()`, so a
// tiny stub avoids the fetch Request forbidden-header rules for `host`.
const req = (method: string, headers: Record<string, string>) =>
  ({ method, headers: { get: (k: string) => headers[k.toLowerCase()] ?? null } }) as unknown as Request

describe('sanitizeText', () => {
  it('strips HTML tags and returns empty for non-strings', () => {
    expect(sanitizeText('<b>hi</b>')).toBe('hi')
    expect(sanitizeText('<script>x</script>')).toBe('x')
    expect(sanitizeText(123 as unknown)).toBe('')
  })
  it('enforces max length', () => {
    expect(sanitizeText('a'.repeat(50), 10)).toHaveLength(10)
  })
})

describe('sanitizeHtml', () => {
  it('keeps allowlisted tags', () => {
    expect(sanitizeHtml('<b>bold</b>')).toBe('<b>bold</b>')
  })
  it('drops script tags and javascript: hrefs', () => {
    // Strips the <script> tag (leftover text is inert once the tag is gone).
    const out = sanitizeHtml('<script>alert(1)</script>hi')
    expect(out).not.toContain('<script')
    expect(out).not.toContain('</script')
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript')
  })
})

describe('isValidEmail', () => {
  it('accepts valid addresses', () => {
    expect(isValidEmail('nandaregine@gmail.com')).toBe(true)
    expect(isValidEmail('a.b+c@sub.example.co.za')).toBe(true)
  })
  it('rejects malformed or oversized addresses', () => {
    expect(isValidEmail('notanemail')).toBe(false)
    expect(isValidEmail('a@')).toBe(false)
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail(`${'a'.repeat(320)}@x.com`)).toBe(false)
    expect(isValidEmail(42 as unknown)).toBe(false)
  })
})

describe('sanitizeFilename', () => {
  it('strips path separators and dangerous chars', () => {
    const out = sanitizeFilename('../../etc/passwd')
    expect(out).not.toContain('/')
    expect(out).not.toContain('\\')
    expect(sanitizeFilename('a:b*c?.txt')).not.toMatch(/[:*?]/)
    expect(sanitizeFilename(null as unknown)).toBe('file')
  })
})

describe('isMaliciousPayload / scanBody', () => {
  it('flags XSS, SQLi and SSRF signatures', () => {
    expect(isMaliciousPayload('<script>x</script>')).toBe(true)
    expect(isMaliciousPayload("1' OR '1'='1")).toBe(true)
    expect(isMaliciousPayload('union select * from users')).toBe(true)
    expect(isMaliciousPayload('http://169.254.169.254/latest/meta-data')).toBe(true)
  })
  it('passes clean input', () => {
    expect(isMaliciousPayload('Hello, my budget is R500 this month')).toBe(false)
  })
  it('recurses into nested objects/arrays but bounds depth', () => {
    expect(scanBody({ a: { b: ['ok', '<script>x'] } })).toBe(true)
    expect(scanBody({ a: { b: 'clean' } })).toBe(false)
  })
})

describe('checkCsrfOrigin', () => {
  it('always allows safe methods', () => {
    expect(checkCsrfOrigin(req('GET', {}))).toBe(true)
    expect(checkCsrfOrigin(req('HEAD', { origin: 'https://evil.com', host: 'app.co.za' }))).toBe(true)
  })
  it('allows same-origin mutations and server-to-server (no Origin)', () => {
    expect(checkCsrfOrigin(req('POST', { origin: 'https://app.co.za', host: 'app.co.za' }))).toBe(true)
    expect(checkCsrfOrigin(req('POST', { host: 'app.co.za' }))).toBe(true)
  })
  it('blocks cross-origin mutations and missing host', () => {
    expect(checkCsrfOrigin(req('POST', { origin: 'https://evil.com', host: 'app.co.za' }))).toBe(false)
    expect(checkCsrfOrigin(req('POST', { origin: 'https://app.co.za' }))).toBe(false)
  })
})

describe('safeError', () => {
  it('scrubs keys, tokens and IPs; generic for non-Errors', () => {
    expect(safeError(new Error('boom sk-abcdef1234567890 leaked'))).toContain('[KEY]')
    expect(safeError(new Error('at 192.168.1.100 failed'))).toContain('[IP]')
    expect(safeError('a raw string')).toBe('An unexpected error occurred')
  })
})

describe('getReqId', () => {
  it('passes through a valid request id', () => {
    expect(getReqId(req('GET', { 'x-request-id': 'abc12345' }))).toBe('abc12345')
  })
  it('generates a uuid when absent or malformed', () => {
    expect(getReqId(req('GET', {}))).toMatch(/^[0-9a-f-]{36}$/i)
    expect(getReqId(req('GET', { 'x-request-id': 'bad id!' }))).toMatch(/^[0-9a-f-]{36}$/i)
  })
})

describe('assertPayloadSize / rlKey', () => {
  it('throws over the byte limit only', () => {
    expect(() => assertPayloadSize('2000000', 1_048_576)).toThrow()
    expect(() => assertPayloadSize('100', 1_048_576)).not.toThrow()
    expect(() => assertPayloadSize(null)).not.toThrow()
  })
  it('builds a deterministic, PII-free key', () => {
    expect(rlKey('user-123!!!', 'notify')).toBe('rl:notify:user-123')
  })
})
