import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { repository } from '@/data'
import { useAuthStore } from '@/features/auth/useAuthStore'

type Status = 'checking' | 'onboarded' | 'needs-onboarding'

/**
 * Sends a brand-new account through setup before it reaches an empty board.
 *
 * Skipped entirely without Supabase: the mock profile is never marked
 * onboarded, so gating on it would trap demo and design work in the wizard on
 * every reload.
 */
export function RequireOnboarded({ children }: { children: React.ReactNode }) {
  const status = useOnboardedStatus()
  if (status === 'skip') return <>{children}</>
  if (status === 'checking') return <Checking />
  if (status === 'needs-onboarding') return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

/**
 * The other way round: onboarding is only for accounts that haven't done it.
 * Going through it again, from the back button or a bookmark, would save a
 * second set of pillars over a board already in use.
 */
export function RedirectIfOnboarded({ children }: { children: React.ReactNode }) {
  const status = useOnboardedStatus()
  if (status === 'skip') return <>{children}</>
  if (status === 'checking') return <Checking />
  if (status === 'onboarded') return <Navigate to="/" replace />
  return <>{children}</>
}

function Checking() {
  return (
    <div className="flex min-h-full items-center justify-center">
      <p role="status" className="label-mono text-[12px] text-slate-600">Loading…</p>
    </div>
  )
}

function useOnboardedStatus(): Status | 'skip' {
  const offline = useAuthStore((s) => s.offline)
  const session = useAuthStore((s) => s.session)
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    if (offline || !session) return

    let cancelled = false
    void repository
      .getProfile()
      .then((profile) => {
        if (cancelled) return
        setStatus(profile?.onboardedAt ? 'onboarded' : 'needs-onboarding')
      })
      .catch(() => {
        // A failed profile read shouldn't lock someone out of their board.
        if (!cancelled) setStatus('onboarded')
      })

    return () => {
      cancelled = true
    }
  }, [offline, session])

  return offline || !session ? 'skip' : status
}
