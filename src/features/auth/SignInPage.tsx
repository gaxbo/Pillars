import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AuthButton,
  AuthCard,
  AuthError,
  AuthLayout,
  AuthNote,
  AuthSubtitle,
  AuthTitle,
  TextField,
} from './AuthUI'
import { useAuthStore } from './useAuthStore'

export function SignInPage() {
  const signIn = useAuthStore((s) => s.signIn)
  const offline = useAuthStore((s) => s.offline)
  const setPendingEmail = useAuthStore((s) => s.setPendingEmail)
  const navigate = useNavigate()
  // The landing page's "Early access" link lands here with ?access=early.
  const [params] = useSearchParams()
  const early = params.get('access') === 'early'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const address = email.trim()
    try {
      await signIn(address, password)
      navigate('/', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not sign in.'

      // An unconfirmed account is not a failure, it is an unfinished
      // sign-up — send them to the code screen instead of a dead end.
      if (/not confirmed|not verified/i.test(message)) {
        setPendingEmail(address)
        navigate(`/verify?type=signup&email=${encodeURIComponent(address)}`)
        return
      }
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout split>
      <AuthCard>
        {early && (
          <p className="label-mono mb-3 text-center text-[12px] text-blue-800">
            Early access
          </p>
        )}
        <AuthTitle size="lg">Pillars</AuthTitle>
        <AuthSubtitle>
          {early
            ? 'Welcome back. Sign in with your beta account.'
            : 'A weekly planner for your 5-9 and everything in between.'}
        </AuthSubtitle>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3.5">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="pt-2">
            <AuthButton type="submit" busy={busy} disabled={offline}>
              Sign In
            </AuthButton>
          </div>
        </form>

        <AuthError>{error}</AuthError>

        {offline && (
          <AuthNote>
            Supabase isn&apos;t configured yet, so accounts are unavailable.
            Copy <code>.env.example</code> to <code>.env</code> and add your
            keys — or{' '}
            <Link to="/" className="underline underline-offset-2">
              keep exploring with sample data
            </Link>
            .
          </AuthNote>
        )}

        <div className="mt-6 flex items-center justify-between gap-4">
          <Link
            to="/sign-up"
            className="text-[13px] text-slate-700 underline underline-offset-2 hover:text-blue-800 hover:decoration-2"
          >
            Make an account
          </Link>
          <Link
            to="/forgot-password"
            className="text-[13px] text-slate-700 underline underline-offset-2 hover:text-blue-800 hover:decoration-2"
          >
            Forgot password?
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
