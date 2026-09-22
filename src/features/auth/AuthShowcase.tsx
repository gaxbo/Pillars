import { cn } from '@/lib/cn'

/**
 * The left half of the split auth layout.
 *
 * Straight on, at real scale, in the app's own components — no perspective
 * tilt, no glass, no decorative blur. The motion is the argument: two tasks
 * get done and the week's goal fills in behind them, which is the whole loop
 * the product is built around.
 *
 * The vignette is sized in `em` against one base font size per breakpoint, so
 * it scales as a single object on a large display instead of staying pinned at
 * laptop dimensions while the panel around it grows.
 */
export function AuthShowcase() {
  return (
    <div
      className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center"
      aria-hidden="true"
      style={{
        background: 'linear-gradient(170deg, #5cb4ee 0%, #86cdf4 52%, #c9e6f7 100%)',
      }}
    >
      <div className="relative z-10 mx-auto w-full max-w-[30rem] px-10 xl:max-w-[34rem] xl:px-12 2xl:max-w-[46rem]">
        <h2 className="animate-rise max-w-[14ch] text-[36px] font-bold leading-[1.05] tracking-tight text-white xl:text-[42px] 2xl:text-[56px]">
          A week you meant to have.
        </h2>
        <p className="animate-rise delay-1 mt-5 max-w-[46ch] text-[16px] leading-snug text-white/90 xl:text-[17px] 2xl:text-[21px]">
          Pick the few things that matter. Give each one a goal. Then watch the
          week actually add up.
        </p>

        {/* One base size drives every em beneath it. */}
        <div className="sc-cycle animate-rise delay-2 mt-11 text-[15px] xl:text-[16.5px] 2xl:text-[22px]">
          <GoalsPanel />
          <TaskStrip />
        </div>
      </div>
    </div>
  )
}

/** The This Week panel, the same one the board opens. */
function GoalsPanel() {
  return (
    <div
      className="sc-float-a relative z-10 rounded-[1.1em] border border-white/70 px-[1.4em] pb-[3em] pt-[1.1em]"
      style={{
        background: 'linear-gradient(170deg, #ffffff 0%, #eaf4fc 100%)',
        boxShadow: '0 12px 32px rgba(30,69,96,0.16)',
      }}
    >
      <p className="label-mono text-[0.62em] text-slate-500">This week</p>

      <div className="mt-[0.85em]">
        <Goal
          pillar="Health"
          goal="Move three times"
          animated
          count={
            <span className="relative inline-block w-[2.6em] text-right">
              <span className="sc-count-1 absolute inset-0">1/3</span>
              <span className="sc-count-2 absolute inset-0">2/3</span>
              <span className="sc-count-3 absolute inset-0">3/3</span>
              <span className="invisible">0/3</span>
            </span>
          }
        />
        <Goal pillar="Craft" goal="Ship something" count="2/2" width="100%" met />
        <Goal pillar="People" goal="Reach out" count="1/3" width="33.33%" last />
      </div>
    </div>
  )
}

function Goal({
  pillar,
  goal,
  count,
  width,
  met,
  animated,
  last,
}: {
  pillar: string
  goal: string
  count: React.ReactNode
  width?: string
  met?: boolean
  animated?: boolean
  last?: boolean
}) {
  return (
    <div
      className={cn('border-b py-[0.7em]', last && 'border-b-0 pb-0')}
      style={{ borderColor: 'var(--border-hairline)' }}
    >
      <div className="flex items-baseline justify-between gap-[0.8em]">
        <span className="text-[0.88em] font-semibold text-slate-900">
          {pillar}
        </span>
        <span className="label-mono text-[0.6em] tabular-nums text-slate-500">
          {count}
        </span>
      </div>
      <p className="mt-[0.15em] text-[0.75em] text-slate-600">{goal}</p>
      <div className="mt-[0.55em] h-[0.46em] overflow-hidden rounded-pill border border-slate-200 bg-white">
        <div
          className={cn(
            'h-full rounded-pill',
            animated ? 'sc-bar' : met ? 'bg-priority-low' : 'bg-blue-500',
          )}
          style={animated ? undefined : { width }}
        />
      </div>
    </div>
  )
}

/** The two tasks doing the work, overlapping the panel they feed. */
function TaskStrip() {
  return (
    <div
      className="sc-float-b relative z-20 -mt-[2.2em] ml-[2.6em] mr-[1em] rounded-[0.9em] border border-white/80 px-[1.1em] py-[0.85em]"
      style={{
        background: '#ffffff',
        boxShadow: '0 10px 28px rgba(30,69,96,0.18)',
      }}
    >
      <p className="label-mono mb-[0.45em] text-[0.56em] text-blue-800">Health</p>
      <Task label="Morning run" variant="a" />
      <Task label="Gym — upper body" variant="b" />
    </div>
  )
}

function Task({ label, variant }: { label: string; variant: 'a' | 'b' }) {
  return (
    <div className="flex items-center gap-[0.7em] py-[0.2em]">
      <span
        className={cn(
          'grid size-[1em] shrink-0 place-items-center rounded-full border',
          variant === 'a' ? 'sc-check-a' : 'sc-check-b',
        )}
      >
        <svg
          viewBox="0 0 12 12"
          className={cn('size-[0.6em]', variant === 'a' ? 'sc-tick-a' : 'sc-tick-b')}
        >
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.8"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="relative">
        <span
          className={cn(
            'text-[0.82em]',
            variant === 'a' ? 'sc-fade-a' : 'sc-fade-b',
          )}
        >
          {label}
        </span>
        {/* Drawn left to right, so completing reads as an action. */}
        <span
          className={cn(
            'absolute left-0 top-1/2 h-px w-full bg-current opacity-60',
            variant === 'a' ? 'sc-strike-a' : 'sc-strike-b',
          )}
        />
      </span>
    </div>
  )
}
