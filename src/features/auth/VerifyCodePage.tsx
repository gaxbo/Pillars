import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/cn'
import {
  AuthButton,
  AuthCard,
  AuthError,
  AuthLayout,
  AuthNote,
  AuthSubtitle,
  AuthTitle,
  CodeInput,
} from './AuthUI'
import { useAuthStore } from './useAuthStore'

const RESEND_COOLDOWN = 30

/**
 * "Check your email — just making sure it's you!"
 *
 * Reached after sign-up, or after a sign-in that needs confirming. The
 * challenge type comes from the query string so one screen serves both.
 */
export function VerifyCodePage() {
  const verifyCode = useAuthStore((s) => s.verifyCode)
  const resendCode = useAuthStore((s) => s.resendCode)
  const pendingEmail = useAuthStore((s) => s.pendingEmail)
  const offline = useAuthStore((s) => s.offline)

  const [params] = useSearchParams()
  const navigate = useNavigate()

  const type = params.get('type') === 'email' ? 'email' : 'signup'
  const email = params.get('email') ?? pendingEmail

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [resent, setResent] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  async function submit(value: string) {
    if (value.length !== 6 || busy) return
    setError('')
    setBusy(true)
    try {
      await verifyCode(email, value, type)
      navigate('/welcome', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'That code did not work.',
      )
      setCode('')
      inputRef.current?.focus()
    } finally {
      setBusy(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0) return
    setError('')
    setResent(false)
    try {
      await resendCode(email, type)
      setResent(true)
      setCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a new code.')
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <AuthTitle>Check your email</AuthTitle>
        <AuthSubtitle>Just making sure it&rsquo;s you!</AuthSubtitle>

        {email && (
          <p className="mt-2 text-center text-[13px] text-slate-500">{email}</p>
        )}

        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            void submit(code)
          }}
          className="mt-7"
        >
          <CodeInput
            ref={inputRef}
            value={code}
            onChange={setCode}
            onComplete={(value) => void submit(value)}
            disabled={busy}
          />
          <div className="pt-4">
            <AuthButton
              type="submit"
              busy={busy}
              disabled={code.length !== 6 || offline}
            >
              Verify
            </AuthButton>
          </div>
        </form>

        <AuthError>{error}</AuthError>

        {resent && !error && <AuthNote>A new code is on its way.</AuthNote>}

        {offline && (
          <AuthNote>
            Supabase isn&apos;t configured, so there&apos;s no code to check.
          </AuthNote>
        )}

        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/sign-in')}
            className="text-[13px] text-slate-700 underline underline-offset-2 hover:text-blue-700"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={cooldown > 0 || offline}
            className={cn(
              'text-[13px] underline underline-offset-2',
              cooldown > 0
                ? 'cursor-not-allowed text-slate-400 no-underline'
                : 'text-slate-700 hover:text-blue-700',
            )}
          >
            {cooldown > 0 ? `Send another code in ${cooldown}s` : 'Send another code'}
          </button>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
