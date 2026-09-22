import { create } from 'zustand'
import { repository } from '@/data'
import type { Goal, IsoDate, Pillar, Task, WeekReport } from '@/data/types'
import { addDays, startOfWeek, toIso } from '@/lib/date'
import type { EditablePillar } from '@/features/goals/GoalEditor'

const uid = () => Math.random().toString(36).slice(2, 10)

/** One row of "Your goals summarized". */
export interface GoalSummary {
  pillarName: string
  goalTitle: string
  planned: number
  completed: number
  target: number
}

interface WeeklyState {
  stage: 'report' | 'goals'
  loading: boolean
  saving: boolean
  error: string

  /** Monday of the week being reviewed (the one just finished). */
  reviewWeek: IsoDate
  report: WeekReport | null
  summaries: GoalSummary[]
  /** Next week's goals, seeded from this week's so "keep" is the default. */
  draft: EditablePillar[]

  load: () => Promise<void>
  toGoals: () => void
  toReport: () => void

  addGoal: (pillarId: string) => void
  updateGoal: (pillarId: string, goalId: string, patch: Partial<{ title: string; target: number }>) => void
  removeGoal: (pillarId: string, goalId: string) => void

  commit: () => Promise<void>
}

function summarize(
  pillars: Pillar[],
  goals: Goal[],
  tasks: Task[],
): GoalSummary[] {
  return goals.map((goal) => {
    const linked = tasks.filter((t) => t.goalId === goal.id)
    return {
      pillarName: pillars.find((p) => p.id === goal.pillarId)?.name ?? 'Pillar',
      goalTitle: goal.title,
      planned: linked.length,
      completed: linked.filter((t) => t.status === 'done').length,
      target: goal.target,
    }
  })
}

export const useWeeklyStore = create<WeeklyState>((set, get) => ({
  stage: 'report',
  loading: true,
  saving: false,
  error: '',
  reviewWeek: toIso(addDays(startOfWeek(new Date()), -7)),
  report: null,
  summaries: [],
  draft: [],

  async load() {
    set({ loading: true, error: '' })

    // The week being reviewed is the one that just ended.
    const reviewWeek = toIso(addDays(startOfWeek(new Date()), -7))
    const from = reviewWeek
    const to = toIso(addDays(startOfWeek(new Date()), -1))

    try {
      const [pillars, goals, tasks] = await Promise.all([
        repository.listPillars(),
        repository.listGoals(reviewWeek),
        repository.listTasks(from, to),
      ])

      const tasksDone = tasks.filter((t) => t.status === 'done').length
      const summaries = summarize(pillars, goals, tasks)
      const goalsCompleted = summaries.filter(
        (s) => s.completed >= s.target,
      ).length

      const report: WeekReport = {
        weekStart: reviewWeek,
        tasksDone,
        tasksOpen: tasks.length - tasksDone,
        goalsCompleted,
        goalsTotal: goals.length,
      }

      // Seeded from last week so the default action is "keep".
      const draft: EditablePillar[] = pillars.map((pillar) => ({
        id: pillar.id,
        name: pillar.name,
        goals: goals
          .filter((g) => g.pillarId === pillar.id)
          .map((g) => ({ id: uid(), title: g.title, target: g.target })),
      }))

      set({ reviewWeek, report, summaries, draft, loading: false })
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Could not load your week.',
      })
    }
  },

  toGoals() {
    set({ stage: 'goals' })
  },

  toReport() {
    set({ stage: 'report' })
  },

  addGoal(pillarId) {
    set({
      draft: get().draft.map((p) =>
        p.id === pillarId
          ? { ...p, goals: [...p.goals, { id: uid(), title: '', target: 1 }] }
          : p,
      ),
    })
  },

  updateGoal(pillarId, goalId, patch) {
    set({
      draft: get().draft.map((p) =>
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
      draft: get().draft.map((p) =>
        p.id === pillarId
          ? { ...p, goals: p.goals.filter((g) => g.id !== goalId) }
          : p,
      ),
    })
  },

  /**
   * Writes next week's goals and records the review, which is also what marks
   * the week as done so the prompt stops appearing.
   */
  async commit() {
    const { draft, report } = get()
    set({ saving: true, error: '' })

    try {
      const nextWeek = toIso(startOfWeek(new Date()))

      for (const pillar of draft) {
        for (const goal of pillar.goals) {
          const title = goal.title.trim()
          if (!title) continue
          await repository.createGoal({
            pillarId: pillar.id,
            title,
            target: Math.max(1, goal.target),
            weekStart: nextWeek,
          })
        }
      }

      if (report) await repository.saveWeekReview(report)
    } catch (err) {
      set({
        saving: false,
        error: err instanceof Error ? err.message : 'Could not save your goals.',
      })
      throw err
    }

    set({ saving: false })
  },
}))
