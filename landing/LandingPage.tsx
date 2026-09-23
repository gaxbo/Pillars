import { Archetypes } from './sections/Archetypes'
import { Difference } from './sections/Difference'
import { FinalCta } from './sections/FinalCta'
import { Hero } from './sections/Hero'
import { Method } from './sections/Method'
import { Nav } from './sections/Nav'
import { Pile } from './sections/Pile'
import { Resilient } from './Resilient'

/**
 * The pre-launch page: one ask (join the list), and the case for it.
 * Six sections, each a different layout: centered hero with the product on
 * a scroll-driven stage, a pinned pile that builds as you scroll, bento,
 * side-by-side comparison, tab picker, closing band.
 */
export function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Resilient fallback={<Pile still />}>
          <Pile />
        </Resilient>
        <Method />
        <Difference />
        <Archetypes />
        <FinalCta />
      </main>
      <footer className="mx-auto flex max-w-7xl items-center justify-between px-4 py-10 text-[14px] text-slate-600 sm:px-6 lg:px-8">
        <span className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">Pillars</span>
        <span>&copy; {new Date().getFullYear()} Pillars</span>
      </footer>
    </>
  )
}
