import { MAX_LENGTH } from '@/data/limits'
import { cn } from '@/lib/cn'
import { InlineAction } from '@/features/onboarding/OnboardingUI'

export interface EditableGoal {
  id: string
  title: string
  target: number
}

export interface EditablePillar {
  id: string
  name: string
  goals: EditableGoal[]
}

interface GoalEditorProps {
  pillars: EditablePillar[]
  onAdd: (pillarId: string) => void
  onUpdate: (pillarId: string, goalId: string, patch: Partial<EditableGoal>) => void
  onRemove: (pillarId: string, goalId: string) => void
  emptyHint?: string
}

/**
 * Shared by onboarding's "Set your goals" and the weekly review's "Keep, edit,
 * remove, or add". They are the same editor doing the same job, so they are
 * the same component.
 */
export function GoalEditor({
  pillars,
  onAdd,
  onUpdate,
  onRemove,
  emptyHint = 'No goal yet — optional, but the week works better with one.',
}: GoalEditorProps) {
  return (
    <>
      {pillars.map((pillar) => (
        <section
          key={pillar.id}
          className="border-b py-6 first:pt-0"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          {/* Solid, with an edge: the translucent fill it had all but vanished
              where the page gradient is palest, at the top. */}
          <span className="inline-block rounded-md border border-blue-200 bg-white px-2.5 py-1 text-[14px] font-medium text-blue-900 shadow-[var(--shadow-rest)]">
            {pillar.name || 'Untitled pillar'}
          </span>

          {pillar.goals.length === 0 && (
            <p className="mt-3 text-[13px] text-slate-600">{emptyHint}</p>
          )}

          <ul className="mt-3 space-y-3">
            {pillar.goals.map((goal) => (
              <li key={goal.id} className="flex flex-wrap items-center gap-3">
                <input
                  value={goal.title}
                  maxLength={MAX_LENGTH.goalTitle}
                  onChange={(e) =>
                    onUpdate(pillar.id, goal.id, { title: e.target.value })
                  }
                  placeholder="Example goal written here"
                  aria-label={`Goal for ${pillar.name}`}
                  className={cn(
                    // 16px on a phone: iOS zooms the page into any smaller field.
                    'min-w-0 flex-1 rounded-pill border border-slate-500 bg-white px-5 py-3 text-[16px] md:text-[15px]',
                    'text-slate-900 placeholder:italic placeholder:text-slate-500',
                    'shadow-[var(--shadow-rest)] outline-none',
                    'focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30',
                  )}
                />

                <div
                  role="group"
                  aria-label={`Times this week: ${goal.title.trim() || `${pillar.name} goal`}`}
                  className="flex items-center gap-2"
                >
                  <Stepper
                    label="One fewer time"
                    onClick={() =>
                      onUpdate(pillar.id, goal.id, {
                        target: Math.max(1, goal.target - 1),
                      })
                    }
                    disabled={goal.target <= 1}
                  >
                    &minus;
                  </Stepper>

                  {/* Live, so pressing + or - reads back the new count. */}
                  <output
                    aria-live="polite"
                    className="label-mono w-10 text-center text-[12px] tabular-nums text-slate-700"
                  >
                    {goal.target}&times;
                    <span className="sr-only-text"> a week</span>
                  </output>

                  <Stepper
                    label="One more time"
                    onClick={() =>
                      onUpdate(pillar.id, goal.id, {
                        target: Math.min(99, goal.target + 1),
                      })
                    }
                  >
                    +
                  </Stepper>

                  <button
                    type="button"
                    onClick={() => onRemove(pillar.id, goal.id)}
                    aria-label={`Remove goal: ${goal.title.trim() || `${pillar.name} goal`}`}
                    className={cn(
                      'ml-2 grid size-7 place-items-center rounded-full text-slate-600',
                      'transition-colors duration-150 hover:bg-error-text/10 hover:text-error-text',
                      'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700',
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

          {/* One goal per pillar per week: the database holds it to that
              (goals_pillar_id_week_start_key), and the board links new tasks
              to the pillar's goal. Removing it brings the link back. */}
          {pillar.goals.length === 0 && (
            <div className="pt-3">
              <InlineAction onClick={() => onAdd(pillar.id)}>
                + Add a goal
              </InlineAction>
            </div>
          )}
        </section>
      ))}
    </>
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
        'text-[14px] leading-none text-slate-700 transition-colors duration-150',
        props.disabled
          ? 'cursor-not-allowed opacity-40'
          : 'hover:border-blue-500 hover:bg-blue-100 hover:text-blue-900',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700',
      )}
    >
      {children}
    </button>
  )
}
