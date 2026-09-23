import { WaitlistForm } from '../WaitlistForm'

/** The same ask as the hero, for whoever read to the end. */
export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div
        className="grid gap-8 rounded-modal px-6 py-14 sm:px-12 md:grid-cols-2 md:items-end md:py-20 lg:px-16"
        style={{ background: 'var(--gradient-showcase)' }}
      >
        <div>
          <h2 className="text-balance max-w-[14ch] text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-slate-900 sm:text-[44px]">
            Be there for the first week.
          </h2>
          <p className="mt-4 max-w-[34ch] text-[18px] leading-relaxed text-slate-900">
            Join the list and we&rsquo;ll let you know the day Pillars opens.
          </p>
        </div>
        <div
          className="rounded-modal border border-white/70 p-6 sm:p-8"
          style={{ background: 'var(--gradient-surface-soft)', boxShadow: 'var(--shadow-lift)' }}
        >
          <WaitlistForm source="footer" />
        </div>
      </div>
    </section>
  )
}
