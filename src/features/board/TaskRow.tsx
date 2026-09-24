import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'motion/react'
import type { Task } from '@/data/types'
import { ease } from '@/design/motion'
import { cn } from '@/lib/cn'

interface TaskRowProps {
  task: Task
  onToggle: (id: string) => void
  onOpen: (id: string) => void
}

/**
 * The loudest thing in a pillar block, by design. In the original screens the
 * task was small plain text under a heavy grey bar, which inverted the
 * hierarchy — the pillar is the container, the task is the substance.
 */
export const TaskRow = memo(function TaskRow({
  task,
  onToggle,
  onOpen,
}: TaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const done = task.status === 'done'

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-task py-2 pl-1.5 pr-2 md:py-1.5',
        'transition-colors duration-150',
        'hover:bg-white/90 hover:shadow-[var(--shadow-rest)]',
        // Keyboard focus anywhere in the row lights it, the same as hover.
        'has-[:focus-visible]:bg-white/90',
        isDragging && 'opacity-40',
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        // A checkbox, so it's announced as checked or not checked, rather
        // than a toggle whose label says the opposite of its state.
        role="checkbox"
        aria-checked={done}
        aria-label={`Done: ${task.title}`}
        className={cn(
          'relative grid size-[22px] shrink-0 place-items-center rounded-full md:size-[18px]',
          // A fingertip-sized hit area around a small circle, on phones only.
          'before:absolute before:-inset-2 md:before:hidden',
          'transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
          done
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'border-[1.5px] border-slate-500 bg-white hover:border-blue-600 hover:bg-blue-100',
        )}
      >
        {done && (
          <motion.svg
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={ease.fast}
            viewBox="0 0 12 12"
            className="size-[13px] md:size-[11px]"
            aria-hidden="true"
          >
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.8"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </button>

      {/* The drag surface. A 6px activation distance keeps plain clicks
          working; on touch it's a long press, so the text must not select. */}
      <button
        type="button"
        onClick={() => onOpen(task.id)}
        {...attributes}
        {...listeners}
        // The priority dot beside the row is visual only; this is its words.
        aria-label={
          !done && task.priority !== 'low'
            ? `${task.title}, ${task.priority} priority`
            : task.title
        }
        className={cn(
          'flex-1 cursor-grab select-none text-left text-[15px] leading-snug active:cursor-grabbing md:text-[13.5px]',
          '[-webkit-touch-callout:none]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 focus-visible:rounded-sm',
          done ? 'text-slate-600 line-through decoration-slate-500' : 'text-slate-800',
        )}
      >
        {task.title}
      </button>

      {/* Only signal what's exceptional: low priority is the default and gets
          no mark at all. */}
      {!done && task.priority !== 'low' && (
        <span
          aria-hidden="true"
          className={cn(
            'size-[6px] shrink-0 rounded-full',
            task.priority === 'high'
              ? 'bg-priority-high'
              : 'bg-priority-medium opacity-70',
          )}
        />
      )}
    </div>
  )
})
