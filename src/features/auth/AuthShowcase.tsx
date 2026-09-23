import { WeekVignette } from '@/components/WeekVignette'

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
        background: 'var(--gradient-showcase)',
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
        <WeekVignette className="animate-rise delay-2 mt-11 text-[15px] xl:text-[16.5px] 2xl:text-[22px]" />
      </div>
    </div>
  )
}
