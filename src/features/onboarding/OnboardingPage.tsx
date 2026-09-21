import { useEffect } from 'react'
import { StepProgress } from './OnboardingUI'
import { ArchetypeStep } from './steps/ArchetypeStep'
import { DumpStep } from './steps/DumpStep'
import { GoalsStep } from './steps/GoalsStep'
import { PillarsStep } from './steps/PillarsStep'
import { PlanTimeStep } from './steps/PlanTimeStep'
import { TemplatesStep } from './steps/TemplatesStep'
import {
  STEP_LABEL,
  STEP_SEGMENT,
  useOnboardingStore,
  type Step,
} from './useOnboardingStore'

const SCREENS: Record<Step, () => React.ReactElement> = {
  archetype: ArchetypeStep,
  dump: DumpStep,
  templates: TemplatesStep,
  pillars: PillarsStep,
  goals: GoalsStep,
  time: PlanTimeStep,
}

export function OnboardingPage() {
  const step = useOnboardingStore((s) => s.step)
  const direction = useOnboardingStore((s) => s.direction)
  const Screen = SCREENS[step]

  // Steps differ in height, so without this a long step followed by a short
  // one leaves you scrolled past the content you just arrived at.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  return (
    <div className="min-h-full overflow-x-hidden">
      <StepProgress label={STEP_LABEL[step]} segment={STEP_SEGMENT[step]} />

      {/*
        Keying on the step restarts the CSS animation on every move; without a
        changing key the browser would treat it as the same element and skip
        the transition entirely.
      */}
      <div
        key={step}
        className={
          direction === 'forward' ? 'animate-step-forward' : 'animate-step-back'
        }
      >
        <Screen />
      </div>
    </div>
  )
}
