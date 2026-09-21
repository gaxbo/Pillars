import { cn } from '@/lib/cn'
import {
  InlineAction,
  PrimaryButton,
  QuietLink,
  StepBody,
  StepFooter,
  StepHeading,
} from '../OnboardingUI'
import { useOnboardingStore } from '../useOnboardingStore'

export function GoalsStep() {
  const pillars = useOnboardingStore((s) => s.pillars)
  const addGoal = useOnboardingStore((s) => s.addGoal)
  const updateGoal = useOnboardingStore((s) => s.updateGoal)
  const removeGoal = useOnboardingStore((s) => s.removeGoal)
  const next = useOnboardingStore((s) => s.next)
  const back = useOnboardingStore((s) => s.back)

  // A goal with no words is not a goal. Blank rows are dropped on save, so
  // they must not gate the button either.
  const written = pillars.flatMap((p) =>
    p.goals.filter((g) => g.title.trim().length > 0),
  )

  return (
    <StepBody>
      <StepHeading title="Set your goals">
        Write down goals that are actionable, quantifiable, and within reach in
        a week.
      </StepHeading>

      {pillars.map((pillar) => (
        <section
          key={pillar.id}
          className="border-b py-6 first:pt-0"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          <span
            className="inline-block rounded-md px-2.5 py-1 text-[14px] font-medium text-slate-800"
            style={{ background: 'var(--surface-column-hover)' }}
          >
            {pillar.name || 'Untitled pillar'}
          </span>

          {pillar.goals.length === 0 && (
            <p className="mt-3 text-[13px] text-slate-400">
              No goal yet — optional, but the week works better with one.
            </p>
          )}

          <ul className="mt-3 space-y-3">
            {pillar.goals.map((goal) => (
              <li key={goal.id} className="flex flex-wrap items-center gap-3">
                <input
                  value={goal.title}
                  onChange={(e) =>
                    updateGoal(pillar.id, goal.id, { title: e.target.value })
                  }
                  placeholder="Example goal written here"
                  aria-label={`Goal for ${pillar.name}`}
                  className={cn(
                    'min-w-0 flex-1 rounded-pill border border-slate-200 bg-white px-5 py-3 text-[15px]',
                    'text-slate-900 placeholder:italic placeholder:text-slate-400',
                    'shadow-[var(--shadow-rest)] outline-none',
                    'focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30',
                  )}
                />

                <div className="flex items-center gap-2">
                  <Stepper
                    label="Fewer"
                    onClick={() =>
                      updateGoal(pillar.id, goal.id, {
                        target: Math.max(1, goal.target - 1),
                      })
                    }
                    disabled={goal.target <= 1}
                  >
                    &minus;
                  </Stepper>

                  <span className="label-mono w-10 text-center text-[12px] tabular-nums text-slate-700">
                    {goal.target}&times;
                  </span>

                  <Stepper
                    label="More"
                    onClick={() =>
                      updateGoal(pillar.id, goal.id, {
                        target: Math.min(99, goal.target + 1),
                      })
                    }
                  >
                    +
                  </Stepper>

                  <button
                    type="button"
                    onClick={() => removeGoal(pillar.id, goal.id)}
                    aria-label="Remove goal"
                    className={cn(
                      'ml-2 grid size-7 place-items-center rounded-full text-slate-400',
                      'transition-colors duration-150 hover:bg-white/70 hover:text-priority-high',
                      'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500',
                    )}
                  >
                    <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden="true">
                      <path
                        d="M4 4l6 6M10 4l-6 6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="pt-3">
            <InlineAction onClick={() => addGoal(pillar.id)}>
              + Add a goal
            </InlineAction>
          </div>
        </section>
      ))}

      <StepFooter>
        <PrimaryButton onClick={next} disabled={written.length === 0}>
          Continue
        </PrimaryButton>
        <QuietLink onClick={back}>Go back</QuietLink>
      </StepFooter>
    </StepBody>
  )
}

function Stepper({
  label,
  children,
  ...props
}: { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      {...props}
      className={cn(
        'grid size-7 place-items-center rounded-full border border-slate-200 bg-white/70',
        'text-[14px] leading-none text-slate-600 transition-colors duration-150',
        props.disabled
          ? 'cursor-not-allowed opacity-40'
          : 'hover:border-blue-300 hover:text-blue-700',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500',
      )}
    >
      {children}
    </button>
  )
}
