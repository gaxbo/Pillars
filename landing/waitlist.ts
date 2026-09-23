/**
 * Adds an address to the `waitlist` table (supabase/migrations/0003).
 *
 * A plain fetch rather than supabase-js: one insert doesn't justify shipping
 * the client library to every visitor. The table accepts inserts from anyone
 * and can't be read back, so there is nothing else this page needs.
 */

export type JoinResult = 'joined' | 'already' | 'invalid' | 'error'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function looksLikeEmail(value: string): boolean {
  return EMAIL.test(value) && value.length <= 254
}

export async function joinWaitlist(email: string, source: string): Promise<JoinResult> {
  if (!url || !key) return 'error'

  try {
    const res = await fetch(`${url}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        // Insert only: the table has no read policy, so asking for the row
        // back would fail.
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), source }),
    })
    if (res.ok) return 'joined'

    const body = (await res.json().catch(() => null)) as { code?: string } | null
    // Unique violation: they signed up before. That's a success to them.
    if (res.status === 409 || body?.code === '23505') return 'already'
    // Check violation: the database's shape check disagreed with ours.
    if (body?.code === '23514') return 'invalid'
    return 'error'
  } catch {
    return 'error'
  }
}
