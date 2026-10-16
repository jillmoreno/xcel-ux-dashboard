import { createContext, useContext, useEffect } from 'react'

/**
 * WHICH SURFACE OF THE PRODUCT IS ON SCREEN — 2026-10-16, so the Design
 * controls bar can carry a different set of controls inside Compass than on
 * Home.
 *
 * ⚠ WHY A CONTEXT AND NOT `?section=`. The bar resolves everything else it
 * shows from the URL — `?version=`, `?demo=1` — and the obvious move was to
 * read a section param here too. There isn't one. Compass is entered through
 * the launcher (`PlatformShell`: `launcherOpen && launcherStyle === 'compass'`)
 * and its own page (Overview / Learn / Study planner) is `useState` inside
 * `CompassLearningPage`. Neither reaches the address bar, so the bar could not
 * see Compass at all, let alone which page of it. Lifting both into the URL
 * would change how the product navigates — deep links, back-button behaviour,
 * the tests around both — to serve a control bar. This does not touch
 * navigation: the surface publishes what it is, and the bar reads it.
 *
 * ⚠ IT IS A HINT FOR CHROME, NOT ROUTING STATE. Nothing about what renders
 * depends on this. A surface that forgets to declare itself leaves the value
 * null, and `designControlsFor` then shows a flag wherever `versions` already
 * put it — exactly what every control did before this existed. The failure
 * mode is the old behaviour, not a blank bar.
 *
 * ⚠ A PLAIN `.ts` MODULE, and the provider lives next door in
 * `DesignSurfaceProvider.tsx`. Hooks and a component in one file trip
 * react-refresh's "only export components", the same rule that pushed
 * `HYBRID_COMPASS_PAGES` out of `CompassCoursePlayer.tsx`.
 */
export type DesignSurfaceId =
  /* The lesson itself (`CompassSessionPage`), mounted from `PlatformShell`
     rather than through `CompassLearningPage` — it is where Rubi's rail
     lives, so it declares itself separately from the pages around it. */
  | 'compass:session'
  | 'compass:overview'
  | 'compass:course'
  | 'compass:study-planner'
  | 'compass:progress'

export type DesignSurfaceCtx = {
  surface: DesignSurfaceId | null
  setSurface: (id: DesignSurfaceId | null) => void
}

export const DesignSurfaceContext = createContext<DesignSurfaceCtx>({
  surface: null,
  setSurface: () => {},
})

/** What the bar reads. */
export function useDesignSurface(): DesignSurfaceId | null {
  return useContext(DesignSurfaceContext).surface
}

/**
 * What a surface calls to say what it is.
 *
 * ⚠ IT CLEARS ITSELF ON UNMOUNT, and that is the whole reason this is an
 * effect rather than a render-time set. Leaving Compass unmounts the page
 * without telling anyone, and a stale `compass:study-planner` would leave the
 * planner's controls sitting on Home — the exact noise this was added to
 * remove, just moved somewhere harder to spot.
 */
export function useDeclareDesignSurface(id: DesignSurfaceId | null) {
  const { setSurface } = useContext(DesignSurfaceContext)
  useEffect(() => {
    setSurface(id)
    return () => setSurface(null)
  }, [id, setSurface])
}

/**
 * What the Design bar calls the surface, in place of the dashboard version.
 *
 * ⚠ THE VERSION TAG WAS LYING BY OMISSION ON COMPASS — 2026-10-16. The bar
 * states what it is scoped to so a designer knows why the controls changed,
 * and on Compass it read "End-to-End Demo", because the Compass row opens
 * `?section=compass` with no `?version=` and that resolves to the default,
 * which is Eric's. True, and useless: the controls on Compass are scoped by
 * SURFACE, not by that version, and naming his made Anjani's pages look like
 * his. Name the thing actually doing the scoping.
 */
export const DESIGN_SURFACE_LABELS: Record<DesignSurfaceId, string> = {
  'compass:session': 'Compass · Session',
  'compass:overview': 'Compass · Overview',
  'compass:course': 'Compass · Learn',
  'compass:study-planner': 'Compass · Study planner',
  'compass:progress': 'Compass · Progress',
}
