import { useId, type ReactNode, type Ref } from 'react'
import { cn } from '@/lib/cn'
import { AuthShowcase } from './AuthShowcase'

/**
 * Sign-in uses the split layout from the design: a blue gradient panel on the
 * left, the card on the right. Every other auth screen centres the same card
 * on the page wash.
 */
export function AuthLayout({
  split = false,
  children,
}: {
  split?: boolean
  children: ReactNode
}) {
  if (!split) {
    return (
      <main className="flex min-h-full items-center justify-center p-6">
        {children}
      </main>
    )
  }

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <AuthShowcase />
      <main className="flex flex-1 items-center justify-center bg-white p-6">
        {children}
      </main>
    </div>
  )
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="w-full max-w-[26rem] rounded-[2rem] border border-white/70 px-8 py-10 sm:px-10"
      style={{
        background: 'var(--gradient-surface)',
        boxShadow: 'var(--shadow-lift)',
      }}
    >
      {children}
    </div>
  )
}

export function AuthTitle({
  children,
  size = 'md',
}: {
  children: ReactNode
  size?: 'md' | 'lg'
}) {
  return (
    <h1
      className={cn(
        'text-center font-bold tracking-tight text-slate-900',
        size === 'lg' ? 'text-[40px] leading-none' : 'text-[28px] leading-tight',
      )}
    >
      {children}
    </h1>
  )
}

export function AuthSubtitle({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-center text-[15px] leading-snug text-slate-700">
      {children}
    </p>
  )
}

/**
 * A field with its label above it. The label used to be the placeholder,
 * which vanished on the first keystroke and left a filled-in form with no
 * names on it (WCAG 3.3.2).
 */
export function TextField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const fallbackId = useId()
  const id = props.id ?? fallbackId
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label htmlFor={id} className="pl-4 text-[13px] font-medium text-slate-800">
        {label}
      </label>
      <input
        {...props}
        id={id}
        className={cn(
          // 16px on a phone: iOS zooms the page into any smaller field.
          'w-full rounded-pill border border-slate-500 bg-white px-5 py-3.5 text-[16px] md:text-[15px]',
          'text-slate-900 placeholder:text-slate-500',
          'shadow-[var(--shadow-rest)] outline-none transition-[border-color,box-shadow] duration-150',
          'hover:border-blue-400',
          'focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30',
          props.className,
        )}
      />
    </div>
  )
}

export function AuthButton({
  children,
  busy,
  ...props
}: { busy?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const disabled = props.disabled || busy
  return (
    <button
      {...props}
      disabled={disabled}
      aria-busy={busy || undefined}
      className={cn(
        'btn-primary w-full rounded-pill px-6 py-3.5 text-[15px] font-semibold',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
      )}
    >
      {busy ? 'Just a moment…' : children}
    </button>
  )
}

export function AuthLink({
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      className={cn(
        'rounded-sm text-[13.5px] text-slate-700 underline underline-offset-2',
        'transition-colors duration-150 hover:text-blue-800 hover:decoration-2',
        props.className,
      )}
    >
      {children}
    </a>
  )
}

/** Errors from Supabase are shown verbatim — they are already user-facing. */
export function AuthError({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p
      role="alert"
      className="mt-4 rounded-pillar border border-error-text/25 bg-error-text/5 px-4 py-2.5 text-[13px] text-error-text"
    >
      {children}
    </p>
  )
}

/**
 * Where Turnstile's widget appears if it wants a click (see lib/captcha).
 * Takes no space otherwise; give spacing with `data-captcha-visible:`.
 */
export function CaptchaSlot({ ref, className }: { ref: Ref<HTMLDivElement>; className?: string }) {
  return <div ref={ref} className={cn('flex justify-center', className)} />
}

export function AuthNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 rounded-pillar border border-blue-200 bg-white/60 px-4 py-2.5 text-[13px] leading-snug text-slate-700">
      {children}
    </p>
  )
}

/**
 * The bare centred states from the design ("All set!", "Reset link sent!") —
 * no card, just the page wash behind a headline.
 */
export function CenteredState({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string
  subtitle?: ReactNode
  icon?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
      {icon && <div className="animate-rise mb-4">{icon}</div>}
      <h1 className="animate-rise delay-1 text-[40px] font-bold leading-none tracking-tight text-slate-900">
        {title}
      </h1>
      {subtitle && (
        <p className="animate-rise delay-2 mt-4 text-[17px] text-slate-700">
          {subtitle}
        </p>
      )}
      {children && <div className="mt-8">{children}</div>}
    </div>
  )
}

export function CheckMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-14 text-slate-900" aria-hidden="true">
      <path
        d="M10 25l10 10 18-22"
        fill="none"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Six-digit code entry. One input rather than six boxes: paste works, screen
 * readers announce one field, and mobile keyboards behave.
 */
export function CodeInput({
  value,
  onChange,
  onComplete,
  ...props
}: {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  ref?: React.Ref<HTMLInputElement>
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input
      {...props}
      value={value}
      onChange={(e) => {
        const next = e.target.value.replace(/\D/g, '').slice(0, 6)
        onChange(next)
        if (next.length === 6) onComplete?.(next)
      }}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      maxLength={6}
      placeholder="000000"
      aria-label="Six-digit code"
      className={cn(
        'w-full rounded-pill border border-slate-500 bg-white px-6 py-4',
        'text-center text-[26px] font-semibold tracking-[0.5em] text-slate-900',
        'placeholder:font-normal placeholder:tracking-[0.5em] placeholder:text-slate-500',
        'shadow-[var(--shadow-rest)] outline-none transition-shadow duration-150',
        'focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30',
      )}
    />
  )
}
