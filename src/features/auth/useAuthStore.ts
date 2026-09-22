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
  /** The address awaiting a code, so the verify screen survives a refresh. */
  pendingEmail: string
  setPendingEmail: (email: string) => void

  verifyCode: (email: string, token: string, type: 'signup' | 'email') => Promise<void>
  resendCode: (email: string, type: 'signup' | 'email') => Promise<void>
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
  pendingEmail: readPendingEmail(),

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

  setPendingEmail(email) {
    writePendingEmail(email)
    set({ pendingEmail: email })
  },

  /**
   * Supabase sends either a link or a 6-digit code depending on the email
   * template; this verifies the code path. `signup` confirms a new account,
   * `email` confirms a sign-in challenge.
   */
  async verifyCode(email, token, type) {
    const { error } = await requireClient().auth.verifyOtp({
      email,
      token: token.trim(),
      type,
    })
    fail(error)
    writePendingEmail('')
    set({ pendingEmail: '' })
  },

  async resendCode(email, type) {
    const client = requireClient()
    // resend() only covers signup and change flows; a fresh sign-in
    // challenge is issued by requesting a new one.
    const { error } =
      type === 'signup'
        ? await client.auth.resend({ type: 'signup', email })
        : await client.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false },
          })
    fail(error)
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

const PENDING_KEY = 'pillars.auth.pendingEmail'

/** Storage throws in private mode; an empty address just means retyping it. */
function readPendingEmail(): string {
  try {
    return window.localStorage.getItem(PENDING_KEY) ?? ''
  } catch {
    return ''
  }
}

function writePendingEmail(email: string) {
  try {
    if (email) window.localStorage.setItem(PENDING_KEY, email)
    else window.localStorage.removeItem(PENDING_KEY)
  } catch {
    // Non-fatal.
  }
}

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}
