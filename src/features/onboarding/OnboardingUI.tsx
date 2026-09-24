import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { SEGMENT_COUNT } from './useOnboardingStore'

/**
 * The segmented bar from the onboarding screens: five rounded segments, filled
 * blue up to the current step, grey after.
 */
export function StepProgress({
  label,
  segment,
}: {
  label: string
  segment: number
}) {
  return (
    <div className="px-6 pt-8 sm:px-12">
      <p key={label} className="label-mono animate-fade-in pb-2 text-[12px] text-slate-600">
        {label}
      </p>
      <div
        className="flex gap-1"
        role="progressbar"
        aria-valuenow={segment + 1}
        aria-valuemin={1}
        aria-valuemax={SEGMENT_COUNT}
        aria-label="Setup progress"
      >
        {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
          <span
            key={i}
            style={{ transitionDelay: `${i * 45}ms` }}
            className={cn(
              'h-[5px] flex-1 rounded-pill transition-colors duration-300',
              i <= segment ? 'bg-blue-400' : 'bg-slate-200',
            )}
          />
        ))}
      </div>
    </div>
  )
}

export function StepBody({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 pb-16 pt-10 sm:px-12">
      {children}
    </main>
  )
}

export function StepHeading({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <header className="mb-8">
      {/* Focusable by script only: a step change moves focus here, so a
          screen reader starts reading the new step instead of losing its
          place on a button that no longer exists. */}
      <h1
        tabIndex={-1}
        data-step-heading
        className="animate-rise text-[32px] font-bold leading-tight tracking-tight text-slate-900 outline-none sm:text-[38px]"
      >
        {title}
      </h1>
      {children && (
        <p className="animate-rise delay-1 mt-3 max-w-2xl text-[16px] leading-relaxed text-slate-700">
          {children}
        </p>
      )}
    </header>
  )
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'btn-primary rounded-pill px-10 py-3.5 text-[15px] font-semibold',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
        props.className,
      )}
    >
      {children}
    </button>
  )
}

export function QuietLink({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'rounded-sm text-[13.5px] text-slate-700 underline underline-offset-2',
        'transition-colors duration-150 hover:text-blue-800 hover:decoration-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        props.className,
      )}
    >
      {children}
    </button>
  )
}

/** The small uppercase action from the design, e.g. "+ ADD A PILLAR". */
export function InlineAction({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'label-mono rounded-sm text-[12px] text-slate-700 underline underline-offset-4',
        'transition-colors duration-150 hover:text-blue-800 hover:decoration-2',
        props.className,
      )}
    >
      {children}
    </button>
  )
}

export function StepFooter({ children }: { children: ReactNode }) {
  return <div className="mt-10 flex flex-wrap items-center gap-5">{children}</div>
}

/** Mono counter, like "# written down" on the dump screen. */
export function Counter({ children }: { children: ReactNode }) {
  return (
    <span aria-live="polite" className="label-mono text-[12px] tabular-nums text-slate-600">
      {children}
    </span>
  )
}
