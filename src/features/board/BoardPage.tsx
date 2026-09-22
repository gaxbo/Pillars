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
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { getEventCoordinates } from '@dnd-kit/utilities'
import type { IsoDate, Task } from '@/data/types'
import { cn } from '@/lib/cn'
import { fromIso, startOfWeek, toIso, weekTitle } from '@/lib/date'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { useNavigate } from 'react-router-dom'
import { BoardHeader } from './BoardHeader'
import { DayColumn } from './DayColumn'
import { DayStrip } from './DayStrip'
import { EodToast } from '@/features/eod/EodToast'
import { EodTriage } from '@/features/eod/EodTriage'
import { snoozeEod } from '@/features/reminders/reminders'
import { useReminders } from '@/features/reminders/useReminders'
import { TaskDialog, type DialogTarget } from './TaskDialog'
import { WeekPanel } from './WeekPanel'
import {
  cellId,
  parseCellId,
  parseDayDropId,
  selectWeek,
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

export function BoardPage() {
  // Narrow subscriptions: opening the panel must not re-render the whole board.
  const anchor = useBoardStore((s) => s.anchor)
  const pillars = useBoardStore((s) => s.pillars)
  const goals = useBoardStore((s) => s.goals)
  const tasks = useBoardStore((s) => s.tasks)
  const loading = useBoardStore((s) => s.loading)
  const panelOpen = useBoardStore((s) => s.panelOpen)
  const planningTime = useBoardStore((s) => s.planningTime)

  const load = useBoardStore((s) => s.load)
  const shiftWeek = useBoardStore((s) => s.shiftWeek)
  const goToToday = useBoardStore((s) => s.goToToday)
  const selectDay = useBoardStore((s) => s.selectDay)
  const setPanelOpen = useBoardStore((s) => s.setPanelOpen)
  const toggleTask = useBoardStore((s) => s.toggleTask)
  const placeTask = useBoardStore((s) => s.placeTask)
  const editTask = useBoardStore((s) => s.editTask)
  const removeTask = useBoardStore((s) => s.removeTask)

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogTarget | null>(null)
  const [triageOpen, setTriageOpen] = useState(false)
  const [eodHidden, setEodHidden] = useState(false)

  const navigate = useNavigate()
  // Same 48rem as Tailwind's `md`, which the header's own classes switch on.
  const wide = useMediaQuery('(min-width: 48rem)')
  const { eod, weeklyDue } = useReminders(tasks, !loading)

  // The weekly report card is a destination, not a banner — the design
  // sends people straight there, and that page carries its own way out.
  useEffect(() => {
    if (weeklyDue) navigate('/weekly-review')
  }, [weeklyDue, navigate])

  useEffect(() => {
    void load()
  }, [load])

  const sensors = useSensors(
    // 6px of slop so a click to open or complete still registers as a click.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // On touch, press and hold to lift, so a swipe down the day still scrolls.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
      <BoardHeader
        title={weekTitle(days)}
        shortTitle={weekTitle(days, true)}
        onPrev={() => shiftWeek(-1)}
        onNext={() => shiftWeek(1)}
        onToday={goToToday}
        onOpenWeek={() => setPanelOpen(true)}
      />

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

      {eod.due && !eodHidden && !triageOpen && (
        <EodToast
          count={eod.tasks.length}
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
        onDone={toggleTask}
        onTomorrow={(id, date) => editTask(id, { scheduledDate: date })}
        onDelete={removeTask}
        onClose={() => {
          setTriageOpen(false)
          setEodHidden(true)
        }}
      />

      <DndContext
        sensors={sensors}
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
          className={cn(
            'min-h-0 flex-1 px-4 pb-8 sm:px-6 md:px-8',
            !wide && 'flex flex-col pt-3',
          )}
        >
          {loading && pillars.length === 0 ? (
            <p className="label-mono px-1 pt-6 text-[11px] text-slate-400">
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
