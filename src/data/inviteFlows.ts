import { useSearchParams } from 'react-router-dom'
import { useFeatureFlag } from '@/context/FeatureFlagContext'

/**
 * THE FOUR INVITE FLOWS — 2026-10-22, Jillienne: "i think i need 1 refinement
 * row where we can review all of the different flows, so maybe that is a design
 * tool dropdown to select which flow we are working through?"
 *
 * ⚠ ONE CONTROL, ONE ROW, FOUR FLOWS — and that shape is the point, not a
 * convenience. Four Refinement rows for four arms of one build is four links
 * that go stale separately and four things to keep in your head; one row whose
 * build carries a flow picker is a single address that always shows all four.
 * It is also the only shape the repo's own rule allows comfortably: Refinement
 * takes any number of rows, but each row is a BUILD, and these four are one
 * build with an axis.
 *
 * ⚠ IT WAS `checkout-audience` WITH THREE ARMS (B2B / B2C / Guest) FOR HALF A
 * DAY, and the rename is not cosmetic — the old names collapsed two questions
 * into one. Jillienne's four separate them:
 *
 *   WHO SENT THEM        — a partner (B2B2C), or nobody (B2C direct)
 *   WHAT THAT CARRIED    — the person's details, their email, or nothing
 *
 * The predicates below are those questions asked one at a time. Every page
 * asks a predicate rather than comparing to a flow by name, so a fifth flow is
 * a row here plus an answer to each question — not a search for every `===`
 * across three files.
 */

export type InviteFlowId =
  /** A partner invited this person and supplied their email. */
  | 'b2b2c-email'
  /** A partner invited this person but left the email out. */
  | 'b2b2c-no-email'
  /** No partner, no invitation. They found XCEL and bought. */
  | 'b2c-guest'
  /** A partner's QR code or social post. Partner-attributed, but a broadcast
   *  link knows nothing about whoever scanned it. */
  | 'qr-social'
  /** A partner invited this person and left the email out — and the learner
   *  PROVES the address before checkout: name and email in a modal, a 6-digit
   *  code to that address, the code typed back. From there the address is as
   *  known as if the partner had supplied it. 2026-10-27. */
  | 'b2b2c-verified'
  /** Already an XCEL customer, signed in to xcelsolutions.com. No partner, no
   *  invitation; the site knows who they are, so checkout arrives filled in
   *  and the email is the account's — and the learning dashboard still needs
   *  a password of its own, set on the confirmation page. 2026-10-27. */
  | 'xcel-signed-in'

export const INVITE_FLOW_FLAG = 'invite-flow-journey'

/**
 * ⚠ `b2c-guest` SINCE 2026-10-23 (was `b2b2c-email`) — Jillienne, of the
 * Prototypes row: "clicking on this should default to the guest view".
 *
 * ⚠ THIS IS A BASELINE CHANGE, NOT A PREFERENCE. It decides what a bare
 * `/end-to-end-demo` link shows — the Prototypes row, a pasted address, a
 * stakeholder following a link in Slack — so it is `promote-to-prototype`'s
 * decision and the owner's, which is how it was made.
 *
 * Why the guest: it is the LONGEST of the four and the only one that starts
 * outside the product, on xcelsolutions.com. Every screen the other three
 * touch, it also touches, plus five of its own — so the flow a stranger
 * lands in shows the most of what has been built, and the three invited arms
 * are one control away. `b2b2c-email` was the default while it was the only
 * arm there was.
 */
export const DEFAULT_INVITE_FLOW: InviteFlowId = 'b2c-guest'

export function resolveInviteFlow(value: string | null | undefined): InviteFlowId {
  switch (value) {
    case 'b2b2c-email':
    case 'b2b2c-no-email':
    case 'b2c-guest':
    case 'qr-social':
    case 'b2b2c-verified':
    case 'xcel-signed-in':
      return value
    default:
      return DEFAULT_INVITE_FLOW
  }
}

export function useInviteFlow(): InviteFlowId {
  return resolveInviteFlow(useFeatureFlag(INVITE_FLOW_FLAG).variant)
}

/* ── The questions each page asks ──────────────────────────────────────── */

/**
 * Is a partner behind this purchase — and so, does the partner header show, and
 * does the partner price apply?
 *
 * ⚠ THIS IS WHAT MAKES `qr-social` ITS OWN FLOW rather than a second name for
 * guest checkout. A QR code in a branch office or a link on a partner's social
 * account is partner-ATTRIBUTED — the discount is the whole reason the partner
 * posted it — while knowing nothing whatever about the person who scanned it.
 * Partner pricing without an individual invitation is the combination none of
 * the other three cover.
 */
export function partnerAttributed(flow: InviteFlowId): boolean {
  /* The two public-site arms: a stranger, and a returning customer whose
     account carries no partner (2026-10-27 — see `signedIn`). */
  return flow !== 'b2c-guest' && !signedIn(flow)
}

/**
 * Did an invitation name THIS PERSON — so the page may say "you've been
 * invited" and show their name and address?
 *
 * ⚠ NOT THE SAME AS `partnerAttributed`. `qr-social` has a partner and no
 * individual invitation, which is exactly the pair that makes the welcome
 * banner lie if the two questions are collapsed into one.
 */
export function individuallyInvited(flow: InviteFlowId): boolean {
  return flow === 'b2b2c-email' || flow === 'b2b2c-no-email' || flow === 'b2b2c-verified'
}

/**
 * Does the learner prove their email BEFORE the checkout opens — name and
 * address in a modal, a 6-digit code sent to it, the code typed back?
 *
 * ⚠ 2026-10-27, Jillienne: "another invite flow, that includes a modal prior
 * to the checkout flow that requires the first name, last name, and email
 * address, and this will send a 6-digit pin to the users email that they will
 * need to enter before they can continue with the checkout flow."
 *
 * ⚠ ITS OWN QUESTION, because two others follow from it. Once a code has come
 * back from an address, that address is as known as one the partner supplied:
 * it is not typed twice at checkout and the password is set inline. Both of
 * those predicates ask this one rather than naming the flow, so the day a
 * second flow verifies up front it gets the same downstream answers for free.
 * The modal itself, the code and where the identity is kept are in
 * `inviteVerification.ts`.
 */
export function verifiesEmailBeforeCheckout(flow: InviteFlowId): boolean {
  return flow === 'b2b2c-verified'
}

/**
 * Is the learner already an XCEL customer, signed in to the public site?
 *
 * ⚠ 2026-10-27, Jillienne: "another invite flow that is for a user that is
 * already logged into the Xcel site, but when they complete their purchase,
 * they will need to create a new password. So there would be an email field,
 * and a create password field. With a message indicating they need a new
 * password."
 *
 * The site knows this person: the header shows My Training instead of Log In,
 * the student information arrives filled from the account and Payment is
 * open on arrival, and the email is the account's — locked, not typed twice.
 * It is not asked for a partner code either: an account created through a
 * partner site already carries that affiliation, and a question the account
 * has answered is not asked again in the middle of a purchase.
 *
 * ⚠ THE PASSWORD IS STILL SET, and that is the arm's whole point. The
 * learning dashboard is a NEW account beside the XCEL site's, with its own
 * password; the confirmation page says so above the field rather than
 * presenting a password prompt to someone who believes they already have one.
 * `passwordSetFromEmailedLink` is false here for the with-email arm's reason —
 * the address is one XCEL has already reached this learner at.
 */
export function signedIn(flow: InviteFlowId): boolean {
  return flow === 'xcel-signed-in'
}

/*
 * ⚠ `studentDetailsKnown` IS GONE — 2026-10-23, Jillienne: "its both - remove
 * the known details path."
 *
 * It asked whether the invitation carried the learner's NAME AND ADDRESS, and
 * for a day it was simply `individuallyInvited` under a second name. Then the
 * with-email arm turned out to know only the email, and the question became:
 * which arm knows more? The answer is neither. A recruiter inviting someone
 * types the least they can get away with — a way to CONTACT them — and never
 * their home address and phone number. So all four flows open the student form
 * empty, the learner fills it in, and Payment stays closed until they press
 * Save and continue.
 *
 * A predicate every flow answers the same way is not a predicate; it was
 * removed rather than left returning `false` forever, along with the filled
 * address display and the "Edit Student Information" expander it gated in
 * `InvitedCheckoutPageV2`. **V1 keeps both** — `InvitedCheckoutPage.tsx` is
 * untouched and still opens on Jordan's address behind an Edit expander, which
 * is where to look for how that path was built if it is ever wanted back.
 */

/**
 * Does the learner type their address twice — the first field masked?
 *
 * Every flow but `b2b2c-email` and `b2b2c-verified`, and for one reason: those
 * are the flows where the address is already known to be reachable — supplied
 * by someone who had it, or proven by a code sent to it. Everywhere else it is
 * typed, so producing it twice is the only evidence it can be reached.
 */
export function emailEnteredTwice(flow: InviteFlowId): boolean {
  /* ⚠ AND NOT THE VERIFIED ARM EITHER (2026-10-27): a code has already come
     back from that address, which is better evidence than a second typing.
     Nor the signed-in arm: the address is the account's. */
  return flow !== 'b2b2c-email' && !verifiesEmailBeforeCheckout(flow) && !signedIn(flow)
}

/**
 * Does the password get set from a link in the confirmation email, rather than
 * inline on Confirmation & Password?
 *
 * ⚠ THE SAME FLOWS AS `emailEnteredTwice`, AND KEPT AS ITS OWN QUESTION. The
 * two say different things ("how is the address captured" vs "where is the
 * password set"), they are read on different pages, and a flow could answer
 * them differently — a guest checkout that creates no account at all would
 * still type its email twice and have no password step to send anyone to.
 * Collapsing them is a one-line edit the day that stops being true, and an
 * unfindable bug if they were ever one predicate.
 */
export function passwordSetFromEmailedLink(flow: InviteFlowId): boolean {
  /* The verified arm proved the address before paying, so there is nothing
     left for a mailed link to prove — the password is set inline. The
     signed-in arm's address is one XCEL already reaches them at; same answer. */
  return flow !== 'b2b2c-email' && !verifiesEmailBeforeCheckout(flow) && !signedIn(flow)
}

/**
 * Does this flow arrive already knowing which PRODUCT the learner wants?
 *
 * ⚠ INHERENT FOR `qr-social`, not a setting. A poster's QR code and a social
 * post are one link shown to everybody — there is no field on them for a
 * recruiter to fill in a state or a line of authority, so the product question
 * is always open on that flow. On the invited flows it is a recruiter's
 * omission, which is what the separate `invite-missing-details` toggle
 * explores; see `useInviteDetailsMissing`.
 */
export function productUnknownFor(flow: InviteFlowId): boolean {
  return flow === 'qr-social'
}

/* ── Email helpers ─────────────────────────────────────────────────────── */

/**
 * Do the two addresses match?
 *
 * ⚠ TRIMMED AND CASE-FOLDED, deliberately. A trailing space from a paste, or
 * `Jordan@` against `jordan@`, is the same mailbox — failing those would be the
 * form inventing a mismatch the mail server does not have, and the learner
 * cannot SEE the first field to work out what it is objecting to.
 */
export function emailsMatch(first: string, second: string): boolean {
  return first.trim().toLowerCase() === second.trim().toLowerCase()
}

/** Enough of an address to be worth comparing. Deliberately loose — this is a
 *  prototype's "looks like an email", not a validator. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * THE STUDENT INFORMATION GUEST CHECKOUT GATES PAYMENT ON — 2026-10-22,
 * Jillienne: "the payment section is not available until the student
 * information is fulled out".
 *
 * ⚠ WHAT COUNTS AS "FILLED OUT" IS A DECISION, so it is one function rather
 * than a condition written at the gate. Name, street, city, state and ZIP are
 * required; Street Address line 2 is not (the form itself marks it optional)
 * and Country is a single-option select that cannot be empty. The email is
 * required too and has to AGREE with its confirmation — a learner with a typo
 * in their address and no partner behind them has no account to recover and
 * nobody to ask, so reaching payment on an unconfirmed address is the one
 * failure these flows cannot absorb.
 *
 * ⚠ TRIMMED, so a field holding a space is not "filled". That is the whole
 * difference between gating on content and gating on keystrokes.
 */
export function studentInformationComplete(details: {
  first: string
  last: string
  street: string
  state: string
  city: string
  zip: string
  /** Marked required on the form (2026-10-22), so it counts here too — a
   *  starred field the gate ignores teaches reviewers that the star means
   *  nothing. */
  phone: string
  email: string
  emailAgain: string
}): boolean {
  const required = [
    details.first,
    details.last,
    details.street,
    details.state,
    details.city,
    details.zip,
    details.phone,
  ]
  if (required.some((v) => v.trim() === '')) return false
  return looksLikeEmail(details.email) && emailsMatch(details.email, details.emailAgain)
}

/**
 * WHERE THIS FLOW STARTS — 2026-10-22, Jillienne: "Guest Checkout. Needs to
 * start sooner."
 *
 * ⚠ THE INVITED FLOWS START AT THE EMAIL; THE OTHER TWO DO NOT HAVE ONE. A
 * guest found XCEL on their own and a QR code was scanned off a poster —
 * neither received a letter, so opening the demo on an invitation email is
 * opening it on a screen that flow has no version of.
 *
 * Guest starts on the public site's course finder, which is where a stranger
 * actually begins. QR / social starts at the PRODUCT page: a code links
 * straight to an offer, which is why that flow arrives partner-attributed with
 * nothing known about the person and meets the options modal immediately.
 */
export function entryPathFor(flow: InviteFlowId): string {
  switch (flow) {
    /* A signed-in customer starts where a guest does — on the public site —
       with the header already knowing them (2026-10-27). */
    case 'b2c-guest':
    case 'xcel-signed-in':
      return '/end-to-end-demo/find'
    case 'qr-social':
      /* ⚠ THE PARTNER'S SHARE CARD, SINCE 2026-10-23 — this arm used to open
         the Invited Product Detail page, which is where a SCAN lands. Starting
         there skipped the only screen that explains where the link came from,
         and left the one flow that begins outside the learner's hands looking
         identical to the three that don't. */
      return '/end-to-end-demo/qr'
    default:
      return '/end-to-end-demo/email'
  }
}

/* ── The Partner Code question ─────────────────────────────────────────── */

/**
 * WHERE "Do you have a Partner Code?" IS ASKED — 2026-10-22, Jillienne: "i
 * think we should explore a variant of this simply showing over the checkout
 * screen in a simple modal instead of taking user to another page right away.
 * make it a toggle to compare both versions?"
 *
 * `page` — its own step between the cart and the checkout.
 * `modal` — over the checkout, so the learner never leaves the page they came
 *           to pay on.
 *
 * ⚠ IT IS A PRESENTATION AXIS, NOT A BEHAVIOUR ONE. Both arms ask the same
 * question, accept the same two answers and have the same consequence; the
 * only difference is what is drawn around it. That is what makes the toggle a
 * comparison rather than two features.
 */
export const PARTNER_CODE_ASK_FLAG = 'partner-code-ask'

export type PartnerCodeAskStyle = 'page' | 'modal'

/* ⚠ `modal` SINCE 2026-10-22, the direct ask. It was `page` because that is
   the arm the design showed first; the modal is the one being taken forward,
   so it is what a bare load opens on. The resolver's fallback moves with the
   flag's default deliberately — a browser holding a dropped value should land
   where a fresh visit lands, not on the arm nobody chose. */
export const DEFAULT_PARTNER_CODE_ASK: PartnerCodeAskStyle = 'modal'

export function resolvePartnerCodeAsk(value: string | null | undefined): PartnerCodeAskStyle {
  return value === 'page' || value === 'modal' ? value : DEFAULT_PARTNER_CODE_ASK
}

export function usePartnerCodeAsk(): PartnerCodeAskStyle {
  return resolvePartnerCodeAsk(useFeatureFlag(PARTNER_CODE_ASK_FLAG).variant)
}

/** The answer, in the address — so it is not asked twice and a reviewer can
 *  link to either side of it. */
export const PARTNER_CODE_PARAM = 'partner'

/**
 * Is this purchase partner-attributed, counting the learner's own answer?
 *
 * ⚠ AN ANSWERED "YES" OVERRIDES THE FLOW, and that is the point of asking. A
 * guest is `b2c-guest` — no partner — right up until they say they have a code,
 * at which moment they are exactly what `qr-social` is: partner pricing,
 * nobody identified. Without this the question is a dialog that changes
 * nothing, and the two arms of the toggle would be two ways of showing the
 * same inert screen.
 */
export function usePartnerAttribution(): boolean {
  const flow = useInviteFlow()
  const [params] = useSearchParams()
  return partnerAttributed(flow) || params.get(PARTNER_CODE_PARAM) === 'yes'
}

/** Has the question been answered yet? */
export function usePartnerCodeAnswered(): boolean {
  const [params] = useSearchParams()
  const answer = params.get(PARTNER_CODE_PARAM)
  return answer === 'yes' || answer === 'no'
}

/**
 * Does this flow ask at all?
 *
 * ⚠ ONLY THE FLOWS WITH NO PARTNER ALREADY. An invited learner's partner is
 * named on the invitation and a scanned code carries its own attribution —
 * asking either of them whether they have a partner code is asking a question
 * the flow already answered, in the middle of a purchase.
 */
export function asksForPartnerCode(flow: InviteFlowId): boolean {
  /* ⚠ NOR A SIGNED-IN ACCOUNT (2026-10-27) — see `signedIn`: the account
     already carries its affiliation, or its absence. */
  return !partnerAttributed(flow) && !signedIn(flow)
}

/**
 * Drop the partner-code answer, because a NEW purchase has started.
 *
 * ⚠ THE ANSWER BELONGS TO ONE CART, and the flow's habit of carrying its whole
 * query string forward is what made that go wrong: once `partner=no` was set it
 * rode along through every later navigation — back through the cart, back
 * through the package page, back to the finder — so the second walk down the
 * guest flow was never asked the question at all, on either arm. The symptom is
 * the worst kind: nothing appears, and the control that is supposed to be
 * compared looks broken rather than answered.
 *
 * So every point that starts a fresh selection or a fresh cart calls this: the
 * nav's Get License pick, the homepage finder, Add to Cart, Remove, and
 * re-entering the flow at a new door. One helper rather than five `delete`
 * calls, so a sixth entry point has one thing to remember.
 */
export function clearPartnerCodeAnswer(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete(PARTNER_CODE_PARAM)
  return next
}

/* ── Which thank-you page the guest flow ends on ───────────────────────── */

/**
 * THE ORDER CONFIRMATION'S STYLE — 2026-10-22, Jillienne: "i want another
 * version of this thank you page, use a feature flag dropdown to show
 * different ones".
 *
 * `receipt` — the public site's own: full width, order number, Launch Student
 *             Portal, the two Order Details panels.
 * `split`   — the confirmation as a dark receipt rail on the left and the topo
 *             background on the right carrying a sign-in card, in the loading
 *             page's register. On this one the learner has to validate from
 *             their email before they can log in, so the page has a before and
 *             an after.
 * `light`    — the same split, with the rail in the flow's own warm paper
 *             instead of the dark ground: a brick tick, the heading ranged
 *             left with no box around it, hairline rules. Same page, same
 *             behaviour — it is the TONE that is being compared, which is why
 *             it is a third option here rather than a fourth page.
 *
 * ⚠ THEY ARE TWO ENDINGS, NOT TWO SKINS. The receipt hands the learner a
 * portal button and assumes the account is ready; the split screen makes them
 * go to their inbox first. That is a different promise about when they can
 * start, which is the thing being compared — so neither page is a restyle of
 * the other and both keep their own copy.
 */
/**
 * THE JOURNEY RAIL ON THE SPLIT CONFIRMATION — 2026-10-22, Jillienne: "add a
 * feature toggle that hides this section completely and on default only shows
 * the last step section, centered in the screen."
 *
 * ⚠ OFF BY DEFAULT. The flag's own note in the catalog carries the argument;
 * the key lives here so the page and its tests name the same string.
 */
export const SPLIT_JOURNEY_RAIL_FLAG = 'split-journey-rail'

export const ORDER_CONFIRMATION_STYLE_FLAG = 'order-confirmation-style'

export type OrderConfirmationStyle = 'receipt' | 'split' | 'light'

/* ⚠ `light` SINCE 2026-10-22, the direct ask. The receipt is still the public
   site's own ending and still one click away; the light split is the one this
   branch is putting forward. */
export const DEFAULT_ORDER_CONFIRMATION_STYLE: OrderConfirmationStyle = 'light'

export function resolveOrderConfirmationStyle(
  value: string | null | undefined,
): OrderConfirmationStyle {
  return value === 'receipt' || value === 'split' || value === 'light'
    ? value
    : DEFAULT_ORDER_CONFIRMATION_STYLE
}

export function useOrderConfirmationStyle(): OrderConfirmationStyle {
  return resolveOrderConfirmationStyle(useFeatureFlag(ORDER_CONFIRMATION_STYLE_FLAG).variant)
}

/**
 * Has the learner come back from the link in their confirmation email?
 *
 * ⚠ THE SPLIT SCREEN IS THE SAME SCREEN BOTH TIMES — that is the shape
 * Jillienne described: "the user is required to go to their email to validate
 * and that will bring them back to this same styled screen with the login
 * info". So the page does not navigate anywhere to show its second state; it
 * reads this and changes what the right-hand card says.
 */
export const EMAIL_VALIDATED_PARAM = 'validated'

export function useEmailValidated(): boolean {
  const [params] = useSearchParams()
  return params.get(EMAIL_VALIDATED_PARAM) === '1'
}
