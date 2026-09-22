import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

const MIN_PASSWORD = 8

export function SignUpPage() {
  const signUp = useAuthStore((s) => s.signUp)
  const setPendingEmail = useAuthStore((s) => s.setPendingEmail)
  const offline = useAuthStore((s) => s.offline)
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    // Checked here so the user finds out before a round trip.
    if (fullName.trim().length < 2) {
      setError('What should we call you?')
      return
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters.`)
      return
    }
    if (password !== confirm) {
      setError("Those passwords don't match.")
      return
    }

    setBusy(true)
    try {
      const address = email.trim()
      const { needsVerification } = await signUp(address, password, fullName)
      if (needsVerification) {
        setPendingEmail(address)
        navigate(`/verify?type=signup&email=${encodeURIComponent(address)}`, {
          replace: true,
        })
      } else {
        navigate('/welcome', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create an account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout split>
      <AuthCard>
        <AuthTitle size="lg">Pillars</AuthTitle>
        <AuthSubtitle>Make an account and build your first week.</AuthSubtitle>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3.5">
          <TextField
            label="Your name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <div className="pt-2">
            <AuthButton type="submit" busy={busy} disabled={offline}>
              Create account
            </AuthButton>
          </div>
        </form>

        <AuthError>{error}</AuthError>

        <div className="mt-6 text-center">
          <Link
            to="/sign-in"
            className="text-[13px] text-slate-700 underline underline-offset-2 hover:text-blue-700"
          >
            I already have an account
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
