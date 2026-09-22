import { useEffect, useState } from 'react'
import type { Pillar, Priority, Task } from '@/data/types'
import { addDays, fromIso, toIso } from '@/lib/date'
import { cn } from '@/lib/cn'

interface EodTriageProps {
  open: boolean
  tasks: Task[]
  pillars: Pillar[]
  onDone: (id: string) => void
  onTomorrow: (id: string, date: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

/**
 * One open task at a time: done, push to tomorrow, or bin it.
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
  onClose,
}: EodTriageProps) {
  const [queue, setQueue] = useState<Task[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (open) {
      setQueue(tasks)
      setIndex(0)
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

  function advance() {
    setIndex((i) => i + 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-slate-900/25"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Open tasks"
        className="animate-pop-in relative w-[min(92vw,30rem)] rounded-modal border border-white/70 p-7"
        style={{
          background: 'var(--gradient-surface-soft)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {finished ? (
          <div className="py-4 text-center">
            <h2 className="text-[22px] font-bold tracking-tight text-slate-900">
              That&rsquo;s everything.
            </h2>
            <p className="mt-2 text-[14px] text-slate-600">
              Nothing left open today.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-pill px-6 py-2.5 text-[14px] font-semibold text-white"
              style={{
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--shadow-raised)',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="label-mono text-[10px] text-slate-500">
                {pillars.find((p) => p.id === task.pillarId)?.name ?? 'Pillar'}
              </p>
              <p className="label-mono text-[10px] tabular-nums text-slate-400">
                {index + 1} of {queue.length}
              </p>
            </div>

            <h2 className="mt-2 text-[24px] font-bold leading-tight tracking-tight text-slate-900">
              {task.title}
            </h2>

            <PriorityTag priority={task.priority} />

            <div className="mt-7 flex flex-wrap gap-2.5">
              <Action
                tone="primary"
                onClick={() => {
                  onDone(task.id)
                  advance()
                }}
              >
                Done
              </Action>
              <Action
                onClick={() => {
                  onTomorrow(task.id, toIso(addDays(fromIso(task.scheduledDate), 1)))
                  advance()
                }}
              >
                Tomorrow
              </Action>
              <Action
                tone="danger"
                onClick={() => {
                  onDelete(task.id)
                  advance()
                }}
              >
                Delete
              </Action>
              <button
                type="button"
                onClick={advance}
                className="ml-auto text-[13px] text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-800"
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
        'rounded-pill px-6 py-2.5 text-[14px] font-semibold transition-all duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
        tone === 'primary' && 'text-white hover:opacity-90',
        tone === 'danger' &&
          'border border-priority-high/30 text-priority-high hover:bg-priority-high/10',
        !tone && 'border border-slate-200 bg-white/70 text-slate-700 hover:border-blue-300',
      )}
      style={
        tone === 'primary'
          ? {
              background: 'var(--gradient-primary)',
              boxShadow: 'var(--shadow-raised)',
            }
          : undefined
      }
    >
      {children}
    </button>
  )
}
