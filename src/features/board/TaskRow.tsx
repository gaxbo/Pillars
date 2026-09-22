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
        'hover:bg-white/60',
        isDragging && 'opacity-40',
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-label={done ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
        aria-pressed={done}
        className={cn(
          'relative grid size-[22px] shrink-0 place-items-center rounded-full md:size-[18px]',
          // A fingertip-sized hit area around a small circle, on phones only.
          'before:absolute before:-inset-2 md:before:hidden',
          'transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
          done
            ? 'bg-blue-500'
            : 'border border-slate-300 bg-white/70 hover:border-blue-400',
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
        className={cn(
          'flex-1 cursor-grab select-none text-left text-[15px] leading-snug active:cursor-grabbing md:text-[13.5px]',
          '[-webkit-touch-callout:none]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 focus-visible:rounded-sm',
          done ? 'text-slate-400 line-through' : 'text-slate-800',
        )}
      >
        {task.title}
      </button>

      {/* Only signal what's exceptional: low priority is the default and gets
          no mark at all. */}
      {!done && task.priority !== 'low' && (
        <span
          aria-label={`${task.priority} priority`}
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
