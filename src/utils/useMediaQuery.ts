import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 * Returns `false` on the server / before hydration where `window` is absent.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    [query],
  )
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])
  const getServerSnapshot = () => false
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
