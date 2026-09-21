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

  if (offline || !session) return <>{children}</>

  if (status === 'checking') {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="label-mono text-[11px] text-slate-400">Loading…</p>
      </div>
    )
  }

  if (status === 'needs-onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
