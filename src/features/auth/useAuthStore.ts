import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  /** True until the initial session lookup finishes. */
  loading: boolean
  /** Set when Supabase isn't configured — the app runs on mock data. */
  offline: boolean

  init: () => () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsVerification: boolean }>
  signOut: () => Promise<void>
  sendReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}

/** Supabase errors are user-facing here, so keep the message and drop the rest. */
function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  offline: !isSupabaseConfigured,

  init() {
    if (!supabase) {
      set({ loading: false, offline: true })
      return () => {}
    }

    void supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, user: data.session?.user ?? null, loading: false })
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false })
    })

    return () => data.subscription.unsubscribe()
  },

  async signIn(email, password) {
    const { error } = await requireClient().auth.signInWithPassword({ email, password })
    fail(error)
  },

  async signUp(email, password) {
    const { data, error } = await requireClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    fail(error)
    // With email confirmation on, Supabase returns a user but no session.
    return { needsVerification: !data.session }
  },

  async signOut() {
    const { error } = await requireClient().auth.signOut()
    fail(error)
    set({ session: null, user: null })
  },

  async sendReset(email) {
    const { error } = await requireClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    fail(error)
  },

  async updatePassword(password) {
    const { error } = await requireClient().auth.updateUser({ password })
    fail(error)
  },
}))

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}
