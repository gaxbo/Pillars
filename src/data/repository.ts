import type { Goal, IsoDate, Pillar, Profile, Task, WeekReport } from './types'

export interface CreateTaskInput {
  pillarId: string
  goalId?: string | null
  title: string
  notes?: string | null
  scheduledDate: IsoDate
  priority: Task['priority']
}

export interface CreateGoalInput {
  pillarId: string
  title: string
  description?: string
  target: number
  unit?: string
  weekStart: IsoDate
}

export interface MoveTaskInput {
  scheduledDate: IsoDate
  pillarId: string
  order: number
}

/**
 * The seam between UI and storage. The board is built against this interface
 * with an in-memory implementation, so swapping in Supabase later touches no
 * components.
 */
export interface PillarsRepository {
  listPillars(): Promise<Pillar[]>
  listGoals(weekStart: IsoDate): Promise<Goal[]>
  /** Inclusive range. */
  listTasks(from: IsoDate, to: IsoDate): Promise<Task[]>

  createTask(input: CreateTaskInput): Promise<Task>
  updateTask(id: string, patch: Partial<Omit<Task, 'id'>>): Promise<Task>
  deleteTask(id: string): Promise<void>
  moveTask(id: string, input: MoveTaskInput): Promise<Task>

  createPillar(name: string): Promise<Pillar>
  createGoal(input: CreateGoalInput): Promise<Goal>

  /** Null until a week has been reviewed. */
  getWeekReview(weekStart: IsoDate): Promise<WeekReport | null>
  saveWeekReview(report: WeekReport): Promise<void>

  getProfile(): Promise<Profile | null>
  updateProfile(patch: Partial<Profile>): Promise<Profile>
  renamePillar(id: string, name: string): Promise<Pillar>
  archivePillar(id: string): Promise<void>
}
