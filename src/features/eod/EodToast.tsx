import { cn } from '@/lib/cn'

interface EodToastProps {
  count: number
  /** How many of `count` were left on earlier days. */
  earlier: number
  onOpen: () => void
  onLater: () => void
}

/**
 * The bottom-centre nudge from the design. A pill where there's room for one
 * line; on a phone the actions wrapped inside the pill's curve, so there it
 * becomes a card with the actions on their own row.
 */
export function EodToast({ count, earlier, onOpen, onLater }: EodToastProps) {
  return (
    // A landmark to find it by; only the sentence is a live region, so a
    // screen reader announces it once, not every button in it.
    <section
      aria-label="End of day"
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
        <p role="status" className="text-[15px] text-slate-800">
          <span className="font-semibold tabular-nums">{count}</span>{' '}
          {count === 1 ? 'task is' : 'tasks are'} still open
          {earlier === 0
            ? ' today'
            : earlier === count
              ? ' from earlier days'
              : `, ${earlier} from earlier days`}
          .
        </p>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpen}
            className={cn(
              'btn-primary rounded-pill px-4 py-2 text-[13px] font-semibold',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
            )}
          >
            Take a look
          </button>

          <button
            type="button"
            onClick={onLater}
            className="mr-3 rounded-sm text-[13px] text-slate-700 underline underline-offset-2 transition-colors hover:text-blue-800 hover:decoration-2"
          >
            Remind me later
          </button>
        </div>
      </div>
    </section>
  )
}
