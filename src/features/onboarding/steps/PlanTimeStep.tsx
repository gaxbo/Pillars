import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import {
  PrimaryButton,
  QuietLink,
  StepBody,
  StepFooter,
  StepHeading,
} from '../OnboardingUI'
import { useOnboardingStore } from '../useOnboardingStore'

/** Rendered Monday-first; values stay JS convention (0 = Sunday). */
const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = ['00', '15', '30', '45']

function parse(time: string) {
  const [h, m] = time.split(':').map(Number)
  const meridiem = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return { hour12, minute: String(m).padStart(2, '0'), meridiem }
}

function build(hour12: number, minute: string, meridiem: string) {
  const h = meridiem === 'PM' ? (hour12 % 12) + 12 : hour12 % 12
  return `${String(h).padStart(2, '0')}:${minute}`
}

export function PlanTimeStep() {
  const weekday = useOnboardingStore((s) => s.planningWeekday)
  const time = useOnboardingStore((s) => s.planningTime)
  const setWeekday = useOnboardingStore((s) => s.setPlanningWeekday)
  const setTime = useOnboardingStore((s) => s.setPlanningTime)
  const finish = useOnboardingStore((s) => s.finish)
  const saving = useOnboardingStore((s) => s.saving)
  const error = useOnboardingStore((s) => s.error)
  const back = useOnboardingStore((s) => s.back)
  const reset = useOnboardingStore((s) => s.reset)
  const navigate = useNavigate()

  const { hour12, minute, meridiem } = parse(time)

  async function handleFinish() {
    try {
      await finish()
      navigate('/', { replace: true })
      // The answers belong to this account. Anyone who signs up next in this
      // tab starts at the first screen, not at the end holding these. After
      // the navigation, so the first screen doesn't flash on the way out.
      reset()
    } catch {
      // The store holds the message; stay on the step so nothing is lost.
    }
  }

  return (
    <StepBody>
      <StepHeading title="Set a time to plan your week">
        No more last minute planning. It&rsquo;s time to plan with intention.
        <br />
        For the best results, set your time in an uninterrupted 1-2 hour window.
      </StepHeading>

      <section>
        <h2 id="plan-day" className="label-mono pb-3 text-[12px] text-slate-600">Day</h2>
        <div role="group" aria-labelledby="plan-day" className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <Pill
              key={day.value}
              selected={weekday === day.value}
              aria-label={DAY_NAMES[day.value]}
              onClick={() => setWeekday(day.value)}
            >
              {day.label}
            </Pill>
          ))}
        </div>
      </section>

      <section className="pt-8">
        <h2 id="plan-time" className="label-mono pb-3 text-[12px] text-slate-600">Time</h2>
        <div role="group" aria-labelledby="plan-time" className="flex flex-wrap gap-2">
          <Select
            label="Hour"
            value={String(hour12)}
            options={HOURS.map((h) => String(h))}
            onChange={(v) => setTime(build(Number(v), minute, meridiem))}
          />
          <Select
            label="Minute"
            value={minute}
            options={MINUTES}
            onChange={(v) => setTime(build(hour12, v, meridiem))}
          />
          <Select
            label="AM or PM"
            value={meridiem}
            options={['AM', 'PM']}
            onChange={(v) => setTime(build(hour12, minute, v))}
          />
        </div>
      </section>

      <p
        className="mt-8 border-t pt-6 text-[14px] text-slate-600"
        style={{ borderColor: 'var(--border-hairline)' }}
      >
        You plan on{' '}
        <span className="font-medium text-slate-900">{DAY_NAMES[weekday]}</span>{' '}
        at{' '}
        <span className="font-medium text-slate-900">
          {hour12}:{minute} {meridiem}
        </span>
        . Nothing else goes there.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-pillar border border-error-text/25 bg-error-text/5 px-4 py-2.5 text-[13px] text-error-text"
        >
          {error}
        </p>
      )}

      <StepFooter>
        <PrimaryButton onClick={handleFinish} disabled={saving}>
          {saving ? 'Setting up…' : 'Finish'}
        </PrimaryButton>
        <QuietLink onClick={back} disabled={saving}>
          Go back
        </QuietLink>
      </StepFooter>
    </StepBody>
  )
}

function Pill({
  selected,
  children,
  ...props
}: { selected: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...props}
      className={cn(
        'rounded-pill border px-5 py-2 text-[14px]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
        selected
          ? 'btn-primary border-transparent font-semibold'
          : 'border-blue-200 bg-blue-50 text-slate-700 transition-colors duration-150 hover:border-blue-500 hover:bg-blue-100 hover:text-blue-900',
      )}
    >
      {children}
    </button>
  )
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        // 16px on a phone: iOS zooms the page into any smaller field.
        'rounded-pill border border-slate-500 px-5 py-2 text-[16px] text-slate-800 md:text-[14px]',
        'outline-none transition-colors duration-150 hover:border-blue-600',
        'focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30',
      )}
      style={{ background: 'var(--color-blue-50)' }}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}
