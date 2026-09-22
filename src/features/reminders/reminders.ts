import type { IsoDate, Profile, Task } from '@/data/types'
import { addDays, startOfWeek, toIso } from '@/lib/date'

const EOD_SNOOZE_KEY = 'pillars.eod.snoozeUntil'
const WEEKLY_DISMISS_KEY = 'pillars.weekly.dismissed'

/**
 * Browser storage throws in private mode and returns nothing when site data is
 * cleared, so every read and write is guarded and every caller has to work
 * without it. A lost snooze shows one extra nudge; a thrown error would break
 * the board.
 */
function readStore(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStore(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Nothing to do; the reminder simply reappears next time.
  }
}

/** Minutes since midnight, for comparing against a "HH:MM" setting. */
function minutesNow(now: Date): number {
  return now.getHours() * 60 + now.getMinutes()
}

function parseTime(value: string): number {
  const [h, m] = value.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export type PreviewMode = 'eod' | 'weekly' | null

/**
 * Both nudges are time-gated, which makes them awkward to look at on a
 * Tuesday afternoon. `?preview=eod` or `?preview=weekly` forces one on.
 *
 * Development only: this is a deliberate bypass of the rules below, and it
 * has no business being reachable in a build other people use.
 */
export function previewMode(): PreviewMode {
  if (!import.meta.env.DEV) return null
  try {
    const value = new URLSearchParams(window.location.search).get('preview')
    return value === 'eod' || value === 'weekly' ? value : null
  } catch {
    return null
  }
}

export function snoozeEod(hours = 2) {
  writeStore(EOD_SNOOZE_KEY, String(Date.now() + hours * 60 * 60 * 1000))
}

function eodSnoozed(now: Date): boolean {
  const raw = readStore(EOD_SNOOZE_KEY)
  if (!raw) return false
  const until = Number(raw)
  return Number.isFinite(until) && now.getTime() < until
}

export interface EodState {
  due: boolean
  tasks: Task[]
}

/**
 * The end-of-day nudge: past the user's chosen time, with work still open
 * today. Returns the tasks so the caller does not filter twice.
 */
export function evaluateEod(
  tasks: Task[],
  profile: Profile | null,
  now = new Date(),
): EodState {
  const today: IsoDate = toIso(now)
  const open = tasks.filter(
    (t) => t.scheduledDate === today && t.status === 'open',
  )

  if (open.length === 0) return { due: false, tasks: [] }

  // Preview skips the clock and the snooze, but not the 'is there anything
  // to triage' check — an empty triage would show nothing either way.
  if (previewMode() === 'eod') return { due: true, tasks: open }

  if (eodSnoozed(now)) return { due: false, tasks: open }

  const threshold = parseTime(profile?.eodReminderTime ?? '20:00')
  return { due: minutesNow(now) >= threshold, tasks: open }
}

export function dismissWeekly(weekStart: IsoDate) {
  writeStore(WEEKLY_DISMISS_KEY, weekStart)
}

/**
 * The weekly planning prompt: the planning moment has passed and last week has
 * not been reviewed yet.
 *
 * `reviewed` comes from the caller because it needs a network read, and this
 * stays a pure function so it can be reasoned about and tested directly.
 */
export function evaluateWeekly(
  profile: Profile | null,
  reviewed: boolean,
  now = new Date(),
): boolean {
  if (previewMode() === 'weekly') return true
  if (reviewed) return false

  const thisWeek = toIso(startOfWeek(now))
  if (readStore(WEEKLY_DISMISS_KEY) === thisWeek) return false

  const planningWeekday = profile?.planningWeekday ?? 0
  const planningMinutes = parseTime(profile?.planningTime ?? '18:00')

  // The planning slot for the current week, as an absolute moment.
  const monday = startOfWeek(now)
  // planningWeekday is JS convention (0 = Sunday), so Sunday sits at the end.
  const offset = planningWeekday === 0 ? 6 : planningWeekday - 1
  const slot = addDays(monday, offset)
  slot.setHours(Math.floor(planningMinutes / 60), planningMinutes % 60, 0, 0)

  return now.getTime() >= slot.getTime()
}

/** The Monday of the week a review would cover. */
export function weekUnderReview(now = new Date()): IsoDate {
  return toIso(addDays(startOfWeek(now), -7))
}
