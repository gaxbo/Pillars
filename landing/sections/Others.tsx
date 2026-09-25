import { cn } from '@/lib/cn'
import { Reveal } from '../Reveal'
import { SOURCES } from '../sources'

/**
 * The answer to the pile above it, said once: other apps start from the
 * tasks; Pillars starts from what the tasks are for. The picture is that
 * order, built top to bottom out of the app's own pieces, so "the other end"
 * is something you see rather than read. The research sits underneath as
 * two quiet links.
 */
export function Others() {
  return (
    <section
      aria-labelledby="others-title"
      className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32 lg:px-8"
    >
      <div className="grid items-center gap-12 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:gap-16">
        <Reveal>
          <p className="text-[20px] text-slate-600 sm:text-[24px]">
            Other apps start with your tasks.
          </p>
          <h2
            id="others-title"
            className="mt-2 text-balance text-[38px] font-bold leading-[1.05] tracking-[-0.03em] text-slate-900 sm:text-[54px]"
          >
            Pillars starts from the other end.
          </h2>
          <p className="mt-6 max-w-[44ch] text-[18px] leading-relaxed text-slate-700 sm:text-[20px]">
            First the few parts of your life that matter. Then a goal for
            each, and a set time to plan the week. The tasks come last, and
            every one of them is for something.
          </p>
          <p className="mt-6 text-[13.5px] text-slate-600">
            Why it works:{' '}
            <SourceLink href={SOURCES.plans.url}>a plan quiets an unfinished goal</SourceLink>,
            and{' '}
            <SourceLink href={SOURCES.intentions.url}>
              deciding when you&rsquo;ll act helps you follow through
            </SourceLink>
            .
          </p>
        </Reveal>

        <Stack />
      </div>
    </section>
  )
}

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-sm underline decoration-slate-400 underline-offset-2 hover:text-blue-800 hover:decoration-blue-800"
    >
      {children}
      <span className="sr-only-text"> (study, opens in a new tab)</span>
    </a>
  )
}

/**
 * Four tiers, each one arriving after the one above it: pillars, a goal, a
 * time to plan, and only then tasks. A rail down the left runs from "Start
 * here" to "Tasks last". A picture for screen readers, described in one
 * sentence; the paragraph beside it already says the same thing in words.
 */
function Stack() {
  return (
    <div
      role="img"
      aria-label="The order Pillars plans in, top to bottom: pillars first (Family, Budget, Me Time), then a goal for each, then a set time to plan the week, and tasks last."
      className="relative"
    >
      {/* The rail: solid blue where you start, fading to where tasks sit. */}
      <div
        aria-hidden="true"
        className="absolute bottom-8 left-[15px] top-8 w-0.5 rounded-full"
        style={{ background: 'linear-gradient(180deg, var(--color-blue-700), var(--color-blue-200))' }}
      />

      <ol aria-hidden="true" className="relative grid gap-4">
        <Tier n={1} label="Start here" strong delay={0}>
          <div className="flex flex-wrap gap-2">
            {['Family', 'Budget', 'Me Time'].map((name) => (
              <span
                key={name}
                className="label-mono rounded-pillar border border-white/70 px-3.5 py-2 text-[12px] text-blue-800 shadow-[var(--shadow-raised)]"
                style={{ background: 'var(--gradient-surface)' }}
              >
                {name}
              </span>
            ))}
          </div>
        </Tier>

        <Tier n={2} label="A goal for each" delay={0.12}>
          <div
            className="rounded-pillar border border-white/70 px-4 py-3 shadow-[var(--shadow-raised)]"
            style={{ background: 'var(--gradient-surface-soft)' }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[14px] font-semibold text-slate-900">Me Time</span>
              <span className="label-mono text-[12px] tabular-nums text-slate-700">2/3</span>
            </div>
            <p className="mt-0.5 text-[13px] text-slate-700">Three evenings to myself</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-pill border border-slate-200 bg-white">
              <div className="h-full w-2/3 rounded-pill bg-blue-600" />
            </div>
          </div>
        </Tier>

        <Tier n={3} label="A time to plan" delay={0.24}>
          <span
            className="inline-flex items-center gap-2 rounded-pill border border-blue-200 bg-white px-4 py-2 text-[14px] text-slate-800 shadow-[var(--shadow-rest)]"
          >
            <svg viewBox="0 0 16 16" className="size-4 text-blue-700">
              <rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M2 6.5h12M5.5 1.75v2.5M10.5 1.75v2.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span>
              <span className="font-semibold">Sunday</span>, 6:00 PM
            </span>
          </span>
        </Tier>

        <Tier n={4} label="Tasks last" delay={0.36}>
          <div className="grid gap-1.5">
            <TaskChip done>Bath and a book</TaskChip>
            <TaskChip>Pottery class</TaskChip>
          </div>
        </Tier>
      </ol>
    </div>
  )
}

function Tier({
  n,
  label,
  strong,
  delay,
  children,
}: {
  n: number
  label: string
  strong?: boolean
  delay: number
  children: React.ReactNode
}) {
  return (
    <Reveal as="li" delay={delay} className="flex gap-4">
      <span
        className={cn(
          'label-mono relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-[12px]',
          strong ? 'bg-blue-700 text-white' : 'border border-blue-300 bg-white text-blue-800',
        )}
      >
        {n}
      </span>
      <div className="min-w-0 flex-1 pb-1">
        <p
          className={cn(
            'label-mono mb-2 pt-2 text-[12px]',
            strong ? 'text-blue-800' : 'text-slate-600',
          )}
        >
          {label}
        </p>
        {children}
      </div>
    </Reveal>
  )
}

function TaskChip({ done, children }: { done?: boolean; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2.5 rounded-task bg-white/85 px-3 py-2 text-[14px] shadow-[var(--shadow-rest)]">
      <span
        className={cn(
          'grid size-4 shrink-0 place-items-center rounded-full',
          done ? 'bg-blue-600' : 'border-[1.5px] border-slate-400 bg-white',
        )}
      >
        {done && (
          <svg viewBox="0 0 12 12" className="size-2.5">
            <path d="M2.5 6.2 4.8 8.5 9.5 3.8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={done ? 'text-slate-600 line-through decoration-slate-500' : 'text-slate-800'}>
        {children}
      </span>
    </span>
  )
}
