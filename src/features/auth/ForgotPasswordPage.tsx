import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AuthButton,
  AuthCard,
  AuthError,
  AuthLayout,
  AuthSubtitle,
  AuthTitle,
  TextField,
} from './AuthUI'
import { useAuthStore } from './useAuthStore'

export function ForgotPasswordPage() {
  const sendReset = useAuthStore((s) => s.sendReset)
  const offline = useAuthStore((s) => s.offline)

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await sendReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the link.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <AuthCard>
          <AuthTitle>Link sent</AuthTitle>
          <AuthSubtitle>
            If an account exists for {email}, a reset link is on its way.
          </AuthSubtitle>

          <div className="mt-8 flex flex-col items-start gap-2">
            <Link
              to="/sign-in"
              className="text-[13px] text-slate-700 underline underline-offset-2 hover:text-blue-700"
            >
              Go back
            </Link>
            <button
              type="button"
              onClick={() => {
                setSent(false)
                setEmail('')
              }}
              className="text-[13px] text-slate-700 underline underline-offset-2 hover:text-blue-700"
            >
              Use a different email.
            </button>
          </div>
        </AuthCard>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AuthCard>
        <AuthTitle>Enter your email</AuthTitle>
        <AuthSubtitle>Forgot your password?</AuthSubtitle>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3.5">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="pt-1">
            <AuthButton type="submit" busy={busy} disabled={offline}>
              Continue
            </AuthButton>
          </div>
        </form>

        <AuthError>{error}</AuthError>

        <div className="mt-6 flex flex-col items-start gap-2">
          <Link
            to="/sign-in"
            className="text-[13px] text-slate-700 underline underline-offset-2 hover:text-blue-700"
          >
            Go back
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
