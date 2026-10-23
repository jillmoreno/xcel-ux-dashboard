/* INVITE FLOW V2 — Confirmation & Password (/end-to-end-demo/confirmation).
 *
 * A VERBATIM FORK of `InvitedConfirmationPage` taken 2026-10-22, the day the invite flow got
 * versions (`inviteFlowVersions.ts`). It renders when `invite-flow-version`
 * resolves to `v2`; `InvitedConfirmationPage` keeps rendering V1 and is NOT
 * touched by work in here — which is the whole point of the fork, and the
 * repo's standing rule for changing something that already exists.
 *
 * ⚠ IDENTICAL TO V1 UNTIL IT IS CHANGED. While that is still true, a
 * difference you see between the two versions is a bug in the switch
 * (`InviteFlowRoutes.tsx`), not a difference in the design.
 *
 * ⚠ FORK THE LAYOUT, IMPORT THE DATA. Everything below reads the demo's course,
 * prices, learner and partner from `./endToEndDemo` — keep it that way. Two
 * copies of the content means the V1/V2 comparison stops being about the
 * design.
 */
import { type CSSProperties } from 'react'
import { CircleCheckSolid } from '@/icons'
import { partnerAttributed, useInviteFlow } from '@/data/inviteFlows'
import { PartnerHeader } from '@/components/e2e/PartnerHeader'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import './inviteFlow.css'
import {
  E2E_LEARNER_EMAIL,
  E2E_PARTNER_PRICE,
  useEndToEndDemoParams,
  useEndToEndPageChrome,
} from './endToEndDemo'

/**
 * CONFIRMATION & PASSWORD — `/end-to-end-demo/confirmation` (2026-10-15,
 * Eric's request), Figma "Atlas UX Design" 425:2597, under the partner header.
 * The End-to-End Demo's step after Checkout: Place your order opens it, and
 * Confirm ENDS THE FLOW HERE (2026-10-15, Jillienne: "it should END after
 * user puts in a password") — the page becomes a LOADING PAGE, a compass of
 * arcs over a topo map, "Taking you to your learning dashboard…" typing its
 * dots. That is `e2e-ends-at-password`, on by default; off, Confirm opens the
 * demo's Home with the Affidavit modal over it, Eric's hand-off from earlier
 * the same day. (The loading page replaced a "Password created" card the same
 * afternoon, Jillienne's call: the end of the flow reads as a hand-off, not
 * a receipt.)
 *
 * ⚠ THE LOADING PAGE RESOLVES ON ONE ROW'S WALK (2026-10-16, Jillienne:
 * "after the loading gif page, after 3 seconds, should transition to the
 * Atlas Learning Home page"). These three pages are opened by TWO Prototypes
 * rows asking different questions, and the spinner is where the two answers
 * part:
 *
 *   • Invite & Purchase (Afsana & Eric) — the flow ENDS here, terminal
 *     spinner, exactly as `main` shipped on 2026-10-15. Nothing below
 *     changes it.
 *   • End-to-End User Experience (Jillienne) — the spinner hands off to the
 *     demo's Home after three seconds, because that row is the whole product
 *     with invite, Atlas and Compass synced together, and assembling it is
 *     the row's purpose: "the 3 designers do not merge those 2 together, I
 *     do."
 *
 * The row says which it is with `?journey=full` on its address — see
 * `isFullJourney` in `endToEndDemo.ts` for why that is a URL param and not a
 * flag (a flag has ONE value per build, and both rows open the same build).
 * `e2e-loading-opens-home` is a branch flag over the top, so the behaviour can
 * be switched off at promotion without editing the row.
 *
 * Left, the order confirmation on the guide's Secondary 200; right, the
 * Create password form. Clicking the password field fills it with a TEST
 * password that meets the rules (2026-10-15, Eric's request), the rules
 * (Figma 425:3001) show under it, and Confirm turns on — XCEL's brick, as
 * Checkout's Place your order. The field
 * still takes typing, and the eye shows or hides it. Nothing is stored or
 * sent.
 *
 * DEMO DATA, kept consistent with the rest of the demo rather than the
 * frame's placeholders: the learner is Checkout's Jordan Navarro (an
 * example.com address, not the frame's jane.doe), and the total is
 * Checkout's Grand Total, `E2E_PARTNER_PRICE` (the frame says $139.00). The confirmation number is the design's.
 */
export function InvitedConfirmationPageV2() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('Confirmation & Password')
  /* WHICH FLOW — still asked, because the partner header above depends on it.
     Which ENDING a flow gets is `InviteFlowRoutes`' decision now, through
     `passwordSetFromEmailedLink`: this page is the one for the arms whose
     password arrives by mail. */
  const flow = useInviteFlow()

  /* ⚠ THE HAND-OFF LEFT WITH THE PASSWORD FORM — 2026-10-23. Pressing Confirm
     used to end this page on the loading spinner and, on the End-to-End row's
     full walk, hand off to Atlas Home. There is no Confirm here any more: this
     arm's learner goes to their inbox, and the arm that presses a button now
     ends on `XcelSplitConfirmationPage`, which carries the same two flags
     (`e2e-ends-at-password`, `e2e-loading-opens-home`) and the same hand-off.
     Look there, not here, for how the walk reaches the dashboard. */

  return (
    <div style={PAGE}>
      {/* ⚠ THE BROWSER WINDOW CONTINUES HERE (2026-10-19, Jillienne: "can
          we also add this browser header to the email/invite flows so it
          feels like a seamless experience"). These pages render OUTSIDE the
          app shell, so the shell's own strip never reached them — the walk
          opened in a browser window, lost it for the invite flow, and got it
          back at the dashboard. Draws only in the Demo frame, as it does
          there. */}
      <StandaloneBrowserChrome />
      <PartnerHeader partner={partnerAttributed(flow)} />
      <main style={BODY}>
        {/* THE ORDER CONFIRMATION */}
        <section aria-label="Order confirmation" style={CONFIRM_PANEL}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: CHECK_GAP, width: '100%' }}>
            <CircleCheckSolid size={CHECK_SIZE} aria-hidden style={{ color: 'var(--color-xcel-brick-600)', display: 'block' }} />
            <h1 style={TITLE}>Thank you for your order!</h1>
          </div>
          <dl style={FACTS}>
            <span aria-hidden style={RULE} />
            <Fact term="Confirmation number" value="XL00186764" spaced />
            <span aria-hidden style={RULE} />
            <Fact term="Email confirmation sent to" value={DEMO_EMAIL} />
            <span aria-hidden style={RULE} />
            <Fact term="Order total" value={E2E_PARTNER_PRICE} />
          </dl>
        </section>

        {/* B2C AND GUEST END HERE — 2026-10-22, Jillienne's brief: "after secure
            checkout is complete, show something that thanks them for placing
            order, text confirming that info. has been emailed to them + that
            they can click the link in their email to set up their password".

            ⚠ IT REPLACES THE CREATE PASSWORD FORM RATHER THAN SITTING BESIDE
            IT, and that is the substance of the arm rather than a layout
            choice. The emailed link IS the verification step — it is what
            proves the address the learner typed twice is one they can actually
            open — so offering an inline password field next to it would hand
            them a way to finish without ever opening the mail, which is the
            one thing this flow exists to require.

            ⚠ SO THE B2C AND GUEST WALKS STOP ON THIS PAGE. There is no Confirm to press,
            which means the End-to-End row's hand-off to Atlas Learning (the
            spinner, `e2e-loading-opens-home`, `?journey=full`) has nothing to
            fire it. That is correct for the flow as briefed — the learner
            genuinely does leave for their inbox — but it does mean the full
            journey is a B2B walk today. If the row needs to continue, the
            thing to add is an explicit "open the link in your email" demo
            affordance here, NOT a password field. */}
        {/* ⚠ THE ONLY ARM LEFT ON THIS PAGE — 2026-10-23. It used to be a
            ternary: "Check your email" for the flows whose password comes
            from a mailed link, and a Create password form beside this receipt
            for the one that sets it inline. That second half moved to
            `XcelSplitConfirmationPage`, which is the guest journey’s ending
            and now both — Jillienne: "this step needs to match the
            confirmation page we did for the guest version". `InviteFlowRoutes`
            does the choosing, so this page renders one thing.

            ⚠ IT IS STILL A GENUINELY DIFFERENT PAGE, not a state of that one:
            there is no form here, because the emailed link IS the
            verification step and an inline password field beside it would let
            the learner finish without ever opening the mail.

            ⚠ SO THESE WALKS STOP HERE. There is no Confirm to press, which
            means the End-to-End row’s hand-off to Atlas has nothing to fire
            it. Correct for the flow as briefed — the learner genuinely does
            leave for their inbox — but it means the full journey is a
            with-email walk. If the row needs to continue, the thing to add is
            an explicit "open the link in your email" demo affordance, NOT a
            password field. */}
          <section aria-labelledby="check-your-email" style={PASSWORD_COLUMN}>
            <h2 id="check-your-email" style={TITLE}>
              Check your email
            </h2>
            <div style={EMAILED_STACK}>
              <p style={EMAILED_TEXT}>
                We’ve emailed your order confirmation and account details to{' '}
                <strong style={{ fontWeight: 800 }}>{DEMO_EMAIL}</strong>.
              </p>
              <p style={EMAILED_TEXT}>
                Click the link in that email to set up your password and finish creating your account. The
                link confirms we can reach you at this address.
              </p>
              <p style={EMAILED_FINE}>
                Nothing in your inbox after a few minutes? Check your spam folder — the message comes from
                support@xcelsolutions.com.
              </p>
            </div>
          </section>
      </main>
    </div>
  )
}

/* ⚠ THE SAME ADDRESS THE HEADER AND THE EMAIL PAGE SHOW (2026-10-19,
   Jillienne: "make this update within the Invite flow as well where
   applicable"). It was `@example.com` here and `alicia.navarro@gmail.com` in
   the header — so the walk confirmed a purchase to one address and then
   signed the learner in as somebody else. It reads the shared constant now,
   so the three cannot drift apart again. */
/* ── B2C's "check your email" ending (2026-10-22) ── */

const EMAILED_STACK: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 }

const EMAILED_TEXT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const EMAILED_FINE: CSSProperties = {
  ...EMAILED_TEXT,
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const DEMO_EMAIL = E2E_LEARNER_EMAIL

function Fact({ term, value, spaced = false }: { term: string; value: string; spaced?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 2 }}>
      <dt style={FACT_TERM}>{term}</dt>
      <dd style={spaced ? { ...FACT_VALUE, letterSpacing: 2 } : FACT_VALUE}>{value}</dd>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const PAGE: CSSProperties = { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-neutral-75)' }

/* The body fills the window under the header: the confirmation panel, then
   the password column. */
const BODY: CSSProperties = { flex: '1 0 auto', display: 'flex', alignItems: 'stretch' }

/* The left panel's top, the check and the gap under it — named, because the
   password column's top is built from them: the two titles share a baseline
   (2026-10-15, Eric's request; the design's 134 put Create password 2 low). */
const PANEL_TOP = 64
const CHECK_SIZE = 52
const CHECK_GAP = 16

/* Secondary 200, a Secondary 300 rule on its right; 64 down, 88 in. */
const CONFIRM_PANEL: CSSProperties = {
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 32,
  padding: `${PANEL_TOP}px 88px`,
  background: 'var(--color-secondary-200)',
  borderRight: '1px solid var(--color-secondary-300)',
}

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 24,
  lineHeight: '38px',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}

const FACTS: CSSProperties = { margin: 0, width: 297, display: 'flex', flexDirection: 'column', gap: 20 }

const RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-secondary-400)' }

const FACT_TERM: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 12,
  lineHeight: 'normal',
  letterSpacing: 1.08,
  textTransform: 'uppercase',
  color: 'var(--color-neutral-700)',
}

const FACT_VALUE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 15,
  lineHeight: 'normal',
  color: 'var(--color-neutral-900)',
}

/* 88 in, and down to the left title's line; a 440 column, its title 24
   above the form. */
const PASSWORD_COLUMN: CSSProperties = {
  flex: '1 0 0',
  minWidth: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  width: 440,
  maxWidth: 440,
  boxSizing: 'content-box',
  padding: `${PANEL_TOP + CHECK_SIZE + CHECK_GAP}px 0 64px 88px`,
}

/* The demo fill's target: the card's bottom-right corner. Transparent and
   borderless — it is not part of the design, and anything visible here would
   read as a control of the product. The same shape the checkout's
   personal-info form uses.

   ⚠ 40 SQUARE BECAUSE THE CARD'S PADDING IS 40. The checkout's copy of this is
   44, and 44 here put a 4×4 corner of an invisible button over the bottom-right
   pixels of Confirm — absolutely positioned, so it paints above and would have
   taken the press. Sized to the padding, it lives entirely in the margin and
/* THE LOADING PAGE. Centred in the body, no header above it, the topo map
   absolutely behind it (hence `position: relative`); the line under the
   spinner is Open Sans 16 / 24 as the body copy on the Invited Product
   Detail page, its dots in a monospace-ish fixed width so they type in place. */
