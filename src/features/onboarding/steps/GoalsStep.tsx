import { GoalEditor } from '@/features/goals/GoalEditor'
import {
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

      <GoalEditor
        pillars={pillars}
        onAdd={addGoal}
        onUpdate={updateGoal}
        onRemove={removeGoal}
      />

      <StepFooter>
        <PrimaryButton onClick={next} disabled={written.length === 0}>
          Continue
        </PrimaryButton>
        <QuietLink onClick={back}>Go back</QuietLink>
      </StepFooter>
    </StepBody>
  )
}
