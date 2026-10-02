import { useSyncExternalStore } from 'react'

/**
 * WHAT THE APP HEADER SHOULD DO WHILE A COURSE PAGE IS OPEN — 2026-09-23.
 *
 * Two course pages, two answers, and the header cannot work either out for
 * itself:
 *
 *   `'none'`     — no course open. The header is its normal self.
 *   `'course'`   — Option 1's player. The header STAYS, with a slightly
 *                  thicker bottom stroke: the course page is a different place
 *                  from the dashboard, and the heavier rule is what says so
 *                  while the header itself is unchanged.
 *   `'takeover'` — Option 2's full-screen page. The header GOES, because that
 *                  page draws its own (logo · Compass · course · section) and
 *                  two XCEL logos stacked reads as broken rather than as a
 *                  variant.
 *
 * ⚠ A STORE RATHER THAN A PROP, because the components cannot see each other.
 * `<Header />` lives in `AppLayout`, ABOVE the `<Outlet />`; both course pages
 * render inside `PlatformShell`, well below it. There is no prop path between
 * them and no shared provider low enough to add one — `CourseLauncher` is
 * inside `PlatformShell`, so the header is out of its reach. Same
 * `useSyncExternalStore` shape as `demoControlsVisibility`, for the same
 * reason: two places in different branches of the tree agreeing on one value.
 *
 * ⚠ AND NOT A `position: fixed` OVERLAY for the takeover, which was the other
 * obvious answer and is the one to not revisit. The demo frame renders the app
 * inside a centred browser-window card; a fixed overlay resolves against the
 * viewport (or against whichever ancestor happens to carry a transform), so it
 * would either escape the card or cover the demo controls bar — the one piece
 * of chrome a moderated session needs to keep.
 *
 * ⚠ IT IS NOT PERSISTED. Live UI state, not a preference: true only while a
 * page is mounted. Writing it to storage would strand a reviewer headerless
 * with nothing on screen to explain it.
 */
export type CourseChrome = 'none' | 'course' | 'takeover'

let chrome: CourseChrome = 'none'
const listeners = new Set<() => void>()

/** Set by a course page on mount; back to `'none'` on unmount. */
export function setCourseChrome(next: CourseChrome) {
  if (chrome === next) return
  chrome = next
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** Which course page, if any, is open. `Header` reads this. */
export function useCourseChrome(): CourseChrome {
  return useSyncExternalStore(
    subscribe,
    () => chrome,
    () => 'none' as const,
  )
}
