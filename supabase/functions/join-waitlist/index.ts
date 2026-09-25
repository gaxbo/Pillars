// The waitlist's front door once CAPTCHA is on.
//
// Checks the form's Turnstile token with Cloudflare, then adds the address
// through join_waitlist() (migration 0003). Migration 0007 then takes that
// function away from the public API, so bots can't skip the check by
// calling it directly.
//
// Deploy with JWT verification off: the landing page has no signed-in user,
// and the Turnstile token is this function's check instead. Needs one
// secret, TURNSTILE_SECRET_KEY. SUPABASE_DB_URL is provided by Supabase: the
// insert goes straight to the database rather than through the REST API, so
// it doesn't depend on which kind of API keys the project has switched on.

import postgres from 'npm:postgres@3.4.5'

const sql = postgres(Deno.env.get('SUPABASE_DB_URL') ?? '', { prepare: false, max: 1 })

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

export async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  if (req.method !== 'POST') return reply(405, { code: 'method_not_allowed' })

  const body = await req.json().catch(() => null)
  const { email, source, token } = body ?? {}
  if (
    typeof email !== 'string' ||
    typeof token !== 'string' ||
    (source !== undefined && source !== null && typeof source !== 'string')
  ) {
    return reply(400, { code: 'bad_request' })
  }

  const verdict = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: Deno.env.get('TURNSTILE_SECRET_KEY') ?? '',
      response: token,
      remoteip: req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? '',
    }),
  })
    .then((r) => r.json())
    .catch(() => null)
  if (!verdict?.success) {
    // Cloudflare's reasons are safe to pass on, and they tell a bad token
    // ("invalid-input-response") from a bad secret ("invalid-input-secret").
    const reasons: string[] = verdict?.['error-codes'] ?? ['no-answer-from-cloudflare']
    console.error('Turnstile refused the token:', reasons.join(', '))
    return reply(403, { code: 'captcha_failed', reasons })
  }

  try {
    await sql`select public.join_waitlist(${email}, ${source ?? null})`
    return reply(200, { ok: true })
  } catch (error) {
    const { code, message } = (error ?? {}) as { code?: string; message?: string }
    // A check violation is the address failing the table's shape check; pass
    // it on so the form can say so. Anything else is ours, and logged.
    if (code === '23514') return reply(400, { code: '23514' })
    console.error('join_waitlist failed:', code, message)
    return reply(502, { code: 'error' })
  }
}

Deno.serve(handle)
