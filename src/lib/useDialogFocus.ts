import { useEffect, type RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Keyboard focus for a modal: moves in when it opens, can't Tab out behind
 * it while open, and goes back to whatever opened it when it closes.
 *
 * The overlays here stay mounted and toggle `open` (see TODO.md's notes), so
 * this keys on `open` rather than on mount. `initial` is where focus lands;
 * without one it's the first focusable element.
 */
export function useDialogFocus(
  open: boolean,
  container: RefObject<HTMLElement | null>,
  initial?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null

    const target =
      initial?.current ?? container.current?.querySelector<HTMLElement>(FOCUSABLE)
    target?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !container.current) return
      const items = Array.from(
        container.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      const inside = container.current.contains(active)

      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      // Only hand focus back if it's still inside the closing dialog or
      // lost to the page; never steal it from somewhere the user moved it.
      const active = document.activeElement
      const lost = !active || active === document.body
      if ((lost || container.current?.contains(active)) && opener?.isConnected) {
        opener.focus()
      }
    }
    // `initial` and `container` are refs: stable, read at open time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}
