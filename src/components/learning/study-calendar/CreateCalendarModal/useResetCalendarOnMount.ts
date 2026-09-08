import { useEffect } from 'react'

/**
 * Calls `reset` on initial mount and any time `pathId` changes. The
 * STC Create Calendar demo flow uses this to wipe every controlled
 * `useState` in `CreateCalendarDemoHarness` and re-open the modal in
 * its pristine state — so the demo feels fresh on every visit.
 *
 * The mounted `useEffect` already runs on initial mount, so the
 * harness gets a single "reset + open" pulse when the path is first
 * activated.
 */
export function useResetCalendarOnMount(
  pathId: string | undefined,
  reset: () => void,
) {
  useEffect(() => {
    reset()
    // We intentionally only re-run when the path changes. The reset
    // callback itself is closed over the harness's `useState` setters,
    // which are stable references — adding it to the deps would force
    // a re-run on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId])
}
