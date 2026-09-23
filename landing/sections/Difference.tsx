import { Reveal } from '../Reveal'

const ROWS: [list: string, pillars: string][] = [
  ['Holds everything you ever thought of', 'Holds the few areas you chose'],
  ['Every task weighs the same', 'Every task serves a pillar'],
  ['Done means an empty list', 'Done means the goals you set, met'],
  ['Leftovers pile up out of sight', 'Leftovers get a decision every evening'],
  ['You plan when you remember to', 'Planning has a set time each week'],
]

/**
 * Side by side, so the difference reads in one pass down the page. Rows are
 * separated by space, not rules: five short pairs don't need a table.
 */
export function Difference() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 md:pb-32 lg:px-8">
      <Reveal>
        <h2 className="text-balance text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-slate-900 sm:text-[44px]">
          Why it isn&rsquo;t another to-do list.
        </h2>
      </Reveal>

      <div className="mt-12 grid max-w-4xl grid-cols-2 gap-x-6 sm:gap-x-12">
        <p className="border-b pb-3 text-[15px] font-medium text-slate-600" style={{ borderColor: 'var(--border-hairline-strong)' }}>
          A to-do list
        </p>
        <p className="border-b pb-3 text-[15px] font-semibold text-blue-700" style={{ borderColor: 'var(--color-blue-300)' }}>
          Pillars
        </p>
      </div>

      <ul className="grid max-w-4xl gap-y-7 pt-7 sm:gap-y-8 sm:pt-8">
        {ROWS.map(([list, pillars], i) => (
          <Reveal
            key={pillars}
            as="li"
            delay={i * 0.05}
            className="grid grid-cols-2 items-baseline gap-x-6 sm:gap-x-12"
          >
            <span className="text-[16px] leading-snug text-slate-600 sm:text-[19px]">{list}</span>
            <span className="text-[16px] font-medium leading-snug text-slate-900 sm:text-[19px]">
              {pillars}
            </span>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
