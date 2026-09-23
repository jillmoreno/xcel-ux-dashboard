import { useSyncExternalStore } from 'react'

/**
 * IS A FULL-SCREEN COURSE PAGE ON? — 2026-09-23, for
 * `dashboard-navigation: option-2`.
 *
 * Option 2's course page carries its OWN header (logo · Compass · course ·
 * section, plus the controls top-right), so the app's global header has to go
 * while it is open — two logos, one above the other, is the whole reason the
 * variant would read as broken.
 *
 * ⚠ A STORE RATHER THAN A PROP, because the two components cannot see each
 * other. `<Header />` lives in `AppLayout`, ABOVE the `<Outlet />`; the course
 * page renders inside `PlatformShell`, well below it. There is no prop path
 * between them and no shared provider low enough to add one — `CourseLauncher`
 * is inside `PlatformShell`, so the header is out of its reach. Same
 * `useSyncExternalStore` shape as `demoControlsVisibility`, for the same
 * reason: two places in different branches of the tree agreeing on one flag.
 *
 * ⚠ AND NOT A `position: fixed` OVERLAY, which was the other obvious answer
 * and is the one to not revisit. The demo frame renders the app inside a
 * centred browser-window card; a fixed overlay resolves against the viewport
 * (or against whichever ancestor happens to carry a transform), so it would
 * either escape the card or cover the demo controls bar — the one piece of
 * chrome a moderated session needs to keep.
 *
 * ⚠ IT IS NOT PERSISTED. This is live UI state, not a preference: it is true
 * only while the page is mounted, and a reload with no course open must show
 * the header. Writing it to storage would strand a reviewer headerless with
 * nothing on screen to explain it.
 */

let takeover = false
const listeners = new Set<() => void>()

/** Set by the full-screen course page on mount, cleared on unmount. */
export function setCourseTakeover(on: boolean) {
  if (takeover === on) return
  takeover = on
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** True while a course page is drawing its own header. `Header` reads this. */
export function useCourseTakeover(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => takeover,
    () => false,
  )
}
