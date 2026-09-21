import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { IsoDate, Task } from '@/data/types'
import { toIso, weekTitle } from '@/lib/date'
import { BoardHeader } from './BoardHeader'
import { DayColumn } from './DayColumn'
import { TaskDialog, type DialogTarget } from './TaskDialog'
import { WeekPanel } from './WeekPanel'
import { cellId, parseCellId, selectWeek, useBoardStore } from './useBoardStore'

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
  const setPanelOpen = useBoardStore((s) => s.setPanelOpen)
  const toggleTask = useBoardStore((s) => s.toggleTask)
  const placeTask = useBoardStore((s) => s.placeTask)

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogTarget | null>(null)

  useEffect(() => {
    void load()
  }, [load])

  const sensors = useSensors(
    // 6px of slop so a click to open or complete still registers as a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const days = useMemo(() => selectWeek(anchor), [anchor])

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

  return (
    <div className="flex h-full flex-col">
      <BoardHeader
        title={weekTitle(days)}
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

      <main className="min-h-0 flex-1 px-6 pb-8 sm:px-8">
        {loading && pillars.length === 0 ? (
          <p className="label-mono px-1 pt-6 text-[11px] text-slate-400">
            Loading your week…
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setDraggingId(null)}
          >
            {/* Columns stretch into lanes rather than floating at the top. */}
            <div className="grid h-full min-h-128 grid-cols-1 items-stretch gap-3 md:grid-cols-3 xl:grid-cols-7">
              {days.map((date) => {
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
                  />
                )
              })}
            </div>

            {/* Lifted card follows the cursor: scaled, tilted, heavily shadowed. */}
            <DragOverlay
              dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {dragging && (
                <div
                  className="flex items-center gap-2.5 rounded-task px-2.5 py-2 text-[13.5px] text-slate-800"
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
        )}
      </main>
    </div>
  )
}
