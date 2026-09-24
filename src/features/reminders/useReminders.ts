import { useEffect, useMemo, useState } from 'react'
import { repository } from '@/data'
import type { IsoDate, Profile, Task } from '@/data/types'
import { addDays, toIso } from '@/lib/date'
import {
  EOD_LOOKBACK_DAYS,
  evaluateEod,
  evaluateWeekly,
  weekUnderReview,
  type EodState,
} from './reminders'

interface Reminders {
  eod: EodState
  weeklyDue: boolean
}

/**
 * Decides which nudges are owed on this visit.
 *
 * Evaluated once the board has data rather than on an interval: this is a
 * planning app, not a live dashboard, and a reminder that appears the moment
 * the clock ticks over while you are mid-drag would be worse than one that
 * waits for your next visit.
 *
 * The evening check-in reaches back EOD_LOOKBACK_DAYS, which can cross into
 * last week, so it reads its own tasks rather than the board's. Where the
 * board has the same task loaded, the board's copy wins: it's the one the
 * user just ticked or deleted. `refresh` re-reads, for after a check-in.
 */
export function useReminders(
  boardTasks: Task[],
  ready: boolean,
  boardRange: { from: IsoDate; to: IsoDate } | null,
  refresh: number,
  /** A task deleted but still undoable: gone as far as the check-in is concerned. */
  hiddenId: string | null,
): Reminders {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reviewed, setReviewed] = useState<boolean | null>(null)
  const [recent, setRecent] = useState<Task[]>([])

  useEffect(() => {
    if (!ready) return
    let cancelled = false

    void repository
      .getProfile()
      .then((p) => {
        if (!cancelled) setProfile(p)
      })
      .catch(() => {
        if (!cancelled) setProfile(null)
      })

    void repository
      .getWeekReview(weekUnderReview())
      .then((r) => {
        if (!cancelled) setReviewed(r !== null)
      })
      .catch(() => {
        // Treat an unknown review state as reviewed: better to miss a prompt
        // than to nag someone who already planned.
        if (!cancelled) setReviewed(true)
      })

    return () => {
      cancelled = true
    }
  }, [ready])

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    const now = new Date()
    void repository
      .listTasks(toIso(addDays(now, -EOD_LOOKBACK_DAYS)), toIso(now))
      .then((tasks) => {
        if (!cancelled) setRecent(tasks)
      })
      .catch(() => {
        // No check-in is better than a wrong one.
        if (!cancelled) setRecent([])
      })
    return () => {
      cancelled = true
    }
  }, [ready, refresh])

  const merged = useMemo(() => {
    const byId = new Map(recent.map((t) => [t.id, t]))
    if (boardRange) {
      // Inside the board's week, the board is the truth: a task missing
      // from it was deleted, and one in it may be newer.
      for (const [id, t] of byId) {
        if (t.scheduledDate >= boardRange.from && t.scheduledDate <= boardRange.to) {
          byId.delete(id)
        }
      }
      for (const t of boardTasks) byId.set(t.id, t)
    }
    if (hiddenId) byId.delete(hiddenId)
    return [...byId.values()]
  }, [recent, boardTasks, boardRange, hiddenId])

  if (!ready || reviewed === null) {
    return { eod: { due: false, tasks: [], earlier: 0 }, weeklyDue: false }
  }

  return {
    eod: evaluateEod(merged, profile),
    weeklyDue: evaluateWeekly(profile, reviewed),
  }
}
