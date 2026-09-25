import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { WeekVignette } from '@/components/WeekVignette'
import { Resilient } from '../Resilient'
import { mix, span } from '../scroll'
import { WaitlistForm } from '../WaitlistForm'

export const HERO_EMAIL_ID = 'join-email'

/**
 * The promise, the ask, then the product itself. Centered because this is a
 * launch announcement: the message and the product are the design.
 */
export function Hero() {
  return (
    <section id="top" className="overflow-hidden pb-24 md:pb-36">
      <div className="mx-auto max-w-7xl px-4 pt-14 text-center sm:px-6 md:pt-20 lg:px-8 lg:pt-24">
        <h1 className="animate-rise mx-auto max-w-[13ch] text-balance text-[46px] font-bold leading-[0.98] tracking-[-0.04em] text-slate-900 sm:text-[66px] lg:text-[88px]">
          A week you meant to have.
        </h1>
        <p className="animate-rise delay-1 mx-auto mt-6 max-w-[36ch] text-[18px] leading-relaxed text-slate-700 sm:text-[20px] lg:text-[22px]">
          Pick the few things that matter. Give each one a goal. Then watch the
          week actually add up.
        </p>
        <WaitlistForm
          source="hero"
          inputId={HERO_EMAIL_ID}
          className="animate-rise delay-2 mx-auto mt-10 text-left"
        />
      </div>

      <Resilient fallback={<Stage still />}>
        <Stage />
      </Resilient>
    </section>
  )
}

/**
 * The real week board, lying back, straightening to face you as you scroll
 * toward it: the product arriving, the way a device does on a launch page.
 * The live "This week" vignette floats in front and rises faster, so the two
 * read as layers in depth. A phone gets the phone app instead of the board.
 */
function Stage({ still = false }: { still?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion() || still
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start 0.18'],
  })

  // Functions, not ranges: see ../scroll.ts.
  const rotateX = useTransform(scrollYProgress, (v) => mix(24, 0, span(v, 0, 1)))
  const scale = useTransform(scrollYProgress, (v) => mix(0.88, 1, span(v, 0, 1)))
  const y = useTransform(scrollYProgress, (v) => mix(48, 0, span(v, 0, 1)))
  const floatY = useTransform(scrollYProgress, (v) => mix(150, -24, span(v, 0, 1)))

  return (
    <div
      ref={ref}
      className="animate-rise delay-2 relative mx-auto mt-16 max-w-6xl px-4 sm:px-6 md:mt-20 lg:px-8"
      style={{ perspective: 1600 }}
    >
      {/* Light pooling under the screen, tinted with the brand blue. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-16 top-1/3"
        style={{
          background:
            'radial-gradient(50% 55% at 50% 60%, rgba(84, 167, 222, 0.26), transparent 72%)',
        }}
      />

      <motion.div
        className="relative will-change-transform"
        style={reduce ? undefined : { rotateX, scale, y, transformOrigin: '50% 100%' }}
      >
        <picture>
          <source
            media="(max-width: 47.99rem)"
            srcSet="/shots/phone-full.webp"
            width={390}
            height={844}
          />
          <img
            src="/shots/board-full.webp"
            width={1440}
            height={900}
            alt="The Pillars week board: seven days side by side, each listing Fitness, Hobbies, Friends, Savings and Habits, with the week's tasks under their pillars."
            fetchPriority="high"
            className="mx-auto block h-auto w-full max-w-[19rem] rounded-[2.25rem] border border-white/80 md:max-w-none md:rounded-modal"
            style={{ boxShadow: '0 2px 6px rgba(30, 69, 96, 0.08), 0 40px 80px -20px rgba(30, 69, 96, 0.35)' }}
          />
        </picture>
      </motion.div>

      <motion.div
        aria-hidden="true"
        className="absolute -bottom-14 right-0 w-[15rem] sm:right-4 sm:w-[21rem] md:-bottom-20 md:-right-2 md:w-[26rem] lg:-right-6 lg:w-[30rem]"
        style={reduce ? undefined : { y: floatY }}
      >
        <WeekVignette className="text-[10px] sm:text-[13px] md:text-[14px] lg:text-[16px]" />
      </motion.div>
    </div>
  )
}
