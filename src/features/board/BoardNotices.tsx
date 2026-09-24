import { useEffect, useRef } from 'react'
import type { Task } from '@/data/types'
import { cn } from '@/lib/cn'
import type { SaveStatus } from './useBoardStore'

/**
 * "Deleted X. Undo" for the few seconds the board holds a delete back.
 * Bottom centre, where the evening nudge sits; the board hides the nudge
 * while this shows, since it's gone in five seconds anyway.
 */
export function UndoToast({ task, onUndo }: { task: Task; onUndo: () => void }) {
  return (
    <div className="animate-rise fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        role="status"
        className="flex max-w-full items-center gap-3 rounded-pill bg-slate-900 py-2 pl-5 pr-2 text-[14px] text-white shadow-[var(--shadow-lift)]"
      >
        <span className="min-w-0 truncate">Deleted &ldquo;{task.title}&rdquo;</span>
        <button
          type="button"
          onClick={onUndo}
          className={cn(
            'shrink-0 rounded-pill px-4 py-1.5 font-semibold text-blue-200 transition-colors',
            'hover:bg-white/15 hover:text-white',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
          )}
        >
          Undo
        </button>
      </div>
    </div>
  )
}

/**
 * Only there when a save has gone wrong. Retrying is said quietly and
 * fixed on its own; after the last retry it asks for a press, and keeps
 * everything on screen as it is meanwhile.
 */
export function SaveStatusNote({
  status,
  onRetry,
}: {
  status: SaveStatus
  onRetry: () => void
}) {
  return (
    // Always in the page, so a screen reader hears the change when it comes.
    <div role="status" className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      {status !== 'idle' && (
        <div
          className={cn(
            'animate-fade-in pointer-events-auto flex items-center gap-3 rounded-pill border py-1.5 pl-4 text-[13px] shadow-[var(--shadow-raised)]',
            status === 'failed'
              ? 'border-error-text/30 bg-white pr-1.5 text-error-text'
              : 'border-slate-300 bg-white pr-4 text-slate-700',
          )}
        >
          {status === 'retrying' ? (
            <>
              <span
                aria-hidden="true"
                className="size-2 animate-pulse rounded-full bg-warning-text"
              />
              Couldn&rsquo;t save that. Trying again&hellip;
            </>
          ) : (
            <>
              Your latest changes aren&rsquo;t saved yet.
              <button
                type="button"
                onClick={onRetry}
                className={cn(
                  'btn-primary rounded-pill px-3.5 py-1 text-[13px] font-semibold',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
                )}
              >
                Try again
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * The weekly review, offered rather than imposed. It used to take over the
 * board by redirect the moment it was due, mid-task or not.
 */
export function WeeklyBanner({
  onPlan,
  onLater,
}: {
  onPlan: () => void
  onLater: () => void
}) {
  const ref = useRef<HTMLElement>(null)

  // Announced once when it appears, without stealing focus.
  useEffect(() => {
    ref.current?.setAttribute('aria-live', 'polite')
  }, [])

  return (
    <section
      ref={ref}
      aria-label="Weekly review"
      className="mx-4 mb-3 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-pillar border border-blue-300 px-5 py-3.5 sm:mx-6 md:mx-8"
      style={{ background: 'var(--gradient-surface)' }}
    >
      <p className="min-w-0 flex-1 text-[15px] text-slate-800">
        <span className="font-semibold text-slate-900">It&rsquo;s time to plan next week.</span>{' '}
        Last week&rsquo;s report card is ready.
      </p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onPlan}
          className={cn(
            'btn-primary rounded-pill px-5 py-2 text-[14px] font-semibold',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
          )}
        >
          Plan next week
        </button>
        <button
          type="button"
          onClick={onLater}
          className="rounded-sm text-[13.5px] text-slate-700 underline underline-offset-2 transition-colors hover:text-blue-800 hover:decoration-2"
        >
          Not now
        </button>
      </div>
    </section>
  )
}
