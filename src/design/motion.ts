import type { Transition } from 'motion/react'

/**
 * Every spring in the app comes from here. Springs, not durations — anything
 * that responds to a pointer should feel like it has mass.
 */
export const spring = {
  /** Picking a task up, dropping it, toggling completion. */
  snappy: { type: 'spring', stiffness: 420, damping: 32 } satisfies Transition,
  /** Layout reflow when a task moves between pillars or days. */
  gentle: { type: 'spring', stiffness: 260, damping: 28 } satisfies Transition,
  /** Modals and sheets. */
  sheet: { type: 'spring', stiffness: 300, damping: 30 } satisfies Transition,
} as const

/** For opacity and colour, where a spring would read as a wobble. */
export const ease = {
  fast: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } satisfies Transition,
  medium: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } satisfies Transition,
} as const
