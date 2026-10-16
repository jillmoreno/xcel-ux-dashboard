import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCourseDemo, useFeatureFlag } from '@/context/FeatureFlagContext'
import { jurisdictionName } from '@/data/nyProducerRequirements'

/** The End-to-End Demo's dashboard version (`dashboardVersions.ts`). */
export const END_TO_END_VERSION = 'eric-atlas-e2e'

/* THE DEMO'S PRICES, in one place (2026-10-15, Eric's request): the PDP's
   price card, Checkout's order summary and Confirmation's order total all
   read these, so the total is always the checkout's. */
export const E2E_ORIGINAL_PRICE = '$199.00'
export const E2E_PARTNER_PRICE = '$65.00'

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
 *
 * ⚠ THIS ONE IS THE INVITE DOOR'S, AND IT STAYS FLORIDA. `/end-to-end-demo`'s
 * Invited Product Detail and Checkout pages belong to the Invite & Purchase
 * scope (Afsana and Eric), and the Course control is not theirs to re-point.
 * The DASHBOARD's title follows the course — see `useDashboardCourseTitle`
 * below.
 */
export function useEndToEndCourseTitle(): string {
  return useFeatureFlag('atlas-home-long-title').enabled ? E2E_COURSE_TITLE_LONG : E2E_COURSE_TITLE_SHORT
}

/**
 * The same title, FOLLOWING THE COURSE CONTROL — 2026-10-15.
 *
 * ⚠ IT EXISTS BECAUSE THE DEFAULT VERSION'S HOME IS THE LANDING PAGE. End-to-End
 * Demo is what a bare `/dashboard-rebrand?demo=1` resolves to, its Home is
 * `AtlasHomeEricE2E`, and that card's title was a module constant — so the
 * Course control could re-point Readiness, the Study Plan and the Compass tree
 * and the first thing every stakeholder saw still read "Florida". A demo axis
 * that cannot be seen on the landing page reads as a broken control, and that
 * is exactly how it was reported.
 *
 * ⚠ A SECOND FUNCTION RATHER THAN A COURSE ARGUMENT ON THE FIRST, deliberately.
 * The two callers want different things and the split says so: the invite door
 * is selling ONE advertised product and must not change under a demo control
 * that belongs to the dashboard, while the dashboard is showing whichever
 * course the reviewer picked. Collapsing them would quietly drag
 * `/end-to-end-demo` across a scope boundary.
 *
 * ⚠ KNOWN DISAGREEMENT, and it is the boundary rather than a bug: with Texas
 * picked, the invite door still advertises the Florida course while the
 * dashboard it hands off to says Texas. Flagged to Jillienne for Afsana and
 * Eric — extending it is deleting this split.
 *
 * The long-title control still applies, on whichever course is active.
 */
export function useDashboardCourseTitle(): string {
  const long = useFeatureFlag('atlas-home-long-title').enabled
  const { state } = useCourseDemo()
  /* ⚠ `auto` KEEPS THE INVITE DOOR'S STRING, which is Florida's — and that is
     deliberate even though the dashboard's qualifying journey resolves New
     York under `auto`. The mismatch is `main`'s, not this branch's: the
     End-to-End card has read "Florida Life and Health Pre-licensing" beside a
     New York Get Licensed block since the version shipped, because the title
     is the advertised PRODUCT's and the journey is the demo persona's.
     Preserving it is what keeps a plain load unchanged. Picking a
     jurisdiction explicitly is what resolves it. */
  const short = state ? `${jurisdictionName(state)} Life and Health Pre-licensing` : E2E_COURSE_TITLE_SHORT
  return long ? `${short} with Comprehensive Exam Simulators` : short
}
