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
  /**
   * True once this tab has come in through the emailed reset link. Setting a
   * new password needs it: any other session would let whoever is at the
   * keyboard change the password without knowing the current one.
   */
  recovering: boolean

  init: () => () => void
  // `captchaToken` is from useCaptcha(); undefined while CAPTCHA is off.
  signIn: (email: string, password: string, captchaToken?: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    fullName: string,
    /** The early access password; supabase/migrations/0005 checks it. */
    accessCode: string,
    captchaToken?: string,
  ) => Promise<{ needsVerification: boolean }>
  signOut: () => Promise<void>
  /** The address awaiting a code, so the verify screen survives a refresh. */
  pendingEmail: string
  setPendingEmail: (email: string) => void

  verifyCode: (
    email: string,
    token: string,
    type: 'signup' | 'email',
    captchaToken?: string,
  ) => Promise<void>
  resendCode: (email: string, type: 'signup' | 'email', captchaToken?: string) => Promise<void>
  sendReset: (email: string, captchaToken?: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}

/** Supabase errors are user-facing here, so keep the message and drop the rest. */
function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  offline: !isSupabaseConfigured,
  recovering: false,
  pendingEmail: readPendingEmail(),

  init() {
    if (!supabase) {
      set({ loading: false, offline: true })
      return () => {}
    }

    // initialize() has finished reading any link in the URL by the time it
    // resolves; its error says whether the link's tokens were good.
    void Promise.all([supabase.auth.initialize(), supabase.auth.getSession()]).then(
      ([{ error }, { data }]) => {
        const fromLink = resetLinkPending && !error && data.session !== null
        resetLinkPending = false
        set((s) => ({
          session: data.session,
          user: data.session?.user ?? null,
          loading: false,
          recovering: s.recovering || fromLink,
        }))
      },
    )

    // Loading ends above, not here: an early event would end it before
    // recovery is known, and the reset page would flash "expired".
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      set({
        session,
        user: session?.user ?? null,
        // Only the reset link starts recovery; token refreshes and the like
        // leave it as it was.
        ...(event === 'PASSWORD_RECOVERY' && { recovering: true }),
        ...(event === 'SIGNED_OUT' && { recovering: false }),
      })
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
  async verifyCode(email, token, type, captchaToken) {
    const { error } = await requireClient().auth.verifyOtp({
      email,
      token: token.trim(),
      type,
      options: { captchaToken },
    })
    fail(error)
    writePendingEmail('')
    set({ pendingEmail: '' })
  },

  async resendCode(email, type, captchaToken) {
    const client = requireClient()
    // resend() only covers signup and change flows; a fresh sign-in
    // challenge is issued by requesting a new one.
    const { error } =
      type === 'signup'
        ? await client.auth.resend({ type: 'signup', email, options: { captchaToken } })
        : await client.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false, captchaToken },
          })
    fail(error)
  },

  async signIn(email, password, captchaToken) {
    const { error } = await requireClient().auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    })
    fail(error)
  },

  async signUp(email, password, fullName, accessCode, captchaToken) {
    const { data, error } = await requireClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        // Lands in auth.users.raw_user_meta_data, which the email templates
        // can read as {{ .Data.full_name }}; a trigger mirrors it to profiles.
        // access_code is checked and stripped before the row is written.
        data: { full_name: fullName.trim(), access_code: accessCode.trim() },
        captchaToken,
      },
    })
    // The early access trigger can only fail the insert, and Supabase
    // reports any failed insert the same way.
    if (error && /database error saving new user/i.test(error.message)) {
      throw new Error("That early access password isn't right. Check your invite and try again.")
    }
    fail(error)
    // With email confirmation on, Supabase returns a user but no session.
    return { needsVerification: !data.session }
  },

  async signOut() {
    const { error } = await requireClient().auth.signOut()
    fail(error)
    set({ session: null, user: null, recovering: false })
  },

  async sendReset(email, captchaToken) {
    const { error } = await requireClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken,
    })
    fail(error)
  },

  async updatePassword(password) {
    if (!get().recovering) {
      throw new Error('Open the link in your reset email to set a new password.')
    }
    const { error } = await requireClient().auth.updateUser({ password })
    fail(error)
    // One link, one change.
    set({ recovering: false })
  },
}))

/**
 * Read once, before Supabase takes the reset link's tokens out of the URL.
 * Its PASSWORD_RECOVERY event says the same, but only a tick after the
 * session lands. Faking the hash gains nothing: without tokens Supabase
 * accepts, `initialize()` reports an error and recovery never starts.
 */
let resetLinkPending = (() => {
  const params = new URLSearchParams(window.location.hash.slice(1))
  return params.get('type') === 'recovery' && params.has('access_token')
})()

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
