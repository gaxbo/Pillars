import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Goal, IsoDate, Pillar, Priority } from '@/data/types'
import { addDays, dayDateLabel, dayLabel, fromIso, startOfWeek, toIso } from '@/lib/date'
import { cn } from '@/lib/cn'
import { useDialogFocus } from '@/lib/useDialogFocus'
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

/** The pillar's goal this week, if it has one. */
const goalFor = (goals: Goal[], pillarId: string) =>
  goals.find((g) => g.pillarId === pillarId)?.id ?? null

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
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const headingId = useId()

  useDialogFocus(open, dialogRef, inputRef)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (menuOpen) {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      } else {
        onClose()
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
    // A new task counts toward its pillar's goal unless you say otherwise.
    // Left opt-in, most tasks went unlinked and goal bars stayed empty.
    setGoalId(
      target.mode === 'create'
        ? goalFor(useBoardStore.getState().goals, target.pillarId)
        : (current?.goalId ?? null),
    )
    setPriority(current?.priority ?? 'medium')
    setMenuOpen(false)
  }, [target])

  // Moving a task to another pillar moves its goal link to that pillar's
  // goal, rather than silently dropping it.
  function choosePillar(id: string) {
    if (id === pillarId) return
    setPillarId(id)
    setGoalId(goalFor(goals, id))
  }

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

  // Where each move lands, shown in the menu so "next week" isn't a guess.
  const moves = useMemo(() => {
    if (!date) return null
    const from = fromIso(date)
    return {
      tomorrow: addDays(from, 1),
      'next-week': addDays(startOfWeek(from), 7),
    }
  }, [date])

  function handleMove(to: Date) {
    if (!existing) return
    editTask(existing.id, { scheduledDate: toIso(to) })
    onClose()
  }

  function handleDelete() {
    if (existing) removeTask(existing.id)
    onClose()
  }

  const heading = existing ? 'Edit task' : 'New task'

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
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
        <div className="relative z-20 flex items-center justify-between gap-3 px-6 pt-5">
          <h2 id={headingId} className="text-[14px] text-slate-700">
            {heading}
            {date && (
              <span className="text-slate-600">
                {' '}
                · {dayLabel(fromIso(date))} {dayDateLabel(fromIso(date))}
              </span>
            )}
          </h2>

          <div className="relative flex items-center gap-1">
            {existing && (
              <>
                <IconButton
                  ref={menuButtonRef}
                  label="Move task"
                  onClick={() => setMenuOpen((v) => !v)}
                  expanded={menuOpen}
                  haspopup="menu"
                >
                  {/* The dots stand up while the menu is open: the button
                      shows its own state, not just the menu under it. */}
                  <g
                    className="origin-center transition-transform duration-200"
                    style={{ transform: menuOpen ? 'rotate(90deg)' : undefined, transformBox: 'fill-box' }}
                  >
                    <circle cx="4" cy="10" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="16" cy="10" r="1.5" />
                  </g>
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

            {menuOpen && moves && (
              <MoveMenu
                onPick={handleMove}
                onDismiss={(refocus) => {
                  setMenuOpen(false)
                  if (refocus) menuButtonRef.current?.focus()
                }}
                tomorrow={moves.tomorrow}
                nextWeek={moves['next-week']}
                current={date}
              />
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-4">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              // Saving closes the dialog and hands focus back to the button
              // that opened it; left alone, this same Enter would then press
              // that button and open the dialog again.
              e.preventDefault()
              handleSave()
            }}
            placeholder="What is it?"
            aria-label="Task name"
            className={cn(
              // 16px on a phone: iOS zooms the page into any smaller field.
              'w-full rounded-pill border border-slate-500 bg-white px-5 py-3 text-[16px] md:text-[15px]',
              'text-slate-900 placeholder:text-slate-500',
              'shadow-[var(--shadow-rest)] outline-none transition-colors duration-150 hover:border-blue-400',
              'focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30',
            )}
          />

          <Section label="Pillar">
            {(labelId) => (
              <RadioGroup labelledBy={labelId}>
                {pillars.map((pillar) => (
                  <OptionRow
                    key={pillar.id}
                    role="radio"
                    selected={pillar.id === pillarId}
                    onClick={() => choosePillar(pillar.id)}
                  >
                    {pillar.name}
                  </OptionRow>
                ))}
              </RadioGroup>
            )}
          </Section>

          <Section label="Goal">
            {(labelId) =>
              pillarGoals.length === 0 ? (
                <p className="py-2 text-[13px] text-slate-600">
                  No goal set for this pillar this week.
                </p>
              ) : (
                <>
                  <div role="group" aria-labelledby={labelId}>
                    {pillarGoals.map((goal) => {
                      const stats = selectGoalStats(tasks, goal)
                      return (
                        <OptionRow
                          key={goal.id}
                          role="toggle"
                          selected={goal.id === goalId}
                          onClick={() =>
                            setGoalId(goal.id === goalId ? null : goal.id)
                          }
                          trailing={
                            <span className="label-mono text-[12px] tabular-nums text-slate-600">
                              {stats.done}/{stats.target}
                              <span className="sr-only-text"> done</span>
                            </span>
                          }
                        >
                          {goal.title}
                        </OptionRow>
                      )
                    })}
                  </div>
                  <p className="pt-2 text-[12.5px] text-slate-600">
                    Linked tasks count toward the goal. Select it again to unlink.
                  </p>
                </>
              )
            }
          </Section>

          <Section label="Priority">
            {(labelId) => (
              <RadioGroup labelledBy={labelId} className="flex flex-wrap gap-2 pt-1">
                {PRIORITIES.map((p) => (
                  <PriorityChip
                    key={p}
                    priority={p}
                    selected={p === priority}
                    onClick={() => setPriority(p)}
                  />
                ))}
              </RadioGroup>
            )}
          </Section>
        </div>

        <footer className="flex items-center justify-end gap-3 px-6 pb-5 pt-3">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-pill px-4 py-2 text-[13.5px] text-slate-700 transition-colors duration-150',
              'hover:bg-blue-100 hover:text-slate-900',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              'btn-primary rounded-pill px-5 py-2.5 text-[13.5px] font-semibold',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
            )}
          >
            {existing ? 'Save changes' : 'Add task'}
          </button>
        </footer>
    </div>
  )
}

/**
 * Tomorrow and next week, each with its own icon and the date it lands on,
 * then "Pick a day" for anything else. A menu in the ARIA sense: arrow keys
 * move, Enter picks, Escape or Tab closes, focus starts on the first item.
 * "Pick a day" swaps the menu for a date field in the same spot.
 */
function MoveMenu({
  onPick,
  onDismiss,
  tomorrow,
  nextWeek,
  current,
}: {
  onPick: (to: Date) => void
  onDismiss: (refocus: boolean) => void
  tomorrow: Date
  nextWeek: Date
  /** The task's day now, where the date field starts. */
  current: IsoDate
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState(current)
  const fieldId = useId()

  useEffect(() => {
    // A press anywhere else closes it. The trigger is left to its own
    // toggle, or this would close the menu and the click reopen it.
    const onPointer = (e: PointerEvent) => {
      const at = e.target as Element
      if (ref.current?.contains(at) || at.closest('[aria-haspopup="menu"]')) return
      onDismiss(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
    // Once, on open; onDismiss is recreated every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus follows the mode: the first item in the menu, the field when picking.
  useEffect(() => {
    const target = picking
      ? ref.current?.querySelector<HTMLElement>('input')
      : ref.current?.querySelector<HTMLElement>('[role="menuitem"]')
    target?.focus()
  }, [picking])

  function onKeyDown(e: React.KeyboardEvent) {
    const items = Array.from(
      ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    )
    const at = items.indexOf(document.activeElement as HTMLElement)
    const go = (i: number) => items[(i + items.length) % items.length]?.focus()

    if (e.key === 'ArrowDown') go(at + 1)
    else if (e.key === 'ArrowUp') go(at - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(items.length - 1)
    else if (e.key === 'Tab') {
      onDismiss(false)
      return
    } else return
    e.preventDefault()
  }

  const shell = 'animate-pop-in absolute right-0 top-10 z-10 w-64 overflow-hidden rounded-pillar border border-white/70'
  const surface = { background: 'var(--gradient-surface-soft)', boxShadow: 'var(--shadow-lift)' }

  if (picking) {
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(picked)
    return (
      <div ref={ref} role="group" aria-label="Pick a day" className={cn(shell, 'p-4')} style={surface}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (valid) onPick(fromIso(picked))
          }}
        >
          <label htmlFor={fieldId} className="label-mono block pb-2 text-[12px] text-slate-600">
            Move to
          </label>
          <input
            id={fieldId}
            type="date"
            value={picked}
            onChange={(e) => setPicked(e.target.value)}
            className={cn(
              'w-full rounded-pill border border-slate-500 bg-white px-4 py-2 text-[16px] text-slate-900 md:text-[14px]',
              'outline-none hover:border-blue-400',
              'focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30',
            )}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPicking(false)}
              className="rounded-pill px-3 py-1.5 text-[13.5px] text-slate-700 transition-colors hover:bg-blue-100 hover:text-slate-900"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!valid}
              className={cn(
                'btn-primary rounded-pill px-4 py-1.5 text-[13.5px] font-semibold',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
              )}
            >
              {valid ? `Move to ${dayLabel(fromIso(picked))} ${dayDateLabel(fromIso(picked))}` : 'Move'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Move to"
      onKeyDown={onKeyDown}
      className={cn(shell, 'py-1.5')}
      style={surface}
    >
      <p aria-hidden="true" className="label-mono px-4 pb-1 pt-1.5 text-[12px] text-slate-600">
        Move to
      </p>
      <MenuItem
        onClick={() => onPick(tomorrow)}
        label="Tomorrow"
        detail={`${dayLabel(tomorrow)} ${dayDateLabel(tomorrow)}`}
        icon={
          // A single step forward.
          <path
            d="M4 10h10M10.5 6.5 14 10l-3.5 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        }
      />
      <MenuItem
        onClick={() => onPick(nextWeek)}
        label="Next week"
        detail={`${dayLabel(nextWeek)} ${dayDateLabel(nextWeek)}`}
        icon={
          // A calendar page with a jump to the next row.
          <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.25" y="4.5" width="13.5" height="12" rx="2.25" />
            <path d="M3.25 8.25h13.5M7 3v3M13 3v3" />
            <path d="M7.5 12.5h4.5M10.5 11l1.5 1.5-1.5 1.5" />
          </g>
        }
      />
      <MenuItem
        onClick={() => setPicking(true)}
        label="Pick a day"
        detail="…"
        icon={
          // A calendar page with one day circled.
          <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.25" y="4.5" width="13.5" height="12" rx="2.25" />
            <path d="M3.25 8.25h13.5M7 3v3M13 3v3" />
            <circle cx="10" cy="12.4" r="1.9" />
          </g>
        }
      />
    </div>
  )
}

function MenuItem({
  onClick,
  label,
  detail,
  icon,
}: {
  onClick: () => void
  label: string
  detail: string
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={onClick}
      className={cn(
        'group/item flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] text-slate-800',
        'transition-colors duration-150 hover:bg-blue-100 hover:text-blue-900',
        'focus-visible:bg-blue-100 focus-visible:text-blue-900 focus-visible:outline-none',
        'focus-visible:shadow-[inset_3px_0_0_var(--color-blue-700)]',
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-full bg-white/80 text-blue-700 transition-colors group-hover/item:bg-white"
      >
        <svg viewBox="0 0 20 20" className="size-4">
          {icon}
        </svg>
      </span>
      <span className="flex-1 font-medium">{label}</span>
      <span className="text-[12.5px] tabular-nums text-slate-600">{detail}</span>
    </button>
  )
}

function Section({
  label,
  children,
}: {
  label: string
  children: (labelId: string) => React.ReactNode
}) {
  const id = useId()
  return (
    <section className="pt-5">
      <h3 id={id} className="label-mono pb-1 text-[12px] text-slate-600">
        {label}
      </h3>
      {children(id)}
    </section>
  )
}

/**
 * Single-choice rows as a radio group: one tab stop, arrow keys move the
 * choice, as screen readers announce and keyboard users expect.
 */
function RadioGroup({
  labelledBy,
  className,
  children,
}: {
  labelledBy: string
  className?: string
  children: React.ReactNode
}) {
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? 1
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? -1
          : 0
    if (!step) return
    const radios = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]'),
    )
    const at = radios.indexOf(document.activeElement as HTMLElement)
    const next = radios[(at + step + radios.length) % radios.length]
    if (!next) return
    e.preventDefault()
    next.focus()
    next.click()
  }

  return (
    <div role="radiogroup" aria-labelledby={labelledBy} onKeyDown={onKeyDown} className={className}>
      {children}
    </div>
  )
}

function OptionRow({
  role,
  selected,
  onClick,
  children,
  trailing,
}: {
  /** A radio picks one of several; a toggle can also be picked off. */
  role: 'radio' | 'toggle'
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  trailing?: React.ReactNode
}) {
  const radio = role === 'radio'
  return (
    <button
      type="button"
      onClick={onClick}
      role={radio ? 'radio' : undefined}
      aria-checked={radio ? selected : undefined}
      aria-pressed={radio ? undefined : selected}
      tabIndex={radio && !selected ? -1 : 0}
      className={cn(
        '-mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-md border-b px-2 py-2.5 text-left',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-700',
        selected
          ? 'text-blue-800'
          : 'text-slate-800 hover:bg-blue-100/70 hover:text-blue-900',
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
            selected ? 'border-blue-700 bg-blue-700' : 'border-slate-500 bg-white',
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
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-pill border px-3.5 py-1.5 text-[13px] capitalize',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
        selected ? 'btn-primary border-transparent font-semibold' : 'btn-quiet',
      )}
    >
      <span className={cn('size-2 rounded-full ring-1 ring-white/70', dot)} aria-hidden="true" />
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
  haspopup,
  ref,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
  expanded?: boolean
  haspopup?: 'menu'
  ref?: React.Ref<HTMLButtonElement>
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={expanded}
      aria-haspopup={haspopup}
      className={cn(
        'grid size-8 place-items-center rounded-full',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
        danger
          ? 'text-slate-600 transition-colors duration-150 hover:bg-error-text/10 hover:text-error-text'
          : 'btn-icon',
      )}
    >
      <svg viewBox="0 0 20 20" className="size-4.5" fill="currentColor" aria-hidden="true">
        {children}
      </svg>
    </button>
  )
}
