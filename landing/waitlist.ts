/**
 * Adds an address to the waitlist through `join_waitlist()`
 * (supabase/migrations/0003).
 *
 * A plain fetch rather than supabase-js: one call doesn't justify shipping
 * the client library to every visitor. The function answers the same way for
 * a new address and one already listed, so there is no "already on the list"
 * to report: that answer would tell anyone whether an address had signed up.
 */

export type JoinResult = 'joined' | 'invalid' | 'error'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function looksLikeEmail(value: string): boolean {
  return EMAIL.test(value) && value.length <= 254
}

export async function joinWaitlist(email: string, source: string): Promise<JoinResult> {
  if (!url || !key) return 'error'

  try {
    const res = await fetch(`${url}/rest/v1/rpc/join_waitlist`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), source }),
    })
    if (res.ok) return 'joined'

    const body = (await res.json().catch(() => null)) as { code?: string } | null
    // Check violation: the database's shape check disagreed with ours.
    if (body?.code === '23514') return 'invalid'
    return 'error'
  } catch {
    return 'error'
  }
}
