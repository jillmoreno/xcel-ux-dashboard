import { CART_PACKAGE_PARAM } from '@/data/xcelCourseFinder'
import { INVITE_LOA_PARAM, INVITE_STATE_PARAM } from '@/data/inviteMissingDetails'
import { EMAIL_VERIFIED_PARAM } from '@/data/inviteVerification'
import {
  EMAIL_VALIDATED_PARAM,
  PARTNER_CODE_PARAM,
  entryPathFor,
  type InviteFlowId,
} from '@/data/inviteFlows'

/**
 * PUTTING THE WALK BACK TO ITS BEGINNING — 2026-10-23, Jillienne of the Reset
 * button: "this button should refresh the current Start, and invite flow at
 * the beginning screen, it doesnt seem to be working?"
 *
 * It wasn't. Reset restored the DASHBOARD's scenario — tier, progress,
 * education, course, the access window — and left the invite walk exactly
 * where it stood: still on the order confirmation, still validated, still
 * holding the state, the line of authority, the package and the partner
 * answer. Pressing it mid-walk changed one query parameter nobody was looking
 * at.
 *
 * ⚠ IT KEEPS THE START AND THE FLOW, which is the whole phrasing of the ask —
 * "the CURRENT Start, and invite flow". Reset restarts the walk you are on; it
 * does not decide you wanted a different one. The Invite flow control is how
 * you change flows, and it already returns you to that flow's own first
 * screen.
 *
 * ⚠ A SEPARATE MODULE BECAUSE OF THE IMPORT DIRECTION. The three parameter
 * names live in three places and `inviteMissingDetails` already imports
 * `inviteFlows`, so collecting them in either would be a cycle. Nothing
 * imports this one.
 */

/**
 * Everything the walk ACCUMULATES — what the learner picked, bought, answered
 * and proved, as opposed to how the demo is configured.
 *
 * ⚠ THE DEMO'S OWN PARAMETERS ARE NOT HERE: `demo`, `version`, `journey` and
 * the flag pin say what build you are looking at, and a reviewer who reset the
 * walk did not ask to leave the demo.
 */
export const INVITE_WALK_PARAMS: readonly string[] = [
  INVITE_STATE_PARAM,
  INVITE_LOA_PARAM,
  CART_PACKAGE_PARAM,
  PARTNER_CODE_PARAM,
  EMAIL_VALIDATED_PARAM,
  /* The verified arm's "I proved my address" — 2026-10-27. Reset puts the
     modal back in front of the checkout, which is the walk's beginning there. */
  EMAIL_VERIFIED_PARAM,
]

/** The same parameters, minus the walk's progress. Does not mutate its input. */
export function clearInviteWalk(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params)
  for (const key of INVITE_WALK_PARAMS) next.delete(key)
  return next
}

/**
 * Where the walk begins for a flow — the guest's public homepage, the invited
 * arms' invitation email, the broadcast link's product page.
 *
 * ⚠ NOT `START_POINTS['invite-checkout'].pathname`. That is one fixed
 * path (`/end-to-end-demo/email`) and the beginning of the walk depends on the
 * FLOW: sending a guest to an invitation they never received is the thing this
 * flow spent a day learning not to do.
 */
export function inviteWalkStart(flow: InviteFlowId): string {
  return entryPathFor(flow)
}
