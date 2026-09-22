import { cn } from '@/lib/cn'

interface EodToastProps {
  count: number
  onOpen: () => void
  onLater: () => void
}

/**
 * The bottom-centre nudge from the design. A pill where there's room for one
 * line; on a phone the actions wrapped inside the pill's curve, so there it
 * becomes a card with the actions on their own row.
 */
export function EodToast({ count, onOpen, onLater }: EodToastProps) {
  return (
    <div
      role="status"
      aria-label="Tasks still open today"
      className="animate-rise fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
    >
      <div
        className={cn(
          'flex w-full max-w-sm flex-col gap-3 rounded-modal border border-white/70 p-4',
          'sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:gap-4 sm:rounded-pill sm:py-2.5 sm:pl-6 sm:pr-3',
        )}
        style={{
          background: 'var(--gradient-surface-soft)',
          boxShadow: 'var(--shadow-lift)',
        }}
      >
        <p className="text-[15px] text-slate-800">
          <span className="font-semibold tabular-nums">{count}</span>{' '}
          {count === 1 ? 'task is' : 'tasks are'} still open today.
        </p>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpen}
            className={cn(
              'rounded-pill px-4 py-2 text-[13px] font-semibold text-white',
              'transition-opacity duration-150 hover:opacity-90',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
            )}
            style={{
              background: 'var(--gradient-primary)',
              boxShadow: 'var(--shadow-raised)',
            }}
          >
            Take a look
          </button>

          <button
            type="button"
            onClick={onLater}
            className="pr-3 text-[13px] text-slate-600 underline underline-offset-2 transition-colors hover:text-slate-900"
          >
            remind me later
          </button>
        </div>
      </div>
    </div>
  )
}
