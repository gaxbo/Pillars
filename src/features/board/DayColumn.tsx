import { memo } from 'react'
import type { IsoDate, Pillar, Task } from '@/data/types'
import { dayDateLabel, dayLabel, isPast, isToday } from '@/lib/date'
import { cn } from '@/lib/cn'
import { PillarBlock } from './PillarBlock'
import { cellId } from './useBoardStore'

interface DayColumnProps {
  date: Date
  iso: IsoDate
  pillars: Pillar[]
  /** Pre-grouped in BoardPage so a cell never filters the whole task list. */
  byCell: Map<string, Task[]>
  dayStats: { total: number; done: number } | undefined
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onAdd: (date: IsoDate, pillarId: string) => void
  /**
   * `lane`: a column in the week grid. `list`: a phone's one day, as a
   * heading over a single card of pillar sections.
   */
  variant?: 'lane' | 'list'
  className?: string
}

const EMPTY: Task[] = []

const fullDayName = (date: Date) =>
  date.toLocaleDateString('en-US', { weekday: 'long' })

/**
 * A column is a real surface that fills its lane. In the original screens a
 * day was a heavy black rule with bars floating under it, so columns never
 * read as columns and content huddled in the top quarter of the page.
 */
export const DayColumn = memo(function DayColumn({
  date,
  iso,
  pillars,
  byCell,
  dayStats,
  onToggle,
  onOpen,
  onAdd,
  variant = 'lane',
  className,
}: DayColumnProps) {
  const today = isToday(date)
  const past = isPast(date)

  /**
   * On a phone the lane's nesting read as clutter: a card for the day, a card
   * for every pillar inside it, and a date the strip above already shows.
   * Here the day is a heading, and its pillars are sections of one card,
   * split by hairlines. The card ends with its content rather than running
   * to the bottom of the screen.
   */
  if (variant === 'list') {
    return (
      <section
        aria-labelledby={`day-${iso}`}
        aria-current={today ? 'date' : undefined}
        className={className}
      >
        <header className="mb-3 flex items-end justify-between gap-3 px-1">
          <div>
            {today && (
              <p aria-hidden="true" className="label-mono mb-1 text-[12px] text-blue-800">
                Today
              </p>
            )}
            <h2
              id={`day-${iso}`}
              className={cn(
                'text-[21px] font-semibold leading-tight tracking-[-0.01em]',
                today ? 'text-blue-800' : past ? 'text-slate-700' : 'text-slate-900',
              )}
            >
              {fullDayName(date)} {dayDateLabel(date)}
              {today && <span className="sr-only-text">, today</span>}
            </h2>
          </div>
          {dayStats && dayStats.total > 0 && (
            <p className="label-mono pb-0.5 text-[12px] tabular-nums text-slate-600">
              <span aria-hidden="true">
                {dayStats.done}/{dayStats.total} done
              </span>
              <span className="sr-only-text">
                {dayStats.done} of {dayStats.total} tasks done
              </span>
            </p>
          )}
        </header>

        <div
          className="overflow-hidden rounded-column border border-white/80 shadow-[var(--shadow-raised)]"
          style={{ background: 'var(--gradient-surface-soft)' }}
        >
          {pillars.map((pillar) => (
            <PillarBlock
              key={pillar.id}
              pillar={pillar}
              date={iso}
              tasks={byCell.get(cellId(iso, pillar.id)) ?? EMPTY}
              onToggle={onToggle}
              onOpen={onOpen}
              onAdd={onAdd}
              variant="section"
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section
      aria-labelledby={`day-${iso}`}
      aria-current={today ? 'date' : undefined}
      className={cn(
        'flex h-full min-w-0 flex-col rounded-column p-2.5',
        'transition-colors duration-200',
        today && 'ring-1 ring-blue-300/70',
        className,
      )}
      style={{
        // A past day recedes through its surface, not an opacity on the
        // whole column: fading the column faded its text under AA contrast.
        background: today
          ? 'var(--surface-column-hover)'
          : past
            ? 'var(--surface-inactive)'
            : 'var(--surface-column)',
        boxShadow: today ? 'var(--shadow-raised)' : 'var(--shadow-rest)',
      }}
    >
      <header
        className="mb-2.5 flex items-baseline justify-between gap-2 border-b pb-2"
        style={{ borderColor: 'var(--border-hairline)' }}
      >
        {/* A heading per day, so a screen reader can jump day to day. */}
        <h2
          id={`day-${iso}`}
          className={cn(
            'text-[15px] font-semibold tracking-tight',
            today ? 'text-blue-800' : past ? 'text-slate-700' : 'text-slate-900',
          )}
        >
          <span className="sr-only-text">{fullDayName(date)} </span>
          {dayDateLabel(date)}
          {today && <span className="sr-only-text">, today</span>}
        </h2>
        <span className="flex items-baseline gap-2" aria-hidden="true">
          {dayStats && dayStats.total > 0 && (
            <span className="label-mono text-[12px] tabular-nums text-slate-600">
              {dayStats.done}/{dayStats.total}
            </span>
          )}
          <span
            className={cn(
              'text-[12px]',
              today ? 'font-medium text-blue-800' : 'text-slate-600',
            )}
          >
            {today ? 'Today' : dayLabel(date)}
          </span>
        </span>
        {dayStats && dayStats.total > 0 && (
          <span className="sr-only-text">
            {dayStats.done} of {dayStats.total} tasks done
          </span>
        )}
      </header>

      <div className="flex flex-col gap-1.5">
        {pillars.map((pillar) => (
          <PillarBlock
            key={pillar.id}
            pillar={pillar}
            date={iso}
            tasks={byCell.get(cellId(iso, pillar.id)) ?? EMPTY}
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
})
