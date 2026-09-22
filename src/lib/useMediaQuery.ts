import { useCallback, useSyncExternalStore } from 'react'

/**
 * Tracks a CSS media query. Read synchronously on first render, so a layout
 * picked with it never flashes the wrong variant before settling.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}
