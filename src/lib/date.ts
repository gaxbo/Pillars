import type { IsoDate } from '@/data/types'

/** Local-time ISO date ("2026-09-21"). Avoids the UTC shift toISOString gives. */
export function toIso(date: Date): IsoDate {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromIso(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const day = date.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day
  return addDays(date, diff)
}

/** The seven days of the week containing `date`, Monday first. */
export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function isToday(date: Date): boolean {
  return toIso(date) === toIso(new Date())
}

export function isPast(date: Date): boolean {
  return toIso(date) < toIso(new Date())
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const MONTH_SHORT = MONTH_LABELS.map((m) => m.slice(0, 3))

export function dayLabel(date: Date): string {
  return DAY_LABELS[date.getDay()]
}

/** "22 Sep" — the format used in the day column headers. */
export function dayDateLabel(date: Date): string {
  return `${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`
}

/**
 * The header title. A week can straddle a month boundary, in which case the
 * design's single "September 2026" would be wrong — show both.
 */
export function weekTitle(days: Date[]): string {
  const first = days[0]
  const last = days[days.length - 1]
  const sameMonth = first.getMonth() === last.getMonth()
  const sameYear = first.getFullYear() === last.getFullYear()

  if (sameMonth && sameYear) {
    return `${MONTH_LABELS[first.getMonth()]} ${first.getFullYear()}`
  }
  if (sameYear) {
    return `${MONTH_SHORT[first.getMonth()]}–${MONTH_SHORT[last.getMonth()]} ${first.getFullYear()}`
  }
  return `${MONTH_SHORT[first.getMonth()]} ${first.getFullYear()} – ${MONTH_SHORT[last.getMonth()]} ${last.getFullYear()}`
}
