import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { repository } from '@/data'
import { MAX_LENGTH } from '@/data/limits'
import type { Goal, Pillar, Profile } from '@/data/types'
import { useAuthStore } from '@/features/auth/useAuthStore'
import { GoalEditor, type EditablePillar } from '@/features/goals/GoalEditor'
import { PrimaryButton } from '@/features/onboarding/OnboardingUI'
import { cn } from '@/lib/cn'
import { startOfWeek, toIso } from '@/lib/date'

const uid = () => Math.random().toString(36).slice(2, 10)

/** The advice onboarding gives, repeated here as a nudge, never a rule. */
const COMFORTABLE_MAX = 5

/**
 * The frame every settings page shares: a way back to the board, the page's
 * title, and its content. The account menu is the index, as in the design
 * ("Main View - account op"): each of its rows opens one of these.
 */
export function SettingsShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  useEffect(() => {
    document.title = `${title}: Pillars`
    return () => {
      document.title = 'Pillars'
    }
  }, [title])

  return (
    <div className="min-h-full">
      <a href="#settings" className="skip-link">
        Skip to {title.toLowerCase()}
      </a>
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 pt-8 sm:px-10">
        <Link
          to="/"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-pill py-1.5 pl-2 pr-3.5 text-[14px] font-medium text-blue-800',
            'transition-colors hover:bg-blue-100 hover:text-blue-900',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
          )}
        >
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
            <path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to your week
        </Link>
      </header>

      <main id="settings" tabIndex={-1} className="mx-auto w-full max-w-3xl px-6 pb-20 pt-6 outline-none sm:px-10">
        <h1 className="animate-rise text-[32px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[38px]">
          {title}
        </h1>
        {children}
      </main>
    </div>
  )
}

export function AccountPage() {
  return (
    <SettingsShell title="Account">
      <AccountSection />
    </SettingsShell>
  )
}

export function NotificationsPage() {
  return (
    <SettingsShell title="Notifications">
      <ScheduleSection />
    </SettingsShell>
  )
}

/**
 * Not in the design's menu, which predates editing pillars after setup. Its
 * own page, so a pillar renamed in the first section shows in the goals
 * below at once.
 */
export function PillarsGoalsPage() {
  const [pillars, setPillars] = useState<Pillar[] | null>(null)

  useEffect(() => {
    void repository.listPillars().then(setPillars)
  }, [])

  return (
    <SettingsShell title="Pillars & goals">
      <PillarsSection pillars={pillars} setPillars={setPillars} />
      <GoalsSection pillars={pillars} />
    </SettingsShell>
  )
}

/** A titled section with a hairline above it. */
function Section({
  title,
  lead,
  children,
}: {
  title: string
  lead?: string
  children: React.ReactNode
}) {
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className="mt-12 border-t pt-8"
      style={{ borderColor: 'var(--border-hairline-strong)' }}
    >
      <h2 id={id} className="text-[22px] font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      {lead && <p className="mt-1.5 max-w-[56ch] text-[15px] text-slate-700">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

/** "Saved" or an error, read out when it changes. */
function SaveNote({ state }: { state: SaveState }) {
  return (
    <p role="status" className="min-h-5 text-[13.5px]">
      {state.kind === 'saved' && <span className="text-success-text">Saved.</span>}
      {state.kind === 'error' && <span className="text-error-text">{state.message}</span>}
    </p>
  )
}

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string }

function errorMessage(err: unknown) {
  return err instanceof Error && err.message
    ? `Couldn't save: ${err.message}`
    : "Couldn't save. Check your connection and try again."
}

// --- pillars ------------------------------------------------------------------

export function PillarsSection({
  pillars,
  setPillars,
}: {
  pillars: Pillar[] | null
  setPillars: React.Dispatch<React.SetStateAction<Pillar[] | null>>
}) {
  const [draft, setDraft] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)
  const [state, setState] = useState<SaveState>({ kind: 'idle' })
  const newId = useId()

  async function run(op: () => Promise<void>) {
    setState({ kind: 'saving' })
    try {
      await op()
      setState({ kind: 'saved' })
    } catch (err) {
      setState({ kind: 'error', message: errorMessage(err) })
    }
  }

  function rename(pillar: Pillar, name: string) {
    const next = name.trim()
    if (!next || next === pillar.name) return
    void run(async () => {
      const saved = await repository.renamePillar(pillar.id, next)
      setPillars((list) => list?.map((p) => (p.id === saved.id ? saved : p)) ?? null)
    })
  }

  function remove(pillar: Pillar) {
    setConfirming(null)
    void run(async () => {
      await repository.archivePillar(pillar.id)
      setPillars((list) => list?.filter((p) => p.id !== pillar.id) ?? null)
    })
  }

  function add() {
    const name = draft.trim()
    if (!name) return
    void run(async () => {
      const created = await repository.createPillar(name)
      setPillars((list) => [...(list ?? []), created])
      setDraft('')
    })
  }

  return (
    <Section
      title="Pillars"
      lead="The areas of life under every day on your board. Rename them as they change."
    >
      {pillars === null ? (
        <p role="status" className="text-[14px] text-slate-600">Loading…</p>
      ) : (
        <ul>
          {pillars.map((pillar) => (
            <li
              key={pillar.id}
              className="flex flex-wrap items-center gap-3 border-b py-2"
              style={{ borderColor: 'var(--border-hairline)' }}
            >
              <input
                defaultValue={pillar.name}
                maxLength={MAX_LENGTH.pillarName}
                aria-label={`Rename ${pillar.name}`}
                onBlur={(e) => rename(pillar, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') {
                    e.currentTarget.value = pillar.name
                    e.currentTarget.blur()
                  }
                }}
                className={cn(
                  '-mx-2 min-w-0 flex-1 rounded-md bg-transparent px-2 py-1.5 text-[17px] font-semibold text-slate-900',
                  'outline-none hover:bg-white/70',
                  'focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600/40',
                )}
              />
              {confirming === pillar.id ? (
                <span className="flex items-center gap-2 text-[13.5px] text-slate-700">
                  Remove it and its tasks from your board?
                  <button
                    type="button"
                    onClick={() => remove(pillar)}
                    className="rounded-pill border border-error-text/40 px-3 py-1 font-semibold text-error-text transition-colors hover:border-error-text hover:bg-error-text/10"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="rounded-pill px-3 py-1 text-slate-700 transition-colors hover:bg-blue-100"
                  >
                    Keep
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(pillar.id)}
                  aria-label={`Remove ${pillar.name}`}
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-full text-slate-600',
                    'transition-colors duration-150 hover:bg-error-text/10 hover:text-error-text',
                    'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700',
                  )}
                >
                  <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden="true">
                    <path d="M4 4l6 6M10 4l-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-5 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <div className="flex min-w-[14rem] flex-1 flex-col gap-1.5">
          <label htmlFor={newId} className="text-[13px] font-medium text-slate-800">
            Add a pillar
          </label>
          <input
            id={newId}
            value={draft}
            maxLength={MAX_LENGTH.pillarName}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Name it"
            className={cn(
              'rounded-pill border border-slate-500 bg-white px-5 py-2.5 text-[16px] text-slate-900 md:text-[15px]',
              'placeholder:text-slate-500 outline-none hover:border-blue-400',
              'focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30',
            )}
          />
        </div>
        <button
          type="submit"
          disabled={!draft.trim()}
          className="btn-quiet rounded-pill px-5 py-2.5 text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {pillars && pillars.length > COMFORTABLE_MAX && (
        <p className="mt-3 text-[13.5px] text-slate-700">
          That&rsquo;s {pillars.length}. Five or fewer tends to hold up better.
        </p>
      )}
      <div className="mt-3">
        <SaveNote state={state} />
      </div>
    </Section>
  )
}

// --- goals --------------------------------------------------------------------

export function GoalsSection({ pillars }: { pillars: Pillar[] | null }) {
  const weekStart = toIso(startOfWeek(new Date()))
  const [original, setOriginal] = useState<Goal[]>([])
  const [draft, setDraft] = useState<EditablePillar[] | null>(null)
  const [state, setState] = useState<SaveState>({ kind: 'idle' })

  async function load() {
    const [pillars, goals] = await Promise.all([
      repository.listPillars(),
      repository.listGoals(weekStart),
    ])
    setOriginal(goals)
    setDraft(
      pillars.map((p) => ({
        id: p.id,
        name: p.name,
        goals: goals
          .filter((g) => g.pillarId === p.id)
          .map((g) => ({ id: g.id, title: g.title, target: g.target })),
      })),
    )
  }

  useEffect(() => {
    void load()
    // Once; `load` reads only this week's date.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The pillars as they stand now, each carrying its drafted goals.
  const shown: EditablePillar[] | null =
    draft && pillars
      ? pillars.map((p) => ({
          id: p.id,
          name: p.name,
          goals: draft.find((d) => d.id === p.id)?.goals ?? [],
        }))
      : null

  function edit(fn: (list: EditablePillar[]) => EditablePillar[]) {
    // From `shown`, so a pillar added above can take goals straight away.
    if (shown) setDraft(fn(shown))
    if (state.kind !== 'idle') setState({ kind: 'idle' })
  }

  /** Works out what changed against what was loaded, and sends only that. */
  async function save() {
    if (!shown) return
    setState({ kind: 'saving' })
    try {
      const byId = new Map(original.map((g) => [g.id, g]))
      const kept = new Set<string>()
      for (const pillar of shown) {
        for (const goal of pillar.goals) {
          const title = goal.title.trim()
          const before = byId.get(goal.id)
          if (before) {
            // A goal emptied of words is a goal removed.
            if (!title) continue
            kept.add(goal.id)
            if (before.title !== title || before.target !== goal.target) {
              await repository.updateGoal(goal.id, { title, target: goal.target })
            }
          } else if (title) {
            await repository.createGoal({
              pillarId: pillar.id,
              title,
              target: goal.target,
              weekStart,
            })
          }
        }
      }
      // Only goals under pillars still here: one under a pillar just
      // removed goes with the pillar, not with this save.
      const here = new Set(shown.map((p) => p.id))
      for (const goal of original) {
        if (here.has(goal.pillarId) && !kept.has(goal.id)) {
          await repository.deleteGoal(goal.id)
        }
      }
      await load()
      setState({ kind: 'saved' })
    } catch (err) {
      setState({ kind: 'error', message: errorMessage(err) })
    }
  }

  return (
    <Section
      title="This week’s goals"
      lead="Change a goal mid-week if the week changed. Tasks linked to a removed goal stay on your board."
    >
      {shown === null ? (
        <p role="status" className="text-[14px] text-slate-600">Loading…</p>
      ) : (
        <>
          <GoalEditor
            pillars={shown}
            onAdd={(pillarId) =>
              edit((list) =>
                list.map((p) =>
                  p.id === pillarId
                    ? { ...p, goals: [...p.goals, { id: uid(), title: '', target: 1 }] }
                    : p,
                ),
              )
            }
            onUpdate={(pillarId, goalId, patch) =>
              edit((list) =>
                list.map((p) =>
                  p.id === pillarId
                    ? { ...p, goals: p.goals.map((g) => (g.id === goalId ? { ...g, ...patch } : g)) }
                    : p,
                ),
              )
            }
            onRemove={(pillarId, goalId) =>
              edit((list) =>
                list.map((p) =>
                  p.id === pillarId ? { ...p, goals: p.goals.filter((g) => g.id !== goalId) } : p,
                ),
              )
            }
            emptyHint="No goal for this pillar this week."
          />
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <PrimaryButton onClick={() => void save()} disabled={state.kind === 'saving'}>
              {state.kind === 'saving' ? 'Saving…' : 'Save goals'}
            </PrimaryButton>
            <SaveNote state={state} />
          </div>
        </>
      )}
    </Section>
  )
}

// --- schedule -----------------------------------------------------------------

/** Monday first on screen; values are JS weekdays (0 = Sunday). */
const WEEKDAYS: [number, string][] = [
  [1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'],
  [5, 'Friday'], [6, 'Saturday'], [0, 'Sunday'],
]

export function ScheduleSection() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [state, setState] = useState<SaveState>({ kind: 'idle' })
  const dayId = useId()
  const timeId = useId()
  const eodId = useId()

  useEffect(() => {
    void repository.getProfile().then(setProfile)
  }, [])

  function change(patch: Partial<Profile>) {
    setProfile((p) => (p ? { ...p, ...patch } : p))
    if (state.kind !== 'idle') setState({ kind: 'idle' })
  }

  async function save() {
    if (!profile) return
    setState({ kind: 'saving' })
    try {
      await repository.updateProfile({
        planningWeekday: profile.planningWeekday,
        planningTime: profile.planningTime,
        eodReminderTime: profile.eodReminderTime,
      })
      setState({ kind: 'saved' })
    } catch (err) {
      setState({ kind: 'error', message: errorMessage(err) })
    }
  }

  const field = cn(
    'rounded-pill border border-slate-500 bg-white px-4 py-2.5 text-[16px] text-slate-900 md:text-[15px]',
    'outline-none hover:border-blue-400',
    'focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30',
  )
  const label = 'text-[13px] font-medium text-slate-800'

  return (
    <Section
      title="Reminders"
      lead="When Pillars asks you to plan the week, and when the evening check-in asks about what's still open."
    >
      {profile === null ? (
        <p role="status" className="text-[14px] text-slate-600">Loading…</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <fieldset className="flex flex-wrap gap-4">
            <legend className="label-mono mb-3 text-[12px] text-slate-600">Weekly planning</legend>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={dayId} className={label}>Day</label>
              <select
                id={dayId}
                value={profile.planningWeekday}
                onChange={(e) => change({ planningWeekday: Number(e.target.value) })}
                className={field}
              >
                {WEEKDAYS.map(([value, name]) => (
                  <option key={value} value={value}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={timeId} className={label}>Time</label>
              <input
                id={timeId}
                type="time"
                step={900}
                value={profile.planningTime}
                onChange={(e) => change({ planningTime: e.target.value })}
                className={field}
              />
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="label-mono mb-3 text-[12px] text-slate-600">Evening check-in</legend>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={eodId} className={label}>Ask about open tasks from</label>
              <input
                id={eodId}
                type="time"
                step={900}
                value={profile.eodReminderTime}
                onChange={(e) => change({ eodReminderTime: e.target.value })}
                className={cn(field, 'w-fit')}
              />
            </div>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center gap-5">
            <PrimaryButton type="submit" disabled={state.kind === 'saving'}>
              {state.kind === 'saving' ? 'Saving…' : 'Save schedule'}
            </PrimaryButton>
            <SaveNote state={state} />
          </div>
        </form>
      )}
    </Section>
  )
}

// --- account ------------------------------------------------------------------

export function AccountSection() {
  const offline = useAuthStore((s) => s.offline)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

  const name = String(user?.user_metadata?.full_name ?? '').trim()

  return (
    <Section title="Your account">
      {offline || !user ? (
        <p className="text-[15px] text-slate-700">
          You&rsquo;re looking at sample data. Nothing here is tied to an account.
        </p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            {name && <p className="text-[16px] font-semibold text-slate-900">{name}</p>}
            <p className="text-[14px] text-slate-700">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="btn-quiet rounded-pill px-5 py-2 text-[14px] font-semibold"
          >
            Log out
          </button>
        </div>
      )}
    </Section>
  )
}
