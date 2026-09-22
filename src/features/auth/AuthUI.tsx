import type { ReactNode } from 'react'
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
      <div className="flex min-h-full items-center justify-center p-6">
        {children}
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <AuthShowcase />
      <div className="flex flex-1 items-center justify-center bg-white p-6">
        {children}
      </div>
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

export function TextField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      aria-label={label}
      placeholder={label}
      {...props}
      className={cn(
        // 16px on a phone: iOS zooms the page into any smaller field.
        'w-full rounded-pill border border-white/80 bg-white px-5 py-3.5 text-[16px] md:text-[15px]',
        'text-slate-900 placeholder:text-slate-400',
        'shadow-[var(--shadow-rest)] outline-none transition-shadow duration-150',
        'focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30',
        props.className,
      )}
    />
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
      className={cn(
        'w-full rounded-pill px-6 py-3.5 text-[15px] font-semibold text-white',
        'transition-opacity duration-150',
        disabled ? 'cursor-not-allowed' : 'hover:opacity-90',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
      )}
      style={{
        background: disabled
          ? 'var(--color-slate-400)'
          : 'var(--gradient-primary)',
        boxShadow: disabled ? 'none' : 'var(--shadow-raised)',
      }}
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
        'text-[13px] text-slate-700 underline underline-offset-2',
        'transition-colors duration-150 hover:text-blue-700',
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
      className="mt-4 rounded-pillar border border-priority-high/20 bg-priority-high/5 px-4 py-2.5 text-[13px] text-priority-high"
    >
      {children}
    </p>
  )
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
        'w-full rounded-pill border border-white/80 bg-white px-6 py-4',
        'text-center text-[26px] font-semibold tracking-[0.5em] text-slate-900',
        'placeholder:font-normal placeholder:tracking-[0.5em] placeholder:text-slate-300',
        'shadow-[var(--shadow-rest)] outline-none transition-shadow duration-150',
        'focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30',
      )}
    />
  )
}
