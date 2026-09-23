/**
 * Helpers for scroll-linked motion.
 *
 * Every scroll transform on this page is written as a function of progress,
 * not as `useTransform(progress, [a, b], [x, y])` ranges. Motion hands range
 * transforms of a scroll value to the browser's own scroll timelines, and
 * there they don't hold their end value outside the range: a list that had
 * faded in kept fading back out as you scrolled on. A function can't be
 * handed off, so it runs as a plain motion value and clamps as written.
 */

/** Where `value` sits between `from` and `to`, clamped to 0..1. */
export function span(value: number, from: number, to: number): number {
  return Math.min(1, Math.max(0, (value - from) / (to - from)))
}

/** Maps a clamped 0..1 amount onto an output range. */
export function mix(from: number, to: number, amount: number): number {
  return from + (to - from) * amount
}

export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
