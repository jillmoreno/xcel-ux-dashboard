import { useState, type CSSProperties, type ReactNode } from 'react'
import {
  ArrowLeft,
  CalendarDay,
  CircleCheck,
  CreditCard,
  Gem,
  HourglassClock,
  LogOut,
  Receipt,
  TriangleExclamation,
  ArrowsRotate,
} from '@/icons'
import { Radio } from '@/components/ui/Radio'
import { Toast } from '@/components/ui/Toast'
import type { MembershipRenewal } from '@/context/AccountContext'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { formatRenewalDate, daysUntil } from './membershipRenewalState'
import {
  CANCEL_REASONS,
  CANCEL_RECORD_STAYS,
  cancelOffersFor,
  pauseRenewalOn,
  pauseResumeOn,
  type CancelOffer,
  type CancelOfferKind,
} from '@/data/membership/cancelOffersFixtures'

/**
 * Self-service cancellation flow.
 *
 * Built to "Self-Service Cancellation Best Practices" (a synthesis of Baymard
 * Institute guidance). The option comparison that chose this shape, with all
 * three containers side by side and the reasoning for each, is
 * `explorations/membership-cancellation/cancellation-flow-options.html`.
 *
 * ── THE FOUR THINGS THIS COMPONENT EXISTS TO GET RIGHT ───────────────────────
 *
 *  1. RETENTION COMES AFTER THE CLICK, NOT INSTEAD OF IT. The learner has
 *     already pressed Cancel membership by the time this mounts. Offers are
 *     shown as a courtesy on the way out — never as a gate. The guidance's
 *     sharpest warning is that teams treat retention as a blocking intervention
 *     rather than a helpful choice, and the structural test for which one you
 *     built is whether a learner can reach the exit without engaging: here they
 *     can, twice (the skip row at the top, and the cancel card below the
 *     offers).
 *
 *  2. THE OFFERS ARE PARALLEL AND NONE IS PRESELECTED. Every offer renders at
 *     once with equal weight — no accordion, no ranking, no "recommended" flag,
 *     no default selection. On the page layout they are literal columns. This is
 *     the reason the page layout exists at all: three stacked cards in a 480px
 *     sheet are a queue, not a set of parallel options, and by the time the
 *     third is on screen the first has scrolled away.
 *
 *  3. EVERY TERM IS VISIBLE BEFORE COMMITTING, INLINE. `offer.terms` is always
 *     rendered — there is deliberately no expander, no "see details", no
 *     tooltip. Pause is the case that proves the rule: its terms REPLACE
 *     themselves with resolved dates the moment a length is chosen
 *     (`pauseTermsFor`), because "the day your pause ends" is not a date and a
 *     changed billing date is exactly the term that must not be a surprise.
 *
 *  4. THE REASON QUESTION COMES AFTER THE POINT OF NO RETURN, AND IS OPTIONAL.
 *     It sits on the confirmation screen with a visible way to decline. A
 *     required reason reads as an eligibility test for whether you will be
 *     allowed to leave.
 *
 * Confirmation screens all answer the same four questions, in this order:
 * what you chose, when it takes effect, what happens to billing and access, and
 * how to reverse it. The undo is a real state change with its own confirmation
 * rather than a link back to the start.
 *
 * ── WHAT IS STILL A STUB ─────────────────────────────────────────────────────
 * Every terminal action is `console.info` + a `Toast`. Nothing here mutates the
 * account, so the undo is honest by construction. The billing questions behind
 * the offers themselves (can a term be extended, does a mid-term downgrade
 * prorate, how often may a discount be taken) are open decisions logged on the
 * feature handoff — see `cancelOffersFixtures.ts` for the pause modelling note,
 * which is the one that changes copy rather than plumbing.
 */

export type CancelFlowLayout = 'sheet' | 'page' | 'modal'

type Props = {
  /** `modal` (the default) is `page`'s side-by-side treatment at dialog width;
   *  `sheet` stacks everything in the 480px panel; `page` lays the offers out as
   *  columns. Driven by the `membership-cancel-flow` flag. */
  layout: CancelFlowLayout
  /** Product name for the confirmation copy. Every confirmation names the
   *  membership, because a learner holding several needs to know which one
   *  ended — and that the others did not. */
  planTitle: string
  /** The renewal facts. `null` (a record with no renewal, or the account-level
   *  fallback) means there is nothing to offer and no date to promise, so the
   *  flow opens on the review step with a softer set of facts. */
  renewal: MembershipRenewal | null
  /** Current tier label — suppresses a downgrade offer to the tier they hold. */
  tierLabel?: string | null
  /** Record id, for the action stubs. */
  membershipId?: string
  /** Leave the flow: back to the Manage Membership sheet body (sheet layout) or
   *  back to the membership page (page layout). */
  onExit: () => void
}

type Step = 'offers' | 'review' | 'confirmed' | 'accepted'

/** Which glyph leads an offer card.
 *  TODO(icons): a `Tag` glyph would read better than `Receipt` for the discount
 *  offer, and a true `Pause` better than `HourglassClock`. Neither is in the FA
 *  set yet; reusing existing icons beats hand-authoring two that won't match. */
const OFFER_ICON: Record<CancelOfferKind, typeof CalendarDay> = {
  pause: HourglassClock,
  downgrade: Gem,
  discount: Receipt,
}

export function CancelMembershipFlow({
  layout,
  planTitle,
  renewal,
  tierLabel,
  membershipId,
  onExit,
}: Props) {
  const { brand } = useAccount()
  const offers = cancelOffersFor({ brand, tierLabel, renewal })
  // `null` means "the learner hasn't moved yet", NOT a step. The entry step is
  // then DERIVED on every render until they act.
  //
  // This was `useState(offers.length > 0 ? 'offers' : 'review')` and that was a
  // bug: on a cold load the brand-seeding effect hasn't run yet, so `renewal` is
  // null on the first paint, so `offers` is empty, so the step froze on `review`
  // and never recovered once the data arrived. A reviewer opening a shared link
  // in a fresh browser landed past the offers; a refresh "fixed" it. Deriving
  // instead of freezing means late data is picked up with no effect and no
  // flicker, and once `step` is set the learner's position is pinned.
  const [step, setStep] = useState<Step | null>(null)
  // No offers to show ⇒ never render an empty "alternatives" screen. Straight to
  // the review step, which is also what an expired membership should do.
  const current: Step = step ?? (offers.length > 0 ? 'offers' : 'review')
  // The pause length is FIXED at one month since 2026-08-25 (the 1/2/3 picker
  // was removed), so there is no selection to hold. Kept as a named constant
  // rather than a literal at the call site because the accepted-offer payload
  // and the confirmation copy both read it.
  const pauseMonths = FIXED_PAUSE_MONTHS
  const [accepted, setAccepted] = useState<{ kind: CancelOfferKind; months: number | null } | null>(
    null,
  )
  const [reason, setReason] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  // Which way the survey was closed. `sent` and `declined` must be
  // distinguishable — thanking someone for feedback they explicitly declined to
  // give is a small lie the confirmation doesn't need.
  const [surveyDone, setSurveyDone] = useState<'sent' | 'declined' | null>(null)
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null)

  const endsOn = renewal?.endsOn ?? null
  const endsLong = endsOn ? formatRenewalDate(endsOn) : null
  const price = renewal?.price ?? 0

  const page = layout === 'page'
  // `modal` shares the PAGE's wide treatment — offers as literal columns, the
  // larger heading, the wide action row — because that side-by-side comparison
  // is the whole reason a non-sheet layout exists. What it does NOT share is
  // the page's chrome: a modal has its own close, so it never renders the
  // "Back to Membership" link, and the Modal supplies its own surface, so the
  // wrap only has to space the content.
  const wide = page || layout === 'modal'
  const wrap: CSSProperties = page
    ? pageWrapStyle
    : layout === 'modal'
      ? modalWrapStyle
      : sheetWrapStyle

  /* ── actions (all stubs) ────────────────────────────────────────────────── */

  const acceptOffer = (offer: CancelOffer) => {
    const months = offer.kind === 'pause' ? pauseMonths : null
    console.info(`membership-cancel:accept-offer:${offer.kind}`, { membershipId, months })
    setAccepted({ kind: offer.kind, months })
    setStep('accepted')
  }

  const confirmCancel = () => {
    console.info('membership-cancel:confirm', { membershipId, endsOn })
    setStep('confirmed')
  }

  const keepMembership = () => {
    console.info('membership-cancel:keep', { membershipId })
    setToast({
      title: 'Nothing has changed',
      body: endsLong
        ? `Your ${planTitle} renews as normal on ${endsLong}.`
        : `Your ${planTitle} is unchanged.`,
    })
    onExit()
  }

  const undoAccepted = () => {
    if (!accepted) return
    console.info(`membership-cancel:undo:${accepted.kind}`, { membershipId })
    setToast({ title: 'Reverted', body: undoneCopy(accepted.kind, planTitle, endsLong, price) })
    onExit()
  }

  const sendSurvey = () => {
    console.info('membership-cancel:reason', { membershipId, reason, comment })
    setSurveyDone('sent')
  }

  /* ── screens ────────────────────────────────────────────────────────────── */

  // `membership-cancel-steps` — a SEPARATE axis from the container flag. Stepped
  // is the built flow (alternatives → review → confirmation). Single screen
  // collapses the first two so cancelling is one click rather than two: the
  // alternatives become stacked rows and the review content sits under them.
  //
  // Only meaningful in the WIDE containers. A 480px sheet cannot hold the
  // alternatives and five facts without becoming the scroll it was trying to
  // avoid, so the sheet keeps the stepped flow whatever the flag says.
  const singleScreen = useFeatureFlag('membership-cancel-steps').variant === 'single-screen' && wide

  let body: ReactNode = null

  if (current === 'offers') {
    body = (
      <>
        <FlowHeading
          layout={layout}
          // Dropped in the modal arm (2026-08-25): the dialog header already
          // says "Cancel membership", so this was a third title stacked above
          // the first card. The page and sheet arms have no container title,
          // so they keep it.
          title={layout === 'modal' ? undefined : 'Before you go, here are a few options'}
          // Option C (2026-08-25). "A few alternatives first" implied a gate —
          // the word `first` was the only thing on the screen suggesting the
          // offers had to be got past.
          //
          // With the step heading gone in the modal arm, the lede carries the
          // framing on its own. NOTE that means "Nothing is charged today" is
          // no longer anywhere on THIS step
          // — Option C stripped it from the cards, and this replaced it in the
          // lede. It still appears on the accepted step. If the reassurance is
          // wanted back, append it here; do not put it back in the cards, which
          // is where it was being said three times.
          lede="Before you go, please consider a few options…"
        />

        {/* Rule 1 — the exit is reachable without engaging with a single offer —
            is now carried by the "Cancel my membership" CARD in the row below,
            which is a peer of the offers rather than a way past them. The
            "Skip to cancelling" row that used to sit here was removed on
            2026-08-25: once the exit became a column, the two did the same job
            (both went straight to `review`) and one of them had to go. If the
            exit ever leaves that row, this link has to come back — the rule is
            that leaving never requires engaging with an offer first. */}

        {/* Cancelling is the LAST COLUMN, not a footnote under the row. It used
            to sit in its own card below the offers, which made the exit
            something you reached after the offers rather than something you
            chose between them. As a peer card it is weighted the same as every
            alternative — which is rule 2 (nothing ranked, nothing recommended)
            applied to the exit as well as to the offers.

            `offers.length + 1` because the exit occupies one of the columns. */}
        <div
          style={{
            display: 'grid',
            gap: 16,
            // Single screen stacks: the alternatives are full-width rows so the
            // review content can sit beneath them in the same column.
            gridTemplateColumns: singleScreen
              ? '1fr'
              : wide
                ? `repeat(${Math.min(offers.length + 1, 3)}, minmax(0, 1fr))`
                : '1fr',
            alignItems: 'stretch',
          }}
        >
          {offers.map((offer) => (
            <OfferCard
              key={offer.kind}
              offer={offer}
              row={singleScreen}
              onAccept={() => acceptOffer(offer)}
            />
          ))}
          {/* Built from the OFFER card's own parts — same chrome, same head
              layout, same title and blurb styles, same floored action — so the
              exit reads as a peer of the alternatives rather than a differently
              built thing parked beside them. It used to have a dashed border, a
              grey fill, no icon and its own type scale, which marked it as the
              not-an-offer at the cost of looking unfinished.

              What still distinguishes it is exactly what distinguishes the
              alternatives from each other: its own glyph, and here the icon
              tint and the CTA on the error ramp. The glyph is LogOut, NOT the
              ✕ — the modal's own close button is a ✕, and marking "end your
              membership" with the same mark as "dismiss this dialog" is the
              confusion the sheet redesign already had to undo once. */}
          {!singleScreen && (
            <div style={offerCardStyle}>
              <div style={offerHeadStyle}>
                <span aria-hidden style={exitIconStyle}>
                  <LogOut size={17} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={offerTitleStyle}>
                    {endsLong
                      ? `End it — keep access to ${endsLong}`
                      : 'End it — keep access to the end of your year'}
                  </h4>
                  <p style={offerBlurbStyle}>Nothing further is charged.</p>
                </div>
              </div>
              <div style={offerActionStyle}>
                <button
                  type="button"
                  className="cre-flow-btn cre-flow-btn--danger"
                  style={{ ...dangerBtnStyle, width: '100%' }}
                  onClick={() => setStep('review')}
                >
                  Continue to cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SINGLE SCREEN: the review step, inlined under the alternatives. The
            exit stops being a peer card and becomes the section it always was
            — the same five facts and the same actions, one click earlier.

            It sits BELOW rather than beside on purpose: the facts are the thing
            a learner should read before ending a membership, and a column can't
            hold them at a readable measure. Placing them last also keeps the
            reading order honest — alternatives first, consequences second,
            the irreversible button last. */}
        {singleScreen && (
          <section style={exitSectionStyle}>
            {/* Head is a row like the alternatives above: glyph + text on the
                left, the action top-right. `flex-start` rather than centre so
                the button sits level with the HEADING — the block below it is
                five facts tall, and centring would drop the button into the
                middle of them. */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ ...offerHeadStyle, flex: 1, minWidth: 0 }}>
                <span aria-hidden style={exitIconStyle}>
                  <LogOut size={17} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={offerTitleStyle}>Cancel membership</h4>
                {/* Was "Cancelling ends your {plan} on {date}." — replaced
                    2026-08-25. The date is carried by the Access and Billing
                    facts directly below, so it was being said twice.
                    NOTE the plan NAME went with it, and this arm has no plan
                    band above the flow the way the sheet does — so nothing on
                    this screen now says WHICH membership is ending. Fine for a
                    learner holding one; put the plan name in the Modal's title
                    if the multi-membership case matters. */}
                  <p style={offerBlurbStyle}>What this means…</p>
                </div>
              </div>
              {/* Outlined, not solid. It reads as a peer of "Pause Plan"
                  opposite it, but stays on the error ramp — with the solid
                  treatment gone that hue is the only thing left marking this
                  as the destructive one. Swap `dangerBtnStyle` for
                  `secondaryBtnStyle` for a fully neutral outline. */}
              <button
                type="button"
                className="cre-flow-btn cre-flow-btn--danger"
                style={{ ...dangerBtnStyle, flex: 'none' }}
                onClick={confirmCancel}
              >
                Cancel Membership
              </button>
            </div>
            {/* Indented to the icon gutter so the facts start under "Cancel
                your membership" rather than under its glyph — the heading, its
                sub-line and the facts then share one left edge. */}
            <div style={{ marginTop: 12, paddingLeft: FACT_INDENT }}>
              <CancelFacts endsLong={endsLong} price={price} endsOn={endsOn} />
            </div>

          </section>
        )}
      </>
    )
  }

  if (current === 'review') {
    body = (
      <>
        {offers.length > 0 && (
          <button type="button" style={backStyle} onClick={() => setStep('offers')}>
            <ArrowLeft size={13} aria-hidden /> Back to options
          </button>
        )}
        <FlowHeading
          layout={layout}
          title="Here’s what happens"
          lede={
            endsLong
              ? `Cancelling ends your ${planTitle} on ${endsLong}.`
              : `Cancelling ends your ${planTitle} at the end of your membership year.`
          }
        />
        <CancelFacts endsLong={endsLong} price={price} endsOn={endsOn} />
        {/* "Keep my membership" stays the QUIET one wherever it sits. Giving
            the retention choice the filled treatment at the point of no return
            would be preselection by emphasis — the learner came here to do the
            other thing — so cancelling carries the solid CTA.

            The two layouts order it differently on purpose. Wide: Keep on the
            left, Cancel pushed to the far right, which is the conventional
            confirm slot and puts the destructive button LAST in tab order.
            Sheet: a stacked column has no "right", and whichever button is on
            top reads as the lead — so cancelling stays first there. */}
        <div style={wide ? pageActionsStyle : sheetActionsStyle}>
          {wide ? (
            <>
              <button
                type="button"
                className="cre-flow-btn cre-flow-btn--secondary"
                style={secondaryBtnStyle}
                onClick={keepMembership}
              >
                Keep my membership
              </button>
              <button
                type="button"
                className="cre-flow-btn cre-flow-btn--danger-solid"
                style={{ ...dangerSolidBtnStyle, marginLeft: 'auto' }}
                onClick={confirmCancel}
              >
                Cancel my membership
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="cre-flow-btn cre-flow-btn--danger-solid"
                style={dangerSolidBtnStyle}
                onClick={confirmCancel}
              >
                Cancel my membership
              </button>
              <button
                type="button"
                className="cre-flow-btn cre-flow-btn--secondary"
                style={secondaryBtnStyle}
                onClick={keepMembership}
              >
                Keep my membership
              </button>
            </>
          )}
        </div>
      </>
    )
  }

  if (current === 'confirmed') {
    body = (
      <>
        <Banner>
          <b>
            Your {planTitle} will end{endsLong ? ` on ${endsLong}` : ''}.
          </b>{' '}
          {surveyDone === 'sent'
            ? 'Thanks for the feedback — it goes to the membership team.'
            : 'A confirmation is on its way to the email address on your account.'}
        </Banner>
        {/* The five facts were removed from THIS step on 2026-08-25 — the
            learner read them a moment ago on the screen they just acted on.
            The review step keeps them. */}
        {/* Rule 4 — asked after the cancellation is already confirmed, and
            declinable in one click. */}
        {surveyDone ? (
          <p style={surveyThanksStyle}>
            {surveyDone === 'sent'
              ? 'Thanks — that’s all we needed.'
              : 'No problem. Nothing else is needed from you.'}
          </p>
        ) : (
          <div style={surveyStyle}>
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>
                We’re always looking to improve. Why did you cancel your membership?
              </legend>
              <p style={surveySubStyle}>
                Optional — your cancellation is already confirmed either way.
              </p>
              {/* Two columns in the wide containers — four short options in a
                  single stack made the survey the tallest thing on a screen
                  whose whole job is already done. The SHEET arm stays one
                  column: at 480px two columns would wrap every label. */}
              <div style={wide ? reasonGridStyle : undefined}>
                {CANCEL_REASONS.map((r) => (
                  <div key={r} style={reasonRowStyle}>
                    <Radio
                      name="cancel-reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      label={r}
                    />
                  </div>
                ))}
              </div>
            </fieldset>
            <label htmlFor="cancel-comment" style={commentLabelStyle}>
              Anything you’d like to add? (optional)
            </label>
            <textarea
              id="cancel-comment"
              style={textareaStyle}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div style={surveyActionsStyle}>
              <button
                type="button"
                className="cre-flow-btn cre-flow-btn--primary"
                style={primaryBtnStyle}
                onClick={sendSurvey}
              >
                Send feedback
              </button>
              <button
                type="button"
                className="cre-link-action"
                style={declineLinkStyle}
                onClick={() => setSurveyDone('declined')}
              >
                No thanks
              </button>
            </div>
          </div>
        )}

        {/* The "Changed your mind? / Keep my membership" undo panel was removed
            from this step on 2026-08-25. NOTE what that costs: the flow was
            built to the Baymard-derived guidance, which asks for a reversal at
            the point of confirmation, and there is now no way to undo from
            inside the flow — closing the dialog is final.
            Reversal still EXISTS in the product: the membership card's
            `expired` and `grace` renewal states carry "Restore membership"
            (see membershipRenewalState.ts), so the learner can come back to it
            from the Membership section. If the in-flow undo is wanted again,
            the handler is still here — `keepMembership`, used by the review
            step — so it is a block of markup, not a rebuild. */}
      </>
    )
  }

  if (current === 'accepted' && accepted) {
    const o = acceptedCopy(accepted, { planTitle, endsOn, price, offers })
    body = (
      <>
        <Banner>
          <b>{o.title}.</b> {o.lede}
        </Banner>
        <ul style={factsStyle}>
          {o.facts.map((f) => (
            <FactRow key={f.label} Icon={f.Icon} warn={f.warn} label={f.label} detail={f.detail} />
          ))}
        </ul>
        <div style={wide ? pageActionsStyle : sheetActionsStyle}>
          <button
                type="button"
                className="cre-flow-btn cre-flow-btn--secondary"
                style={secondaryBtnStyle}
                onClick={undoAccepted}
              >
            {o.undo}
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div style={wrap}>
        {page && (
          <button type="button" style={backStyle} onClick={onExit}>
            <ArrowLeft size={13} aria-hidden /> Back to Membership
          </button>
        )}
        {body}
      </div>
      <Toast
        open={toast != null}
        onClose={() => setToast(null)}
        tone="success"
        title={toast?.title ?? ''}
      >
        {toast?.body ?? ''}
      </Toast>
    </>
  )
}

/** How long a pause runs, now that the learner no longer picks. Change here,
 *  not at a call site — the offer copy, the accept payload and the confirmation
 *  line all have to agree. */
const FIXED_PAUSE_MONTHS = 1

/* ─── offer card ───────────────────────────────────────────────────────────
   One card, used in every layout. No controls inside it any more: the pause
   arm's 1/2/3-month picker was removed on 2026-08-25 and the offer fixed at one
   month, so every card is now blurb + one CTA.

   The separate "What this means" terms box went with it. The rule it served —
   never let a learner accept an offer without seeing what changes — still
   holds; the terms moved INTO each offer's blurb rather than being dropped.
   Check that when editing copy: `offer.blurb` is now the only place the
   material change is stated. */

function OfferCard({
  offer,
  onAccept,
  row = false,
}: {
  offer: CancelOffer
  onAccept: () => void
  /** Full-width horizontal row instead of a tile in a column. Used by the
   *  single-screen variant, where the alternatives stack so the review content
   *  can sit beneath them. Same parts, re-laid: the CTA moves from the card's
   *  floor to its right edge and stops stretching, since a full-width button on
   *  a full-width card would be the widest thing on the screen. */
  row?: boolean
}) {
  const Icon = OFFER_ICON[offer.kind]

  return (
    <div style={row ? offerRowStyle : offerCardStyle}>
      <div style={row ? { ...offerHeadStyle, flex: 1, minWidth: 0 } : offerHeadStyle}>
        <span aria-hidden style={offerIconStyle}>
          <Icon size={17} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={offerTitleStyle}>
            {offer.title}
            {offer.priceLabel && <span style={offerPriceStyle}>{offer.priceLabel}</span>}
          </h4>
          <p style={offerBlurbStyle}>{offer.blurb}</p>
        </div>
      </div>

      <div style={row ? offerRowActionStyle : offerActionStyle}>
        <button
          type="button"
          className={`cre-flow-btn cre-flow-btn--${
            offer.emphasis === 'secondary' ? 'secondary' : 'primary'
          }`}
          style={
            offer.emphasis === 'secondary'
              ? row
                ? { ...secondaryBtnStyle, minWidth: OFFER_CTA_MIN_W }
                : { ...secondaryBtnStyle, width: '100%' }
              : row
                ? { ...primaryBtnStyle, minWidth: OFFER_CTA_MIN_W }
                : { ...primaryBtnStyle, width: '100%' }
          }
          onClick={onAccept}
        >
          {offer.cta}
        </button>
      </div>
    </div>
  )
}

/* ─── shared bits ──────────────────────────────────────────────────────────── */

function FlowHeading({
  layout,
  title,
  lede,
}: {
  layout: CancelFlowLayout
  /** Omitted where the CONTAINER already titles the screen — the modal draws
   *  "Cancel membership" in its own header, so a step heading under it was a
   *  third layer of title before any content. The page and sheet arms have no
   *  such header, so they keep theirs. */
  title?: string
  lede: string
}) {
  const titleStyle =
    layout === 'page' ? pageTitleStyle : layout === 'modal' ? modalTitleStyle : sheetTitleStyle
  return (
    <div>
      {title && <h3 style={titleStyle}>{title}</h3>}
      <p style={ledeStyle}>{lede}</p>
    </div>
  )
}

function Banner({ children }: { children: ReactNode }) {
  return (
    <div style={bannerStyle} role="status">
      <span aria-hidden style={{ color: 'var(--color-success-600)', flex: 'none', marginTop: 1 }}>
        <CircleCheck size={17} />
      </span>
      <div>{children}</div>
    </div>
  )
}

type Fact = {
  /** Optional. The CANCEL facts dropped their icons on 2026-08-25 — five glyphs
   *  down the left of five one-line facts was decoration competing with the
   *  three cards above, and the amber warning glyph read as an error rather
   *  than a note once it was the only coloured thing in the list. The ACCEPTED
   *  step keeps its icons: that list is the whole screen, not a block inside
   *  one, so it can carry them. */
  Icon?: typeof CalendarDay
  label: string
  detail: string
  warn?: boolean
}

function FactRow({ Icon, label, detail, warn }: Fact) {
  const text = (
    <>
      <b style={{ color: 'var(--color-text-primary)' }}>{label}</b> {detail}
    </>
  )
  // Iconless rows are a plain block: no flex, no gutter, and the divider and
  // padding drop with the glyph (see `factRowStyle` / `factRowIconStyle`).
  if (!Icon) return <li style={factRowStyle}>{text}</li>
  return (
    <li style={factRowIconStyle}>
      <span
        aria-hidden
        style={{
          flex: 'none',
          marginTop: 1,
          color: warn ? 'var(--color-warning-700)' : 'var(--color-primary-600)',
        }}
      >
        <Icon size={17} />
      </span>
      <div>{text}</div>
    </li>
  )
}

/** What cancelling actually does. Reused verbatim by the review step and the
 *  confirmation, so the promise a learner agreed to is the one they keep. */
function CancelFacts({
  endsLong,
  endsOn,
  price,
}: {
  endsLong: string | null
  endsOn: string | null
  price: number
}) {
  const days = endsOn ? daysUntil(endsOn) : null
  const weeks = days != null && days > 0 ? Math.round(days / 7) : null
  // One line each. Shortened 2026-08-25: these are meant to be scanned before an
  // irreversible action, and a paragraph per fact is read by nobody. Nothing
  // material was dropped — each still names its date, amount or condition.
  const facts: Fact[] = [
    {
      label: 'Access.',
      detail: endsLong
        ? `Full access until ${endsLong}${weeks ? ` (about ${weeks} week${weeks === 1 ? '' : 's'})` : ''}.`
        : 'Full access to the end of your membership year.',
    },
    {
      label: 'Billing.',
      detail:
        price > 0 && endsLong
          ? `No further payments — the $${price} due ${endsLong} won’t be taken.`
          : 'No further payments will be taken.',
    },
    { label: 'Your records.', detail: CANCEL_RECORD_STAYS },
    {
      label: 'Courses in progress.',
      detail: 'Progress is saved. Finishing later needs a membership or a purchase.',
    },
    {
      label: 'Reversible.',
      detail: endsLong ? `Restart any time before ${endsLong}.` : 'Restart any time before it ends.',
    },
  ]
  return (
    <ul style={factsStyle}>
      {facts.map((f) => (
        <FactRow key={f.label} {...f} />
      ))}
    </ul>
  )
}

/* ─── outcome copy ─────────────────────────────────────────────────────────
   Each accepted offer gets a confirmation answering the same four questions:
   what you chose, when it takes effect, what billing and access do next, and how
   to change it. */

function acceptedCopy(
  accepted: { kind: CancelOfferKind; months: number | null },
  ctx: { planTitle: string; endsOn: string | null; price: number; offers: CancelOffer[] },
): { title: string; lede: string; facts: Fact[]; undo: string } {
  const { planTitle, endsOn, price } = ctx
  const endsLong = endsOn ? formatRenewalDate(endsOn) : 'your renewal date'
  const mailLine = 'A confirmation is on its way to the email address on your account.'

  if (accepted.kind === 'pause' && accepted.months != null && endsOn) {
    const m = accepted.months
    const resume = formatRenewalDate(pauseResumeOn(m))
    const renews = formatRenewalDate(pauseRenewalOn(m, endsOn))
    return {
      title: `Your ${planTitle} is paused`,
      lede: `Paused for ${m} month${m > 1 ? 's' : ''}. Access comes back on ${resume}. ${mailLine}`,
      facts: [
        {
          Icon: CalendarDay,
          label: 'When it takes effect.',
          detail: `Today. Your access pauses now and resumes ${resume}.`,
        },
        {
          Icon: CreditCard,
          label: 'Billing.',
          detail: `Nothing today, and nothing while you are paused. Your paid-through date moves to ${renews}, so your next ${price > 0 ? `$${price} ` : ''}charge falls then instead of ${endsLong}.`,
        },
        {
          Icon: TriangleExclamation,
          warn: true,
          label: 'What you give up.',
          detail:
            'Courses, podcasts, and the library are unavailable while paused. Your progress and certificates are untouched.',
        },
        {
          Icon: ArrowsRotate,
          label: 'How to change it.',
          detail:
            'Unpause any time from Manage Membership — the unused days go back on the end.',
        },
      ],
      undo: 'Unpause my membership',
    }
  }

  if (accepted.kind === 'downgrade') {
    const offer = ctx.offers.find((o) => o.kind === 'downgrade')
    return {
      title: `You’re switching to ${offer?.title.replace('Switch to ', '') ?? 'the lighter plan'}`,
      lede: `Your plan changes on ${endsLong}. ${mailLine}`,
      facts: [
        {
          Icon: CalendarDay,
          label: 'When it takes effect.',
          detail: `${endsLong}. Until then you keep everything you have now.`,
        },
        {
          Icon: CreditCard,
          label: 'Billing.',
          detail: `${offer?.priceLabel ?? 'The lower rate'} on ${endsLong} instead of $${price}. Nothing is charged today.`,
        },
        {
          Icon: TriangleExclamation,
          warn: true,
          label: 'What changes.',
          detail: `From ${endsLong} you lose the benefits your current tier adds. ${CANCEL_RECORD_STAYS}`,
        },
        {
          Icon: ArrowsRotate,
          label: 'How to change it.',
          detail: `Switch back any time before ${endsLong} from Manage Membership.`,
        },
      ],
      undo: 'Stay on my current plan',
    }
  }

  const offer = ctx.offers.find((o) => o.kind === 'discount')
  return {
    title: 'Your discount is applied',
    lede: `Your next renewal is ${offer?.priceLabel ?? 'reduced'} instead of $${price}. ${mailLine}`,
    facts: [
      {
        Icon: CalendarDay,
        label: 'When it takes effect.',
        detail: `At your renewal on ${endsLong}. Nothing changes before then.`,
      },
      {
        Icon: CreditCard,
        label: 'Billing.',
        detail: `${offer?.priceLabel ?? 'The reduced amount'} on ${endsLong}. Nothing is charged today.`,
      },
      {
        Icon: TriangleExclamation,
        warn: true,
        label: 'After that.',
        detail: `It renews at the standard $${price} the following year unless you cancel.`,
      },
      {
        Icon: ArrowsRotate,
        label: 'How to change it.',
        detail: 'Cancel or change your plan any time from Manage Membership.',
      },
    ],
    undo: 'Remove this discount',
  }
}

function undoneCopy(
  kind: CancelOfferKind,
  planTitle: string,
  endsLong: string | null,
  price: number,
): string {
  const on = endsLong ? ` on ${endsLong}` : ''
  if (kind === 'pause')
    return `Your ${planTitle} is active again and your renewal is back${on}. Nothing was charged.`
  if (kind === 'downgrade')
    return `You’re staying on your current plan. Your renewal is unchanged${price > 0 ? ` at $${price}` : ''}${on}.`
  return `The discount is removed. Your renewal is back${price > 0 ? ` to $${price}` : ''}${on}.`
}

/* ─── styles (tokens only) ─────────────────────────────────────────────────── */

const sheetWrapStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

/** `Modal` renders its children as a bare `<div>` with NO padding of its own —
 *  every caller pads its own body — so this wrap owns the inset. Matches
 *  MembershipUpgradeModal, the closest sibling (also a wide multi-column
 *  comparison in a dialog); the deeper bottom keeps the offer CTAs off the
 *  modal's floor. The Modal DOES draw the surface and the header, which is why
 *  there is no background or border here. */
const modalWrapStyle: CSSProperties = {
  // Horizontal inset MATCHES the Modal header's own 20px, not the 32px other
  // modal bodies use. With the header divider dropped, the body's first line
  // reads as part of the header block — and it only does that if it starts at
  // the same x as the title. Change one and change the other.
  //
  // 4px on top for the same reason: the lede should sit under the title like a
  // subtitle, not after a gap sized for the step heading that used to be here.
  padding: '4px 20px 28px',
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
}

const pageWrapStyle: CSSProperties = {
  padding: '28px 40px 56px',
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
  maxWidth: 1100,
}

const sheetTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 19,
  lineHeight: '25px',
  color: 'var(--color-text-primary)',
}

const pageTitleStyle: CSSProperties = {
  ...sheetTitleStyle,
  fontSize: 26,
  lineHeight: '32px',
}

/** The modal arm needs its OWN size, not the page's. `Modal` draws its own
 *  title ("Cancel membership") at 24px/500, and the page heading's 26px/700 is
 *  both bigger and bolder than it — so the step heading was outranking the
 *  dialog it sits inside. 20px/700 keeps it clearly the working headline while
 *  the dialog title stays the thing that names the flow. The page arm has no
 *  such title above it, so it keeps 26px. */
const modalTitleStyle: CSSProperties = {
  ...sheetTitleStyle,
  fontSize: 20,
  lineHeight: '27px',
}

const ledeStyle: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-text-secondary)',
  maxWidth: '68ch',
}

const backStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-primary-600)',
  cursor: 'pointer',
}

const offerCardStyle: CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-surface-card)',
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
}

const offerHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
}

const offerIconStyle: CSSProperties = {
  width: 34,
  height: 34,
  flex: 'none',
  borderRadius: 9,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  // Brand PRIMARY, not secondary: these mark the retention alternatives, which
  // are the brand's own offers. The exit's plate stays on the error ramp
  // (`exitIconStyle`) — that one is marking a destructive action, not a brand.
  background: 'color-mix(in srgb, var(--color-primary-500) 16%, var(--color-surface-card))',
  color: 'var(--color-primary-700)',
}

/** The exit's icon plate — `offerIconStyle` on the error ramp. Same 34px
 *  rounded square and the same 16% tint recipe, so only the hue differs. */
const exitIconStyle: CSSProperties = {
  ...offerIconStyle,
  background: 'color-mix(in srgb, var(--color-error-500) 14%, var(--color-surface-card))',
  color: 'var(--color-error-600)',
}

const offerTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 16,
  lineHeight: '21px',
  color: 'var(--color-text-primary)',
}

const offerPriceStyle: CSSProperties = {
  marginLeft: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-primary-600)',
  whiteSpace: 'nowrap',
}

const offerBlurbStyle: CSSProperties = {
  // 2px, not 5: the blurb belongs to the title above it, and at this size a
  // wider gap reads as two separate lines rather than a heading and its
  // explanation. Shared by all three cards, so they stay in step.
  margin: '2px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

/** The terms block. ALWAYS rendered — never behind an expander. */
const offerActionStyle: CSSProperties = { marginTop: 'auto', paddingTop: 13 }

/** The single-screen variant's full-width alternative. A row, not a tile: the
 *  head and the action sit side by side, and the action is sized to its label
 *  rather than the card. `alignItems: center` keeps the CTA on the text's
 *  optical centre however many lines the blurb runs to. */
const offerRowStyle: CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-surface-card)',
  padding: '16px 18px',
  display: 'flex',
  alignItems: 'center',
  gap: 20,
}

const offerRowActionStyle: CSSProperties = { flex: 'none' }

/** Shared floor for the stacked rows' CTAs, so a short label doesn't sit in a
 *  visibly narrower button than the one above it. Set to the widest of the
 *  current offer labels ("Change Plan", 124px); anything longer simply grows
 *  past it, so this pads the short ones up rather than capping the long ones.
 *  The cards are separate flex containers, so CSS cannot equalise them on its
 *  own — if the labels change a lot, re-measure. */
const OFFER_CTA_MIN_W = 124

/** Width of the icon gutter in a card head: the 34px plate plus `offerHeadStyle`'s
 *  12px gap. Anything that has to line up with a card's TEXT rather than its
 *  glyph is inset by this — change it here if the plate or the gap changes. */
const FACT_INDENT = 46

/** The inlined review section in the single-screen variant. Same chrome as the
 *  alternative rows above it — border, radius, surface, padding — so the screen
 *  reads as one set of blocks rather than two kinds of thing.
 *
 *  It is still NOT a fourth option: what separates it is the wrap's 22px gap
 *  (wider than the 16px between the rows), its own error-tinted glyph, and the
 *  fact it holds the consequences and the irreversible action rather than a
 *  single CTA. A rule used to do that job; the box does it without making the
 *  section look like an afterthought pinned to the bottom. */
const exitSectionStyle: CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-surface-card)',
  padding: '16px 18px',
}

const baseBtn: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  borderRadius: 'var(--radius-md)',
  padding: '11px 18px',
  cursor: 'pointer',
  // Width and style only — the COLOUR comes from the `.cre-flow-btn--*` class.
  // `border: '1px solid transparent'` here would set border-color inline and
  // beat the stylesheet, leaving every outlined button borderless.
  borderWidth: 1,
  borderStyle: 'solid',
}

/* NOTE: these four carry NO colour. Background, text and border live on the
   `.cre-flow-btn--*` classes in tokens.css, because an inline background beats
   a stylesheet `:hover` on specificity — the buttons would look interactive and
   then not respond. Keep colour out of these objects. */

const primaryBtnStyle: CSSProperties = baseBtn

const secondaryBtnStyle: CSSProperties = baseBtn

/** Outlined, on the error ramp. Used by the exit. */
const dangerBtnStyle: CSSProperties = baseBtn

/** Solid. Used at the REVIEW step only — the point of commitment, where
 *  cancelling IS the action the learner came for, so it takes the filled
 *  treatment and the trailing (confirm) position. Deliberately not the same
 *  button as the offers row: there, equal weight is the whole point. */
const dangerSolidBtnStyle: CSSProperties = baseBtn

const sheetActionsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const pageActionsStyle: CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap' }

const factsStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
}

/** Iconless fact row (the cancel list). No rules between rows: with one line
 *  per fact the list reads as a block, and five hairlines inside a card that
 *  already has a border was the busiest part of the screen. The padding drops
 *  with them — the 10px was spacing away from a divider that is gone. */
const factRowStyle: CSSProperties = {
  padding: '3px 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

/** The original row, kept for the accepted step: glyph gutter + dividers. */
const factRowIconStyle: CSSProperties = {
  ...factRowStyle,
  display: 'flex',
  gap: 11,
  padding: '10px 0',
  borderBottom: '1px solid var(--color-border-subtle)',
}

const bannerStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  borderRadius: 'var(--radius-lg)',
  padding: '14px 16px',
  background: 'var(--color-success-100)',
  color: 'var(--color-success-700)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  maxWidth: 620,
}

const surveyStyle: CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-surface-card)',
  padding: 18,
  maxWidth: 620,
}

const fieldsetStyle: CSSProperties = { border: 'none', margin: 0, padding: 0 }

const legendStyle: CSSProperties = {
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const surveySubStyle: CSSProperties = {
  margin: '4px 0 12px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
}

const reasonRowStyle: CSSProperties = {
  padding: '7px 0',
  borderBottom: '1px solid var(--color-border-subtle)',
}

/** 2×2 for four options. `column-gap` only — the rows keep their own bottom
 *  rule as the vertical rhythm, so a row gap would double it. */
const reasonGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  columnGap: 24,
}

const commentLabelStyle: CSSProperties = {
  display: 'block',
  margin: '14px 0 5px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

const textareaStyle: CSSProperties = {
  width: '100%',
  minHeight: 64,
  resize: 'vertical',
  border: '1px solid var(--color-neutral-300)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-primary)',
  background: 'var(--color-surface-card)',
}

/** The bare link-style button in the reason survey's "No thanks". Was
 *  `skipLinkStyle`, shared with the removed "Skip to cancelling" row; renamed
 *  when that went so the name still describes what it is for. Rule 4 — the
 *  reason question is declinable in ONE click — is what this styles. */
const declineLinkStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-cta-500)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const surveyActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'center',
  marginTop: 14,
  flexWrap: 'wrap',
}

const surveyThanksStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}
