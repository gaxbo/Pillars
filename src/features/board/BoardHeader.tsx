import { useEffect, useRef, useState } from 'react'
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
}

export function BoardHeader({
  title,
  shortTitle,
  onPrev,
  onNext,
  onToday,
  onOpenWeek,
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
          'label-mono rounded-pill px-3 py-1.5 text-[10.5px] text-blue-700',
          'border border-blue-200 bg-white/60 transition-colors duration-150',
          'hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
        )}
      >
        Today
      </button>

      <AccountMenu />

      {/* Opens the "goals expanded" slide-over. */}
      <button
        type="button"
        onClick={onOpenWeek}
        className={cn(
          'label-mono rounded-pill px-3.5 py-1.5 text-[10.5px] text-white',
          'transition-opacity duration-150 hover:opacity-90',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
        )}
        style={{
          background: 'var(--gradient-primary)',
          boxShadow: 'var(--shadow-raised)',
        }}
      >
        This week
      </button>
    </header>
  )
}

/**
 * The "account op" popover from the design, cut down to what exists: who is
 * signed in, and signing out. A labelled "Sign out" pill cost a phone's
 * header row the room it needed for Today.
 */
function AccountMenu() {
  const offline = useAuthStore((s) => s.offline)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Nothing to sign out of when the app is running on sample data.
  if (offline || !user) return <span className="ml-auto" />

  const name = String(user.user_metadata?.full_name ?? '').trim()
  const email = user.email ?? ''
  const initial = (name || email || '?').charAt(0).toUpperCase()

  return (
    <div ref={rootRef} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account"
        aria-expanded={open}
        className={cn(
          'grid size-7 place-items-center rounded-full border border-blue-300 bg-white/60',
          'text-[12px] font-semibold text-blue-700 transition-colors duration-150',
          'hover:border-blue-400 hover:bg-white',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
        )}
      >
        {initial}
      </button>

      {open && (
        <div
          className="animate-pop-in absolute right-0 top-9 z-50 w-60 rounded-pillar border border-white/70 p-4"
          style={{
            background: 'var(--gradient-surface-soft)',
            boxShadow: 'var(--shadow-lift)',
          }}
        >
          <p className="truncate text-[15px] font-semibold text-slate-900">
            {name || email}
          </p>
          {name && email && (
            <p className="mt-0.5 truncate text-[13px] text-slate-500">{email}</p>
          )}
          <button
            type="button"
            onClick={() => void signOut()}
            className={cn(
              'mt-4 w-full rounded-pill py-2 text-[13.5px] font-semibold text-white',
              'transition-opacity duration-150 hover:opacity-90',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
            )}
            style={{
              background: 'var(--gradient-primary)',
              boxShadow: 'var(--shadow-raised)',
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
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
        'grid size-7 shrink-0 place-items-center rounded-full border border-blue-300 text-blue-500',
        'transition-colors duration-150',
        'hover:border-blue-400 hover:bg-white/70 hover:text-blue-600',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
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
