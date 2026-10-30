import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useFeatureFlag, useFeatureFlags } from '@/context/FeatureFlagContext'
import {
  END_TO_END_VERSION,
  START_POINTS,
  startPointAt,
  resolveStartPoint,
  type StartPoint,
} from './endToEndDemo'
import { clearPartnerCodeAnswer, entryPathFor, useInviteFlow } from '@/data/inviteFlows'
import { INVITE_LOA_PARAM, INVITE_STATE_PARAM } from '@/data/inviteMissingDetails'
import {
  INVITE_FLOW_VERSION_FLAG,
  isInviteFlowPath,
  resolveInviteFlowVersion,
} from '@/data/inviteFlowVersions'
import {
  V3_B2C_CART,
  entryPathV3,
  v3ScreensFor,
  inviteV3Surface,
  useInviteFlowV3,
  useInviteModel,
} from '@/data/inviteFlowsV3'
import { CART_PACKAGE_PARAM } from '@/data/xcelCourseFinder'
import { clearInviteWalk } from '@/data/inviteWalk'
import { clearVerifiedIdentity } from '@/data/inviteVerification'
import { useDeclareDesignSurface } from '@/context/designSurface'

/**
 * THE "START" DEMO CONTROL — `demo-start-point` (2026-10-16), and the route,
 * kept in step. Renamed and widened from `atlas-e2e-page`, Eric's design
 * control for his version's three pages; `archivedItems.ts` carries the
 * re-wire.
 *
 * THE ROUTE IS THE TRUTH, as `useAtlasBackgroundSwitch` treats the version:
 * arriving on a page sets the control to it, and picking an option opens that
 * page. A short settle window after each arrival lets a `?demo=1` flag reset
 * land without being read as a pick. Renders nothing.
 */

export function EndToEndPageSync() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setVariant } = useFeatureFlags()
  /* ⚠ RESOLVED, NOT RAW — 2026-10-20. Four of this control's six options were
     folded into one; a browser still holding `email` or `checkout` would
     otherwise index `START_POINTS` with a key that no longer exists, and the
     control would silently navigate nowhere. */
  const picked = resolveStartPoint(useFeatureFlag('demo-start-point').variant)
  /* ⚠ NO VERSION GATE ANY MORE. `atlas-e2e-page` only synced when the address
     carried Eric's version, because it was his control on his version. Start
     is every version's, so the route alone decides. */
  /* WHICH FLOW, so Start opens the right FIRST SCREEN — 2026-10-22. Every
     invite flow answers to the one "Invite & Checkout" option, but they do not
     share an entry: a guest has no invitation email to click, so opening them
     on one is opening them on a screen their flow has no version of. See
     `entryPathFor`. */
  const entry = useInviteEntryPath()
  const here = startPointAt(pathname, params.get('section'))
  const lastHere = useRef<StartPoint | null | undefined>(undefined)
  const lastPicked = useRef<string | undefined>(undefined)
  const syncUntil = useRef(0)

  useEffect(() => {
    if (lastHere.current !== here) {
      lastHere.current = here
      syncUntil.current = Date.now() + 1500
    }
    const pickedChanged = picked !== lastPicked.current
    lastPicked.current = picked
    if (!here || picked === here) return
    if (Date.now() < syncUntil.current) {
      window.setTimeout(() => setVariant('demo-start-point', here), 0)
      return
    }
    if (!pickedChanged) return
    const target: (typeof START_POINTS)[StartPoint] = START_POINTS[picked]
    if (!target) return
    /* THE ADDRESS IS CARRIED FORWARD, not rebuilt — `?journey=full` and the
       reviewer's version have to survive a jump, or Start would quietly undo
       the walk it is meant to move you around inside. The exception is
       `?section=`, which IS what two of these options mean, and `coursePage`,
       which would otherwise ride along into a page that has no course open. */
    const next = new URLSearchParams(params)
    next.delete('coursePage')
    if (target.section) next.set('section', target.section)
    else next.delete('section')
    /* …except the three End-to-End Demo pages, which pin their own version on
       arrival (`useEndToEndDemoParams`). Setting it here as well keeps the
       jump from flashing the old version's chrome for a tick. */
    const pathname_ = target.pathname.startsWith('/end-to-end-demo') ? entry : target.pathname
    if (pathname_ === '/end-to-end-demo/cart') fillV3Cart(next)
    if (pathname_.startsWith('/end-to-end-demo')) next.set('version', END_TO_END_VERSION)
    navigate(`${pathname_}?${next.toString()}`)
  }, [here, picked, setVariant, navigate, params, entry])

  return null
}

/**
 * CHANGING THE FLOW RE-ENTERS IT AT ITS OWN FIRST SCREEN — 2026-10-22,
 * Jillienne: "im on guest checkout but its not starting at the right page".
 *
 * ⚠ THE SYNC ABOVE ONLY WATCHES THE START CONTROL, which is why this is
 * needed. Picking B2C Guest Checkout from the Invite flow dropdown changed
 * which door that flow uses and nothing re-ran the navigation, so a reviewer
 * who switched while reading the invitation email stayed on the invitation
 * email — a screen the guest flow has no version of, and the exact thing
 * `entryPathFor` exists to prevent.
 *
 * ⚠ IT COMPARES ENTRY PATHS, NOT FLOW IDS, and that distinction is what keeps
 * it from being annoying. B2B2C with email and B2B2C without email share a
 * door, so switching between those two mid-walk leaves a reviewer exactly where
 * they are — which is right, because the difference between them is what
 * CHECKOUT does, and throwing them back to the email to see it would be the
 * control undoing the walk it is meant to move you around inside.
 *
 * ⚠ AND IT DROPS THE PRODUCT PICK. `lstate` / `loa` belong to one journey;
 * carrying Texas Personal Lines from a finished QR walk into a fresh guest walk
 * would skip the finder and leave the options modal quiet on the flow whose
 * signature behaviour is asking.
 */
export function InviteFlowEntrySync() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const entry = useInviteEntryPath()
  const version = resolveInviteFlowVersion(useFeatureFlag(INVITE_FLOW_VERSION_FLAG).variant)
  const model = useInviteModel()
  const v3FlowId = useInviteFlowV3().id
  /* ⚠ ON V3 EVERY FLOW PICK RESTARTS THE WALK — 2026-10-30, Afsana: "when I
     click on another invite flow, it should start at the first screen for that
     respective flow". V1/V2 compare entry paths, so two flows sharing a door
     leave the reviewer where they are (see the note above); V3's flows share
     doors too — four start at the QR code, four at the cart — and differ from
     the very next screen, so V3 compares the FLOW. */
  const key = version === 'v3' ? `v3:${v3FlowId}` : entry
  const lastKey = useRef<string | undefined>(undefined)

  useEffect(() => {
    const previous = lastKey.current
    lastKey.current = key
    /* First render is not a change — never move anyone on arrival, or a pasted
       deep link into the middle of a flow would bounce to its start. */
    if (previous === undefined || previous === key) return
    /* Outside the flow this control means nothing; a reviewer on the dashboard
       who flips it is configuring, not navigating. */
    if (!isInviteFlowPath(pathname)) return
    /* V3 starts the new flow from nothing — no pick, no partner answer, no
       verified address carried over from the last walk. */
    const next = version === 'v3' ? clearInviteWalk(params) : clearPartnerCodeAnswer(params)
    if (version === 'v3') clearVerifiedIdentity()
    next.delete(INVITE_STATE_PARAM)
    next.delete(INVITE_LOA_PARAM)
    if (entry === '/end-to-end-demo/cart') fillV3Cart(next)
    /* `replace`: the page they were on belongs to a flow that is no longer
       selected, so leaving it in history means Back returns them to a screen
       the current flow has no version of — this bug, reached by a different
       button. */
    navigate({ pathname: entry, search: next.toString() }, { replace: true })
  }, [key, version, entry, pathname, params, navigate])

  /* ⚠ ON V3, A SCREEN OUTSIDE THE MODEL'S FLOWS GOES TO ITS FIRST SCREEN —
     2026-10-30, Afsana: "make sure that all the B2C flows start with this
     screen" (the cart). The effect above only moves a walk when the ENTRY
     changes; the Demo bar's Reset (protected, and reading V1/V2's flow), a
     pasted link and the Prototypes row all arrive without one, on the QR
     card or the public homepage. This catches every one of them. */
  useEffect(() => {
    if (version !== 'v3' || !isInviteFlowPath(pathname)) return
    if (v3ScreensFor(model).includes(pathname)) return
    const next = new URLSearchParams(params)
    if (entry === '/end-to-end-demo/cart') fillV3Cart(next)
    navigate({ pathname: entry, search: next.toString() }, { replace: true })
  }, [version, model, pathname, entry, params, navigate])

  return null
}

/** Where the selected flow starts. V3's flows start at their own first screen
 *  — the QR code for B2B, the cart for B2C (`entryPathV3`, 2026-10-30); V1
 *  and V2 keep `entryPathFor`. */
function useInviteEntryPath(): string {
  const flow = useInviteFlow()
  const version = resolveInviteFlowVersion(useFeatureFlag(INVITE_FLOW_VERSION_FLAG).variant)
  const v3 = useInviteFlowV3()
  return version === 'v3' ? entryPathV3(v3) : entryPathFor(flow)
}

/** Only V3's B2C flows START at the cart, so a walk entering there with an
 *  empty cart gets the file's Arizona Health Premier (`V3_B2C_CART`). */
function fillV3Cart(next: URLSearchParams) {
  /* All three or none: a package with no state and line of authority (what
     Reset and a flow switch leave behind) is an empty cart. */
  if (next.has(CART_PACKAGE_PARAM) && next.has(INVITE_STATE_PARAM) && next.has(INVITE_LOA_PARAM)) return
  next.set(INVITE_STATE_PARAM, V3_B2C_CART.lstate)
  next.set(INVITE_LOA_PARAM, V3_B2C_CART.loa)
  next.set(CART_PACKAGE_PARAM, V3_B2C_CART.pkg)
}

/**
 * THE INVITE FLOW SAYS WHAT IT IS — 2026-10-22, so the Design bar carries the
 * flow's own controls there and leaves Atlas's behind.
 *
 * ⚠ ONE COMPONENT, NOT A CALL IN EVERY PAGE. The flow is nine screens and
 * growing; a `useDeclareDesignSurface` in each is nine chances to forget one,
 * and the page that forgot would silently show the wrong bar. The route is
 * what identifies this surface, so the route is what declares it.
 *
 * ⚠ IT MUST MOUNT INSIDE `DesignSurfaceProvider`, which is further in than the
 * other syncs in `AppLayout` — the provider holds the state it writes.
 */
export function InviteSurfaceSync() {
  const { pathname } = useLocation()
  /* V3 declares its own surface, one per model type — `inviteFlowsV3.ts`. */
  const version = resolveInviteFlowVersion(useFeatureFlag(INVITE_FLOW_VERSION_FLAG).variant)
  const model = useInviteModel()
  const surface = version === 'v3' ? inviteV3Surface(model) : 'invite'
  useDeclareDesignSurface(isInviteFlowPath(pathname) ? surface : null)
  return null
}
