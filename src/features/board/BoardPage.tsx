import { useEffect, useState } from 'react'
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
import type { IsoDate } from '@/data/types'
import { toIso, weekTitle } from '@/lib/date'
import { BoardHeader } from './BoardHeader'
import { DayColumn } from './DayColumn'
import { WeekPanel } from './WeekPanel'
import {
  parseCellId,
  selectCellTasks,
  selectWeek,
  useBoardStore,
} from './useBoardStore'

export function BoardPage() {
  const {
    anchor,
    pillars,
    goals,
    tasks,
    loading,
    panelOpen,
    planningTime,
    load,
    shiftWeek,
    goToToday,
    setPanelOpen,
    toggleTask,
    placeTask,
  } = useBoardStore()

  const [draggingId, setDraggingId] = useState<string | null>(null)

  useEffect(() => {
    void load()
    // Once on mount; shiftWeek and goToToday reload themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sensors = useSensors(
    // 6px of slop so a click to open or complete still registers as a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const days = selectWeek(anchor)

  function handleDragStart(event: DragStartEvent) {
    setDraggingId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
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
        selectCellTasks(tasks, date, pillarId).length,
      )
      return
    }

    // Dropped on another task — take that task's slot.
    const target = tasks.find((t) => t.id === overId)
    if (!target || target.id === taskId) return

    const siblings = selectCellTasks(tasks, target.scheduledDate, target.pillarId)
    const index = siblings.findIndex((t) => t.id === target.id)
    placeTask(taskId, target.scheduledDate, target.pillarId, Math.max(0, index))
  }

  function handleAdd(date: IsoDate, pillarId: string) {
    // Wired up in Phase 3 (add/edit task modal).
    console.info('add task', { date, pillarId })
  }

  function handleOpen(id: string) {
    // Wired up in Phase 3.
    console.info('open task', id)
  }

  const dragging = tasks.find((t) => t.id === draggingId)

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
            <div className="grid h-full min-h-[32rem] grid-cols-1 items-stretch gap-3 md:grid-cols-3 xl:grid-cols-7">
              {days.map((date) => {
                const iso = toIso(date)
                return (
                  <DayColumn
                    key={iso}
                    date={date}
                    iso={iso}
                    pillars={pillars}
                    tasks={tasks}
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
                  <span className="size-[18px] shrink-0 rounded-full border border-slate-300 bg-white/70" />
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
