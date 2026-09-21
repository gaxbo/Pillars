import type { IsoDate, Pillar, Task } from '@/data/types'
import { dayDateLabel, dayLabel, isPast, isToday } from '@/lib/date'
import { cn } from '@/lib/cn'
import { PillarBlock } from './PillarBlock'
import { selectCellTasks } from './useBoardStore'

interface DayColumnProps {
  date: Date
  iso: IsoDate
  pillars: Pillar[]
  tasks: Task[]
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onAdd: (date: IsoDate, pillarId: string) => void
}

/**
 * A column is a real surface that fills its lane. In the original screens a
 * day was a heavy black rule with bars floating under it, so columns never
 * read as columns and content huddled in the top quarter of the page.
 */
export function DayColumn({
  date,
  iso,
  pillars,
  tasks,
  onToggle,
  onOpen,
  onAdd,
}: DayColumnProps) {
  const today = isToday(date)
  const past = isPast(date)
  const dayTasks = tasks.filter((t) => t.scheduledDate === iso)
  const done = dayTasks.filter((t) => t.status === 'done').length

  return (
    <section
      aria-label={`${dayLabel(date)} ${dayDateLabel(date)}`}
      className={cn(
        'flex h-full min-w-0 flex-col rounded-column p-2.5',
        'transition-colors duration-200',
        today && 'ring-1 ring-blue-300/70',
        past && !today && 'opacity-[0.7]',
      )}
      style={{
        background: today ? 'var(--surface-column-hover)' : 'var(--surface-column)',
        boxShadow: today ? 'var(--shadow-raised)' : 'var(--shadow-rest)',
      }}
    >
      <header
        className="mb-2.5 flex items-baseline justify-between gap-2 border-b pb-2"
        style={{ borderColor: 'var(--border-hairline)' }}
      >
        <span
          className={cn(
            'text-[15px] font-semibold tracking-tight',
            today ? 'text-blue-700' : 'text-slate-900',
          )}
        >
          {dayDateLabel(date)}
        </span>
        <span className="flex items-baseline gap-2">
          {dayTasks.length > 0 && (
            <span className="label-mono text-[9.5px] tabular-nums text-slate-400">
              {done}/{dayTasks.length}
            </span>
          )}
          <span
            className={cn(
              'text-[12px]',
              today ? 'font-medium text-blue-600' : 'text-slate-500',
            )}
          >
            {today ? 'Today' : dayLabel(date)}
          </span>
        </span>
      </header>

      <div className="flex flex-col gap-1.5">
        {pillars.map((pillar) => (
          <PillarBlock
            key={pillar.id}
            pillar={pillar}
            date={iso}
            tasks={selectCellTasks(tasks, iso, pillar.id)}
            onToggle={onToggle}
            onOpen={onOpen}
            onAdd={onAdd}
          />
        ))}
      </div>

      {/* The rest of the lane stays open: it's drop space, not dead space. */}
      <div className="flex-1" aria-hidden="true" />
    </section>
  )
}
