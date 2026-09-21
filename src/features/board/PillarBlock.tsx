import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'motion/react'
import type { IsoDate, Pillar, Task } from '@/data/types'
import { ease, spring } from '@/design/motion'
import { cn } from '@/lib/cn'
import { TaskRow } from './TaskRow'
import { cellId } from './useBoardStore'

interface PillarBlockProps {
  pillar: Pillar
  date: IsoDate
  tasks: Task[]
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onAdd: (date: IsoDate, pillarId: string) => void
}

/**
 * The fix at the heart of this redesign.
 *
 * Before: every pillar was a heavy #808080 bar with white text, so empty
 * pillars were the loudest thing on screen and pure-neutral grey fought the
 * blue palette.
 *
 * After: an empty pillar recedes — translucent, hairline, no shadow — and a
 * pillar holding work rises onto the same pale-blue gradient surface the
 * onboarding screens already use.
 *
 * Weekly goal progress deliberately does NOT appear here. It's a week-scoped
 * number, and repeating it in all seven day columns made it read as a daily
 * figure. It lives once, in the week summary.
 */
export function PillarBlock({
  pillar,
  date,
  tasks,
  onToggle,
  onOpen,
  onAdd,
}: PillarBlockProps) {
  const id = cellId(date, pillar.id)
  const { setNodeRef, isOver } = useDroppable({ id })
  const active = tasks.length > 0

  // An empty pillar is the natural place to click to add work, so the whole
  // block is the target rather than a hover-only "+".
  if (!active) {
    return (
      <motion.button
        ref={setNodeRef}
        layout
        transition={spring.gentle}
        type="button"
        onClick={() => onAdd(date, pillar.id)}
        aria-label={`Add a task to ${pillar.name}`}
        className={cn(
          'group/pillar flex w-full items-center justify-between gap-2 rounded-pillar',
          'border border-dashed px-2.5 py-1.5 text-left',
          'transition-colors duration-200',
          'hover:border-blue-300 hover:bg-white/70',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500',
          isOver && 'border-blue-400 ring-2 ring-blue-400/50',
        )}
        style={{
          background: isOver ? 'var(--surface-column-hover)' : 'var(--surface-inactive)',
          borderColor: isOver ? undefined : 'var(--border-inactive)',
        }}
      >
        <span className="label-mono truncate text-[10.5px] text-slate-500 transition-colors group-hover/pillar:text-blue-700">
          {pillar.name}
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 text-[13px] leading-none text-slate-400 transition-colors group-hover/pillar:text-blue-500"
        >
          +
        </span>
      </motion.button>
    )
  }

  return (
    <motion.div
      ref={setNodeRef}
      layout
      transition={spring.gentle}
      className={cn(
        'group/pillar relative rounded-pillar border border-white/70',
        'px-2.5 pb-2 pt-2 shadow-[var(--shadow-raised)]',
        'transition-[box-shadow] duration-200',
        isOver && 'ring-2 ring-blue-400/60',
      )}
      style={{ background: 'var(--gradient-surface)' }}
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="label-mono truncate text-[10.5px] text-blue-800">
          {pillar.name}
        </h3>
        <button
          type="button"
          onClick={() => onAdd(date, pillar.id)}
          aria-label={`Add a task to ${pillar.name}`}
          className={cn(
            'grid size-4 shrink-0 place-items-center rounded-full text-[13px] leading-none',
            'text-blue-600/70 transition-all duration-150',
            'hover:bg-white/70 hover:text-blue-600',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500',
            'opacity-0 group-hover/pillar:opacity-100 focus-visible:opacity-100',
            '[@media(hover:none)]:opacity-60',
          )}
        >
          +
        </button>
      </header>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <AnimatePresence initial={false}>
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={ease.medium}
            className="mt-1 overflow-hidden"
          >
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={onToggle}
                onOpen={onOpen}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </SortableContext>
    </motion.div>
  )
}
