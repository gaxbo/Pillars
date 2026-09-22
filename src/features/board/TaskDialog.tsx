import { useEffect, useMemo, useRef, useState } from 'react'
import type { Goal, IsoDate, Pillar, Priority } from '@/data/types'
import { addDays, dayDateLabel, fromIso, startOfWeek, toIso } from '@/lib/date'
import { cn } from '@/lib/cn'
import { selectGoalStats, useBoardStore } from './useBoardStore'

export type DialogTarget =
  | { mode: 'create'; date: IsoDate; pillarId: string }
  | { mode: 'edit'; taskId: string }

interface TaskDialogProps {
  target: DialogTarget | null
  onClose: () => void
  pillars: Pillar[]
  goals: Goal[]
}

const PRIORITIES: Priority[] = ['high', 'medium', 'low']

export function TaskDialog({ target, onClose, pillars, goals }: TaskDialogProps) {
  // The shell stays mounted and toggles visibility instead of mounting on
  // demand. Measured: the first mount of this subtree cost a ~50ms frame
  // while every later one cost ~7ms, so paying it at page load — where it is
  // invisible among everything else — removes the hitch on first open.
  const [lastTarget, setLastTarget] = useState<DialogTarget | null>(target)

  useEffect(() => {
    if (target) setLastTarget(target)
  }, [target])

  useEffect(() => {
    const first = pillars[0]
    if (!lastTarget && first) {
      setLastTarget({ mode: 'create', date: toIso(new Date()), pillarId: first.id })
    }
  }, [lastTarget, pillars])

  const open = target !== null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        open ? '' : 'pointer-events-none',
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <div
        className={cn(
          'absolute inset-0 bg-slate-900/15 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      {lastTarget && (
        <TaskDialogInner
          open={open}
          target={lastTarget}
          onClose={onClose}
          pillars={pillars}
          goals={goals}
        />
      )}
    </div>
  )
}

function TaskDialogInner({
  target,
  open,
  onClose,
  pillars,
  goals,
}: TaskDialogProps & { target: DialogTarget; open: boolean }) {
  const tasks = useBoardStore((s) => s.tasks)
  const addTask = useBoardStore((s) => s.addTask)
  const editTask = useBoardStore((s) => s.editTask)
  const removeTask = useBoardStore((s) => s.removeTask)

  const existing =
    target.mode === 'edit' ? tasks.find((t) => t.id === target.taskId) : undefined

  const [title, setTitle] = useState(existing?.title ?? '')
  const [pillarId, setPillarId] = useState(
    existing?.pillarId ?? (target.mode === 'create' ? target.pillarId : ''),
  )
  const [goalId, setGoalId] = useState<string | null>(existing?.goalId ?? null)
  const [priority, setPriority] = useState<Priority>(
    existing?.priority ?? 'medium',
  )
  const [menuOpen, setMenuOpen] = useState(false)

  const date = existing?.scheduledDate ?? (target.mode === 'create' ? target.date : '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (menuOpen) setMenuOpen(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, menuOpen, onClose])

  // The dialog stays mounted, so each new target resyncs the form instead of
  // remounting it — remounting cost a dropped frame on the first open.
  useEffect(() => {
    const current =
      target.mode === 'edit'
        ? useBoardStore.getState().tasks.find((t) => t.id === target.taskId)
        : undefined
    setTitle(current?.title ?? '')
    setPillarId(current?.pillarId ?? (target.mode === 'create' ? target.pillarId : ''))
    setGoalId(current?.goalId ?? null)
    setPriority(current?.priority ?? 'medium')
    setMenuOpen(false)
  }, [target])

  // A goal belongs to a pillar, so changing pillar invalidates the selection.
  useEffect(() => {
    if (goalId && !goals.some((g) => g.id === goalId && g.pillarId === pillarId)) {
      setGoalId(null)
    }
  }, [pillarId, goalId, goals])

  const pillarGoals = useMemo(
    () => goals.filter((g) => g.pillarId === pillarId),
    [goals, pillarId],
  )

  const canSave = title.trim().length > 0 && pillarId !== ''

  function handleSave() {
    if (!canSave) return
    if (existing) {
      editTask(existing.id, { title: title.trim(), pillarId, goalId, priority })
    } else {
      void addTask({
        title: title.trim(),
        pillarId,
        goalId,
        scheduledDate: date,
        priority,
      })
    }
    onClose()
  }

  function handleMove(to: 'tomorrow' | 'next-week') {
    if (!existing) return
    const from = fromIso(existing.scheduledDate)
    const next =
      to === 'tomorrow'
        ? addDays(from, 1)
        : addDays(startOfWeek(from), 7)
    editTask(existing.id, { scheduledDate: toIso(next) })
    onClose()
  }

  function handleDelete() {
    if (existing) removeTask(existing.id)
    onClose()
  }

  const heading = existing ? 'Edit task' : 'New task'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      // Centred by the flex parent and animated in CSS, so the dialog is
      // visible even if no JS animation frame ever runs.
      className={cn(
        'relative flex max-h-[85vh] w-[min(92vw,34rem)] flex-col',
        'transition-transform duration-200 ease-[var(--ease-out-soft)]',
        open ? 'translate-y-0 scale-100' : 'translate-y-[130vh] scale-[0.98]',
        'rounded-modal border border-white/70',
      )}
      style={{
        background: 'var(--gradient-surface-soft)',
        boxShadow: 'var(--shadow-modal)',
      }}
    >
        <header className="relative z-20 flex items-center justify-between gap-3 px-6 pt-5">
          <h2 className="text-[14px] text-slate-600">
            {heading}
            {date && (
              <span className="text-slate-400">
                {' '}
                · {dayDateLabel(fromIso(date))}
              </span>
            )}
          </h2>

          <div className="relative flex items-center gap-1">
            {existing && (
              <>
                <IconButton
                  label="Move task"
                  onClick={() => setMenuOpen((v) => !v)}
                  expanded={menuOpen}
                >
                  <circle cx="4" cy="10" r="1.4" />
                  <circle cx="10" cy="10" r="1.4" />
                  <circle cx="16" cy="10" r="1.4" />
                </IconButton>

                <IconButton label="Delete task" onClick={handleDelete} danger>
                  <path
                    d="M5 6h10M8.5 6V4.5h3V6M6.5 6l.6 9h5.8l.6-9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </IconButton>
              </>
            )}

            <IconButton label="Close" onClick={onClose}>
              <path
                d="M5.5 5.5l9 9M14.5 5.5l-9 9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </IconButton>

            {menuOpen && (
              <div
                className="animate-pop-in absolute right-0 top-9 z-10 w-44 overflow-hidden rounded-pillar border border-white/70"
                style={{
                  background: 'var(--gradient-surface)',
                  boxShadow: 'var(--shadow-lift)',
                }}
              >
                <MenuItem onClick={() => handleMove('tomorrow')}>
                  Tomorrow
                </MenuItem>
                <MenuItem onClick={() => handleMove('next-week')}>
                  Next week
                </MenuItem>
              </div>
            )}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-4">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            placeholder="What is it?"
            aria-label="Task name"
            className={cn(
              // 16px on a phone: iOS zooms the page into any smaller field.
              'w-full rounded-pill border border-slate-200 bg-white px-5 py-3 text-[16px] md:text-[15px]',
              'text-slate-900 placeholder:text-slate-400',
              'shadow-[var(--shadow-rest)] outline-none',
              'focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30',
            )}
          />

          <Section label="Pillar">
            {pillars.map((pillar) => (
              <OptionRow
                key={pillar.id}
                selected={pillar.id === pillarId}
                onClick={() => setPillarId(pillar.id)}
              >
                {pillar.name}
              </OptionRow>
            ))}
          </Section>

          <Section label="Goal">
            {pillarGoals.length === 0 ? (
              <p className="py-2 text-[13px] text-slate-400">
                No goal set for this pillar this week.
              </p>
            ) : (
              <>
                {pillarGoals.map((goal) => {
                  const stats = selectGoalStats(tasks, goal)
                  return (
                    <OptionRow
                      key={goal.id}
                      selected={goal.id === goalId}
                      onClick={() =>
                        setGoalId(goal.id === goalId ? null : goal.id)
                      }
                      trailing={
                        <span className="label-mono text-[9.5px] tabular-nums text-slate-400">
                          {stats.done}/{stats.target}
                        </span>
                      }
                    >
                      {goal.title}
                    </OptionRow>
                  )
                })}
                <p className="pt-2 text-[12px] text-slate-400">
                  Optional — a task doesn&apos;t have to serve a goal.
                </p>
              </>
            )}
          </Section>

          <Section label="Priority">
            <div className="flex flex-wrap gap-2 pt-1">
              {PRIORITIES.map((p) => (
                <PriorityChip
                  key={p}
                  priority={p}
                  selected={p === priority}
                  onClick={() => setPriority(p)}
                />
              ))}
            </div>
          </Section>
        </div>

        <footer className="flex items-center justify-end gap-3 px-6 pb-5 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill px-4 py-2 text-[13px] text-slate-500 transition-colors hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              'rounded-pill px-5 py-2.5 text-[13.5px] font-semibold text-white',
              'transition-opacity duration-150',
              canSave ? 'hover:opacity-90' : 'cursor-not-allowed',
            )}
            style={{
              background: canSave
                ? 'var(--gradient-primary)'
                : 'var(--color-slate-400)',
              boxShadow: canSave ? 'var(--shadow-raised)' : 'none',
            }}
          >
            {existing ? 'Save changes' : 'Add task'}
          </button>
        </footer>
    </div>
  )
}

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section className="pt-5">
      <h3 className="label-mono pb-1 text-[10px] text-slate-500">{label}</h3>
      {children}
    </section>
  )
}

function OptionRow({
  selected,
  onClick,
  children,
  trailing,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center justify-between gap-3 border-b py-2.5 text-left',
        'transition-colors duration-150',
        selected ? 'text-blue-700' : 'text-slate-800 hover:text-blue-600',
      )}
      style={{
        borderColor: selected
          ? 'var(--color-blue-400)'
          : 'var(--border-hairline)',
      }}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden="true"
          className={cn(
            'grid size-4 shrink-0 place-items-center rounded-full border transition-colors',
            selected ? 'border-blue-500 bg-blue-500' : 'border-slate-300',
          )}
        >
          {selected && <span className="size-1.5 rounded-full bg-white" />}
        </span>
        <span className="truncate text-[15px] font-medium">{children}</span>
      </span>
      {trailing}
    </button>
  )
}

function PriorityChip({
  priority,
  selected,
  onClick,
}: {
  priority: Priority
  selected: boolean
  onClick: () => void
}) {
  const dot =
    priority === 'high'
      ? 'bg-priority-high'
      : priority === 'medium'
        ? 'bg-priority-medium'
        : 'bg-priority-low'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex items-center gap-2 rounded-pill border px-3.5 py-1.5 text-[13px] transition-all duration-150',
        selected
          ? 'border-transparent text-white'
          : 'border-slate-200 bg-white/70 text-slate-600 hover:border-blue-300',
      )}
      style={
        selected
          ? {
              background: 'var(--gradient-primary)',
              boxShadow: 'var(--shadow-raised)',
            }
          : undefined
      }
    >
      <span className={cn('size-2 rounded-full', dot)} aria-hidden="true" />
      {priority}
    </button>
  )
}

function IconButton({
  label,
  onClick,
  children,
  danger,
  expanded,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
  expanded?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={expanded}
      className={cn(
        'grid size-7 place-items-center rounded-full transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
        danger
          ? 'text-slate-400 hover:bg-priority-high/10 hover:text-priority-high'
          : 'text-slate-500 hover:bg-white/70 hover:text-slate-800',
      )}
    >
      <svg viewBox="0 0 20 20" className="size-4.5" fill="currentColor">
        {children}
      </svg>
    </button>
  )
}

function MenuItem({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[13.5px] text-slate-800 transition-colors hover:bg-white/60"
    >
      {children}
      <span aria-hidden="true" className="text-blue-500">
        →
      </span>
    </button>
  )
}
