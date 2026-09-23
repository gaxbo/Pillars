import { useRef, useState } from 'react'
import { ARCHETYPES, TEMPLATES } from '@/features/onboarding/catalog'
import { cn } from '@/lib/cn'
import { Reveal } from '../Reveal'

/**
 * The first question Pillars asks, as a picker. Six archetypes is too many for
 * a row of cards, and choosing one mirrors onboarding. The copy and each
 * archetype's starting pillars come straight from the app's catalog, so the
 * page can't promise a set the app doesn't offer.
 */
export function Archetypes() {
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  const archetype = ARCHETYPES[active]
  const template = TEMPLATES.find((t) => t.archetypes.includes(archetype.id))

  function select(index: number) {
    const next = (index + ARCHETYPES.length) % ARCHETYPES.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const keys: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowDown: active + 1,
      ArrowLeft: active - 1,
      ArrowUp: active - 1,
      Home: 0,
      End: ARCHETYPES.length - 1,
    }
    if (e.key in keys) {
      e.preventDefault()
      select(keys[e.key])
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 md:pb-32 lg:px-8">
      <Reveal>
        <h2 className="text-balance max-w-[18ch] text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-slate-900 sm:text-[44px]">
          Built around who you&rsquo;re trying to be.
        </h2>
        <p className="mt-5 max-w-[52ch] text-[18px] leading-relaxed text-slate-700">
          Pillars starts by asking. Your answer shapes the pillars you begin
          with, and you can change them anytime.
        </p>
      </Reveal>

      <Reveal className="mt-12 grid gap-6 md:grid-cols-[minmax(0,18rem)_1fr] md:gap-10">
        {/* A scroll-snap row on phones, a column beside the panel from md up. */}
        <div
          role="tablist"
          aria-label="Who you're trying to be"
          onKeyDown={onKeyDown}
          className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:mx-0 md:flex-col md:overflow-visible md:px-0"
        >
          {ARCHETYPES.map((a, i) => {
            const selected = i === active
            return (
              <button
                key={a.id}
                ref={(el) => {
                  tabs.current[i] = el
                }}
                type="button"
                role="tab"
                id={`archetype-tab-${a.id}`}
                aria-selected={selected}
                aria-controls="archetype-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                className={cn(
                  'shrink-0 snap-start whitespace-nowrap rounded-pill px-5 py-2.5 text-left text-[16px] transition-colors duration-150',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
                  'md:rounded-pillar md:py-3',
                  selected
                    ? 'font-semibold text-blue-800'
                    : 'text-slate-700 hover:bg-white/70 hover:text-slate-900',
                )}
                style={
                  selected
                    ? { background: 'var(--gradient-surface)', boxShadow: 'var(--shadow-raised)' }
                    : undefined
                }
              >
                {a.name}
              </button>
            )
          })}
        </div>

        <div
          id="archetype-panel"
          role="tabpanel"
          aria-labelledby={`archetype-tab-${archetype.id}`}
          className="rounded-modal border px-6 py-8 sm:px-10 sm:py-10"
          style={{
            background: 'var(--surface-column-hover)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          {/* Keyed so each choice fades in as its own state. */}
          <div key={archetype.id} className="animate-fade-in">
            <p className="max-w-[30ch] text-[24px] font-semibold leading-snug tracking-[-0.02em] text-slate-900 sm:text-[28px]">
              {archetype.blurb}
            </p>

            {template && (
              <div className="mt-10">
                <p className="text-[16px] leading-relaxed text-slate-700">
                  <span className="font-semibold text-slate-900">
                    You&rsquo;d start with {template.name}.
                  </span>{' '}
                  {template.blurb}
                </p>
                <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${template.name} pillars`}>
                  {template.pillars.map((pillar) => (
                    <li
                      key={pillar}
                      className="label-mono rounded-pillar border border-white/70 px-3.5 py-2 text-[12px] text-blue-800"
                      style={{ background: 'var(--gradient-surface)', boxShadow: 'var(--shadow-raised)' }}
                    >
                      {pillar}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  )
}
