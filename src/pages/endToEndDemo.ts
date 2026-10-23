import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCourseDemo, useFeatureFlag } from '@/context/FeatureFlagContext'
import { jurisdictionName } from '@/data/nyProducerRequirements'

/**
 * THE VERSION THE WALK PINS — and it must be the BRAND DEFAULT.
 *
 * ⚠ IT WAS `eric-atlas-e2e` UNTIL 2026-10-20, four hours after the default
 * moved to `jill-atlas-main`, and the gap is the thing this note exists to
 * stop happening again. The Prototypes section's FIRST row — "End-to-End User
 * Experience", under "Final prototype — source of truth" — opens
 * `/end-to-end-demo/email?demo=1&journey=full`, and `EndToEndPageSync` then
 * APPENDS this version to the URL. So the one row that claims to be what the
 * product is right now was pinned to a version the default had already left
 * behind, and every other Prototypes row (which carries no `?version=` and
 * falls through to the default) showed something else. Two answers to "what
 * is the product", from the section whose whole job is to have one.
 *
 * ⚠ IT FAILS SILENTLY, which is why it is pinned by a test rather than by
 * this comment. Both versions render; both are Atlas Homes; the difference on
 * the day of the swap was Step 2 and the pace card. Nobody reading the row
 * would know it was stale — Jillienne asked "make sure its going to be
 * reflected on the final prototype", and it was not.
 *
 * `DefaultVersionReach.test.ts` asserts this equals
 * `defaultDiscoverabilityVersionFor('xcel')`. Move one, move both.
 */
export const END_TO_END_VERSION = 'jill-atlas-main'

/* ───────────────────────────────────────────────────────────────────────────
 *  WHICH JOURNEY IS THIS? — `?journey=full` (2026-10-16)
 *
 *  THE PAGES ARE SHARED; THE JOURNEY IS NOT. `/end-to-end-demo` is opened by
 *  TWO Prototypes rows, and they are asking different questions of the same
 *  three pages:
 *
 *    • Invite & Purchase (Afsana & Eric) — "how does a learner get IN?" The
 *      answer ends when the account exists, which is the spinner. Their row
 *      carries NO journey param and is unchanged by any of this.
 *    • End-to-End User Experience (Jillienne) — "what is the whole product?"
 *      That is invite + Atlas + Compass synced together, and it is the row
 *      Jillienne assembles; the three designers do not merge their surfaces
 *      into each other's. Her row carries `?journey=full`, and that is the
 *      ONLY thing that lets the spinner hand off to the dashboard.
 *
 *  ⚠ A URL PARAM RATHER THAN A FLAG, because the difference is per-ROW and a
 *  flag is per-BUILD. A flag has one value for everyone looking at the site,
 *  so pointing both rows at the same build and asking a flag to tell them
 *  apart cannot work — whichever way it is set, both rows get it. `?section=`
 *  on the Atlas and Compass rows is the same shape and the precedent:
 *  one build, entered differently, the row's address saying how.
 *
 *  The smoke test admits it: it bans `ff` and `version` on a row (those make
 *  a row stop tracking `main`) and nothing else. `journey` pins no flag and
 *  no build — it says which question is being asked of the one build.
 * ─────────────────────────────────────────────────────────────────────────── */
export const E2E_JOURNEY_PARAM = 'journey'
export const E2E_JOURNEY_FULL = 'full'

/** True when the address says this is the WHOLE journey — the End-to-End row's
 *  walk — rather than the invite door on its own. */
export function isFullJourney(params: URLSearchParams): boolean {
  return params.get(E2E_JOURNEY_PARAM) === E2E_JOURNEY_FULL
}

/**
 * COURSE OVERVIEW REACHES COMPASS — on the End-to-End walk only (2026-10-16,
 * Jillienne: "On Atlas Learning, clicking Course Overview, anything that was
 * in Eric's original promotion needs to be removed, as that action will now
 * link up with Anjani's Prototype").
 *
 * This is the Atlas↔Compass seam, and it is the End-to-End row's whole job:
 * the three designers do not wire their surfaces into each other's, Jillienne
 * assembles them. So the link exists on HER walk and nowhere else — Eric's
 * Atlas Learning tile keeps the behaviour he promoted, and his overview, study
 * plan and Rubi Insights pages are untouched in the repo and still reachable
 * from the Atlas Top Nav, so he can keep working on them on his branch
 * (2026-10-16, her condition: "still allow eric to play with those pages on
 * his branch, but not promote it to the prototype"). NOTHING OF HIS IS
 * UNWIRED OR ARCHIVED — if this ever becomes a removal, that is
 * `/archive-a-feature` and Eric's call, not this.
 *
 * It follows the 2026-10-08 decision for the other Course Overview controls
 * ("both land on Anjani's dashboard", see `MembershipOverview`); what is new
 * is that the Atlas course card now does it too, and only here.
 *
 * The flag is the promotion gate: default ON so `promote-to-prototype`
 * surfaces it, OFF restores the inert button this walk had before.
 */
export function useCourseOverviewOpensCompass(): boolean {
  const [params] = useSearchParams()
  const on = useFeatureFlag('e2e-course-overview-opens-compass').enabled
  return on && isFullJourney(params)
}

/** The Compass session player's param — `?section=compass&session=1`, the
 *  lesson view (Contents rail, the video, Rubi beside it). */
export const COMPASS_SESSION_PARAM = 'session'

/**
 * BEGIN COURSE OPENS THE COMPASS SESSION — the walk only (2026-10-16,
 * Jillienne, selecting the button: "make this button go into the compass
 * course").
 *
 * The second half of the Atlas↔Compass seam, and a SEPARATE flag from
 * `e2e-course-overview-opens-compass` on purpose: the two buttons sit side by
 * side but land in different places — Course Overview on Anjani's dashboard
 * (`?section=compass`), Begin Course INSIDE a lesson
 * (`?section=compass&session=1`). They are one decision in practice and two
 * in principle, and a reviewer notices them separately, so they are promoted
 * separately.
 *
 * Scoped the same way, for the same reason: `?journey=full` is the End-to-End
 * row's walk, so Eric's Atlas Learning tile keeps the inert button he
 * promoted. Nothing of his is unwired.
 */
export function useBeginOpensCompassSession(): boolean {
  const [params] = useSearchParams()
  const on = useFeatureFlag('e2e-begin-opens-compass-session').enabled
  return on && isFullJourney(params)
}

/**
 * THE COMPASS SESSION KEEPS THE ATLAS HEADER ON THE WALK (2026-10-16,
 * Jillienne: "this course needs to have a header that matches Atlas header so
 * user can get back to HOME").
 *
 * The third piece of the seam, and the one that closes the loop: Begin Course
 * puts a reviewer inside a lesson, and the session's full-screen arm carries
 * no Home — so without this the walk ends somewhere with no way back to the
 * product.
 *
 * ⚠ IT OVERRIDES `compass-session-chrome`, it does not re-point it. That
 * control is Anjani's (`owner: 'anjani'`), its `full-screen` arm is what
 * ships, and her Compass tile still opens full-screen. This only forces the
 * in-shell arm on `?journey=full`, which is Jillienne's row. Picking
 * `in-shell` on the control still works everywhere, as it always did.
 */
export function useCompassSessionInShell(): boolean {
  const [params] = useSearchParams()
  const on = useFeatureFlag('e2e-session-keeps-atlas-header').enabled
  return on && isFullJourney(params)
}

/**
 * THE STUDY JOURNEY'S STEPS, TIDIED FOR THE WALK (2026-10-16, Jillienne,
 * selecting them one at a time): Step 2's detail becomes the state-exam-date
 * prompt instead of "150 scored questions in 165 minutes. 70% to pass.",
 * Step 3 loses its detail line, and the "<State> State Requirements" button
 * goes.
 *
 * ⚠ THE PROMPT IS MOVED, NOT COPIED. It stood above the steps; on this arm it
 * is Step 2's detail and nowhere else, or the same question is on screen
 * twice.
 *
 * Scoped to `?journey=full` like every other change to this shared Home, so
 * Eric's Atlas Learning tile keeps the steps he promoted — figures, link and
 * requirements button intact.
 */
export function useWalkStudyJourneySteps(): boolean {
  const [params] = useSearchParams()
  const on = useFeatureFlag('e2e-walk-journey-steps').enabled
  return on && isFullJourney(params)
}

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
 *
 * ⚠ IT COPIES `prev` AND ADDS TO IT, which is what carries `?journey=full`
 * across each page's own normalisation. Rebuilding the params from scratch
 * here would silently turn the End-to-End row's walk back into the invite
 * row's, and the only symptom would be the spinner never resolving.
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
/**
 * THE DEMO LEARNER AND THE PARTNER, in one place (2026-10-19).
 *
 * ⚠ THEY WERE SCATTERED AS LITERALS and drifted: the invite flow confirmed a
 * purchase to `jordan.navarro@example.com` while the dashboard's header
 * showed `alicia.navarro@gmail.com`, so the walk mailed one person and
 * signed in another. Named constants are what keep the email page, the
 * confirmation page and the header saying the same thing.
 *
 * ⚠ KEEP JORDAN NAVARRO — 2026-10-19, asked for explicitly alongside the
 * partner rename. The email's design shows a work address at the partner's
 * domain, which suits its story better; adopting it would have recreated
 * exactly the mismatch the constants above exist to prevent, since the
 * dashboard signs the learner in as Navarro.
 */
export const E2E_LEARNER_FIRST = 'Jordan'
export const E2E_LEARNER_NAME = 'Jordan Navarro'
export const E2E_LEARNER_EMAIL = 'jordan.navarro@gmail.com'

/** …and the phone the checkout's address block has always displayed, named so
 *  the Guest form's demo fill and that block cannot drift apart. */
export const E2E_LEARNER_PHONE = '555 010 0199'

/**
 * ⚠ THE PARTNER IS SUNRISE BANK, EVERYWHERE — 2026-10-19 ("use Sunrise Bank
 * everywhere, keep Jordan Navarro"). It was "Pristine Solutions Financial
 * Services Group LLC", the Figma's own name, and the invitation email's
 * design introduced Sunrise Bank alongside it — so for one commit the walk
 * opened on a Sunrise Bank letter and landed on a Pristine Solutions page.
 * Both were invented; this settles it on the shorter one, and ONE constant
 * now feeds the email, the Product Detail page and the partner header so the
 * three cannot part company again.
 */
export const E2E_PARTNER_NAME = 'Sunrise Bank'

/**
 * The rest of the invitation's scenario — the office the recruit is joining
 * and the admin who sent for them. Email-only: no other page in the flow
 * mentions either.
 */
export const E2E_EMAIL_OFFICE = 'Tampa Office'
export const E2E_EMAIL_ADMIN = 'Cody McClintock'

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

/**
 * WHERE THE START CONTROL CAN OPEN THE DEMO — three options since 2026-10-20,
 * six before it (Jillienne: "Lets COmbine Email, invite, Checkout, and
 * Confirmation into 1 Invite & Checkout flow").
 *
 * ⚠ THE FOUR WERE ONE JOURNEY LISTED AS FOUR DOORS. Email → Invite →
 * Checkout → Confirmation is a single path a learner walks end to end; the
 * control offered each screen of it beside Atlas and Compass, which are whole
 * surfaces. So two thirds of the menu was one flow, and a stakeholder reading
 * it had to already know that to see the three real choices.
 *
 * ⚠ `also` IS THE REVERSE LOOKUP, and it is why this is a table rather than a
 * string map. The control is route-is-the-truth both ways: picking an option
 * navigates to `pathname`, and ARRIVING anywhere the option owns ticks it. The
 * combined option goes to the Email — the flow's first screen — but answers to
 * all four, so walking Email → Checkout no longer makes the control jump
 * between entries mid-journey. It reads "Invite & Checkout" for the whole
 * walk, which is what the flow is.
 */
export const START_POINTS = {
  'invite-checkout': {
    pathname: '/end-to-end-demo/email',
    section: null,
    /* ⚠ WHOLE PATHNAMES, NOT PREFIXES — `startAt` matches exactly, which is
       what lets `/end-to-end-demo/email` and `/end-to-end-demo` be different
       entries in a list where one path is the other's child. */
    /* ⚠ THE GUEST JOURNEY'S TWO PUBLIC-SITE SCREENS JOINED THIS LIST on
       2026-10-22. They are part of the same walk — a guest's way IN — so the
       control must stay lit on them; without that it goes quiet for the first
       two screens of a flow it is supposed to name, which reads as the demo
       having left the invite flow entirely. */
    also: [
      '/end-to-end-demo',
      '/end-to-end-demo/find',
      '/end-to-end-demo/packages',
      '/end-to-end-demo/cart',
      '/end-to-end-demo/partner-code',
      '/end-to-end-demo/order-confirmation',
      '/end-to-end-demo/activation-email',
      '/end-to-end-demo/checkout',
      '/end-to-end-demo/confirmation',
    ],
  },
  atlas: { pathname: '/dashboard-rebrand', section: null },
  compass: { pathname: '/dashboard-rebrand', section: 'compass' },
} as const
export type StartPoint = keyof typeof START_POINTS

/**
 * A stored Start value -> an option that still exists.
 *
 * ⚠ IT EXISTS FOR THE FOUR IDS THAT WENT. `demo-start-point` is in
 * `cgp.featureFlags` in every browser that has opened the demo, and most of
 * them hold `email`, `invite`, `checkout` or `confirmation`. Without this the
 * dropdown ticks NOTHING, its label falls back to "Atlas" while the page is on
 * the invite, and `START_POINTS[picked]` is undefined so the control navigates
 * nowhere — a dead control on exactly the machines that have used it.
 */
export function resolveStartPoint(value: string | undefined): StartPoint {
  if (value === 'atlas' || value === 'compass' || value === 'invite-checkout') return value
  if (value === 'email' || value === 'invite' || value === 'checkout' || value === 'confirmation') {
    return 'invite-checkout'
  }
  return 'atlas'
}

/** The Start option this address IS, or null for a page the control does not
 *  name (a course page, Certificates — it goes quiet rather than claiming one
 *  of its three). */
export function startPointAt(pathname: string, section: string | null): StartPoint | null {
  const hits = (Object.keys(START_POINTS) as StartPoint[]).filter((k) => {
    const p = START_POINTS[k]
    const also: readonly string[] = 'also' in p ? p.also : []
    return p.pathname === pathname || also.includes(pathname)
  })
  if (hits.length === 0) return null
  /* ⚠ SECTION DECIDES BETWEEN THE TWO DASHBOARD OPTIONS, and the match has to
     be exact in BOTH directions: `compass` only when `?section=compass`, and
     `atlas` only when there is no section at all. Falling back to `atlas` for
     any unmatched section would light the control up on Certificates and the
     course pages, which is a claim the page does not support. */
  const exact = hits.find((k) => (START_POINTS[k].section ?? null) === section)
  return exact ?? null
}
