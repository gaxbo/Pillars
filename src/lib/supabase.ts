import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Development escape hatch: treat Supabase as absent even when keys are
 * present, so the app drops into the mock path and skips sign-in. Keeping it
 * here rather than in the route guards means auth and data stay in agreement —
 * bypassing the login screen while still talking to Supabase would only fail
 * later, on the first query that needs a session.
 */
const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true'

/**
 * The app runs against mock data until Supabase is configured, so a missing
 * key is a normal state rather than a crash. `isSupabaseConfigured` is what
 * decides which repository the board uses.
 */
export const isSupabaseConfigured = !bypassAuth && Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/** Throws rather than returning null, for call sites that require a session. */
export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      bypassAuth
        ? 'Supabase is disabled by VITE_BYPASS_AUTH. Remove it from .env to sign in for real.'
        : 'Supabase is not configured. Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    )
  }
  return supabase
}
