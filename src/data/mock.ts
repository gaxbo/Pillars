import { addDays, startOfWeek, toIso } from '@/lib/date'
import type {
  CreateGoalInput,
  CreateTaskInput,
  MoveTaskInput,
  PillarsRepository,
} from './repository'
import type { Goal, IsoDate, Pillar, Profile, Task, WeekReport } from './types'
import { TEMPLATES } from '@/features/onboarding/catalog'

const uid = () => Math.random().toString(36).slice(2, 10)

const monday = startOfWeek(new Date())
const day = (offset: number): IsoDate => toIso(addDays(monday, offset))

type Priority = Task['priority']
type Status = Task['status']

interface SampleWeek {
  /** One of onboarding's starting sets, by id: its pillars, in its order. */
  template: string
  goals: { key: string; pillar: string; title: string; description: string; target: number; unit: string }[]
  /** [pillar, goal key or null, title, day (0 is Monday, negative is last week), priority, status] */
  tasks: [string, string | null, string, number, Priority, Status][]
}

/**
 * Three weeks from three different lives, all real starting sets. The
 * landing page's screenshots are taken from these, a different life per
 * section, so the page doesn't read as written for one kind of person.
 * `?sample=<template id>` picks one; the capture script passes it.
 *
 * Each is seeded deliberately uneven: some days full, some pillars empty,
 * Saturday untouched. The empty state matters as much as the active one.
 * A goal key with `-prev` is last week's copy, for the weekly review.
 */
const SAMPLES: SampleWeek[] = [
  {
    template: 'the-good-week',
    goals: [
      { key: 'move', pillar: 'Fitness', title: 'Move three times', description: 'Three sessions that get the heart rate up.', target: 3, unit: 'sessions' },
      { key: 'paint', pillar: 'Hobbies', title: 'Paint twice', description: 'Two evenings at the easel, phone in another room.', target: 2, unit: 'sessions' },
      { key: 'reach', pillar: 'Friends', title: 'Reach out', description: "Three people I'd regret losing touch with.", target: 3, unit: 'people' },
      { key: 'read', pillar: 'Habits', title: 'Read most days', description: 'Five sittings with a book, not a feed.', target: 5, unit: 'sittings' },
    ],
    tasks: [
      ['Fitness', 'move', 'Morning run, 5k', 0, 'high', 'done'],
      ['Habits', null, 'Meal prep for the week', 0, 'medium', 'open'],
      ['Hobbies', 'paint', 'Finish the lake sketch', 0, 'high', 'open'],
      ['Habits', 'read', 'Read 20 pages', 0, 'low', 'done'],
      ['Hobbies', 'paint', 'Watercolor class', 1, 'medium', 'open'],
      ['Friends', 'reach', 'Call Mom', 1, 'high', 'open'],
      ['Fitness', 'move', 'Gym: upper body', 2, 'medium', 'open'],
      ['Savings', null, 'Review monthly spend', 2, 'low', 'open'],
      ['Habits', 'read', 'Read 20 pages', 2, 'low', 'open'],
      ['Savings', null, 'Move $100 to savings', 3, 'high', 'open'],
      ['Fitness', 'move', 'Long run', 4, 'medium', 'open'],
      ['Friends', 'reach', 'Coffee with Sam', 4, 'medium', 'open'],
      ['Habits', null, 'Plan next week', 6, 'high', 'open'],
      ['Fitness', 'move-prev', 'Morning run', -7, 'medium', 'done'],
      ['Hobbies', 'paint-prev', 'Sketch at the park', -7, 'high', 'done'],
      ['Fitness', 'move-prev', 'Gym', -6, 'medium', 'done'],
      ['Friends', 'reach-prev', 'Call Dad', -6, 'high', 'open'],
      ['Hobbies', 'paint-prev', 'Paint the window view', -5, 'medium', 'done'],
      ['Savings', null, 'Cancel the old subscription', -5, 'low', 'open'],
      ['Fitness', 'move-prev', 'Long run', -4, 'medium', 'open'],
      ['Friends', 'reach-prev', 'Text Priya', -3, 'low', 'done'],
    ],
  },
  {
    template: 'hold-the-line',
    goals: [
      { key: 'train', pillar: 'Training', title: 'Train three times', description: 'Three sessions, before work or at lunch.', target: 3, unit: 'sessions' },
      { key: 'close', pillar: 'Day Job', title: 'Close two big items', description: 'Two things off the list that actually matter.', target: 2, unit: 'items' },
      { key: 'logoff', pillar: 'Boundaries', title: 'Log off by 6', description: 'Three evenings with the laptop shut on time.', target: 3, unit: 'evenings' },
      { key: 'off', pillar: 'Downtime', title: 'Two evenings off', description: 'Nothing scheduled, nothing to catch up on.', target: 2, unit: 'evenings' },
    ],
    tasks: [
      ['Training', 'train', 'Early swim', 0, 'high', 'done'],
      ['Household', null, 'Meal prep for the week', 0, 'medium', 'open'],
      ['Day Job', 'close', 'Finish the Q3 deck', 0, 'high', 'open'],
      ['Boundaries', 'logoff', 'Laptop shut at 6', 0, 'low', 'done'],
      ['Day Job', 'close', 'Prep the 1:1s', 1, 'medium', 'open'],
      ['Downtime', 'off', 'Movie night, no phone', 1, 'high', 'open'],
      ['Training', 'train', 'Gym: upper body', 2, 'medium', 'open'],
      ['Household', null, 'Pay the bills', 2, 'low', 'open'],
      ['Boundaries', 'logoff', 'Laptop shut at 6', 2, 'low', 'open'],
      ['Day Job', null, 'Draft the performance review', 3, 'high', 'open'],
      ['Training', 'train', 'Lunchtime run', 4, 'medium', 'open'],
      ['Downtime', 'off', 'Dinner with Sam', 4, 'medium', 'open'],
      ['Household', null, 'Plan next week', 6, 'high', 'open'],
      ['Training', 'train-prev', 'Early swim', -7, 'medium', 'done'],
      ['Day Job', 'close-prev', 'Ship the pricing update', -7, 'high', 'done'],
      ['Training', 'train-prev', 'Gym', -6, 'medium', 'done'],
      ['Downtime', 'off-prev', 'Board game night', -6, 'high', 'open'],
      ['Day Job', 'close-prev', 'Write the quarterly summary', -5, 'medium', 'done'],
      ['Household', null, 'Cancel the old subscription', -5, 'low', 'open'],
      ['Training', 'train-prev', 'Long run', -4, 'medium', 'open'],
      ['Downtime', 'off-prev', 'Afternoon off, no email', -3, 'low', 'done'],
    ],
  },
  {
    template: 'back-on-your-feet',
    goals: [
      { key: 'bed', pillar: 'Sleep', title: 'In bed by 11', description: 'Five nights, phone charging in the kitchen.', target: 5, unit: 'nights' },
      { key: 'walk', pillar: 'Daily Basics', title: 'Walk three times', description: 'Twenty minutes outside, nowhere to be.', target: 3, unit: 'walks' },
      { key: 'reach', pillar: 'Support', title: 'Reach out twice', description: 'Two people who know how the year has been.', target: 2, unit: 'people' },
    ],
    tasks: [
      ['Sleep', 'bed', 'Phone out of the bedroom', 0, 'high', 'done'],
      ['Headspace', null, 'Journal for ten minutes', 0, 'medium', 'open'],
      ['Daily Basics', 'walk', 'Walk around the block', 0, 'medium', 'open'],
      ['Daily Basics', null, 'Cook one real dinner', 0, 'low', 'done'],
      ['Support', 'reach', 'Call Jess back', 1, 'high', 'open'],
      ['Sleep', 'bed', 'In bed by 11', 1, 'medium', 'open'],
      ['Daily Basics', 'walk', 'Walk to the market', 2, 'medium', 'open'],
      ['Money Reset', null, 'List what I owe', 2, 'low', 'open'],
      ['Headspace', null, 'Therapy, 5pm', 3, 'high', 'open'],
      ['Daily Basics', 'walk', 'Walk with Sam', 4, 'medium', 'open'],
      ['Support', 'reach', 'Text my sister', 4, 'medium', 'open'],
      ['Daily Basics', null, 'Plan next week', 6, 'high', 'open'],
      ['Sleep', 'bed-prev', 'In bed by 11', -7, 'medium', 'done'],
      ['Daily Basics', 'walk-prev', 'Walk around the block', -7, 'high', 'done'],
      ['Sleep', 'bed-prev', 'In bed by 11', -6, 'medium', 'done'],
      ['Support', 'reach-prev', 'Call Dad', -6, 'high', 'open'],
      ['Headspace', null, 'Journal', -5, 'medium', 'done'],
      ['Money Reset', null, 'Cancel the old subscription', -5, 'low', 'open'],
      ['Daily Basics', 'walk-prev', 'Walk after dinner', -4, 'medium', 'open'],
      ['Support', 'reach-prev', 'Coffee with Priya', -3, 'low', 'done'],
    ],
  },
]

const requested = new URLSearchParams(window.location.search).get('sample')
const sample = SAMPLES.find((s) => s.template === requested) ?? SAMPLES[0]

const pillarId = (name: string) => `p-${name.toLowerCase().replace(/\W+/g, '-')}`

const pillars: Pillar[] = (
  TEMPLATES.find((t) => t.id === sample.template)?.pillars ?? []
).map((name, order) => ({ id: pillarId(name), name, order, archivedAt: null }))

// This week's goals, and last week's copies so the review has a week to report on.
const goals: Goal[] = sample.goals.flatMap((g) =>
  [0, -7].map((offset) => ({
    id: `g-${g.key}${offset ? '-prev' : ''}`,
    pillarId: pillarId(g.pillar),
    title: g.title,
    description: g.description,
    target: g.target,
    unit: g.unit,
    weekStart: day(offset),
  })),
)

let tasks: Task[] = sample.tasks.map(([pillar, goal, title, offset, priority, status]) =>
  t(pillarId(pillar), goal && `g-${goal}`, title, offset, priority, status),
)


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

const weekReviews = new Map<IsoDate, WeekReport>()

let profile: Profile = {
  fullName: 'Sample account',
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

  async updateGoal(id, patch) {
    let updated: Goal | undefined
    goalList = goalList.map((g) => {
      if (g.id !== id) return g
      updated = { ...g, ...patch }
      return updated
    })
    if (!updated) throw new Error(`No goal ${id}`)
    return settle(updated)
  },

  async deleteGoal(id) {
    goalList = goalList.filter((g) => g.id !== id)
    tasks = tasks.map((x) => (x.goalId === id ? { ...x, goalId: null } : x))
    return settle(undefined)
  },

  async getWeekReview(weekStart) {
    return settle(weekReviews.get(weekStart) ?? null)
  },

  async saveWeekReview(report) {
    weekReviews.set(report.weekStart, report)
    return settle(undefined)
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
