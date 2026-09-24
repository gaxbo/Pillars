import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/useAuthStore'
import { cn } from '@/lib/cn'

interface BoardHeaderProps {
  title: string
  /** The same title, abbreviated for a phone's header row. */
  shortTitle: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onOpenWeek: () => void
  /** Whether the goals slide-over is open, so its button can show it. */
  weekOpen: boolean
}

export function BoardHeader({
  title,
  shortTitle,
  onPrev,
  onNext,
  onToday,
  onOpenWeek,
  weekOpen,
}: BoardHeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-3 px-4 pb-3 pt-5 sm:px-6 md:gap-x-4 md:px-8 md:pb-5 md:pt-7">
      <h1 className="text-[23px] font-bold leading-none tracking-[-0.02em] text-slate-900 sm:text-[30px] lg:text-[34px]">
        <span className="sm:hidden">{shortTitle}</span>
        <span className="hidden sm:inline">{title}</span>
      </h1>

      {/* The design had these reversed — next before previous. On a phone
          they move down into the day strip. */}
      <div className="hidden items-center gap-1.5 md:flex">
        <ChevronButton direction="prev" onClick={onPrev} />
        <ChevronButton direction="next" onClick={onNext} />
      </div>

      <button
        type="button"
        onClick={onToday}
        className={cn(
          'label-mono rounded-pill border border-blue-300 bg-white/70 px-3 py-1.5 text-[12px] text-blue-800',
          'transition-colors duration-150',
          'hover:border-blue-500 hover:bg-blue-100 hover:text-blue-900',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
        )}
      >
        Today
      </button>

      <AccountMenu />

      {/* Opens the week's goals in a slide-over. An icon, so on a phone it
          costs the header row one square instead of a word. */}
      <TipButton label="View goals" onClick={onOpenWeek} expanded={weekOpen}>
        <svg viewBox="0 0 20 20" className="size-4.5" aria-hidden="true">
          <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="10" cy="10" r="1.3" fill="currentColor" />
        </svg>
      </TipButton>
    </header>
  )
}

/**
 * The primary action as an icon. Its name is on the button for screen
 * readers, and shown as a tooltip on hover or keyboard focus, so a sighted
 * user never has to guess what the target means.
 */
function TipButton({
  label,
  onClick,
  expanded,
  children,
}: {
  label: string
  onClick: () => void
  expanded: boolean
  children: React.ReactNode
}) {
  return (
    <span className="group/tip relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={expanded}
        className={cn(
          'btn-primary grid size-9 place-items-center rounded-full',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
        )}
      >
        {children}
      </button>
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute right-0 top-full z-40 mt-2 whitespace-nowrap rounded-md px-2.5 py-1.5',
          'bg-slate-900 text-[12px] font-medium text-white shadow-[var(--shadow-lift)]',
          'opacity-0 transition-opacity duration-150',
          'group-hover/tip:opacity-100 group-has-[:focus-visible]/tip:opacity-100',
        )}
      >
        {label}
      </span>
    </span>
  )
}

/**
 * The "account op" popover from the design: the name, a card of settings, a
 * card of help, and Log out. Each row opens its own page. "Pillars & goals"
 * is the one row the design doesn't have: it predates editing them after
 * setup. On sample data there's no account to log out of.
 */
function AccountMenu() {
  const offline = useAuthStore((s) => s.offline)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstRef = useRef<HTMLAnchorElement>(null)
  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    firstRef.current?.focus()
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    // Tabbing out of the popover closes it rather than leaving it hanging
    // open behind the focus.
    const onFocus = (e: FocusEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('focusin', onFocus)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('focusin', onFocus)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const signedIn = !offline && user
  const name = signedIn ? String(user.user_metadata?.full_name ?? '').trim() : 'Sample data'
  const email = signedIn ? (user.email ?? '') : ''
  const initial = signedIn ? (name || email || '?').charAt(0).toUpperCase() : null

  return (
    <div ref={rootRef} className="relative ml-auto">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={signedIn ? `Account: ${name || email}` : 'Account and settings'}
        aria-expanded={open}
        aria-controls="account-popover"
        className={cn(
          'grid size-9 place-items-center rounded-full border border-blue-300 bg-white/70',
          'text-[13px] font-semibold text-blue-800 transition-colors duration-150',
          'hover:border-blue-500 hover:bg-blue-100',
          'aria-expanded:border-blue-500 aria-expanded:bg-blue-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
        )}
      >
        {initial ?? (
          // No account on sample data: a person outline instead of an initial.
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
            <circle cx="8" cy="5.5" r="2.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2.75 14c.6-2.75 2.75-4.25 5.25-4.25s4.65 1.5 5.25 4.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div
          id="account-popover"
          role="group"
          aria-label="Account menu"
          className="animate-pop-in absolute right-0 top-11 z-50 w-72 rounded-modal border border-white/80 p-4"
          style={{
            background: 'var(--gradient-surface-soft)',
            boxShadow: 'var(--shadow-lift)',
          }}
        >
          <div className="flex items-start justify-between gap-3 pl-1">
            <div className="min-w-0 pt-1">
              <p className="truncate text-[17px] font-bold uppercase tracking-[0.02em] text-slate-900">
                {name || email}
              </p>
              {name && email && (
                <p className="mt-0.5 truncate text-[13px] text-slate-600">{email}</p>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className={cn(
                'btn-icon grid size-8 shrink-0 place-items-center rounded-full',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
              )}
            >
              <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <nav aria-label="Settings">
            <MenuCard>
              <MenuRow ref={firstRef} to="/settings/account">Account</MenuRow>
              <MenuRow to="/settings/notifications">Notifications</MenuRow>
              <MenuRow to="/settings/pillars">Pillars &amp; goals</MenuRow>
            </MenuCard>
            <MenuCard>
              <MenuRow to="/help">Help &amp; Support</MenuRow>
              <MenuRow to="/about">About Us</MenuRow>
            </MenuCard>
          </nav>

          {signedIn && (
            <button
              type="button"
              onClick={() => void signOut()}
              className={cn(
                'btn-primary mt-3 w-full rounded-pill py-2.5 text-[15px] font-semibold',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
              )}
            >
              Log out
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** One of the design's pale-blue cards of rows. */
function MenuCard({ children }: { children: React.ReactNode }) {
  return (
    <ul
      className="mt-3 overflow-hidden rounded-pillar border border-white/80 px-1.5 py-1 shadow-[var(--shadow-raised)]"
      style={{ background: 'var(--gradient-surface)' }}
    >
      {children}
    </ul>
  )
}

/** A row that opens a page: its name, a hairline under it, a chevron. */
function MenuRow({
  to,
  children,
  ref,
}: {
  to: string
  children: React.ReactNode
  ref?: React.Ref<HTMLAnchorElement>
}) {
  return (
    <li className="border-b last:border-b-0" style={{ borderColor: 'var(--border-hairline-strong)' }}>
      <Link
        ref={ref}
        to={to}
        className={cn(
          'group/row my-0.5 flex items-center justify-between gap-3 rounded-task px-2.5 py-2 text-[16px] text-slate-900',
          'transition-colors hover:bg-white/80 hover:text-blue-900',
          'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-700',
        )}
      >
        {children}
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="size-4 shrink-0 text-slate-600 transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-blue-800"
        >
          <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </li>
  )
}

export function ChevronButton({
  direction,
  onClick,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
}) {
  const prev = direction === 'prev'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={prev ? 'Previous week' : 'Next week'}
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-full border border-blue-300 text-blue-700',
        'transition-colors duration-150',
        'hover:border-blue-500 hover:bg-blue-100 hover:text-blue-900',
        'active:bg-blue-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
      )}
    >
      <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
        <path
          d={prev ? 'M10 3.5 5.5 8l4.5 4.5' : 'M6 3.5 10.5 8 6 12.5'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
