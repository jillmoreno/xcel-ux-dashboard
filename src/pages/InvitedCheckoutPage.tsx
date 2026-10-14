import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useEndToEndDemoParams } from './endToEndDemo'

/**
 * CHECKOUT — `/end-to-end-demo/checkout` (2026-10-14, Eric's request), Figma
 * "Atlas UX Design" 420:2392. The End-to-End Demo's next page: Invited Product
 * Detail's Purchase Now opens it, and Return to cart goes back.
 *
 * A STATIC MOCK, deliberately: the card fields hold nothing and send nothing,
 * Place your order stays disabled (the design draws it at 50%), and the Edit
 * buttons, the Terms link and Apply are not wired. The payment methods do
 * switch — Credit Card shows the card form, the other two hide it.
 *
 * DEMO DATA: the learner is the demo's, Jordan Navarro, at an invented address
 * and a 555 number. The Figma frame carries what looks like a real home address
 * and phone, so it is not copied here.
 *
 * The design's fonts and colours, through the `--font-e2e-*` / `--color-e2e-*`
 * tokens (Rockwell for the design's Amasis MT). The card, Google Pay, PayPal
 * and reCAPTCHA marks are the design's own images (`public/brand/checkout/`).
 */
export function InvitedCheckoutPage() {
  const [method, setMethod] = useState<'card' | 'google-pay' | 'paypal'>('card')
  const [params] = useSearchParams()
  useEndToEndDemoParams()

  useEffect(() => {
    const before = document.title
    // A tick later: AccountContext names the tab on mount too.
    const t = window.setTimeout(() => {
      document.title = 'Checkout'
    }, 0)
    return () => {
      window.clearTimeout(t)
      document.title = before
    }
  }, [])

  return (
    <div style={PAGE}>
      <header style={HEADER}>
        <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={HEADER_LOGO} />
        <p style={SECURE_CHECKOUT}>
          Secure Checkout
          <img src="/brand/checkout/lock.svg" alt="" width={11} height={15.714} style={{ display: 'block' }} />
        </p>
        <Link to={`/end-to-end-demo?${params.toString()}`} style={RETURN_LINK}>
          Return to cart
        </Link>
      </header>

      <main style={MAIN}>
        {/* 1. STUDENT INFORMATION */}
        <section aria-labelledby="checkout-student" style={COLUMN}>
          <h3 id="checkout-student" style={STEP_TITLE}>
            1. Student information
          </h3>
          <div style={{ ...PANEL, padding: '20px 20px 30px', gap: 32 }}>
            <Address />
            <button type="button" style={EDIT_BUTTON}>
              Edit
            </button>
          </div>
        </section>

        {/* 2. PAYMENT */}
        <section aria-labelledby="checkout-payment" style={COLUMN}>
          <div style={{ position: 'relative' }}>
            <h3 id="checkout-payment" style={STEP_TITLE}>
              2. Payment
            </h3>
            <span style={SECURE_TAG}>
              Secure
              <img src="/brand/checkout/lock-small.svg" alt="" width={7} height={10} style={{ display: 'block' }} />
            </span>
          </div>
          <div style={{ ...PANEL, gap: 0, overflow: 'hidden' }} role="radiogroup" aria-label="Payment method">
            <MethodRow
              label="Credit Card"
              selected={method === 'card'}
              onSelect={() => setMethod('card')}
              ground="var(--color-fixed-light)"
              bordered
            >
              <span style={CARD_MARKS}>
                {(['amex', 'visa', 'mastercard', 'discover'] as const).map((c) => (
                  <img key={c} src={`/brand/checkout/card-${c}.png`} alt={CARD_NAMES[c]} width={37} height={37} />
                ))}
              </span>
            </MethodRow>

            {method === 'card' ? (
              <div style={CARD_FORM}>
                <div style={FIELD_GRID}>
                  <Field label="Card number" />
                  <Field label="Security code" />
                  <Field label="Expiration date" select />
                  <Field label="Expiration year" hiddenLabel select />
                </div>
                <div style={STORE_ROW}>
                  <label style={STORE_LABEL}>
                    <input type="checkbox" style={CHECKBOX} />
                    Securely store credit card for later use.
                  </label>
                  <img src="/brand/checkout/help.svg" alt="What is this?" width={16} height={16} style={{ display: 'block' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 31 }}>
                  <Address heading="Payment billing address" />
                  <button type="button" style={EDIT_BUTTON}>
                    Edit
                  </button>
                </div>
                <div style={RECAPTCHA}>
                  {/* One inline run: as two flex items the space between them collapsed. */}
                  <span style={RECAPTCHA_TEXT}>
                    <span>
                      protected by <span style={{ fontWeight: 500 }}>reCAPTCHA</span>
                    </span>
                  </span>
                  <img src="/brand/checkout/recaptcha.png" alt="" width={44} height={44} style={RECAPTCHA_MARK} />
                </div>
              </div>
            ) : null}

            <MethodRow
              label="Google Pay"
              selected={method === 'google-pay'}
              onSelect={() => setMethod('google-pay')}
              ground="var(--color-e2e-summary)"
            >
              <img src="/brand/checkout/google-pay.png" alt="Google Pay" width={80} height={42.55} />
            </MethodRow>
            <MethodRow
              label="PayPal"
              selected={method === 'paypal'}
              onSelect={() => setMethod('paypal')}
              ground="var(--color-e2e-summary)"
            >
              <img src="/brand/checkout/paypal.jpg" alt="PayPal" width={68} height={44} />
            </MethodRow>
          </div>
        </section>

        {/* ORDER SUMMARY */}
        <section aria-labelledby="checkout-summary" style={SUMMARY}>
          <h3 id="checkout-summary" style={{ ...STEP_TITLE, background: 'var(--color-fixed-light)' }}>
            Order summary
          </h3>
          {/* The outline starts below the title, so its sides do not run up
              beside it (2026-10-14, Eric's request). */}
          <div style={SUMMARY_BODY}>
          <div style={SUMMARY_ITEMS}>
            <div style={SUMMARY_PRODUCT}>
              <p style={{ ...TEXT_16, maxWidth: 260 }}>Florida Life and Health Pre-licensing Premier</p>
              <p style={TEXT_16}>$299.00</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Florida Life and Health Pre-licensing',
                'Recorded Livestream Exam Review - Life and Health English',
                'Flashcards - Life, Health, and Accident Insurance',
              ].map((d) => (
                <p key={d} style={DETAIL_ROW}>
                  {d}
                </p>
              ))}
            </div>
          </div>

          <div style={PROMO}>
            <label htmlFor="checkout-promo" style={PROMO_LABEL}>
              Promo code
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input id="checkout-promo" type="text" style={PROMO_INPUT} />
              <button type="button" style={APPLY}>
                Apply
              </button>
            </div>
          </div>

          <div style={TOTALS}>
            <p style={TOTAL_ROW}>
              <span>Subtotal</span>
              <span>$299.00</span>
            </p>
            <p style={{ ...TOTAL_ROW, fontWeight: 800, lineHeight: '22px' }}>
              <span>Grand Total</span>
              <span>$299.00</span>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 30, padding: '25px 20px 0' }}>
            <button type="button" disabled style={PLACE_ORDER}>
              Place your order
            </button>
            <p style={TERMS}>
              By completing your purchase, you agree to our{' '}
              <button type="button" style={TERMS_LINK}>
                Terms of Service
              </button>
              .
            </p>
          </div>
          </div>
        </section>
      </main>
    </div>
  )
}

const CARD_NAMES = { amex: 'American Express', visa: 'Visa', mastercard: 'Mastercard', discover: 'Discover' }

function Address({ heading }: { heading?: string }) {
  return (
    <p style={TEXT_16}>
      {heading ? (
        <>
          {heading}
          <br />
        </>
      ) : null}
      Jordan Navarro
      <br />
      1200 Bayshore Boulevard
      <br />
      Tampa, Florida 33606
      <br />
      United States
      <br />
      555 010 0199
    </p>
  )
}

function MethodRow({
  label,
  selected,
  onSelect,
  ground,
  bordered = false,
  children,
}: {
  label: string
  selected: boolean
  onSelect: () => void
  ground: string
  bordered?: boolean
  children: ReactNode
}) {
  return (
    <div
      style={{
        ...METHOD_ROW,
        height: bordered ? 63 : 62,
        background: ground,
        borderBottom: bordered ? '1px solid var(--color-e2e-card-outline)' : undefined,
      }}
    >
      <button type="button" role="radio" aria-checked={selected} onClick={onSelect} style={METHOD_LABEL}>
        <span aria-hidden style={selected ? RADIO_ON : RADIO_OFF} />
        {label}
      </button>
      {children}
    </div>
  )
}

function Field({ label, select = false, hiddenLabel = false }: { label: string; select?: boolean; hiddenLabel?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={hiddenLabel ? { ...FIELD_LABEL, visibility: 'hidden' } : FIELD_LABEL}>
        {label} <span style={{ fontSize: 12 }}>*</span>
      </span>
      <span style={FIELD} aria-hidden>
        {select ? (
          <img src="/brand/checkout/select-chevron.svg" alt="" width={12} height={8} style={SELECT_CHEVRON} />
        ) : null}
      </span>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const PAGE: CSSProperties = { minHeight: '100vh', background: 'var(--color-fixed-light)' }

/* 89.87 tall, a soft shadow below; the logo 8 in from the top and bottom
   and 236 from the left, "Secure checkout" centred, Return to cart 236 from
   the right. */
const HEADER: CSSProperties = {
  position: 'relative',
  height: 89.87,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 236px',
  background: 'var(--color-fixed-light)',
  filter: 'drop-shadow(0 4px 2px var(--color-e2e-header-shadow))',
}

const HEADER_LOGO: CSSProperties = { display: 'block', width: 201.31, height: 73.87, objectFit: 'contain' }

const SECURE_CHECKOUT: CSSProperties = {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 18,
  lineHeight: '27px',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const RETURN_LINK: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 18,
  lineHeight: '27px',
  color: 'var(--color-e2e-link)',
  textDecoration: 'underline',
  textDecorationThickness: 1,
}

/* Three 384 columns, 24 apart, 240 in; 55 below the header. */
const MAIN: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 24,
  padding: '55px 240px 80px',
}

const COLUMN: CSSProperties = { width: 384, flex: 'none', display: 'flex', flexDirection: 'column' }

const STEP_TITLE: CSSProperties = {
  margin: 0,
  height: 45,
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 18,
  lineHeight: '25px',
  color: 'var(--color-neutral-950)',
}

const SECURE_TAG: CSSProperties = {
  position: 'absolute',
  right: 20,
  top: 19,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 11,
  lineHeight: '14px',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const PANEL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  borderRadius: 5,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-fixed-light)',
}

const TEXT_16: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const EDIT_BUTTON: CSSProperties = {
  height: 49,
  borderRadius: 5,
  border: '1px solid var(--color-text-primary)',
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 18,
  lineHeight: '25px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

const METHOD_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxSizing: 'border-box',
  padding: '0 17px',
}

const METHOD_LABEL: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 15,
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

const RADIO_OFF: CSSProperties = {
  width: 20,
  height: 20,
  boxSizing: 'border-box',
  borderRadius: 20,
  border: '1px solid var(--color-text-secondary)',
  background: 'var(--color-fixed-light)',
}

/* Filled, with a 4px white ring inside — the design's selected radio. */
const RADIO_ON: CSSProperties = {
  ...RADIO_OFF,
  border: '1px solid var(--color-text-primary)',
  background: 'var(--color-text-primary)',
  boxShadow: 'inset 0 0 0 4px var(--color-fixed-light)',
}

const CARD_MARKS: CSSProperties = { display: 'flex', gap: 10 }

/* The card form: 39 to the first labels, then the store row, the billing
   address and the reCAPTCHA badge; a #DDD rule below. */
const CARD_FORM: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 25,
  padding: '39px 20px 18px',
  borderBottom: '1px solid var(--color-e2e-card-outline)',
}

const FIELD_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  columnGap: 15,
  rowGap: 29,
}

const FIELD_LABEL: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  lineHeight: '19px',
  color: 'var(--color-text-primary)',
}

const FIELD: CSSProperties = {
  position: 'relative',
  height: 38,
  boxSizing: 'border-box',
  borderRadius: 5,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-e2e-field)',
}

const SELECT_CHEVRON: CSSProperties = { position: 'absolute', right: 13, top: 12.6, display: 'block' }

const STORE_ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 }

const STORE_LABEL: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 11,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

const CHECKBOX: CSSProperties = {
  width: 18,
  height: 18,
  margin: 0,
  accentColor: 'var(--color-text-primary)',
}

/* The reCAPTCHA badge, drawn: 256 × 60, its blue panel, the mark at right. */
const RECAPTCHA: CSSProperties = {
  position: 'relative',
  alignSelf: 'center',
  width: 256,
  height: 60,
  marginTop: 7,
  borderRadius: 3,
  overflow: 'hidden',
  background: 'var(--color-e2e-recaptcha-ground)',
  boxShadow: '0 0 5px 0 var(--color-e2e-recaptcha-shadow)',
}

const RECAPTCHA_TEXT: CSSProperties = {
  position: 'absolute',
  inset: '0 70px 0 0',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: 16,
  background: 'var(--color-e2e-recaptcha)',
  fontFamily: 'Roboto, Arial, sans-serif',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-fixed-light)',
}

const RECAPTCHA_MARK: CSSProperties = { position: 'absolute', left: 199, top: 8, display: 'block' }

/* The order summary: the warm ground, outlined on three sides, its items on
   white under a #DDD rule. */
const SUMMARY: CSSProperties = {
  width: 384,
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
}

const SUMMARY_BODY: CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  paddingBottom: 30,
  borderRadius: 5,
  border: '1px solid var(--color-e2e-card-outline)',
  borderTop: 'none',
  background: 'var(--color-e2e-summary)',
}

const SUMMARY_ITEMS: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '20px 20px 26px',
  borderTop: '1px solid var(--color-e2e-card-outline)',
  borderRadius: '5px 5px 0 0',
  background: 'var(--color-fixed-light)',
}

const SUMMARY_PRODUCT: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16 }

const DETAIL_ROW: CSSProperties = {
  margin: 0,
  padding: '10px 10px',
  background: 'var(--color-e2e-detail-row)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const PROMO: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, padding: '25px 20px 0' }

const PROMO_LABEL: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  lineHeight: '18px',
  color: 'var(--color-text-primary)',
}

const PROMO_INPUT: CSSProperties = {
  flex: '1 1 0',
  minWidth: 0,
  height: 36,
  boxSizing: 'border-box',
  margin: 0,
  padding: '0 10px',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRight: 'none',
  borderRadius: '5px 0 0 5px',
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
}

const APPLY: CSSProperties = {
  width: 96,
  height: 38,
  border: 'none',
  borderRadius: '0 5px 5px 0',
  background: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 14,
  lineHeight: '18px',
  color: 'var(--color-fixed-light)',
  cursor: 'pointer',
}

const TOTALS: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 20px 0' }

const TOTAL_ROW: CSSProperties = {
  ...TEXT_16,
  display: 'flex',
  justifyContent: 'space-between',
}

/* Disabled until the form is complete — the design's 50%. */
const PLACE_ORDER: CSSProperties = {
  height: 60,
  border: 'none',
  borderRadius: 5,
  background: 'var(--color-text-primary)',
  opacity: 0.5,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 20,
  lineHeight: '27px',
  color: 'var(--color-fixed-light)',
  cursor: 'not-allowed',
}

const TERMS: CSSProperties = {
  margin: 0,
  paddingRight: 48,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const TERMS_LINK: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'none',
  font: 'inherit',
  color: 'var(--color-e2e-link)',
  textDecoration: 'underline',
  textDecorationThickness: 1,
  cursor: 'pointer',
}
