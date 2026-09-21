import type { Goal, IsoDate, Pillar, Task } from './types'

export interface CreateTaskInput {
  pillarId: string
  goalId?: string | null
  title: string
  notes?: string | null
  scheduledDate: IsoDate
  priority: Task['priority']
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
  renamePillar(id: string, name: string): Promise<Pillar>
  archivePillar(id: string): Promise<void>
}
