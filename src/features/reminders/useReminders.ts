import { useEffect, useState } from 'react'
import { repository } from '@/data'
import type { Profile, Task } from '@/data/types'
import {
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
 */
export function useReminders(tasks: Task[], ready: boolean): Reminders {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reviewed, setReviewed] = useState<boolean | null>(null)

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

  if (!ready || reviewed === null) {
    return { eod: { due: false, tasks: [] }, weeklyDue: false }
  }

  return {
    eod: evaluateEod(tasks, profile),
    weeklyDue: evaluateWeekly(profile, reviewed),
  }
}
