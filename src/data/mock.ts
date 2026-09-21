import { addDays, startOfWeek, toIso } from '@/lib/date'
import type {
  CreateGoalInput,
  CreateTaskInput,
  MoveTaskInput,
  PillarsRepository,
} from './repository'
import type { Goal, IsoDate, Pillar, Profile, Task } from './types'

const uid = () => Math.random().toString(36).slice(2, 10)

const monday = startOfWeek(new Date())
const day = (offset: number): IsoDate => toIso(addDays(monday, offset))

const pillars: Pillar[] = [
  { id: 'p-health', name: 'Health', order: 0, archivedAt: null },
  { id: 'p-craft', name: 'Craft', order: 1, archivedAt: null },
  { id: 'p-people', name: 'People', order: 2, archivedAt: null },
  { id: 'p-money', name: 'Money', order: 3, archivedAt: null },
  { id: 'p-mind', name: 'Mind', order: 4, archivedAt: null },
]

const goals: Goal[] = [
  {
    id: 'g-run',
    pillarId: 'p-health',
    title: 'Move three times',
    description: 'Three sessions that get the heart rate up.',
    target: 3,
    unit: 'sessions',
    weekStart: day(0),
  },
  {
    id: 'g-ship',
    pillarId: 'p-craft',
    title: 'Ship something',
    description: 'Put two real pieces of work in front of people.',
    target: 2,
    unit: 'things shipped',
    weekStart: day(0),
  },
  {
    id: 'g-call',
    pillarId: 'p-people',
    title: 'Reach out',
    description: "Three people I'd regret losing touch with.",
    target: 3,
    unit: 'people',
    weekStart: day(0),
  },
  {
    id: 'g-read',
    pillarId: 'p-mind',
    title: 'Read most days',
    description: 'Five sittings with a book, not a feed.',
    target: 5,
    unit: 'sittings',
    weekStart: day(0),
  },
]

/**
 * Seeded deliberately uneven: some days full, some pillars empty, one day
 * untouched. The greyed-out empty state is as important to look at as the
 * active one, so the fixture has to show both side by side.
 */
let tasks: Task[] = [
  t('p-health', 'g-run', 'Morning run — 5k', 0, 'high', 'done'),
  t('p-health', null, 'Meal prep for the week', 0, 'medium', 'open'),
  t('p-craft', 'g-ship', 'Finish the onboarding flow', 0, 'high', 'open'),
  t('p-mind', 'g-read', 'Read 20 pages', 0, 'low', 'done'),

  t('p-craft', 'g-ship', 'Review pull requests', 1, 'medium', 'open'),
  t('p-people', 'g-call', 'Call Mom', 1, 'high', 'open'),

  t('p-health', 'g-run', 'Gym — upper body', 2, 'medium', 'open'),
  t('p-money', null, 'Review monthly spend', 2, 'low', 'open'),
  t('p-mind', 'g-read', 'Read 20 pages', 2, 'low', 'open'),

  t('p-craft', null, 'Sketch the landing page', 3, 'high', 'open'),

  t('p-health', 'g-run', 'Long run', 4, 'medium', 'open'),
  t('p-people', 'g-call', 'Coffee with Sam', 4, 'medium', 'open'),

  // Saturday left entirely empty on purpose.

  t('p-mind', null, 'Plan next week', 6, 'high', 'open'),
]

function t(
  pillarId: string,
  goalId: string | null,
  title: string,
  dayOffset: number,
  priority: Task['priority'],
  status: Task['status'],
): Task {
  return {
    id: uid(),
    pillarId,
    goalId,
    title,
    notes: null,
    scheduledDate: day(dayOffset),
    priority,
    status,
    completedAt: status === 'done' ? new Date().toISOString() : null,
    order: 0,
  }
}

// Give every (day, pillar) cell a sane initial ordering.
const cellCounts = new Map<string, number>()
tasks = tasks.map((task) => {
  const key = `${task.scheduledDate}:${task.pillarId}`
  const order = cellCounts.get(key) ?? 0
  cellCounts.set(key, order + 1)
  return { ...task, order }
})

let pillarList = [...pillars]
let goalList = [...goals]

let profile: Profile = {
  archetypes: [],
  planningWeekday: 0,
  planningTime: '18:00',
  eodReminderTime: '20:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
  onboardedAt: null,
}

/** Simulates network latency so loading states get exercised in development. */
const settle = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 120))

export const mockRepository: PillarsRepository = {
  async listPillars() {
    return settle(pillarList.filter((p) => !p.archivedAt))
  },

  async listGoals(weekStart) {
    return settle(goalList.filter((g) => g.weekStart === weekStart))
  },

  async listTasks(from, to) {
    return settle(
      tasks.filter((x) => x.scheduledDate >= from && x.scheduledDate <= to),
    )
  },

  async createTask(input: CreateTaskInput) {
    const siblings = tasks.filter(
      (x) =>
        x.scheduledDate === input.scheduledDate && x.pillarId === input.pillarId,
    )
    const task: Task = {
      id: uid(),
      pillarId: input.pillarId,
      goalId: input.goalId ?? null,
      title: input.title,
      notes: input.notes ?? null,
      scheduledDate: input.scheduledDate,
      priority: input.priority,
      status: 'open',
      completedAt: null,
      order: siblings.length,
    }
    tasks = [...tasks, task]
    return settle(task)
  },

  async updateTask(id, patch) {
    let updated: Task | undefined
    tasks = tasks.map((x) => {
      if (x.id !== id) return x
      updated = { ...x, ...patch }
      return updated
    })
    if (!updated) throw new Error(`No task ${id}`)
    return settle(updated)
  },

  async deleteTask(id) {
    tasks = tasks.filter((x) => x.id !== id)
    return settle(undefined)
  },

  async moveTask(id, input: MoveTaskInput) {
    let updated: Task | undefined
    tasks = tasks.map((x) => {
      if (x.id !== id) return x
      updated = { ...x, ...input }
      return updated
    })
    if (!updated) throw new Error(`No task ${id}`)
    return settle(updated)
  },

  async createPillar(name) {
    const pillar: Pillar = {
      id: uid(),
      name,
      order: pillarList.length,
      archivedAt: null,
    }
    pillarList = [...pillarList, pillar]
    return settle(pillar)
  },

  async renamePillar(id, name) {
    let updated: Pillar | undefined
    pillarList = pillarList.map((p) => {
      if (p.id !== id) return p
      updated = { ...p, name }
      return updated
    })
    if (!updated) throw new Error(`No pillar ${id}`)
    return settle(updated)
  },

  async createGoal(input: CreateGoalInput) {
    const goal: Goal = {
      id: uid(),
      pillarId: input.pillarId,
      title: input.title,
      description: input.description ?? '',
      target: input.target,
      unit: input.unit ?? '',
      weekStart: input.weekStart,
    }
    goalList = [...goalList, goal]
    return settle(goal)
  },

  async getProfile() {
    return settle(profile)
  },

  async updateProfile(patch) {
    profile = { ...profile, ...patch }
    return settle(profile)
  },

  async archivePillar(id) {
    pillarList = pillarList.map((p) =>
      p.id === id ? { ...p, archivedAt: new Date().toISOString() } : p,
    )
    return settle(undefined)
  },
}
