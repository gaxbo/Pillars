import { cn } from '@/lib/cn'
import { ARCHETYPES } from '../catalog'
import {
  Counter,
  PrimaryButton,
  StepBody,
  StepFooter,
  StepHeading,
} from '../OnboardingUI'
import { MAX_ARCHETYPES, useOnboardingStore } from '../useOnboardingStore'

export function ArchetypeStep() {
  const archetypes = useOnboardingStore((s) => s.archetypes)
  const toggle = useOnboardingStore((s) => s.toggleArchetype)
  const next = useOnboardingStore((s) => s.next)

  const atLimit = archetypes.length >= MAX_ARCHETYPES

  return (
    <StepBody>
      <StepHeading title="Who are you trying to be right now?">
        Pick 1-3 you see fit. Don&apos;t worry, you can change these later.
      </StepHeading>

      <div className="grid gap-4 sm:grid-cols-2">
        {ARCHETYPES.map((archetype) => {
          const selected = archetypes.includes(archetype.id)
          // Greying out unpicked cards at the limit explains the cap without
          // needing an error message.
          const muted = !selected && atLimit

          return (
            <button
              key={archetype.id}
              type="button"
              onClick={() => toggle(archetype.id)}
              aria-pressed={selected}
              disabled={muted}
              className={cn(
                'rounded-pillar border p-5 text-left transition-all duration-200',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
                selected
                  ? 'border-blue-400 shadow-[var(--shadow-raised)]'
                  : 'border-white/70',
                muted && 'cursor-not-allowed opacity-45',
                !selected && !muted && 'hover:border-blue-500 hover:shadow-[var(--shadow-raised)]',
              )}
              style={{
                background: selected
                  ? 'var(--gradient-surface)'
                  : 'var(--surface-column)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[19px] font-bold tracking-tight text-slate-900">
                  {archetype.name}
                </h2>
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-1 grid size-5 shrink-0 place-items-center rounded-full border transition-colors',
                    selected
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-slate-300',
                  )}
                >
                  {selected && (
                    <svg viewBox="0 0 12 12" className="size-3">
                      <path
                        d="M2.5 6.2 4.8 8.5 9.5 3.8"
                        fill="none"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
                {archetype.blurb}
              </p>
            </button>
          )
        })}
      </div>

      <StepFooter>
        <PrimaryButton onClick={next} disabled={archetypes.length === 0}>
          Continue
        </PrimaryButton>
        <Counter>
          {archetypes.length} of {MAX_ARCHETYPES} picked
        </Counter>
      </StepFooter>
    </StepBody>
  )
}
