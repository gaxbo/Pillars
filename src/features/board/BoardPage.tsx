import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type UniqueIdentifier,
  type DragStartEvent,
  type Modifier,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { getEventCoordinates } from '@dnd-kit/utilities'
import type { IsoDate, Task } from '@/data/types'
import { cn } from '@/lib/cn'
import { dayDateLabel, fromIso, startOfWeek, toIso, weekTitle } from '@/lib/date'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { useNavigate } from 'react-router-dom'
import { BoardHeader } from './BoardHeader'
import { DayColumn } from './DayColumn'
import { DayStrip } from './DayStrip'
import { EodToast } from '@/features/eod/EodToast'
import { EodTriage } from '@/features/eod/EodTriage'
import { dismissWeekly, snoozeEod } from '@/features/reminders/reminders'
import { useReminders } from '@/features/reminders/useReminders'
import { TaskDialog, type DialogTarget } from './TaskDialog'
import { SaveStatusNote, UndoToast, WeeklyBanner } from './BoardNotices'
import { WeekPanel } from './WeekPanel'
import {
  cellId,
  parseCellId,
  parseDayDropId,
  selectWeek,
  planningLabel,
  useBoardStore,
} from './useBoardStore'

const isDayDrop = (id: string | number) => parseDayDropId(String(id)) !== null

/**
 * A phone hit-tests by the finger. Its lifted card hangs below the finger, so
 * the card's corners say nothing about where it's pointing — and the day
 * strip's targets are too small for corner distance anyway. Corners only
 * decide in the gaps between targets.
 */
const byFinger: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  if (hits.length > 0) return hits
  return closestCorners({
    ...args,
    droppableContainers: args.droppableContainers.filter((c) => !isDayDrop(c.id)),
  })
}

/**
 * On a phone the lifted card hangs just below the finger, centred on it.
 * Left where it was grabbed, a full-width card covered the day strip — the
 * very targets it was being dragged to.
 */
const belowFinger: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  const at = activatorEvent && getEventCoordinates(activatorEvent)
  if (!at || !draggingNodeRect) return transform
  const { left, top, width } = draggingNodeRect
  const fingerX = at.x + transform.x
  const fingerY = at.y + transform.y
  // Centred on the finger, but never pushed off the side of the screen.
  const x = Math.min(Math.max(fingerX - width / 2, 8), window.innerWidth - width - 8)
  return { ...transform, x: x - left, y: fingerY + 28 - top }
}

const screenReaderInstructions = {
  draggable:
    'Press Enter to open this task. To move it, press Space, use the arrow keys to carry it to another pillar or day, then press Space again to drop it, or Escape to cancel.',
}

/** "Wednesday 23 Sep", for announcements. */
function spokenDay(iso: IsoDate): string {
  const date = fromIso(iso)
  return `${date.toLocaleDateString('en-US', { weekday: 'long' })} ${dayDateLabel(date)}`
}

export function BoardPage() {
  // Narrow subscriptions: opening the panel must not re-render the whole board.
  const anchor = useBoardStore((s) => s.anchor)
  const pillars = useBoardStore((s) => s.pillars)
  const goals = useBoardStore((s) => s.goals)
  const tasks = useBoardStore((s) => s.tasks)
  const loading = useBoardStore((s) => s.loading)
  const panelOpen = useBoardStore((s) => s.panelOpen)

  const load = useBoardStore((s) => s.load)
  const shiftWeek = useBoardStore((s) => s.shiftWeek)
  const goToToday = useBoardStore((s) => s.goToToday)
  const selectDay = useBoardStore((s) => s.selectDay)
  const setPanelOpen = useBoardStore((s) => s.setPanelOpen)
  const toggleTask = useBoardStore((s) => s.toggleTask)
  const placeTask = useBoardStore((s) => s.placeTask)
  const editTask = useBoardStore((s) => s.editTask)
  const removeTask = useBoardStore((s) => s.removeTask)
  const undoDelete = useBoardStore((s) => s.undoDelete)
  const retrySaves = useBoardStore((s) => s.retrySaves)
  const pendingDelete = useBoardStore((s) => s.pendingDelete)
  const saveStatus = useBoardStore((s) => s.saveStatus)
  const range = useBoardStore((s) => s.range)
  const profile = useBoardStore((s) => s.profile)

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogTarget | null>(null)
  const [triageOpen, setTriageOpen] = useState(false)
  const [eodHidden, setEodHidden] = useState(false)
  // Bumped when a check-in closes, so the reminders re-read what's left.
  const [eodRefresh, setEodRefresh] = useState(0)
  const [weeklyHidden, setWeeklyHidden] = useState(false)

  const navigate = useNavigate()
  // Same 48rem as Tailwind's `md`, which the header's own classes switch on.
  const wide = useMediaQuery('(min-width: 48rem)')
  const { eod, weeklyDue } = useReminders(
    tasks,
    !loading,
    range,
    eodRefresh,
    pendingDelete?.id ?? null,
  )
  const planningTime = planningLabel(profile)

  useEffect(() => {
    void load()
  }, [load])

  const sensors = useSensors(
    // 6px of slop so a click to open or complete still registers as a click.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // On touch, press and hold to lift, so a swipe down the day still scrolls.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    // Space lifts and drops. Enter is left to the button, so it opens the
    // task: with dnd-kit's default, Enter started a drag instead, and there
    // was no way to edit a task from the keyboard.
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  )

  // Keyed on the week, not the selected day, so picking a day on a phone
  // doesn't hand every column a fresh set of dates.
  const weekStart = toIso(startOfWeek(anchor))
  const days = useMemo(() => selectWeek(fromIso(weekStart)), [weekStart])
  const selected = toIso(anchor)

  /**
   * Grouped once per task change instead of filtering the full list inside
   * every one of the 35 pillar cells on every render.
   */
  const byCell = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      const key = cellId(task.scheduledDate, task.pillarId)
      const bucket = map.get(key)
      if (bucket) bucket.push(task)
      else map.set(key, [task])
    }
    for (const bucket of map.values()) bucket.sort((a, b) => a.order - b.order)
    return map
  }, [tasks])

  const byDay = useMemo(() => {
    const map = new Map<IsoDate, { total: number; done: number }>()
    for (const task of tasks) {
      const entry = map.get(task.scheduledDate) ?? { total: 0, done: 0 }
      entry.total += 1
      if (task.status === 'done') entry.done += 1
      map.set(task.scheduledDate, entry)
    }
    return map
  }, [tasks])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggingId(null)
      const { active, over } = event
      if (!over) return

      const taskId = String(active.id)
      const overId = String(over.id)

      // Dropped on a day in the phone's strip: same pillar, end of that day.
      const day = parseDayDropId(overId)
      if (day) {
        const task = tasks.find((t) => t.id === taskId)
        if (!task || task.scheduledDate === day) return
        placeTask(
          taskId,
          day,
          task.pillarId,
          byCell.get(cellId(day, task.pillarId))?.length ?? 0,
        )
        return
      }

      // Dropped on an empty cell.
      if (overId.includes(':')) {
        const { date, pillarId } = parseCellId(overId)
        placeTask(
          taskId,
          date,
          pillarId,
          byCell.get(cellId(date, pillarId))?.length ?? 0,
        )
        return
      }

      // Dropped on another task — take that task's slot.
      const target = tasks.find((t) => t.id === overId)
      if (!target || target.id === taskId) return

      const siblings =
        byCell.get(cellId(target.scheduledDate, target.pillarId)) ?? []
      const index = siblings.findIndex((t) => t.id === target.id)
      placeTask(taskId, target.scheduledDate, target.pillarId, Math.max(0, index))
    },
    [byCell, placeTask, tasks],
  )

  /**
   * What a screen reader hears while a task is carried by keyboard: the
   * task's name and, at every step, the pillar and day under it. dnd-kit's
   * defaults only say "draggable item 3 is over droppable area 12".
   */
  const announcements = useMemo<Announcements>(() => {
    const title = (id: UniqueIdentifier) =>
      tasks.find((t) => t.id === String(id))?.title ?? 'Task'
    const place = (id: UniqueIdentifier | undefined) => {
      if (id === undefined) return 'nowhere'
      const raw = String(id)
      const day = parseDayDropId(raw)
      if (day) return spokenDay(day)
      // An empty cell, or another task, which stands for its own cell.
      const cell = raw.includes(':')
      const task = cell ? undefined : tasks.find((t) => t.id === raw)
      if (!cell && !task) return 'another task'
      const { date, pillarId } = task
        ? { date: task.scheduledDate, pillarId: task.pillarId }
        : parseCellId(raw)
      const pillar = pillars.find((p) => p.id === pillarId)?.name ?? 'a pillar'
      return `${pillar}, ${spokenDay(date)}`
    }
    return {
      onDragStart: ({ active }) => `Picked up ${title(active.id)}.`,
      onDragOver: ({ active, over }) =>
        over ? `${title(active.id)} is over ${place(over.id)}.` : undefined,
      onDragEnd: ({ active, over }) =>
        over
          ? `Moved ${title(active.id)} to ${place(over.id)}.`
          : `${title(active.id)} was dropped back where it was.`,
      onDragCancel: ({ active }) =>
        `Cancelled. ${title(active.id)} is back where it was.`,
    }
  }, [tasks, pillars])

  const handleAdd = useCallback((date: IsoDate, pillarId: string) => {
    setDialog({ mode: 'create', date, pillarId })
  }, [])

  const handleOpen = useCallback((id: string) => {
    setDialog({ mode: 'edit', taskId: id })
  }, [])

  const dragging = draggingId
    ? tasks.find((t) => t.id === draggingId)
    : undefined

  const column = (date: Date, className?: string) => {
    const iso = toIso(date)
    return (
      <DayColumn
        key={iso}
        date={date}
        iso={iso}
        pillars={pillars}
        byCell={byCell}
        dayStats={byDay.get(iso)}
        onToggle={toggleTask}
        onOpen={handleOpen}
        onAdd={handleAdd}
        className={className}
      />
    )
  }

  return (
    // A phone's page grows with its one day so the strip can stay stuck to
    // the top; wider screens fill the viewport so columns stretch into lanes.
    <div className={cn('flex flex-col', wide ? 'h-full' : 'min-h-full')}>
      <a href="#board" className="skip-link">
        Skip to the week
      </a>
      <BoardHeader
        title={weekTitle(days)}
        shortTitle={weekTitle(days, true)}
        onPrev={() => shiftWeek(-1)}
        onNext={() => shiftWeek(1)}
        onToday={goToToday}
        onOpenWeek={() => setPanelOpen(true)}
        weekOpen={panelOpen}
      />

      {weeklyDue && !weeklyHidden && (
        <WeeklyBanner
          onPlan={() => navigate('/weekly-review')}
          onLater={() => {
            // Once a week: "Not now" holds until next week's planning time.
            dismissWeekly(toIso(startOfWeek(new Date())))
            setWeeklyHidden(true)
          }}
        />
      )}

      <SaveStatusNote status={saveStatus} onRetry={retrySaves} />

      {pendingDelete && !triageOpen && (
        <UndoToast task={pendingDelete} onUndo={undoDelete} />
      )}

      <WeekPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        pillars={pillars}
        goals={goals}
        tasks={tasks}
        planningTime={planningTime}
      />

      <TaskDialog
        target={dialog}
        onClose={() => setDialog(null)}
        pillars={pillars}
        goals={goals}
      />

      {eod.due && !eodHidden && !triageOpen && !pendingDelete && (
        <EodToast
          count={eod.tasks.length}
          earlier={eod.earlier}
          onOpen={() => setTriageOpen(true)}
          onLater={() => {
            snoozeEod()
            setEodHidden(true)
          }}
        />
      )}

      <EodTriage
        open={triageOpen}
        tasks={eod.tasks}
        pillars={pillars}
        onDone={(task) =>
          editTask(task.id, { status: 'done', completedAt: new Date().toISOString() })
        }
        onTomorrow={(task, date) => editTask(task.id, { scheduledDate: date })}
        onDelete={(task) => removeTask(task.id, task)}
        onUndo={undoDelete}
        undoableId={pendingDelete?.id ?? null}
        onClose={() => {
          setTriageOpen(false)
          setEodHidden(true)
          setEodRefresh((n) => n + 1)
        }}
      />

      <DndContext
        sensors={sensors}
        accessibility={{ screenReaderInstructions, announcements }}
        collisionDetection={wide ? closestCorners : byFinger}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDraggingId(null)}
      >
        {!wide && (
          <DayStrip
            days={days}
            selected={selected}
            byDay={byDay}
            onSelect={selectDay}
            onPrev={() => shiftWeek(-1)}
            onNext={() => shiftWeek(1)}
          />
        )}

        <main
          id="board"
          tabIndex={-1}
          aria-label="Your week"
          className={cn(
            'min-h-0 flex-1 px-4 pb-8 outline-none sm:px-6 md:px-8',
            !wide && 'flex flex-col pt-3',
          )}
        >
          {loading && pillars.length === 0 ? (
            <p role="status" className="label-mono px-1 pt-6 text-[12px] text-slate-600">
              Loading your week…
            </p>
          ) : wide ? (
            // Columns stretch into lanes rather than floating at the top.
            <div className="grid h-full min-h-128 grid-cols-3 items-stretch gap-3 xl:grid-cols-7">
              {days.map((date) => column(date))}
            </div>
          ) : (
            column(days.find((d) => toIso(d) === selected) ?? days[0], 'flex-1')
          )}
        </main>

        {/* Lifted card follows the cursor: scaled, tilted, heavily shadowed. */}
        <DragOverlay
          modifiers={wide ? undefined : [belowFinger]}
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {dragging && (
            <div
              className="flex items-center gap-2.5 rounded-task px-2.5 py-2 text-[15px] text-slate-800 md:text-[13.5px]"
              style={{
                background: 'var(--gradient-surface-soft)',
                boxShadow: 'var(--shadow-lift)',
                transform: 'rotate(-1.5deg) scale(1.03)',
              }}
            >
              <span className="size-4.5 shrink-0 rounded-full border border-slate-300 bg-white/70" />
              {dragging.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
