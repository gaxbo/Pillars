import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'motion/react'
import type { IsoDate, Pillar, Task } from '@/data/types'
import { ease, spring } from '@/design/motion'
import { cn } from '@/lib/cn'
import { fromIso } from '@/lib/date'
import { TaskRow } from './TaskRow'
import { cellId } from './useBoardStore'

interface PillarBlockProps {
  pillar: Pillar
  date: IsoDate
  tasks: Task[]
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onAdd: (date: IsoDate, pillarId: string) => void
  /**
   * `card`: its own surface, in a week-grid column. `section`: one of a
   * phone day's sections, sharing a single card, split by hairlines.
   */
  variant?: 'card' | 'section'
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
export const PillarBlock = memo(function PillarBlock({
  pillar,
  date,
  tasks,
  onToggle,
  onOpen,
  onAdd,
  variant = 'card',
}: PillarBlockProps) {
  const id = cellId(date, pillar.id)
  const { setNodeRef, isOver } = useDroppable({ id })
  const active = tasks.length > 0
  // Seven columns each have a Health: say which day this one is.
  const spoken = fromIso(date).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })

  const addLabel = `Add a task to ${pillar.name}, ${spoken}`

  if (variant === 'section') {
    const divider = 'border-t first:border-t-0'
    const dividerColor = { borderColor: 'var(--border-hairline)' }

    // Empty, it's one quiet line: the pillar's name and a way to add to it.
    // The whole line is the button, and a drop target.
    if (!active) {
      return (
        <motion.button
          ref={setNodeRef}
          layout
          transition={spring.gentle}
          type="button"
          onClick={() => onAdd(date, pillar.id)}
          aria-label={addLabel}
          className={cn(
            'group/pillar flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left',
            divider,
            'transition-colors duration-150 hover:bg-blue-50/70 active:bg-blue-50',
            // Inset, so the card's rounded edge doesn't clip it.
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-700',
            isOver && 'bg-blue-50 ring-2 ring-inset ring-blue-400/60',
          )}
          style={dividerColor}
        >
          <span className="label-mono truncate text-[12px] text-slate-600">{pillar.name}</span>
          <span
            aria-hidden="true"
            className="grid size-6 shrink-0 place-items-center rounded-full text-[17px] leading-none text-slate-500"
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
          'px-4 pb-2.5 pt-3.5 transition-colors duration-150',
          divider,
          isOver && 'bg-blue-50 ring-2 ring-inset ring-blue-400/60',
        )}
        style={dividerColor}
      >
        <header className="flex items-center justify-between gap-2">
          <h3 className="label-mono truncate text-[12px] text-blue-800">{pillar.name}</h3>
          <button
            type="button"
            onClick={() => onAdd(date, pillar.id)}
            aria-label={addLabel}
            className={cn(
              'grid size-8 -my-2 -mr-2 shrink-0 place-items-center rounded-full text-[17px] leading-none text-blue-700',
              'transition-colors duration-150 hover:bg-blue-700 hover:text-white',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700',
            )}
          >
            +
          </button>
        </header>

        {/* Pulled out by the row's own padding, so each checkbox lines up
            under the pillar's name. */}
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="-mx-1.5 mt-1.5">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={onToggle} onOpen={onOpen} />
            ))}
          </div>
        </SortableContext>
      </motion.div>
    )
  }

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
        aria-label={addLabel}
        className={cn(
          'group/pillar flex w-full items-center justify-between gap-2 rounded-pillar',
          'border border-dashed px-2.5 py-3 text-left md:py-1.5',
          'transition-colors duration-150',
          // Hover fills and firms the dashed outline, so the block reads as
          // a button the moment the pointer is on it. Important, to beat the
          // resting surface set inline below.
          'hover:border-solid hover:border-blue-500! hover:bg-blue-50!',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700',
          isOver && 'border-blue-400 ring-2 ring-blue-400/50',
        )}
        style={{
          background: isOver ? 'var(--surface-column-hover)' : 'var(--surface-inactive)',
          borderColor: isOver ? undefined : 'var(--border-inactive)',
        }}
      >
        <span className="label-mono truncate text-[12px] text-slate-600 transition-colors group-hover/pillar:text-blue-800">
          {pillar.name}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'grid size-4 shrink-0 place-items-center rounded-full text-[13px] leading-none text-slate-500',
            'transition-colors group-hover/pillar:bg-blue-700 group-hover/pillar:text-white',
          )}
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
        <h3 className="label-mono truncate text-[12px] text-blue-800">
          {pillar.name}
        </h3>
        <button
          type="button"
          onClick={() => onAdd(date, pillar.id)}
          aria-label={addLabel}
          // Finger-sized on a phone, 24px (WCAG's minimum target) from md
          // up; the negative margins keep the header's height from growing.
          className={cn(
            'grid size-8 -my-2 -mr-1.5 shrink-0 place-items-center rounded-full text-[17px] leading-none',
            'md:-my-1 md:-mr-1 md:size-6 md:text-[14px]',
            'text-blue-700 transition-all duration-150',
            'hover:bg-blue-700 hover:text-white',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700',
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
})
