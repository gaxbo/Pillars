export type Priority = 'high' | 'medium' | 'low'

export type TaskStatus = 'open' | 'done'

/** ISO date, no time component: "2026-09-21". The board is day-granular. */
export type IsoDate = string

export interface Pillar {
  id: string
  name: string
  /** Display order within every day column. */
  order: number
  archivedAt: string | null
}

export interface Goal {
  id: string
  pillarId: string
  title: string
  /** The "what the goal is about" line in the This Week panel. */
  description: string
  /** Goals are quantifiable by design — "3" of "runs". */
  target: number
  unit: string
  /** Monday of the week this goal is scoped to. */
  weekStart: IsoDate
}

/**
 * Derived from tasks, never stored. The design's "# planned, # done" is two
 * separate counts: how much work you committed to this week, and how much of
 * it you actually finished.
 */
export interface GoalStats {
  planned: number
  done: number
  target: number
}

export interface Task {
  id: string
  pillarId: string
  goalId: string | null
  title: string
  notes: string | null
  scheduledDate: IsoDate
  priority: Priority
  status: TaskStatus
  completedAt: string | null
  /** Display order within its (day, pillar) cell. */
  order: number
}

export interface WeekReport {
  weekStart: IsoDate
  tasksDone: number
  tasksOpen: number
  goalsCompleted: number
  goalsTotal: number
}

export interface Profile {
  /** Collected at sign-up. Mirrored from auth metadata by a trigger. */
  fullName: string
  archetypes: string[]
  /** JS convention: 0 = Sunday. The UI renders Monday-first. */
  planningWeekday: number
  /** "HH:MM", 24-hour. */
  planningTime: string
  eodReminderTime: string
  timezone: string
  onboardedAt: string | null
}
