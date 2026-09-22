import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { IsoDate } from '@/data/types'
import { dayDateLabel, dayLabel, isPast, isToday, toIso } from '@/lib/date'
import { cn } from '@/lib/cn'
import { ChevronButton } from './BoardHeader'
import { dayDropId } from './useBoardStore'

type DayStats = { total: number; done: number }

interface DayStripProps {
  days: Date[]
  selected: IsoDate
  byDay: Map<IsoDate, DayStats>
  onSelect: (date: Date) => void
  onPrev: () => void
  onNext: () => void
}

/**
 * A phone's stand-in for the seven-column grid: one day on screen, the week as
 * a row to switch between. Seven stacked full-width columns made the week a
 * scroll longer than two screens, with today somewhere in the middle of it.
 *
 * Sticky, because every day is also a drop target — a task dragged down a
 * long day still needs somewhere to go.
 */
export function DayStrip({
  days,
  selected,
  byDay,
  onSelect,
  onPrev,
  onNext,
}: DayStripProps) {
  return (
    <nav
      aria-label="Days this week"
      className="sticky top-0 z-30 flex items-center gap-1 border-b px-4 py-2 sm:px-6"
      style={{
        background: 'var(--surface-strip)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      <ChevronButton direction="prev" onClick={onPrev} />
      <div className="grid flex-1 grid-cols-7">
        {days.map((date) => {
          const iso = toIso(date)
          return (
            <DayChip
              key={iso}
              date={date}
              iso={iso}
              selected={iso === selected}
              stats={byDay.get(iso)}
              onSelect={onSelect}
            />
          )
        })}
      </div>
      <ChevronButton direction="next" onClick={onNext} />
    </nav>
  )
}

const DayChip = memo(function DayChip({
  date,
  iso,
  selected,
  stats,
  onSelect,
}: {
  date: Date
  iso: IsoDate
  selected: boolean
  stats: DayStats | undefined
  onSelect: (date: Date) => void
}) {
  // The selected day is the one being dragged from; dropping back on it would
  // do nothing, so it doesn't pretend to accept.
  const { setNodeRef, isOver } = useDroppable({
    id: dayDropId(iso),
    disabled: selected,
  })

  const today = isToday(date)
  const past = isPast(date) && !today
  const total = stats?.total ?? 0
  const allDone = total > 0 && stats?.done === total

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSelect(date)}
      aria-pressed={selected}
      aria-current={today ? 'date' : undefined}
      aria-label={`${dayLabel(date)} ${dayDateLabel(date)}${
        total > 0 ? `, ${stats?.done} of ${total} done` : ''
      }`}
      className={cn(
        'flex flex-col items-center gap-1 rounded-task pb-1.5 pt-2',
        'transition-[background-color,box-shadow,scale] duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500',
        !selected && 'hover:bg-white/70',
        // Grows under a dragged task so it shows around the fingertip.
        isOver && 'scale-115 bg-white ring-2 ring-blue-400',
      )}
      style={
        selected
          ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-raised)' }
          : undefined
      }
    >
      <span
        className={cn(
          'label-mono text-[9px] leading-none',
          selected ? 'text-white/85' : today ? 'text-blue-600' : 'text-slate-500',
        )}
      >
        {dayLabel(date)}
      </span>
      <span
        className={cn(
          'text-[16px] font-semibold leading-none tabular-nums',
          selected
            ? 'text-white'
            : today
              ? 'text-blue-700'
              : past
                ? 'text-slate-400'
                : 'text-slate-900',
        )}
      >
        {date.getDate()}
      </span>
      {/* Has work, and whether it's all done. The count lives in the day's
          own header; seven of them here would be noise. */}
      <span
        aria-hidden="true"
        className={cn(
          'size-1 rounded-full',
          total === 0
            ? 'bg-transparent'
            : selected
              ? 'bg-white'
              : allDone
                ? 'bg-priority-low'
                : 'bg-blue-400',
        )}
      />
    </button>
  )
})
