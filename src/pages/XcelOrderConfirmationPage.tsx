import type { CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import { XcelFooter } from '@/components/e2e/XcelFooter'
import { XcelSiteHeader } from '@/components/e2e/XcelSiteHeader'
import { CART_PACKAGE_PARAM, cartPackage } from '@/data/xcelCourseFinder'
import {
  signedIn,
  useInviteFlow,
  useOrderConfirmationStyle,
  usePartnerAttribution,
} from '@/data/inviteFlows'
import { INVITE_LOA_PARAM, INVITE_STATE_PARAM } from '@/data/inviteMissingDetails'
import {
  E2E_LEARNER_EMAIL,
  E2E_LEARNER_NAME,
  E2E_LEARNER_PHONE,
  useEndToEndDemoParams,
  useEndToEndPageChrome,
} from './endToEndDemo'
import { XcelSplitConfirmationPage } from './XcelSplitConfirmationPage'
import './inviteFlow.css'

/**
 * THE ORDER CONFIRMATION — 2026-10-22, the public site's own, and the last
 * screen of the guest journey.
 *
 * ⚠ THERE ARE NOW TWO CONFIRMATIONS, and they belong to different journeys.
 * `InvitedConfirmationPage` is "Confirmation & Password" — the INVITED flow's
 * ending, where the learner sets a password and is handed into Atlas. This is
 * the one a stranger who bought from xcelsolutions.com sees: an order number, a
 * way into the portal, and the order's details. They are not variants of each
 * other and neither should be made to serve both; what a flow ends on follows
 * from how it began.
 *
 * ⚠ IT ASSUMES THE ACCOUNT EXISTS, which is in tension with the B2C ending
 * built earlier today ("we've emailed you — click the link to set your
 * password"). Both are real patterns and the live site uses this one; the
 * earlier message is still what `passwordSetFromEmailedLink` describes. Worth
 * settling before this goes in front of anyone — see the note on
 * `LAUNCH_PORTAL` below.
 */
export function XcelOrderConfirmationPage() {
  /* ⚠ ONE ROUTE, TWO ENDINGS — 2026-10-22. The `Thank you page` control picks
     which; sharing the route means every link into the guest flow's ending
     keeps working whichever is selected, and a reviewer can flip between them
     without the address changing under them. */
  const style = useOrderConfirmationStyle()
  const flow = useInviteFlow()
  if (style === 'split') return <XcelSplitConfirmationPage tone="dark" />
  if (style === 'light') return <XcelSplitConfirmationPage tone="light" />
  /* ⚠ THE RECEIPT HAS NO PASSWORD STEP, AND THE SIGNED-IN ARM NEEDS ONE —
     2026-10-27. Its Launch Student Portal assumes the account is ready; this
     learner's dashboard account does not exist until they set its password.
     So the receipt resolves to the light split here, exactly as it does for
     the invited journey in `InviteFlowRoutes` — one password screen, not a
     second one drawn inside the receipt. */
  if (signedIn(flow)) return <XcelSplitConfirmationPage tone="light" />
  return <XcelReceiptConfirmation />
}

function XcelReceiptConfirmation() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('Order Confirmation | XCEL')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const state = params.get(INVITE_STATE_PARAM) ?? ''
  const lineOfAuthority = params.get(INVITE_LOA_PARAM) ?? ''
  const pkg = cartPackage(state, lineOfAuthority, params.get(CART_PACKAGE_PARAM))
  const partnered = usePartnerAttribution()
  /* The price actually paid — the partner's where a code was accepted, the
     list price otherwise. The same call the checkout made. */
  const paid = partnered ? '$65.00' : (pkg?.price ?? '$199.00')

  return (
    <div style={PAGE}>
      <StandaloneBrowserChrome />
      <XcelSiteHeader />

      <main style={BODY}>
        <h1 style={TITLE}>Thank you for your order!</h1>
        <p style={ORDER_LINE}>
          Your order confirmation is: <span style={ORDER_NUMBER}>XL00186785</span>
        </p>

        <span aria-hidden style={RULE} />

        <section aria-labelledby="access-training" style={BLOCK}>
          <h2 id="access-training" style={BLOCK_TITLE}>
            To access your training:
          </h2>
          <p style={BODY_TEXT}>
            Visit the student portal to view and take your purchased training. You can also find your
            training directly by clicking My Training at the top of every page.
          </p>
          <p style={BODY_TEXT}>
            Purchased courses will be available in your student portal within 15 minutes.
          </p>
          {/* ⚠ WHERE THIS LEADS IS THE OPEN QUESTION. It opens the demo's own
              dashboard, which is the only portal this prototype has — but on a
              flow that was told its password would arrive by email, a learner
              would not be able to get in yet. Wiring it anyway is the honest
              placeholder: the button is in the design and a dead one would
              teach reviewers less than one that goes somewhere. */}
          <button
            type="button"
            className="cre-e2e-cta"
            style={LAUNCH_PORTAL}
            onClick={() =>
              navigate({ pathname: '/dashboard-rebrand', search: params.toString() })
            }
          >
            Launch Student Portal
          </button>
        </section>

        <span aria-hidden style={RULE} />

        <section aria-labelledby="order-details" style={BLOCK}>
          <h2 id="order-details" style={BLOCK_TITLE}>
            Order Details:
          </h2>
          <div style={DETAILS}>
            <DetailPanel
              title="Billing Information"
              lines={[E2E_LEARNER_NAME, pkg?.name ?? '', paid]}
            />
            <DetailPanel
              title="Student Information"
              lines={[E2E_LEARNER_NAME, E2E_LEARNER_EMAIL, E2E_LEARNER_PHONE]}
            />
          </div>
        </section>
      </main>

      <XcelFooter />
    </div>
  )
}

/** One of the two grey-headed panels under Order Details. */
function DetailPanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <section aria-label={title} style={DETAIL_PANEL}>
      <h3 style={DETAIL_HEAD}>{title}</h3>
      <div style={DETAIL_BODY}>
        {lines
          .filter((l) => l !== '')
          .map((line) => (
            <p key={line} style={DETAIL_LINE}>
              {line}
            </p>
          ))}
      </div>
    </section>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const PAGE: CSSProperties = { minHeight: '100%', background: 'var(--color-fixed-light)' }

const BODY: CSSProperties = {
  padding: '40px 48px 72px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  background: 'var(--color-fixed-light)',
}

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 34,
  lineHeight: '42px',
  color: 'var(--color-text-primary)',
}

const ORDER_LINE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const ORDER_NUMBER: CSSProperties = { fontWeight: 800, textDecoration: 'underline' }

const RULE: CSSProperties = {
  display: 'block',
  height: 1,
  background: 'var(--color-e2e-card-outline)',
}

const BLOCK: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }

const BLOCK_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 15,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

const BODY_TEXT: CSSProperties = {
  margin: 0,
  maxWidth: 820,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

/* XCEL brick, and the page's only button — it is what the learner came here
   to do next. */
const LAUNCH_PORTAL: CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 6,
  padding: '13px 22px',
  borderRadius: 4,
  border: 'none',
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
}

const DETAILS: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 24,
  alignItems: 'flex-start',
}

const DETAIL_PANEL: CSSProperties = { flex: '1 1 320px', minWidth: 0 }

/* The design's grey header band, full width of its column. */
const DETAIL_HEAD: CSSProperties = {
  margin: 0,
  padding: '12px 16px',
  background: 'var(--color-e2e-detail-head)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const DETAIL_BODY: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '14px 16px 0',
}

const DETAIL_LINE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-text-primary)',
}
