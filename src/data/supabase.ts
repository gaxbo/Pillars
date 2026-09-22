import { requireSupabase } from '@/lib/supabase'
import type {
  CreateGoalInput,
  CreateTaskInput,
  MoveTaskInput,
  PillarsRepository,
} from './repository'
import type { Goal, Pillar, Profile, Task, WeekReport } from './types'

/**
 * Rows come back snake_case; the app speaks camelCase. Mapping happens here so
 * the column naming never leaks into components.
 */
type PillarRow = {
  id: string
  name: string
  sort_order: number
  archived_at: string | null
}

type GoalRow = {
  id: string
  pillar_id: string
  title: string
  description: string
  target: number
  unit: string
  week_start: string
}

type TaskRow = {
  id: string
  pillar_id: string
  goal_id: string | null
  title: string
  notes: string | null
  scheduled_date: string
  priority: Task['priority']
  status: Task['status']
  completed_at: string | null
  sort_order: number
}

const toPillar = (r: PillarRow): Pillar => ({
  id: r.id,
  name: r.name,
  order: r.sort_order,
  archivedAt: r.archived_at,
})

const toGoal = (r: GoalRow): Goal => ({
  id: r.id,
  pillarId: r.pillar_id,
  title: r.title,
  description: r.description,
  target: r.target,
  unit: r.unit,
  weekStart: r.week_start,
})

const toTask = (r: TaskRow): Task => ({
  id: r.id,
  pillarId: r.pillar_id,
  goalId: r.goal_id,
  title: r.title,
  notes: r.notes,
  scheduledDate: r.scheduled_date,
  priority: r.priority,
  status: r.status,
  completedAt: r.completed_at,
  order: r.sort_order,
})

/**
 * Supabase returns errors rather than throwing; make them loud. The client is
 * untyped here, so the caller names the row shape and this does the cast once.
 */
function unwrap<T>(res: { data: unknown; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  if (res.data === null || res.data === undefined) {
    throw new Error('No data returned.')
  }
  return res.data as T
}

async function currentUserId(): Promise<string> {
  const { data, error } = await requireSupabase().auth.getUser()
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Not signed in.')
  return data.user.id
}

type ProfileRow = {
  archetypes: string[]
  planning_weekday: number
  planning_time: string
  eod_reminder_time: string
  timezone: string
  onboarded_at: string | null
}

const toProfile = (r: ProfileRow): Profile => ({
  archetypes: r.archetypes,
  planningWeekday: r.planning_weekday,
  // Postgres returns "18:00:00"; the app only cares about HH:MM.
  planningTime: r.planning_time.slice(0, 5),
  eodReminderTime: r.eod_reminder_time.slice(0, 5),
  timezone: r.timezone,
  onboardedAt: r.onboarded_at,
})

type ReviewRow = {
  week_start: string
  tasks_done: number
  tasks_open: number
  goals_completed: number
  goals_total: number
}

const toReview = (r: ReviewRow): WeekReport => ({
  weekStart: r.week_start,
  tasksDone: r.tasks_done,
  tasksOpen: r.tasks_open,
  goalsCompleted: r.goals_completed,
  goalsTotal: r.goals_total,
})

const REVIEW_COLS =
  'week_start, tasks_done, tasks_open, goals_completed, goals_total'

const PROFILE_COLS =
  'archetypes, planning_weekday, planning_time, eod_reminder_time, timezone, onboarded_at'

const PILLAR_COLS = 'id, name, sort_order, archived_at'
const GOAL_COLS = 'id, pillar_id, title, description, target, unit, week_start'
const TASK_COLS =
  'id, pillar_id, goal_id, title, notes, scheduled_date, priority, status, completed_at, sort_order'

export const supabaseRepository: PillarsRepository = {
  async listPillars() {
    const rows = unwrap<PillarRow[]>(
      await requireSupabase()
        .from('pillars')
        .select(PILLAR_COLS)
        .is('archived_at', null)
        .order('sort_order'),
    )
    return rows.map(toPillar)
  },

  async listGoals(weekStart) {
    const rows = unwrap<GoalRow[]>(
      await requireSupabase()
        .from('goals')
        .select(GOAL_COLS)
        .eq('week_start', weekStart),
    )
    return rows.map(toGoal)
  },

  async listTasks(from, to) {
    const rows = unwrap<TaskRow[]>(
      await requireSupabase()
        .from('tasks')
        .select(TASK_COLS)
        .gte('scheduled_date', from)
        .lte('scheduled_date', to)
        .order('sort_order'),
    )
    return rows.map(toTask)
  },

  async createTask(input: CreateTaskInput) {
    const client = requireSupabase()
    const userId = await currentUserId()

    // Append to the end of its (day, pillar) cell.
    const { count } = await client
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('scheduled_date', input.scheduledDate)
      .eq('pillar_id', input.pillarId)

    const row = unwrap<TaskRow>(
      await client
        .from('tasks')
        .insert({
          user_id: userId,
          pillar_id: input.pillarId,
          goal_id: input.goalId ?? null,
          title: input.title,
          notes: input.notes ?? null,
          scheduled_date: input.scheduledDate,
          priority: input.priority,
          sort_order: count ?? 0,
        })
        .select(TASK_COLS)
        .single(),
    )
    return toTask(row)
  },

  async updateTask(id, patch) {
    const row = unwrap<TaskRow>(
      await requireSupabase()
        .from('tasks')
        .update({
          ...(patch.title !== undefined && { title: patch.title }),
          ...(patch.notes !== undefined && { notes: patch.notes }),
          ...(patch.pillarId !== undefined && { pillar_id: patch.pillarId }),
          ...(patch.goalId !== undefined && { goal_id: patch.goalId }),
          ...(patch.scheduledDate !== undefined && {
            scheduled_date: patch.scheduledDate,
          }),
          ...(patch.priority !== undefined && { priority: patch.priority }),
          ...(patch.status !== undefined && { status: patch.status }),
          // The schema requires completed_at and status to agree.
          ...(patch.status !== undefined && {
            completed_at:
              patch.status === 'done'
                ? (patch.completedAt ?? new Date().toISOString())
                : null,
          }),
          ...(patch.order !== undefined && { sort_order: patch.order }),
        })
        .eq('id', id)
        .select(TASK_COLS)
        .single(),
    )
    return toTask(row)
  },

  async deleteTask(id) {
    const { error } = await requireSupabase().from('tasks').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async moveTask(id, input: MoveTaskInput) {
    const row = unwrap<TaskRow>(
      await requireSupabase()
        .from('tasks')
        .update({
          scheduled_date: input.scheduledDate,
          pillar_id: input.pillarId,
          sort_order: input.order,
        })
        .eq('id', id)
        .select(TASK_COLS)
        .single(),
    )
    return toTask(row)
  },

  async createPillar(name) {
    const client = requireSupabase()
    const userId = await currentUserId()

    const { count } = await client
      .from('pillars')
      .select('id', { count: 'exact', head: true })
      .is('archived_at', null)

    const row = unwrap<PillarRow>(
      await client
        .from('pillars')
        .insert({ user_id: userId, name, sort_order: count ?? 0 })
        .select(PILLAR_COLS)
        .single(),
    )
    return toPillar(row)
  },

  async renamePillar(id, name) {
    const row = unwrap<PillarRow>(
      await requireSupabase()
        .from('pillars')
        .update({ name })
        .eq('id', id)
        .select(PILLAR_COLS)
        .single(),
    )
    return toPillar(row)
  },

  async createGoal(input: CreateGoalInput) {
    const userId = await currentUserId()
    const row = unwrap<GoalRow>(
      await requireSupabase()
        .from('goals')
        .insert({
          user_id: userId,
          pillar_id: input.pillarId,
          title: input.title,
          description: input.description ?? '',
          target: input.target,
          unit: input.unit ?? '',
          week_start: input.weekStart,
        })
        .select(GOAL_COLS)
        .single(),
    )
    return toGoal(row)
  },

  async getWeekReview(weekStart) {
    const { data, error } = await requireSupabase()
      .from('week_reviews')
      .select(REVIEW_COLS)
      .eq('week_start', weekStart)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toReview(data as ReviewRow) : null
  },

  async saveWeekReview(report) {
    const userId = await currentUserId()
    const { error } = await requireSupabase()
      .from('week_reviews')
      .upsert(
        {
          user_id: userId,
          week_start: report.weekStart,
          tasks_done: report.tasksDone,
          tasks_open: report.tasksOpen,
          goals_completed: report.goalsCompleted,
          goals_total: report.goalsTotal,
        },
        { onConflict: 'user_id,week_start' },
      )
    if (error) throw new Error(error.message)
  },

  async getProfile() {
    const userId = await currentUserId()
    const { data, error } = await requireSupabase()
      .from('profiles')
      .select(PROFILE_COLS)
      .eq('id', userId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toProfile(data as ProfileRow) : null
  },

  async updateProfile(patch) {
    const userId = await currentUserId()
    const row = unwrap<ProfileRow>(
      await requireSupabase()
        .from('profiles')
        .update({
          ...(patch.archetypes !== undefined && { archetypes: patch.archetypes }),
          ...(patch.planningWeekday !== undefined && {
            planning_weekday: patch.planningWeekday,
          }),
          ...(patch.planningTime !== undefined && {
            planning_time: patch.planningTime,
          }),
          ...(patch.eodReminderTime !== undefined && {
            eod_reminder_time: patch.eodReminderTime,
          }),
          ...(patch.timezone !== undefined && { timezone: patch.timezone }),
          ...(patch.onboardedAt !== undefined && {
            onboarded_at: patch.onboardedAt,
          }),
        })
        .eq('id', userId)
        .select(PROFILE_COLS)
        .single(),
    )
    return toProfile(row)
  },

  async archivePillar(id) {
    const { error } = await requireSupabase()
      .from('pillars')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
