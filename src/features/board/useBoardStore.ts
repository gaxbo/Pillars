import { create } from 'zustand'
import { repository } from '@/data'
import type { CreateTaskInput } from '@/data/repository'
import type { Goal, GoalStats, IsoDate, Pillar, Profile, Task } from '@/data/types'
import { addDays, startOfWeek, toIso, weekDays } from '@/lib/date'

/** Chosen in src/data/index.ts: Supabase when configured, mock otherwise. */
const repo = repository

/** A cell is one (day, pillar) intersection. This is the drop-target id. */
export const cellId = (date: IsoDate, pillarId: string) => `${date}:${pillarId}`

export function parseCellId(id: string): { date: IsoDate; pillarId: string } {
  const at = id.indexOf(':')
  return { date: id.slice(0, at), pillarId: id.slice(at + 1) }
}

/** A whole day as a drop target — the phone's day strip. */
export const dayDropId = (date: IsoDate) => `day:${date}`

export function parseDayDropId(id: string): IsoDate | null {
  return id.startsWith('day:') ? id.slice('day:'.length) : null
}

/**
 * Where saving stands. The board updates first and saves after, so a failed
 * save would otherwise be invisible: the screen says done, the server
 * doesn't. `retrying` is shown quietly; `failed` offers a button.
 */
export type SaveStatus = 'idle' | 'retrying' | 'failed'

/** How long a deleted task can be brought back. */
export const UNDO_MS = 5000

interface BoardState {
  /** The selected day. A phone shows only this day; wider screens show its week. */
  anchor: Date
  pillars: Pillar[]
  goals: Goal[]
  tasks: Task[]
  /** The week `tasks` covers, so an undo knows whether its task belongs on screen. */
  range: { from: IsoDate; to: IsoDate } | null
  profile: Profile | null
  loading: boolean

  /** The goals slide-over. Collapsed is the default board state. */
  panelOpen: boolean

  saveStatus: SaveStatus
  /** A deleted task, still recoverable until UNDO_MS has passed. */
  pendingDelete: Task | null

  load: () => Promise<void>
  shiftWeek: (delta: number) => void
  goToToday: () => void
  selectDay: (date: Date) => void
  setPanelOpen: (open: boolean) => void

  toggleTask: (id: string) => void
  addTask: (input: CreateTaskInput) => Promise<void>
  /** Works on tasks outside the loaded week too: the evening check-in reaches back. */
  editTask: (id: string, patch: Partial<Omit<Task, 'id'>>) => void
  /** `task` is for tasks outside the loaded week, which the store can't look up. */
  removeTask: (id: string, task?: Task) => void
  undoDelete: () => void
  /** Reposition a task into a (day, pillar) cell at `index`. */
  placeTask: (id: string, date: IsoDate, pillarId: string, index: number) => void
  retrySaves: () => void
}

// --- saving -----------------------------------------------------------------

/** Writes that failed, oldest first, replayed in order so later edits win. */
const failed: (() => Promise<unknown>)[] = []
let attempt = 0
let retryTimer: ReturnType<typeof setTimeout> | undefined
const RETRY_AFTER_MS = [2000, 5000, 10000]

let deleteTimer: ReturnType<typeof setTimeout> | undefined

export const useBoardStore = create<BoardState>((set, get) => {
  /**
   * Runs a write. While anything is waiting to retry, new writes queue
   * behind it rather than racing ahead: a move saved before the create it
   * depends on would fail too.
   */
  function persist(op: () => Promise<unknown>) {
    if (failed.length > 0) {
      failed.push(op)
      return
    }
    op().catch(() => {
      failed.push(op)
      scheduleRetry()
    })
  }

  function scheduleRetry() {
    clearTimeout(retryTimer)
    if (attempt >= RETRY_AFTER_MS.length) {
      set({ saveStatus: 'failed' })
      return
    }
    set({ saveStatus: 'retrying' })
    retryTimer = setTimeout(() => void flush(), RETRY_AFTER_MS[attempt])
    attempt += 1
  }

  async function flush() {
    while (failed.length > 0) {
      try {
        await failed[0]()
        failed.shift()
      } catch {
        scheduleRetry()
        return
      }
    }
    attempt = 0
    set({ saveStatus: 'idle' })
  }

  /** Sends a waiting delete now: the undo window closed, or another delete replaced it. */
  function commitDelete() {
    clearTimeout(deleteTimer)
    const task = get().pendingDelete
    if (!task) return
    set({ pendingDelete: null })
    persist(() => repo.deleteTask(task.id))
  }

  // Leaving the page ends the undo window; the delete must still happen.
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', commitDelete)
  }

  return {
    anchor: new Date(),
    pillars: [],
    goals: [],
    tasks: [],
    range: null,
    profile: null,
    loading: true,
    panelOpen: false,
    saveStatus: 'idle',
    pendingDelete: null,

    setPanelOpen(open) {
      set({ panelOpen: open })
    },

    async load() {
      const days = weekDays(get().anchor)
      const from = toIso(days[0])
      const to = toIso(days[6])

      set({ loading: true })
      const [pillars, goals, tasks, profile] = await Promise.all([
        repo.listPillars(),
        repo.listGoals(from),
        repo.listTasks(from, to),
        repo.getProfile().catch(() => null),
      ])
      // A task deleted a moment ago is still on the server until its undo
      // window closes; don't let a reload bring it back.
      const hidden = get().pendingDelete?.id
      set({
        pillars,
        goals,
        tasks: hidden ? tasks.filter((t) => t.id !== hidden) : tasks,
        range: { from, to },
        profile,
        loading: false,
      })
    },

    shiftWeek(delta) {
      // Keeps the weekday, so a phone showing Tuesday lands on next Tuesday.
      set({ anchor: addDays(get().anchor, delta * 7) })
      void get().load()
    },

    goToToday() {
      set({ anchor: new Date() })
      void get().load()
    },

    selectDay(date) {
      const sameWeek =
        toIso(startOfWeek(date)) === toIso(startOfWeek(get().anchor))
      set({ anchor: date })
      if (!sameWeek) void get().load()
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
      persist(() => repo.updateTask(id, { status: nextStatus, completedAt }))
    },

    async addTask(input) {
      // Not optimistic: the task needs its real id before it can be edited
      // or moved. A failed create joins the retry queue and appears once saved.
      persist(async () => {
        const task = await repo.createTask(input)
        set({ tasks: [...get().tasks, task] })
      })
    },

    editTask(id, patch) {
      set({
        tasks: get().tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      })
      persist(() => repo.updateTask(id, patch))
    },

    removeTask(id, fallback) {
      // One undo at a time: a second delete makes the first one final.
      commitDelete()
      const task = get().tasks.find((x) => x.id === id) ?? fallback
      if (!task) {
        persist(() => repo.deleteTask(id))
        return
      }
      set({
        tasks: get().tasks.filter((x) => x.id !== id),
        pendingDelete: task,
      })
      deleteTimer = setTimeout(commitDelete, UNDO_MS)
    },

    undoDelete() {
      clearTimeout(deleteTimer)
      const task = get().pendingDelete
      if (!task) return
      const { range } = get()
      const onScreen =
        range !== null && task.scheduledDate >= range.from && task.scheduledDate <= range.to
      set({
        pendingDelete: null,
        tasks: onScreen ? [...get().tasks, task] : get().tasks,
      })
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

      const order = reordered.get(id)?.order ?? 0
      persist(() => repo.moveTask(id, { scheduledDate: date, pillarId, order }))
    },

    retrySaves() {
      clearTimeout(retryTimer)
      attempt = 0
      set({ saveStatus: 'retrying' })
      void flush()
    },
  }
})

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

/** "Sunday, 6:00 PM", from the profile's planning day and "HH:MM" time. */
export function planningLabel(profile: Profile | null): { day: string; time: string } {
  const weekday = profile?.planningWeekday ?? 0
  return { day: DAY_NAMES[weekday], time: formatTime(profile?.planningTime ?? '18:00') }
}

/** "18:30" to "6:30 PM". */
export function formatTime(value: string): string {
  const [h, m] = value.split(':').map(Number)
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

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
 * "# planned, # done" from the goals panel. Both numbers are derived from
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
