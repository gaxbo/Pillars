import { useAuthStore } from '@/features/auth/useAuthStore'
import { cn } from '@/lib/cn'

interface BoardHeaderProps {
  title: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onOpenWeek: () => void
}

export function BoardHeader({
  title,
  onPrev,
  onNext,
  onToday,
  onOpenWeek,
}: BoardHeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 pb-5 pt-7 sm:px-8">
      <h1 className="text-[23px] font-bold leading-none tracking-[-0.02em] text-slate-900 sm:text-[30px] lg:text-[34px]">
        {title}
      </h1>

      {/* The design had these reversed — next before previous. */}
      <div className="flex items-center gap-1.5">
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

      <AccountButton />

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

function AccountButton() {
  const offline = useAuthStore((s) => s.offline)
  const session = useAuthStore((s) => s.session)
  const signOut = useAuthStore((s) => s.signOut)

  // Nothing to sign out of when the app is running on sample data.
  if (offline || !session) return <span className="ml-auto" />

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className={cn(
        'label-mono ml-auto rounded-pill px-3 py-1.5 text-[10.5px] text-slate-600',
        'border border-slate-200 bg-white/60 transition-colors duration-150',
        'hover:bg-white hover:text-slate-900',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
      )}
    >
      Sign out
    </button>
  )
}

function ChevronButton({
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
        'grid size-7 place-items-center rounded-full border border-blue-300 text-blue-500',
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
