import { cn } from '@/lib/cn'
import { Reveal } from '../Reveal'

/**
 * How a week works, as a four-cell bento of real screenshots from the app
 * (captured by `npm run shots:landing`). Cell widths alternate 7/5 then 5/7 so
 * the grid has rhythm, and each cell sits on a different surface.
 */
export function Method() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 md:pb-32 lg:px-8">
      <Reveal>
        <h2 className="text-balance text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-slate-900 sm:text-[44px]">
          How a week works.
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-4 md:grid-cols-12 md:gap-5">
        <Cell
          className="md:col-span-7"
          surface="var(--gradient-surface)"
          title="Choose a few pillars"
          body="The areas of life you've decided to actually invest in. Five or fewer, so each one gets real attention."
        >
          {/* Runs off the right edge: the week keeps going. */}
          <Shot
            src="/shots/board.webp"
            width={988}
            height={500}
            alt="Four days of the Pillars board. Each day lists Day Job, Boundaries, Training, Household and Downtime, with tasks under the pillars that have work."
            // On a phone it runs further off the edge, so two days show at a
            // readable size instead of four too small to read.
            className="-mr-[90%] md:-mr-44"
          />
        </Cell>

        <Cell
          className="md:col-span-5"
          surface="var(--gradient-showcase)"
          title="Give each one a goal"
          body="Something you can count and finish in seven days. “Move three times,” not “get fit.” Progress is counted from real tasks, so it can’t drift."
        >
          <Shot
            src="/shots/goals.webp"
            width={416}
            height={492}
            alt="The This Week panel. Each pillar's goal has a bar showing how much is done and how much is planned."
            className="mx-auto w-full max-w-[22rem]"
          />
        </Cell>

        <Cell
          className="md:col-span-5"
          surface="var(--surface-column-hover)"
          bordered
          title="Plan tasks onto days"
          body="Every task lives under a pillar, on a day. An empty pillar isn't hidden. It's a gap you can see."
        >
          <Shot
            src="/shots/phone.webp"
            width={390}
            height={621}
            alt="Pillars on a phone: the week as a row of days across the top, and one day below, its pillars as sections of a single card."
            className="mx-auto w-full max-w-[19rem]"
            imageClassName="rounded-[1.75rem]"
          />
        </Cell>

        <Cell
          className="md:col-span-7"
          surface="var(--gradient-surface-soft)"
          bordered
          title="Close the loop"
          body="Each evening, whatever's still open gets a decision: done, tomorrow, or gone. Each week, at a time you chose, a report card and new goals."
        >
          <div className="w-full">
            <Shot
              src="/shots/review.webp"
              width={1104}
              height={304}
              alt="The weekly report card: five tasks done, three left open, one goal completed."
              className="-mr-[45%] md:-mr-36"
            />
            {/* The evening decision steps down from the weekly one it feeds,
                overlapping only its margin so all three numbers stay readable. */}
            <Shot
              src="/shots/triage.webp"
              width={480}
              height={222}
              alt="The end-of-day card for one open task, with Done, Tomorrow and Delete."
              className="relative -mt-4 ml-auto w-[84%] max-w-[25rem] pb-6 sm:-mt-6 sm:pb-9"
              imageClassName="rounded-[1.125rem] shadow-[var(--shadow-modal)]"
            />
          </div>
        </Cell>
      </div>
    </section>
  )
}

function Cell({
  className,
  surface,
  bordered,
  title,
  body,
  children,
}: {
  className?: string
  surface: string
  bordered?: boolean
  title: string
  body: string
  children: React.ReactNode
}) {
  return (
    <Reveal
      className={cn(
        'flex flex-col overflow-hidden rounded-modal px-6 pt-8 sm:px-9 sm:pt-10',
        bordered && 'border',
        className,
      )}
      style={{
        background: surface,
        borderColor: bordered ? 'var(--border-hairline)' : undefined,
      }}
    >
      <div className="max-w-[36ch]">
        <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-slate-900 sm:text-[24px]">
          {title}
        </h3>
        <p className="mt-2.5 text-[16px] leading-relaxed text-slate-800">{body}</p>
      </div>
      {/* Screenshots sit on the cell's bottom edge. A column, so a negative
          margin widens a stretched child and it can run off the side. */}
      <div className="mt-8 flex flex-1 flex-col justify-end">{children}</div>
    </Reveal>
  )
}

function Shot({
  src,
  width,
  height,
  alt,
  className,
  imageClassName,
}: {
  src: string
  width: number
  height: number
  alt: string
  /** Sizing and bleed, on the wrapper so negative margins can widen it. */
  className?: string
  imageClassName?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <img
        src={src}
        width={width}
        height={height}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          'block h-auto w-full rounded-t-column border border-b-0 border-white/80 shadow-[var(--shadow-lift)]',
          imageClassName,
        )}
      />
    </div>
  )
}
