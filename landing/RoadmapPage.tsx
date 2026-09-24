import { useEffect } from 'react'
import { cn } from '@/lib/cn'
import { Footer } from './Footer'
import { Nav } from './sections/Nav'
import { WaitlistForm } from './WaitlistForm'

const ROADMAP_EMAIL_ID = 'roadmap-email'

type Stage = 'now' | 'next' | 'later'

interface Item {
  title: string
  body: string
}

/**
 * What's built, what's being built, and what's being thought about. "In the
 * beta" is what the app does today; "Next" is from TODO.md; "Exploring" is
 * ideas, said plainly as ideas. Keep all three honest: people plan around a
 * roadmap.
 */
const STAGES: { id: Stage; title: string; blurb: string; items: Item[] }[] = [
  {
    id: 'now',
    title: 'In the beta now',
    blurb: 'Built, and in the hands of early access members.',
    items: [
      {
        title: 'The week board',
        body: 'Seven days side by side, each listing your pillars, with every task under the one it serves. Drag tasks between days and pillars.',
      },
      {
        title: 'Goals with progress',
        body: 'One goal per pillar per week, counted from real tasks. A bar shows what’s done and what’s planned.',
      },
      {
        title: 'The evening check-in',
        body: 'Whatever is still open at the end of the day gets a decision, one task at a time: done, tomorrow, or gone.',
      },
      {
        title: 'The weekly review',
        body: 'At the day and time you picked, a report card on the week you had, then goals for the next one.',
      },
      {
        title: 'Guided setup',
        body: 'A few questions about who you’re trying to be, then a starting set of pillars picked to fit.',
      },
      {
        title: 'Pillars on a phone',
        body: 'One day at a time, the week as a strip across the top, and press-and-hold to move a task to another day.',
      },
    ],
  },
  {
    id: 'next',
    title: 'Next',
    blurb: 'Being worked on now, before Pillars opens to the list.',
    items: [
      {
        title: 'Swipe between days',
        body: 'On a phone, a sideways swipe moves to the next or previous day, without getting in the way of dragging a task.',
      },
      {
        title: 'A tablet layout',
        body: 'The week laid out for a tablet held upright, instead of wrapping three, three and one.',
      },
      {
        title: 'Polish for iPhone',
        body: 'Testing on real iPhones, not only emulators, starting with press-and-hold and text selection.',
      },
      {
        title: 'Opening the doors',
        body: 'Pillars opens to everyone on the list. You’ll get one email the day it does.',
      },
    ],
  },
  {
    id: 'later',
    title: 'Exploring',
    blurb: 'Ideas we’re weighing. Not promises, and not in any order.',
    items: [
      {
        title: 'Repeating tasks',
        body: 'A run every Tuesday and Thursday, set once.',
      },
      {
        title: 'Your calendar alongside',
        body: 'See the week’s fixed events next to the tasks you planned around them.',
      },
      {
        title: 'Reminders on your phone',
        body: 'A nudge at your planning time, and at the end of the day, even when Pillars isn’t open.',
      },
    ],
  },
]

/**
 * A separate page, served from the same build. Three stages down the page,
 * each marked the same way the app marks progress: solid for done, pale for
 * planned, outlined for not yet.
 */
export function RoadmapPage() {
  useEffect(() => {
    document.title = 'Roadmap: Pillars'
  }, [])

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav page="roadmap" joinInputId={ROADMAP_EMAIL_ID} />
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 md:pt-20 lg:px-8">
          <h1 className="animate-rise max-w-[14ch] text-balance text-[44px] font-bold leading-[1] tracking-[-0.04em] text-slate-900 sm:text-[60px]">
            Where Pillars is going.
          </h1>
          <p className="animate-rise delay-1 mt-6 max-w-[48ch] text-[18px] leading-relaxed text-slate-700 sm:text-[20px]">
            What early access members have today, what&rsquo;s being built
            next, and what we&rsquo;re still thinking about.
          </p>
        </div>

        <ol className="mx-auto grid max-w-7xl gap-16 px-4 pb-24 sm:px-6 md:gap-20 lg:px-8">
          {STAGES.map((stage) => (
            <li key={stage.id}>
              <section aria-labelledby={`stage-${stage.id}`}>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <StageMark stage={stage.id} />
                  <h2
                    id={`stage-${stage.id}`}
                    className="text-[28px] font-bold tracking-[-0.03em] text-slate-900 sm:text-[34px]"
                  >
                    {stage.title}
                  </h2>
                  <p className="text-[16px] text-slate-700">{stage.blurb}</p>
                </div>

                <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {stage.items.map((item) => (
                    <li
                      key={item.title}
                      className={cn(
                        'rounded-modal p-6',
                        stage.id === 'later' ? 'border border-dashed' : 'border',
                      )}
                      style={{
                        background:
                          stage.id === 'now'
                            ? 'var(--gradient-surface)'
                            : stage.id === 'next'
                              ? 'var(--surface-column-hover)'
                              : 'transparent',
                        borderColor:
                          stage.id === 'later'
                            ? 'var(--color-slate-400)'
                            : 'var(--border-hairline)',
                        boxShadow: stage.id === 'now' ? 'var(--shadow-raised)' : undefined,
                      }}
                    >
                      <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-slate-900">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-[15.5px] leading-relaxed text-slate-700">
                        {item.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </li>
          ))}
        </ol>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="grid gap-8 rounded-modal px-6 py-14 sm:px-12 md:grid-cols-2 md:items-end md:py-16 lg:px-16"
            style={{ background: 'var(--gradient-showcase)' }}
          >
            <div>
              <h2 className="max-w-[16ch] text-balance text-[32px] font-bold leading-[1.05] tracking-[-0.03em] text-slate-900 sm:text-[40px]">
                Hear when these ship.
              </h2>
              <p className="mt-4 max-w-[34ch] text-[18px] leading-relaxed text-slate-900">
                Join the list for the day Pillars opens, and the occasional
                update on the way.
              </p>
            </div>
            <div
              className="rounded-modal border border-white/70 p-6 sm:p-8"
              style={{ background: 'var(--gradient-surface-soft)', boxShadow: 'var(--shadow-lift)' }}
            >
              <WaitlistForm source="roadmap" inputId={ROADMAP_EMAIL_ID} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

/** Solid, pale, or outlined: the goal bar's language for done, planned, not yet. */
function StageMark({ stage }: { stage: Stage }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block size-3.5 translate-y-[-2px] rounded-full',
        stage === 'now' && 'bg-blue-700',
        stage === 'next' && 'bg-blue-300',
        stage === 'later' && 'border-2 border-slate-500',
      )}
    />
  )
}
