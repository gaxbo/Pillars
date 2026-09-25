// The waitlist's front door once CAPTCHA is on.
//
// Checks the form's Turnstile token with Cloudflare, then adds the address
// through join_waitlist() (migration 0003). Migration 0006 then takes that
// function away from the public API, so bots can't skip the check by
// calling it directly.
//
// Deploy with JWT verification off: the landing page has no signed-in user,
// and the Turnstile token is this function's check instead. Needs one
// secret, TURNSTILE_SECRET_KEY; SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// are provided by Supabase.

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
  if (!verdict?.success) return reply(403, { code: 'captcha_failed' })

  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/join_waitlist`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, source: source ?? null }),
  })
  if (res.ok) return reply(200, { ok: true })

  // A check violation (23514) is the address failing the table's shape
  // check; pass it on so the form can say so. Anything else is ours.
  const error = await res.json().catch(() => null)
  return error?.code === '23514' ? reply(400, { code: '23514' }) : reply(502, { code: 'error' })
}

Deno.serve(handle)
