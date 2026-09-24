import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { CenteredState, CheckMark } from './AuthUI'
import { useAuthStore } from './useAuthStore'

const RESEND_COOLDOWN = 30

/** "Reset link sent! — Check your inbox to reset your password" */
export function ResetLinkSentPage() {
  const sendReset = useAuthStore((s) => s.sendReset)
  const pendingEmail = useAuthStore((s) => s.pendingEmail)
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const email = params.get('email') ?? pendingEmail

  const [cooldown, setCooldown] = useState(0)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  async function handleResend() {
    if (cooldown > 0 || !email) return
    setError('')
    setNote('')
    try {
      await sendReset(email)
      setNote('Another link is on its way.')
      setCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the link.')
    }
  }

  return (
    <CenteredState
      title="Reset link sent!"
      subtitle="Check your inbox to reset your password"
      icon={<CheckMark />}
    >
      {email && (
        <p className="-mt-2 mb-6 text-[13px] text-slate-600">{email}</p>
      )}

      <div className="flex items-center justify-center gap-10">
        <button
          type="button"
          onClick={() => navigate('/sign-in')}
          className="text-[13px] text-slate-700 underline underline-offset-2 hover:text-blue-800 hover:decoration-2"
        >
          Go back
        </button>
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={cooldown > 0}
          className={cn(
            'text-[13px] underline underline-offset-2',
            cooldown > 0
              ? 'cursor-not-allowed text-slate-600 no-underline'
              : 'text-slate-700 hover:text-blue-700',
          )}
        >
          {cooldown > 0 ? `Send another link in ${cooldown}s` : 'Send another link'}
        </button>
      </div>

      {note && <p className="mt-5 text-[13px] text-blue-700">{note}</p>}
      {error && (
        <p role="alert" className="mt-5 text-[13px] text-error-text">
          {error}
        </p>
      )}
    </CenteredState>
  )
}
