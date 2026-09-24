import { Archetypes } from './sections/Archetypes'
import { Difference } from './sections/Difference'
import { FinalCta } from './sections/FinalCta'
import { HERO_EMAIL_ID, Hero } from './sections/Hero'
import { Method } from './sections/Method'
import { Nav } from './sections/Nav'
import { Others } from './sections/Others'
import { Pile } from './sections/Pile'
import { Footer } from './Footer'
import { Resilient } from './Resilient'

/**
 * The pre-launch page: one ask (join the list), and the case for it.
 * Seven sections, each a different layout: centered hero with the product on
 * a scroll-driven stage, a pinned pile that builds as you scroll, then its
 * answer (starting from the other end, as a stack built top down), bento, a
 * switch that sorts one week two ways, tab picker, closing band.
 */
export function LandingPage() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav page="home" joinInputId={HERO_EMAIL_ID} />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Resilient fallback={<Pile still />}>
          <Pile />
        </Resilient>
        <Others />
        <Method />
        <Difference />
        <Archetypes />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
