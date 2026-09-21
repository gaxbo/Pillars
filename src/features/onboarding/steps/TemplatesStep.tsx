import { useMemo } from 'react'
import { cn } from '@/lib/cn'
import { matchLabel, matchTemplates } from '../match'
import {
  PrimaryButton,
  QuietLink,
  StepBody,
  StepFooter,
  StepHeading,
} from '../OnboardingUI'
import { useOnboardingStore } from '../useOnboardingStore'

export function TemplatesStep() {
  const dump = useOnboardingStore((s) => s.dump)
  const archetypes = useOnboardingStore((s) => s.archetypes)
  const templateId = useOnboardingStore((s) => s.templateId)
  const choose = useOnboardingStore((s) => s.chooseTemplate)
  const startFromNothing = useOnboardingStore((s) => s.startFromNothing)
  const next = useOnboardingStore((s) => s.next)
  const back = useOnboardingStore((s) => s.back)

  // Scored once per answer set, not per render.
  const matches = useMemo(
    () => matchTemplates(dump, archetypes).slice(0, 3),
    [dump, archetypes],
  )

  return (
    <StepBody>
      <StepHeading title="Select your Pillars.">
        Organized by best fit, or select your own.
      </StepHeading>

      <div className="grid gap-4 lg:grid-cols-3">
        {matches.map(({ template }, i) => {
          const selected = templateId === template.id
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => choose(template.id, template.pillars)}
              aria-pressed={selected}
              className={cn(
                'rounded-pillar border p-5 text-left transition-all duration-200',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                selected
                  ? 'border-blue-400 shadow-[var(--shadow-raised)]'
                  : 'border-white/70 hover:border-blue-200',
              )}
              style={{
                background: selected
                  ? 'var(--gradient-surface)'
                  : 'var(--surface-column)',
              }}
            >
              <p
                className={cn(
                  'label-mono text-[10px]',
                  i === 0 ? 'text-priority-medium' : 'text-slate-500',
                )}
              >
                {matchLabel(i)}
              </p>

              <h2 className="mt-1 text-[19px] font-bold tracking-tight text-slate-900">
                {template.name}
              </h2>
              <p className="mt-1 text-[13.5px] leading-snug text-slate-600">
                {template.blurb}
              </p>

              <ul className="mt-4">
                {template.pillars.map((pillar) => (
                  <li
                    key={pillar}
                    className="border-b py-2.5 text-[15px] font-semibold text-slate-800 last:border-b-0"
                    style={{ borderColor: 'var(--border-hairline)' }}
                  >
                    {pillar}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      <StepFooter>
        <PrimaryButton onClick={next} disabled={!templateId}>
          Continue
        </PrimaryButton>
        <QuietLink onClick={back}>Go back</QuietLink>
        <QuietLink
          onClick={() => {
            startFromNothing()
            next()
          }}
          className="ml-auto"
        >
          Start from nothing instead
        </QuietLink>
      </StepFooter>
    </StepBody>
  )
}
