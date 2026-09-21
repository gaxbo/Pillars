import { Link } from 'react-router-dom'
import {
  AuthCard,
  AuthLayout,
  AuthSubtitle,
  AuthTitle,
} from './AuthUI'

export function VerifyPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <AuthTitle>Check your email</AuthTitle>
        <AuthSubtitle>
          We sent you a link to confirm your address. Open it and you&apos;ll be
          signed in.
        </AuthSubtitle>

        <p className="mt-6 text-center text-[13px] leading-relaxed text-slate-500">
          Nothing yet? It can take a minute, and it sometimes lands in spam.
        </p>

        <div className="mt-6 text-center">
          <Link
            to="/sign-in"
            className="text-[13px] text-slate-700 underline underline-offset-2 hover:text-blue-700"
          >
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
