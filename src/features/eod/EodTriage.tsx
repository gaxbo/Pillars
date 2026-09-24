import { useEffect, useRef, useState } from 'react'
import type { Pillar, Priority, Task } from '@/data/types'
import { addDays, dayDateLabel, dayLabel, fromIso, toIso } from '@/lib/date'
import { cn } from '@/lib/cn'
import { useDialogFocus } from '@/lib/useDialogFocus'

interface EodTriageProps {
  open: boolean
  tasks: Task[]
  pillars: Pillar[]
  onDone: (task: Task) => void
  onTomorrow: (task: Task, date: string) => void
  onDelete: (task: Task) => void
  /** Brings back the last deleted task, while the board still can. */
  onUndo: () => void
  /** The task whose delete can still be undone, if any. */
  undoableId: string | null
  onClose: () => void
}

/**
 * One open task at a time: done, push to tomorrow, or bin it. Earlier days'
 * leftovers come first, marked with their day.
 *
 * The queue is frozen when the flow opens rather than read live, so acting on
 * a card does not reshuffle the ones behind it mid-session.
 */
export function EodTriage({
  open,
  tasks,
  pillars,
  onDone,
  onTomorrow,
  onDelete,
  onUndo,
  undoableId,
  onClose,
}: EodTriageProps) {
  const [queue, setQueue] = useState<Task[]>([])
  const [index, setIndex] = useState(0)
  /** The card just deleted, and where it was, so Undo can step back to it. */
  const [deleted, setDeleted] = useState<{ task: Task; index: number } | null>(null)
  /** Bumped on every card change after the first, to move focus. */
  const [moves, setMoves] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)
  // Focus sits on the card's heading, so each new card is read out as it
  // arrives, name first, and the next Tab lands on Done.
  const headingRef = useRef<HTMLHeadingElement>(null)

  useDialogFocus(open, dialogRef, headingRef)

  useEffect(() => {
    if (open && moves > 0) headingRef.current?.focus()
  }, [open, moves])

  useEffect(() => {
    if (open) {
      setQueue(tasks)
      setIndex(0)
      setDeleted(null)
      setMoves(0)
    }
    // Snapshot on open only — see the note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const task = queue[index]
  const finished = !task
  const today = toIso(new Date())
  // Counted from today, not from the task's own day: "tomorrow" for a task
  // left over from Monday would otherwise land on Tuesday, already past.
  const tomorrow = toIso(addDays(new Date(), 1))
  const canUndo = deleted !== null && deleted.task.id === undoableId

  function advance() {
    setIndex((i) => i + 1)
    setMoves((m) => m + 1)
  }

  function undo() {
    if (!deleted) return
    onUndo()
    setIndex(deleted.index)
    setDeleted(null)
    setMoves((m) => m + 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-slate-900/25"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Open tasks"
        className="animate-pop-in relative w-[min(92vw,30rem)] rounded-modal border border-white/70 p-7"
        style={{
          background: 'var(--gradient-surface-soft)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {canUndo && deleted && (
          // The last card's delete, reversible for a few seconds. Above the
          // card rather than a toast: the board's toasts sit behind this dialog.
          <div
            role="status"
            className="-mt-2 mb-5 flex items-center justify-between gap-3 rounded-pill bg-slate-900 py-1.5 pl-4 pr-1.5 text-[13.5px] text-white"
          >
            <span className="min-w-0 truncate">Deleted &ldquo;{deleted.task.title}&rdquo;</span>
            <button
              type="button"
              onClick={undo}
              className={cn(
                'shrink-0 rounded-pill px-3.5 py-1 font-semibold text-blue-200 transition-colors',
                'hover:bg-white/15 hover:text-white',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
              )}
            >
              Undo
            </button>
          </div>
        )}

        {finished ? (
          <div className="py-4 text-center">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-[22px] font-bold tracking-tight text-slate-900 outline-none"
            >
              That&rsquo;s everything.
            </h2>
            <p className="mt-2 text-[14px] text-slate-600">
              Every open task has a decision.
            </p>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'btn-primary mt-6 rounded-pill px-6 py-2.5 text-[14px] font-semibold',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
              )}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="label-mono text-[12px] text-slate-600">
                {pillars.find((p) => p.id === task.pillarId)?.name ?? 'Pillar'}
                {task.scheduledDate < today && (
                  // A leftover says which day it was left on.
                  <span className="text-warning-text">
                    {' '}
                    · From {dayLabel(fromIso(task.scheduledDate))}{' '}
                    {dayDateLabel(fromIso(task.scheduledDate))}
                  </span>
                )}
              </p>
              <p className="label-mono text-[12px] tabular-nums text-slate-600">
                {index + 1} of {queue.length}
              </p>
            </div>

            <h2
              ref={headingRef}
              tabIndex={-1}
              className="mt-2 text-[24px] font-bold leading-tight tracking-tight text-slate-900 outline-none"
            >
              {task.title}
              <span className="sr-only-text">
                , task {index + 1} of {queue.length}
              </span>
            </h2>

            <PriorityTag priority={task.priority} />

            <div className="mt-7 flex flex-wrap gap-2.5">
              <Action
                tone="primary"
                onClick={() => {
                  onDone(task)
                  advance()
                }}
              >
                Done
              </Action>
              <Action
                onClick={() => {
                  onTomorrow(task, tomorrow)
                  advance()
                }}
              >
                Tomorrow
              </Action>
              <Action
                tone="danger"
                onClick={() => {
                  onDelete(task)
                  setDeleted({ task, index })
                  advance()
                }}
              >
                Delete
              </Action>
              <button
                type="button"
                onClick={advance}
                className="ml-auto rounded-sm text-[13px] text-slate-700 underline underline-offset-2 transition-colors hover:text-blue-800 hover:decoration-2"
              >
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PriorityTag({ priority }: { priority: Priority }) {
  const dot =
    priority === 'high'
      ? 'bg-priority-high'
      : priority === 'medium'
        ? 'bg-priority-medium'
        : 'bg-priority-low'

  return (
    <span className="mt-3 inline-flex items-center gap-2 rounded-pill border border-slate-200 bg-white/70 px-3 py-1 text-[12px] text-slate-600">
      <span className={cn('size-2 rounded-full', dot)} aria-hidden="true" />
      {priority} priority
    </span>
  )
}

function Action({
  tone,
  children,
  ...props
}: {
  tone?: 'primary' | 'danger'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'rounded-pill px-6 py-2.5 text-[14px] font-semibold',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
        tone === 'primary' && 'btn-primary',
        tone === 'danger' &&
          'border border-error-text/40 text-error-text transition-colors duration-150 hover:border-error-text hover:bg-error-text/10',
        !tone && 'btn-quiet',
      )}
    >
      {children}
    </button>
  )
}
