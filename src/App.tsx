import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { BoardPage } from '@/features/board/BoardPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { SignInPage } from '@/features/auth/SignInPage'
import { SignUpPage } from '@/features/auth/SignUpPage'
import { ResetLinkSentPage } from '@/features/auth/ResetLinkSentPage'
import { VerifyCodePage } from '@/features/auth/VerifyCodePage'
import { WelcomePage } from '@/features/auth/WelcomePage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { RequireOnboarded } from '@/features/onboarding/RequireOnboarded'
import { WeeklyReviewPage } from '@/features/weekly/WeeklyReviewPage'
import {
  AccountPage,
  NotificationsPage,
  PillarsGoalsPage,
} from '@/features/settings/SettingsPage'
import { AboutPage, HelpPage } from '@/features/settings/InfoPages'
import { useAuthStore } from '@/features/auth/useAuthStore'

export default function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => init(), [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/verify" element={<VerifyCodePage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/reset-link-sent" element={<ResetLinkSentPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/weekly-review"
          element={
            <RequireAuth>
              <WeeklyReviewPage />
            </RequireAuth>
          }
        />
        {/* The account menu's rows, as in the design's "account op" screen. */}
        {(
          [
            ['/settings/account', <AccountPage />],
            ['/settings/notifications', <NotificationsPage />],
            ['/settings/pillars', <PillarsGoalsPage />],
            ['/help', <HelpPage />],
            ['/about', <AboutPage />],
          ] as const
        ).map(([path, page]) => (
          <Route
            key={path}
            path={path}
            element={
              <RequireAuth>
                <RequireOnboarded>{page}</RequireOnboarded>
              </RequireAuth>
            }
          />
        ))}
        <Route path="/settings" element={<Navigate to="/settings/account" replace />} />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <RequireOnboarded>
                <BoardPage />
              </RequireOnboarded>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

/**
 * Without Supabase configured there are no accounts, so the board opens
 * straight onto sample data rather than trapping the user at a sign-in screen
 * that cannot work.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)
  const offline = useAuthStore((s) => s.offline)
  const location = useLocation()

  if (offline) return <>{children}</>

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p role="status" className="label-mono text-[12px] text-slate-600">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  return <>{children}</>
}
