import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
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

/**
 * Reached from the emailed link. Supabase puts a recovery session in the URL
 * and the client picks it up via `detectSessionInUrl`, so by the time this
 * renders the user is authenticated well enough to set a new password.
 */
export function ResetPasswordPage() {
  const updatePassword = useAuthStore((s) => s.updatePassword)
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

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
      await updatePassword(password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set the password.')
    } finally {
      setBusy(false)
    }
  }

  const linkExpired = !loading && !session

  return (
    <AuthLayout>
      <AuthCard>
        <AuthTitle>Set a new password</AuthTitle>
        <AuthSubtitle>
          {linkExpired
            ? 'That link has expired. Request a new one to continue.'
            : 'Pick something you can actually remember.'}
        </AuthSubtitle>

        {!linkExpired && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-3.5">
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <TextField
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <div className="pt-1">
              <AuthButton type="submit" busy={busy}>
                Save password
              </AuthButton>
            </div>
          </form>
        )}

        <AuthError>{error}</AuthError>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-[13px] text-slate-700 underline underline-offset-2 hover:text-blue-800 hover:decoration-2"
          >
            {linkExpired ? 'Send a new link' : 'Start over'}
          </button>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
