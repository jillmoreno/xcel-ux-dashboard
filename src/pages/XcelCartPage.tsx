import type { CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import { XcelFooter } from '@/components/e2e/XcelFooter'
import { XcelSiteHeader } from '@/components/e2e/XcelSiteHeader'
import { CART_PACKAGE_PARAM, cartPackage } from '@/data/xcelCourseFinder'
import { INVITE_LOA_PARAM, INVITE_STATE_PARAM } from '@/data/inviteMissingDetails'
import {
  asksForPartnerCode,
  clearPartnerCodeAnswer,
  usePartnerCodeAnswered,
  usePartnerCodeAsk,
  useInviteFlow,
} from '@/data/inviteFlows'
import { useEndToEndDemoParams, useEndToEndPageChrome } from './endToEndDemo'
import './inviteFlow.css'

/**
 * YOUR CART — `/checkout/cart` on the real site (2026-10-22, "next page =
 * cart"), and the step between the public site and the checkout.
 *
 * ⚠ IT IS WHERE THE GUEST JOURNEY LEAVES THE MARKETING SITE. Everything before
 * it — the finder, the course page, this page — is xcelsolutions.com; Checkout
 * hands over to the flow's own pages, which the invited journeys share. That
 * seam is why Checkout is the only control here that leaves for a different
 * kind of page.
 *
 * ⚠ THE INVITED FLOWS DO NOT COME THROUGH HERE. An invitation links straight
 * to a product and its checkout — there is no browsing and no basket — which
 * is the shape difference between being sent to a course and finding one.
 *
 * ⚠ NO PARTNER PRICE ON THIS PAGE, and that is not an omission: a guest with
 * no partner pays the list price, which is the same call `partnerAttributed`
 * makes on the product page and in the order summary. A cart reached by a
 * partner-attributed flow would need that discount — see the note on Checkout.
 */
export function XcelCartPage() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('Shopping Cart | XCEL')
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const state = params.get(INVITE_STATE_PARAM) ?? ''
  const lineOfAuthority = params.get(INVITE_LOA_PARAM) ?? ''
  const pkg = cartPackage(state, lineOfAuthority, params.get(CART_PACKAGE_PARAM))
  /* WHERE CHECKOUT GOES. On the `page` arm the partner-code question is a step
     of its own between here and the checkout; on the `modal` arm the checkout
     draws it over itself, so this goes straight there. Flows that already have
     a partner skip the question entirely — see `asksForPartnerCode`. */
  const flow = useInviteFlow()
  const ask = usePartnerCodeAsk()
  const answered = usePartnerCodeAnswered()
  const checkoutPath =
    asksForPartnerCode(flow) && ask === 'page' && !answered
      ? '/end-to-end-demo/partner-code'
      : '/end-to-end-demo/checkout'

  const remove = () => {
    /* Emptying the cart ends the purchase the answer belonged to. */
    const next = clearPartnerCodeAnswer(params)
    next.delete(CART_PACKAGE_PARAM)
    setParams(next, { replace: true })
  }

  return (
    <div style={PAGE}>
      <StandaloneBrowserChrome />
      <XcelSiteHeader />

      <main style={BODY}>
        <h1 style={TITLE}>Your cart</h1>

        {pkg ? (
          <div style={LAYOUT}>
            <section aria-label="Items" style={ITEMS}>
              <div style={ITEM}>
                <div style={ITEM_MAIN}>
                  <p style={ITEM_NAME}>{pkg.name}</p>
                  {/* The bundle's contents, as the real cart lists them. Drawn
                      only when there is more than one: a single chip restating
                      the line directly above it is a label, not information. */}
                  {pkg.includes.length > 1 ? (
                    <ul style={CHIPS}>
                      {pkg.includes.map((line) => (
                        <li key={line} style={CHIP}>
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <button type="button" onClick={remove} style={REMOVE}>
                    Remove
                  </button>
                </div>
                <p style={ITEM_PRICE}>{pkg.price}</p>
              </div>
            </section>

            <aside aria-labelledby="order-summary" style={SUMMARY}>
              <h2 id="order-summary" style={SUMMARY_TITLE}>
                Order Summary
              </h2>
              <div style={SUMMARY_BODY}>
                <label style={PROMO_GROUP}>
                  <span style={PROMO_LABEL}>Promo code</span>
                  <span style={PROMO_ROW}>
                    <input type="text" style={PROMO_INPUT} />
                    <button type="button" style={PROMO_APPLY} title="Not wired in this prototype">
                      Apply
                    </button>
                  </span>
                </label>
                <div style={TOTALS}>
                  <p style={TOTAL_ROW}>
                    <span>Subtotal</span>
                    <span>{pkg.price}</span>
                  </p>
                  <p style={{ ...TOTAL_ROW, fontWeight: 800 }}>
                    <span>Order Total</span>
                    <span>{pkg.price}</span>
                  </p>
                </div>
                {/* ⚠ THE HAND-OFF. This is the one control on the public site
                    that opens one of the flow's own pages, and it carries the
                    whole query string so the state, the line of authority and
                    the flow all survive the crossing. */}
                <button
                  type="button"
                  className="cre-e2e-cta"
                  style={CHECKOUT}
                  onClick={() =>
                    navigate({ pathname: checkoutPath, search: params.toString() })
                  }
                >
                  Checkout
                </button>
              </div>
            </aside>
          </div>
        ) : (
          /* ⚠ A REAL STATE, reachable by pressing Remove. Without a way back to
             the catalogue it is a dead end — the one screen in the walk with no
             forward move. */
          <div style={EMPTY}>
            <p style={EMPTY_TEXT}>Your cart is empty.</p>
            <button
              type="button"
              className="cre-e2e-cta"
              style={CHECKOUT}
              onClick={() =>
                navigate({ pathname: '/end-to-end-demo/find', search: params.toString() })
              }
            >
              Find a course
            </button>
          </div>
        )}
      </main>

      <XcelFooter />
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const PAGE: CSSProperties = { minHeight: '100%', background: 'var(--color-fixed-light)' }

const BODY: CSSProperties = {
  padding: '36px 48px 72px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  background: 'var(--color-fixed-light)',
}

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 30,
  lineHeight: '38px',
  color: 'var(--color-text-primary)',
}

const LAYOUT: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: 48,
}

const ITEMS: CSSProperties = { flex: '1 1 520px', minWidth: 0 }

const ITEM: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 24,
  padding: '18px 0 20px',
  borderTop: '1px solid var(--color-e2e-card-outline)',
  borderBottom: '1px solid var(--color-e2e-card-outline)',
}

const ITEM_MAIN: CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  alignItems: 'flex-start',
}

const ITEM_NAME: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 15,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

const CHIPS: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  width: '100%',
  maxWidth: 440,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const CHIP: CSSProperties = {
  padding: '11px 14px',
  background: 'var(--color-e2e-form-locked)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const REMOVE: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  color: 'var(--color-e2e-link)',
  textDecoration: 'underline',
  cursor: 'pointer',
}

const ITEM_PRICE: CSSProperties = {
  flex: 'none',
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

const SUMMARY: CSSProperties = {
  flex: '0 1 340px',
  boxSizing: 'border-box',
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-fixed-light)',
}

const SUMMARY_TITLE: CSSProperties = {
  margin: 0,
  padding: '18px 20px',
  background: 'var(--color-secondary-200)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 17,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const SUMMARY_BODY: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  padding: 20,
}

const PROMO_GROUP: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }

const PROMO_LABEL: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 13,
  color: 'var(--color-text-primary)',
}

const PROMO_ROW: CSSProperties = { display: 'flex' }

const PROMO_INPUT: CSSProperties = {
  boxSizing: 'border-box',
  flex: '1 1 auto',
  minWidth: 0,
  height: 38,
  padding: '0 10px',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRight: 'none',
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
}

const PROMO_APPLY: CSSProperties = {
  flex: 'none',
  width: 86,
  height: 38,
  border: 'none',
  background: 'var(--color-e2e-course-band)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
}

const TOTALS: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  paddingTop: 18,
  borderTop: '1px solid var(--color-e2e-card-outline)',
}

const TOTAL_ROW: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

/* The cart's dark CTA, which is the real page's — not XCEL brick. It is the
   last step on the marketing site and reads as a hand-off rather than as
   another offer. */
const CHECKOUT: CSSProperties = {
  padding: '15px 24px',
  border: 'none',
  background: 'var(--color-e2e-course-band)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 16,
  cursor: 'pointer',
}

const EMPTY: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 18,
  padding: '24px 0 60px',
  borderTop: '1px solid var(--color-e2e-card-outline)',
}

const EMPTY_TEXT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  color: 'var(--color-text-secondary)',
}
