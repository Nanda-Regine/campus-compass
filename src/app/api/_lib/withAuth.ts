import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getReqId, safeError, checkCsrfOrigin, assertPayloadSize, logSecurityEvent } from '@/lib/security'
import type { User } from '@supabase/supabase-js'

export interface AuthCtx {
  userId: string
  user: User
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
  reqId: string
}

type Handler = (ctx: AuthCtx) => Promise<Response>

/**
 * Wraps an API route handler with:
 *  - CSRF origin validation
 *  - Payload size guard (1 MB)
 *  - Supabase session verification
 *  - X-Request-ID tracing on every response
 *  - Safe error serialization
 */
export async function withAuth(request: Request, handler: Handler): Promise<Response> {
  const reqId = getReqId(request)
  const headers = { 'X-Request-ID': reqId }

  // CSRF check for mutating methods
  if (!checkCsrfOrigin(request)) {
    logSecurityEvent('csrf_blocked', {
      reqId,
      method: request.method,
      origin: request.headers.get('origin') ?? '',
      host: request.headers.get('host') ?? '',
    })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers })
  }

  // Payload size guard
  try {
    assertPayloadSize(request.headers.get('content-length'))
  } catch {
    logSecurityEvent('payload_too_large', { reqId })
    return NextResponse.json({ error: 'Payload too large' }, { status: 413, headers })
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      logSecurityEvent('auth_failed', { reqId, reason: safeError(error) })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    }

    const response = await handler({ userId: user.id, user, supabase, reqId })

    // Ensure trace ID is always in the response
    if (!response.headers.get('X-Request-ID')) {
      response.headers.set('X-Request-ID', reqId)
    }

    return response
  } catch (err) {
    const msg = safeError(err)
    console.error(`[${reqId}] Unhandled API error: ${msg}`)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}

/**
 * GET-only variant — skips CSRF check (safe for read-only endpoints)
 */
export async function withAuthGet(request: Request, handler: Handler): Promise<Response> {
  const reqId = getReqId(request)
  const headers = { 'X-Request-ID': reqId }

  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    }

    const response = await handler({ userId: user.id, user, supabase, reqId })
    if (!response.headers.get('X-Request-ID')) {
      response.headers.set('X-Request-ID', reqId)
    }
    return response
  } catch (err) {
    console.error(`[${reqId}] API error: ${safeError(err)}`)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
