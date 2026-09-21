import { create } from 'zustand'
import { mockRepository } from '@/data/mock'
import type { CreateTaskInput, PillarsRepository } from '@/data/repository'
import type { Goal, GoalStats, IsoDate, Pillar, Task } from '@/data/types'
import { addDays, startOfWeek, toIso, weekDays } from '@/lib/date'

/** Swapped for the Supabase implementation in Phase 4; nothing else changes. */
const repo: PillarsRepository = mockRepository

/** A cell is one (day, pillar) intersection. This is the drop-target id. */
export const cellId = (date: IsoDate, pillarId: string) => `${date}:${pillarId}`

export function parseCellId(id: string): { date: IsoDate; pillarId: string } {
  const at = id.indexOf(':')
  return { date: id.slice(0, at), pillarId: id.slice(at + 1) }
}

interface BoardState {
  anchor: Date
  pillars: Pillar[]
  goals: Goal[]
  tasks: Task[]
  loading: boolean

  /** The "This Week" slide-over. Collapsed is the default board state. */
  panelOpen: boolean
  /** Set in onboarding's "plan your time" step; from `profiles` in Phase 4. */
  planningTime: { day: string; time: string }

  load: () => Promise<void>
  shiftWeek: (delta: number) => void
  goToToday: () => void
  setPanelOpen: (open: boolean) => void

  toggleTask: (id: string) => void
  addTask: (input: CreateTaskInput) => Promise<void>
  editTask: (id: string, patch: Partial<Omit<Task, 'id'>>) => void
  removeTask: (id: string) => void
  /** Reposition a task into a (day, pillar) cell at `index`. */
  placeTask: (id: string, date: IsoDate, pillarId: string, index: number) => void
}

export const useBoardStore = create<BoardState>((set, get) => ({
  anchor: new Date(),
  pillars: [],
  goals: [],
  tasks: [],
  loading: true,
  panelOpen: false,
  planningTime: { day: 'Sunday', time: '6:00 PM' },

  setPanelOpen(open) {
    set({ panelOpen: open })
  },

  async load() {
    const days = weekDays(get().anchor)
    const from = toIso(days[0])
    const to = toIso(days[6])

    set({ loading: true })
    const [pillars, goals, tasks] = await Promise.all([
      repo.listPillars(),
      repo.listGoals(from),
      repo.listTasks(from, to),
    ])
    set({ pillars, goals, tasks, loading: false })
  },

  shiftWeek(delta) {
    set({ anchor: addDays(startOfWeek(get().anchor), delta * 7) })
    void get().load()
  },

  goToToday() {
    set({ anchor: new Date() })
    void get().load()
  },

  toggleTask(id) {
    const task = get().tasks.find((x) => x.id === id)
    if (!task) return

    const nextStatus = task.status === 'done' ? 'open' : 'done'
    const completedAt = nextStatus === 'done' ? new Date().toISOString() : null

    // Optimistic: the checkbox must not wait on the network.
    set({
      tasks: get().tasks.map((x) =>
        x.id === id ? { ...x, status: nextStatus, completedAt } : x,
      ),
    })
    void repo.updateTask(id, { status: nextStatus, completedAt })
  },

  async addTask(input) {
    const task = await repo.createTask(input)
    set({ tasks: [...get().tasks, task] })
  },

  editTask(id, patch) {
    set({
      tasks: get().tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    })
    void repo.updateTask(id, patch)
  },

  removeTask(id) {
    set({ tasks: get().tasks.filter((x) => x.id !== id) })
    void repo.deleteTask(id)
  },

  placeTask(id, date, pillarId, index) {
    const task = get().tasks.find((x) => x.id === id)
    if (!task) return

    // Everything except the moved task, so the source cell closes its gap.
    const rest = get().tasks.filter((x) => x.id !== id)

    const destination = rest
      .filter((x) => x.scheduledDate === date && x.pillarId === pillarId)
      .sort((a, b) => a.order - b.order)

    const moved: Task = { ...task, scheduledDate: date, pillarId }
    destination.splice(Math.max(0, Math.min(index, destination.length)), 0, moved)

    const reordered = new Map(
      destination.map((x, i) => [x.id, { ...x, order: i }]),
    )

    set({ tasks: rest.concat(moved).map((x) => reordered.get(x.id) ?? x) })

    void repo.moveTask(id, {
      scheduledDate: date,
      pillarId,
      order: reordered.get(id)?.order ?? 0,
    })
  },
}))

/** Tasks in one cell, in display order. */
export function selectCellTasks(
  tasks: Task[],
  date: IsoDate,
  pillarId: string,
): Task[] {
  return tasks
    .filter((x) => x.scheduledDate === date && x.pillarId === pillarId)
    .sort((a, b) => a.order - b.order)
}

/** The week currently on screen. */
export function selectWeek(anchor: Date): Date[] {
  return weekDays(anchor)
}

export function selectGoalForPillar(
  goals: Goal[],
  pillarId: string,
): Goal | undefined {
  return goals.find((g) => g.pillarId === pillarId)
}

/**
 * "# planned, # done" from the This Week panel. Both numbers are derived from
 * tasks rather than stored, so they can never drift out of sync with the
 * board — planning a task is what makes it planned.
 */
export function selectGoalStats(tasks: Task[], goal: Goal): GoalStats {
  const linked = tasks.filter((t) => t.goalId === goal.id)
  return {
    planned: linked.length,
    done: linked.filter((t) => t.status === 'done').length,
    target: goal.target,
  }
}
