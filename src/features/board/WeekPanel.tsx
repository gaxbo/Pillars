import { useEffect, useRef } from 'react'
import type { Goal, GoalStats, Pillar, Task } from '@/data/types'
import { cn } from '@/lib/cn'
import { selectGoalForPillar, selectGoalStats } from './useBoardStore'

interface WeekPanelProps {
  open: boolean
  onClose: () => void
  pillars: Pillar[]
  goals: Goal[]
  tasks: Task[]
  planningTime: { day: string; time: string }
}

/**
 * The "goals expanded" state: a slide-over listing every pillar's goal for the
 * week. Collapsed is the board's default.
 *
 * Entrance is CSS, not JS. This panel's backdrop blocks the whole page, so if
 * a JS animation failed to run the panel would sit off-screen while its
 * backdrop swallowed every click — a hard lock with no way out.
 */
export function WeekPanel({
  open,
  onClose,
  pillars,
  goals,
  tasks,
  planningTime,
}: WeekPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div
        onClick={onClose}
        // No backdrop-filter. Blurring a full-viewport overlay forces the
        // entire board beneath it to re-rasterise every frame, which is what
        // made opening this panel stutter.
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/10 transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="This week"
        aria-hidden={!open}
        inert={!open}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-104 flex-col',
          'rounded-l-modal border-l border-white/60',
          'transition-transform duration-300 ease-[var(--ease-out-soft)] will-change-transform',
          open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
        )}
        style={{
          background: 'var(--gradient-surface-soft)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        <header
          className="flex items-center justify-between gap-4 border-b px-6 pb-4 pt-6"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          <h2 className="text-[22px] font-bold uppercase tracking-[0.02em] text-slate-900">
            This week
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close this week"
            className={cn(
              'grid size-7 shrink-0 place-items-center rounded-full text-slate-500',
              'transition-colors duration-150 hover:bg-white/70 hover:text-slate-800',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
            )}
          >
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        {/* Named once, so the two bands in every bar below are readable. */}
        <div className="flex items-center gap-4 px-6 pt-3">
          <Legend className="bg-blue-500" label="Done" />
          <Legend className="bg-blue-300" label="Planned" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          {pillars.map((pillar) => (
            <GoalRow
              key={pillar.id}
              pillar={pillar}
              goal={selectGoalForPillar(goals, pillar.id)}
              tasks={tasks}
            />
          ))}
        </div>

        <footer
          className="border-t px-6 pb-6 pt-4"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          <p className="text-[13px] text-slate-500">
            Planning time is{' '}
            <span className="font-medium text-slate-700">
              {planningTime.day}, {planningTime.time}
            </span>
            .
          </p>
        </footer>
      </aside>
    </>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('size-2 rounded-full', className)} aria-hidden="true" />
      <span className="label-mono text-[9.5px] text-slate-500">{label}</span>
    </span>
  )
}

function GoalRow({
  pillar,
  goal,
  tasks,
}: {
  pillar: Pillar
  goal: Goal | undefined
  tasks: Task[]
}) {
  return (
    <div
      className="border-b py-5 last:border-b-0"
      style={{ borderColor: 'var(--border-hairline)' }}
    >
      <h3 className="text-[17px] font-semibold tracking-tight text-slate-900">
        {pillar.name}
      </h3>

      {goal ? (
        <GoalDetail goal={goal} stats={selectGoalStats(tasks, goal)} />
      ) : (
        <p className="mt-1 text-[13px] text-slate-400">
          No goal set for this week.
        </p>
      )}
    </div>
  )
}

function GoalDetail({ goal, stats }: { goal: Goal; stats: GoalStats }) {
  return (
    <>
      <div className="mt-1 flex items-end justify-between gap-4">
        <p className="text-[13px] leading-snug text-slate-600">
          {goal.description}
        </p>
        <span className="label-mono shrink-0 whitespace-nowrap text-[9.5px] tabular-nums text-slate-400">
          {stats.planned} planned, {stats.done} done
        </span>
      </div>
      <GoalBar stats={stats} />
    </>
  )
}

/**
 * Two-tone, because the design tracks two numbers against one target. Solid is
 * finished work; the paler band is work that's on the board but not done yet.
 * The gap between the band and the end of the track is what hasn't been
 * planned at all — the most useful thing to see on a planning screen.
 */
function GoalBar({ stats }: { stats: GoalStats }) {
  const pct = (n: number) =>
    stats.target === 0 ? 0 : Math.min(100, (n / stats.target) * 100)

  const met = stats.done >= stats.target

  return (
    <div
      className="relative mt-3 h-2.5 overflow-hidden rounded-pill border border-slate-200 bg-white/80"
      role="progressbar"
      aria-valuenow={stats.done}
      aria-valuemin={0}
      aria-valuemax={stats.target}
      aria-label={`${stats.done} of ${stats.target} done, ${stats.planned} planned`}
    >
      <div
        className="goal-bar-fill absolute inset-y-0 left-0 rounded-pill bg-blue-300"
        style={{ width: `${pct(stats.planned)}%` }}
      />
      <div
        className={cn(
          'goal-bar-fill absolute inset-y-0 left-0 rounded-pill',
          met ? 'bg-priority-low' : 'bg-blue-500',
        )}
        style={{ width: `${pct(stats.done)}%` }}
      />
    </div>
  )
}
