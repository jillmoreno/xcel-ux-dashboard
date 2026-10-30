import { useSearchParams } from 'react-router-dom'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { ALL_US_STATES } from '@/data/licensedStatesFixtures'
import { FINDER_LINES_OF_AUTHORITY } from '@/data/xcelCourseFinder'
import { productUnknownFor, useInviteFlow } from '@/data/inviteFlows'

/**
 * THE INCOMPLETE INVITATION — 2026-10-22, Jillienne's brief: "if the user
 * clicks on the email invite, but the recruiter did not enter a state or line
 * of authority for the user, so when they get to the XCEL website, we do not
 * know this information and do not know what product to show them, we need to
 * trigger a modal to show the users the options."
 *
 * ⚠ THE MODAL IS NOT THE FEATURE — the missing information is. What a
 * recruiter leaves blank is a (state, line of authority) pair, and that pair is
 * precisely what names the product: "Florida Life & Health Pre-licensing" is a
 * state and a line of authority with a suffix. So the arm with the modal is the
 * arm where the invite door does not yet know what it is selling, and the modal
 * is how it finds out. Anything that treats it as a dialog to dismiss will get
 * the empty product-detail page wrong.
 *
 * ⚠ THE ANSWER LIVES IN THE URL, not in page state. The learner picks on
 * Invited Product Detail and the choice has to survive two more navigations —
 * checkout and confirmation both name the product. The flow already hands its
 * whole query string forward from page to page (see `InvitedProductDetailPage`
 * and the note on `useEndToEndDemoParams`), so the URL is the one carrier that
 * works without a new provider, and a reviewer can paste a link to a chosen
 * combination.
 */

export const INVITE_MISSING_DETAILS_FLAG = 'invite-missing-details'

/** The chosen state, and the chosen line of authority, in the address. */
export const INVITE_STATE_PARAM = 'lstate'
export const INVITE_LOA_PARAM = 'loa'

/**
 * The lines of authority the invite door can sell — ALL SIX, the catalogue's
 * own Get License list (2026-10-23, Jillienne of this modal: "this modal needs
 * to include all of these lines of authority").
 *
 * ⚠ IT WAS THREE, AND THEY CAME FROM THE WRONG PLACE. The three were
 * `licensedStatesFixtures`', on the reasoning that a learner who picks
 * Property & Casualty must land on a dashboard that knows what that is. But
 * that fixture answers "which licences does this learner HOLD", and this modal
 * asks "what do you want to BUY" — so it was offering a subset of the shop
 * because of what the shelf at home looks like. Life, Health and Securities
 * are all sold on xcelsolutions.com and none of them was pickable here.
 *
 * ⚠ AND THE SPELLING CHANGES WITH IT: "Life and Health", not "Life & Health".
 * The catalogue spells it out and so does every other screen in this flow —
 * the course page, the cart, the checkout, the receipt. The modal was the one
 * place answering in a different dialect, and because `inviteProductTitle`
 * composes the product name from this pick, the ampersand followed the learner
 * all the way to their receipt.
 *
 * ⚠ IMPORTED, NOT RESTATED. The previous list was copied out by hand with a
 * note explaining why; a hand copy is how the two spellings diverged in the
 * first place. `GET_LICENSE_NAV` is the one place the catalogue's own list
 * lives.
 */
export const INVITE_LINES_OF_AUTHORITY = FINDER_LINES_OF_AUTHORITY

/* ⚠ NO SECURITIES (2026-10-30, Eric: "remove"). It was here as the Get License nav's sixth entry, but it is a different kind of
   product, not a line of authority (`GET_LICENSE_NAV`'s own note), so the modal offers the five lines of authority alone. The nav
   keeps it. Back to `GET_LICENSE_NAV` above to restore. */

export type InviteLineOfAuthority = (typeof INVITE_LINES_OF_AUTHORITY)[number]

/**
 * The states the invite door offers — ALL FIFTY, from `ALL_US_STATES`.
 *
 * ⚠ IT WAS FIVE UNTIL 2026-10-22, and the argument for five was real: forty-five
 * of these resolve to a course nothing in the prototype can show, and a picker
 * whose options mostly lead nowhere teaches a reviewer the wrong thing. What
 * changed is the CONTROL, not that argument (Jillienne: "make the state a type
 * ahead search field that will narrow down the states, we dont want to have to
 * show 50 pills in a modal"). A learner in Ohio typing "Ohio" and finding
 * nothing is a product that does not sell in Ohio — which is a worse lie than a
 * course whose body copy is generic. A search field makes fifty cost the same
 * as five to show, so the honest list wins.
 *
 * ⚠ IMPORTED, NOT RESTATED. `licensedStatesFixtures` owns this list; a second
 * copy is a spelling difference waiting to happen between this picker and the
 * dashboard's.
 */
export const INVITE_STATES: readonly string[] = ALL_US_STATES

/**
 * ⚠ `string`, NOT A LITERAL UNION, because `ALL_US_STATES` is a `string[]` and
 * there is nothing to derive a union from. The guard is therefore at RUNTIME
 * (`readInviteChoice`), which is where it has to be anyway: the value arrives
 * from the address bar, so the compiler was never going to be the thing that
 * caught "Atlantis".
 */
export type InviteState = string

export type InviteProductChoice = {
  state: InviteState
  lineOfAuthority: InviteLineOfAuthority
}

function isState(v: string | null): v is InviteState {
  return v != null && INVITE_STATES.includes(v)
}

function isLineOfAuthority(v: string | null): v is InviteLineOfAuthority {
  return v != null && (INVITE_LINES_OF_AUTHORITY as readonly string[]).includes(v)
}

/**
 * The product a (state, line of authority) pair names.
 *
 * ⚠ COMPOSED, NOT LOOKED UP, and that is a prototype decision worth stating.
 * The real catalog would resolve this pair to a real SKU with its own price and
 * contents; here the title is built from the pair because the point being
 * explored is whether ASKING works, not what the catalog returns. If a price or
 * a contents list ever has to change with the pick, this function is where a
 * real lookup goes, and every caller already routes through it.
 */
export function inviteProductTitle(choice: InviteProductChoice): string {
  return `${choice.state} ${choice.lineOfAuthority} Pre-licensing`
}

/** Reads the pair out of the address; null until both halves are chosen. */
export function readInviteChoice(params: URLSearchParams): InviteProductChoice | null {
  const state = params.get(INVITE_STATE_PARAM)
  const lineOfAuthority = params.get(INVITE_LOA_PARAM)
  if (!isState(state) || !isLineOfAuthority(lineOfAuthority)) return null
  return { state, lineOfAuthority }
}

/**
 * Is the invitation missing its details — and so, does the flow have to ask?
 *
 * ⚠ TRUE ONLY UNTIL THEY ANSWER. The flag says the recruiter left the fields
 * blank; it does not say the modal is open. Once the learner has picked, the
 * pair is in the address and the flow knows what it is selling, so a reload or
 * a step forward must NOT ask again — which is what separates this from reading
 * the flag directly at the modal's mount.
 */
export function useInviteDetailsMissing(): boolean {
  const enabled = useFeatureFlag(INVITE_MISSING_DETAILS_FLAG).enabled
  /* ⚠ TWO REASONS THE PRODUCT CAN BE UNKNOWN, AND ONLY ONE IS A TOGGLE —
     2026-10-22, with the four flows. On an invited flow it is a recruiter's
     OMISSION, which is what the flag explores. On QR / social it is INHERENT:
     a poster's code and a social post are one link shown to everybody, with no
     field on them for anyone to fill in a state or a line of authority. So the
     toggle stays for the invited flows, and that flow answers yes on its own —
     otherwise a reviewer picking it from the dropdown would land on a product
     page confidently selling a Florida course to someone who scanned a code in
     Texas. */
  const flow = useInviteFlow()
  const [params] = useSearchParams()
  return (enabled || productUnknownFor(flow)) && readInviteChoice(params) == null
}

/** The learner's pick, or null on the arm where the recruiter supplied it. */
export function useInviteChoice(): InviteProductChoice | null {
  const [params] = useSearchParams()
  return readInviteChoice(params)
}

/**
 * The states matching what has been typed, best first.
 *
 * ⚠ PREFIX MATCHES BEFORE CONTAINED ONES, which is the whole value of the
 * ranking: typing "ar" should offer Arizona and Arkansas before Maryland and
 * Nebraska, because someone typing the first letters of a name is naming it,
 * while a match in the middle is a coincidence. Alphabetical within each
 * group, because the source list already is and a stable order is what makes
 * arrow-key navigation predictable.
 *
 * ⚠ AN EMPTY QUERY RETURNS EVERYTHING, deliberately. Focusing the field with
 * nothing typed shows the whole list to scroll — a learner who is not sure how
 * their state is spelled, or who wants to browse, is not forced to guess a
 * first letter before the control will show them anything.
 */
export function matchingStates(query: string): string[] {
  const q = query.trim().toLowerCase()
  if (q === '') return [...INVITE_STATES]
  const starts: string[] = []
  const contains: string[] = []
  for (const state of INVITE_STATES) {
    const lower = state.toLowerCase()
    if (lower.startsWith(q)) starts.push(state)
    else if (lower.includes(q)) contains.push(state)
  }
  return [...starts, ...contains]
}
