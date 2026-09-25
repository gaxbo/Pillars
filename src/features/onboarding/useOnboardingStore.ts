import { create } from 'zustand'
import { repository } from '@/data'
import { startOfWeek, toIso } from '@/lib/date'

/** A goal being drafted, before pillars have real ids. */
export interface DraftGoal {
  id: string
  title: string
  target: number
}

/** A pillar being drafted, keyed locally until it is persisted. */
export interface DraftPillar {
  id: string
  name: string
  goals: DraftGoal[]
}

export const STEPS = [
  'archetype',
  'dump',
  'templates',
  'pillars',
  'goals',
  'time',
] as const

export type Step = (typeof STEPS)[number]

/**
 * Five segments for six screens: picking a template and editing the result are
 * the same act, so they share a segment rather than pretending to be separate
 * progress.
 */
export const STEP_SEGMENT: Record<Step, number> = {
  archetype: 0,
  dump: 1,
  templates: 2,
  pillars: 2,
  goals: 3,
  time: 4,
}

export const SEGMENT_COUNT = 5

export const STEP_LABEL: Record<Step, string> = {
  archetype: 'Focus',
  dump: 'Brain dump',
  templates: 'Select your pillars',
  pillars: 'Select your pillars',
  goals: 'Set your goals',
  time: 'Set your planning time',
}

const uid = () => Math.random().toString(36).slice(2, 10)

export type Direction = 'forward' | 'back'

interface OnboardingState {
  step: Step
  /** Which way the last move went, so the new step enters from that side. */
  direction: Direction
  archetypes: string[]
  dump: string[]
  templateId: string | null
  pillars: DraftPillar[]
  planningWeekday: number
  planningTime: string
  saving: boolean
  error: string

  goTo: (step: Step) => void
  next: () => void
  back: () => void

  toggleArchetype: (id: string) => void
  addDumpItem: (text: string) => void
  removeDumpItem: (index: number) => void

  chooseTemplate: (id: string, pillarNames: string[]) => void
  startFromNothing: () => void

  addPillar: (name: string) => void
  renamePillar: (id: string, name: string) => void
  removePillar: (id: string) => void

  addGoal: (pillarId: string) => void
  updateGoal: (pillarId: string, goalId: string, patch: Partial<DraftGoal>) => void
  removeGoal: (pillarId: string, goalId: string) => void

  setPlanningWeekday: (weekday: number) => void
  setPlanningTime: (time: string) => void

  finish: () => Promise<void>
  /** Back to a fresh start, once a finished setup has left the screen. */
  reset: () => void
}

export const MAX_ARCHETYPES = 3

/** A fresh start: the first screen, nothing answered. */
const FRESH = {
  step: 'archetype' as Step,
  direction: 'forward' as Direction,
  archetypes: [] as string[],
  dump: [] as string[],
  templateId: null as string | null,
  pillars: [] as DraftPillar[],
  planningWeekday: 0,
  planningTime: '18:00',
  saving: false,
  error: '',
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...FRESH,

  goTo(step) {
    const from = STEPS.indexOf(get().step)
    const to = STEPS.indexOf(step)
    set({ step, direction: to >= from ? 'forward' : 'back' })
  },

  next() {
    const i = STEPS.indexOf(get().step)
    if (i < STEPS.length - 1) set({ step: STEPS[i + 1], direction: 'forward' })
  },

  back() {
    const i = STEPS.indexOf(get().step)
    if (i > 0) set({ step: STEPS[i - 1], direction: 'back' })
  },

  toggleArchetype(id) {
    const current = get().archetypes
    if (current.includes(id)) {
      set({ archetypes: current.filter((x) => x !== id) })
    } else if (current.length < MAX_ARCHETYPES) {
      set({ archetypes: [...current, id] })
    }
  },

  addDumpItem(text) {
    const trimmed = text.trim()
    if (!trimmed) return
    set({ dump: [...get().dump, trimmed] })
  },

  removeDumpItem(index) {
    set({ dump: get().dump.filter((_, i) => i !== index) })
  },

  chooseTemplate(id, pillarNames) {
    set({
      templateId: id,
      pillars: pillarNames.map((name) => ({ id: uid(), name, goals: [] })),
    })
  },

  startFromNothing() {
    set({ templateId: null, pillars: [] })
  },

  addPillar(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    set({ pillars: [...get().pillars, { id: uid(), name: trimmed, goals: [] }] })
  },

  renamePillar(id, name) {
    set({
      pillars: get().pillars.map((p) => (p.id === id ? { ...p, name } : p)),
    })
  },

  removePillar(id) {
    set({ pillars: get().pillars.filter((p) => p.id !== id) })
  },

  addGoal(pillarId) {
    set({
      pillars: get().pillars.map((p) =>
        p.id === pillarId
          ? { ...p, goals: [...p.goals, { id: uid(), title: '', target: 1 }] }
          : p,
      ),
    })
  },

  updateGoal(pillarId, goalId, patch) {
    set({
      pillars: get().pillars.map((p) =>
        p.id === pillarId
          ? {
              ...p,
              goals: p.goals.map((g) =>
                g.id === goalId ? { ...g, ...patch } : g,
              ),
            }
          : p,
      ),
    })
  },

  removeGoal(pillarId, goalId) {
    set({
      pillars: get().pillars.map((p) =>
        p.id === pillarId
          ? { ...p, goals: p.goals.filter((g) => g.id !== goalId) }
          : p,
      ),
    })
  },

  setPlanningWeekday(weekday) {
    set({ planningWeekday: weekday })
  },

  setPlanningTime(time) {
    set({ planningTime: time })
  },

  /**
   * Persists pillars first so goals have real pillar ids to point at. Goals
   * are created sequentially per pillar because each needs its parent's id.
   */
  async finish() {
    const { pillars, archetypes, planningWeekday, planningTime } = get()
    set({ saving: true, error: '' })

    try {
      const weekStart = toIso(startOfWeek(new Date()))

      // Safe to run again after a failure partway through. Someone still in
      // onboarding has no real data, so anything already saved is from an
      // earlier attempt: a pillar of the same name is reused, not doubled,
      // its goal is updated rather than added twice, and leftovers that
      // aren't in the final list are archived.
      const existing = await repository.listPillars()
      const existingGoals = await repository.listGoals(weekStart)
      const byName = new Map(existing.map((p) => [p.name.trim().toLowerCase(), p]))
      const kept = new Set<string>()

      for (const draft of pillars) {
        const name = draft.name.trim()
        let pillar = byName.get(name.toLowerCase())
        if (!pillar) {
          pillar = await repository.createPillar(name)
          // So a second pillar of the same name in this list reuses it.
          byName.set(name.toLowerCase(), pillar)
        }
        kept.add(pillar.id)

        // One goal per pillar per week, as the database requires.
        const goal = draft.goals.find((g) => g.title.trim())
        if (!goal) continue
        const fields = { title: goal.title.trim(), target: Math.max(1, goal.target) }
        const saved = existingGoals.find((g) => g.pillarId === pillar.id)
        if (saved) await repository.updateGoal(saved.id, fields)
        else await repository.createGoal({ pillarId: pillar.id, ...fields, weekStart })
      }

      for (const leftover of existing) {
        if (!kept.has(leftover.id)) await repository.archivePillar(leftover.id)
      }

      await repository.updateProfile({
        archetypes,
        planningWeekday,
        planningTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        onboardedAt: new Date().toISOString(),
      })
    } catch (err) {
      set({
        saving: false,
        error: err instanceof Error ? err.message : 'Could not save your setup.',
      })
      throw err
    }

    set({ saving: false })
  },

  reset() {
    set(FRESH)
  },
}))
