import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFeatureFlag } from '@/context/FeatureFlagContext'

/** The End-to-End Demo's dashboard version (`dashboardVersions.ts`). */
export const END_TO_END_VERSION = 'eric-atlas-e2e'

/**
 * Keeps the End-to-End Demo's pages on its version (2026-10-14): the design
 * bar scopes its controls to `?version=`, and the demo bar reads `?demo=1`, so
 * a page opened without them is given them — replaced, not pushed, so Back
 * still leaves the page.
 */
export function useEndToEndDemoParams(): void {
  const [params, setParams] = useSearchParams()
  const missing = params.get('version') !== END_TO_END_VERSION || params.get('demo') !== '1'
  useEffect(() => {
    if (!missing) return
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('demo', '1')
        next.set('version', END_TO_END_VERSION)
        return next
      },
      { replace: true },
    )
  }, [missing, setParams])
}

/**
 * Puts the Atlas guide palette on <html> while a demo page is open, as the
 * dashboard's shell does (`data-atlas-palette` / `data-atlas-brand`), so the
 * Secondary tokens resolve to the guide's tans; restores what was there on
 * leaving. Also names the tab, a tick late — AccountContext names it on
 * mount too, and a parent's effect runs after its child's.
 */
export function useEndToEndPageChrome(title: string): void {
  useEffect(() => {
    const root = document.documentElement
    const before = { palette: root.dataset.atlasPalette, brand: root.dataset.atlasBrand, title: document.title }
    root.dataset.atlasPalette = 'xcel'
    root.dataset.atlasBrand = 'global'
    const timer = window.setTimeout(() => {
      document.title = title
    }, 0)
    return () => {
      window.clearTimeout(timer)
      document.title = before.title
      if (before.palette == null) delete root.dataset.atlasPalette
      else root.dataset.atlasPalette = before.palette
      if (before.brand == null) delete root.dataset.atlasBrand
      else root.dataset.atlasBrand = before.brand
    }
  }, [title])
}

/** The demo's course, short (2026-10-15, Eric's request: "Premier" dropped). */
export const E2E_COURSE_TITLE_SHORT = 'Florida Life and Health Pre-licensing'
/** …and long, which the Design bar's Long title control shows. */
export const E2E_COURSE_TITLE_LONG = `${E2E_COURSE_TITLE_SHORT} with Comprehensive Exam Simulators`

/**
 * The End-to-End Demo's course title, as the `atlas-home-long-title` design
 * control picks it (2026-10-15, Eric's request: "make the long title design
 * control work"). One answer for every page the title appears on — Home,
 * Invited Product Detail and Checkout — so they never disagree.
 */
export function useEndToEndCourseTitle(): string {
  return useFeatureFlag('atlas-home-long-title').enabled ? E2E_COURSE_TITLE_LONG : E2E_COURSE_TITLE_SHORT
}
