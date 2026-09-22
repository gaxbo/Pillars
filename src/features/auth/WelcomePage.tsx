import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CenteredState } from './AuthUI'
import { useAuthStore } from './useAuthStore'

/**
 * "All set! / Logging you in."
 *
 * A held beat after verification rather than a snap to the board — the
 * verification already succeeded, so this is confirmation, not a spinner.
 */
export function WelcomePage() {
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)
  const offline = useAuthStore((s) => s.offline)
  const navigate = useNavigate()

  useEffect(() => {
    // Long enough to read, short enough not to feel stuck.
    const id = window.setTimeout(() => {
      navigate(session || offline ? '/' : '/sign-in', { replace: true })
    }, 1400)
    return () => window.clearTimeout(id)
  }, [session, offline, navigate])

  return (
    <CenteredState
      title="All set!"
      subtitle={
        loading || session || offline
          ? 'Logging you in.'
          : 'Taking you back to sign in.'
      }
    />
  )
}
