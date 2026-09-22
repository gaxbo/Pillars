import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoalEditor } from '@/features/goals/GoalEditor'
import { PrimaryButton, QuietLink } from '@/features/onboarding/OnboardingUI'
import { cn } from '@/lib/cn'
import { dismissWeekly } from '@/features/reminders/reminders'
import { startOfWeek, toIso } from '@/lib/date'
import { useWeeklyStore, type GoalSummary } from './useWeeklyStore'

export function WeeklyReviewPage() {
  const stage = useWeeklyStore((s) => s.stage)
  const loading = useWeeklyStore((s) => s.loading)
  const load = useWeeklyStore((s) => s.load)

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="label-mono text-[11px] text-slate-400">
          Adding up your week…
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-full overflow-x-hidden">
      <div
        key={stage}
        className={stage === 'goals' ? 'animate-step-forward' : 'animate-step-back'}
      >
        {stage === 'report' ? <ReportStage /> : <GoalsStage />}
      </div>
    </div>
  )
}

function ReportStage() {
  const report = useWeeklyStore((s) => s.report)
  const summaries = useWeeklyStore((s) => s.summaries)
  const toGoals = useWeeklyStore((s) => s.toGoals)
  const navigate = useNavigate()

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-16 pt-12 sm:px-12">
      <h1 className="animate-rise text-[32px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[38px]">
        It&rsquo;s time to plan your next week.
      </h1>
      <p className="animate-rise delay-1 mt-3 text-[16px] text-slate-700">
        Here&rsquo;s the week you just had.
      </p>

      <div
        className="mt-8 grid grid-cols-1 overflow-hidden rounded-[1.25rem] border border-white/70 sm:grid-cols-3"
        style={{
          background: 'var(--gradient-surface-soft)',
          boxShadow: 'var(--shadow-raised)',
        }}
      >
        <Stat value={report?.tasksDone ?? 0} label="tasks done" />
        <Stat value={report?.tasksOpen ?? 0} label="tasks left open" divided />
        <Stat
          value={report?.goalsCompleted ?? 0}
          label="goals completed"
          divided
        />
      </div>

      <section className="mt-12">
        <h2 className="text-[24px] font-bold tracking-tight text-slate-900">
          Your goals summarized
        </h2>

        {summaries.length === 0 ? (
          <p
            className="mt-4 border-t pt-5 text-[14px] text-slate-500"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            No goals were set for last week. This is a good week to start.
          </p>
        ) : (
          <ul className="mt-4">
            {summaries.map((summary, i) => (
              <SummaryRow key={i} summary={summary} />
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-5">
        <PrimaryButton onClick={toGoals}>Set next week&rsquo;s goals</PrimaryButton>
        <QuietLink
          onClick={() => {
            // Without this the board would send them straight back here.
            dismissWeekly(toIso(startOfWeek(new Date())))
            navigate('/', { replace: true })
          }}
        >
          Not now
        </QuietLink>
      </div>
    </div>
  )
}

function Stat({
  value,
  label,
  divided,
}: {
  value: number
  label: string
  divided?: boolean
}) {
  return (
    <div
      className={cn('px-6 py-5', divided && 'sm:border-l')}
      style={divided ? { borderColor: 'var(--border-hairline)' } : undefined}
    >
      <p className="text-[34px] font-bold leading-none tabular-nums text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-[14px] text-slate-600">{label}</p>
    </div>
  )
}

function SummaryRow({ summary }: { summary: GoalSummary }) {
  const met = summary.completed >= summary.target
  return (
    <li
      className="flex items-start justify-between gap-4 border-b py-3.5 first:border-t"
      style={{ borderColor: 'var(--border-hairline)' }}
    >
      <div className="min-w-0">
        <p className="text-[16px] font-bold text-slate-900">
          {summary.pillarName}
        </p>
        <p className="text-[13.5px] text-slate-600">{summary.goalTitle}</p>
      </div>
      <p
        className={cn(
          'shrink-0 whitespace-nowrap pt-1 text-[13px] tabular-nums',
          met ? 'font-medium text-priority-low' : 'text-slate-500',
        )}
      >
        {summary.planned} planned, {summary.completed} completed
      </p>
    </li>
  )
}

function GoalsStage() {
  const draft = useWeeklyStore((s) => s.draft)
  const addGoal = useWeeklyStore((s) => s.addGoal)
  const updateGoal = useWeeklyStore((s) => s.updateGoal)
  const removeGoal = useWeeklyStore((s) => s.removeGoal)
  const toReport = useWeeklyStore((s) => s.toReport)
  const commit = useWeeklyStore((s) => s.commit)
  const saving = useWeeklyStore((s) => s.saving)
  const error = useWeeklyStore((s) => s.error)
  const navigate = useNavigate()

  async function handleContinue() {
    try {
      await commit()
      dismissWeekly(toIso(startOfWeek(new Date())))
      navigate('/', { replace: true })
    } catch {
      // The store holds the message; stay put so nothing is lost.
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-16 pt-12 sm:px-12">
      <h1 className="animate-rise text-[32px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[38px]">
        Set your goals
      </h1>
      <p className="animate-rise delay-1 mb-8 mt-3 text-[16px] text-slate-700">
        Keep, edit, remove, or add goals for your upcoming week.
      </p>

      <GoalEditor
        pillars={draft}
        onAdd={addGoal}
        onUpdate={updateGoal}
        onRemove={removeGoal}
        emptyHint="No goal for this pillar next week."
      />

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-pillar border border-priority-high/20 bg-priority-high/5 px-4 py-2.5 text-[13px] text-priority-high"
        >
          {error}
        </p>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-5">
        <PrimaryButton onClick={handleContinue} disabled={saving}>
          {saving ? 'Saving…' : 'Continue'}
        </PrimaryButton>
        <QuietLink onClick={toReport} disabled={saving}>
          Go back
        </QuietLink>
      </div>
    </div>
  )
}
