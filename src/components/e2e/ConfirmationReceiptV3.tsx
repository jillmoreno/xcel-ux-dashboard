import type { CSSProperties, ReactNode } from 'react'

/**
 * INVITE FLOW V3'S ORDER RECEIPT — the left half of `InvitedConfirmationPageV3`.
 *
 * V2's B2C guest checkout receipt, the Light arm of `order-confirmation-style`
 * on `XcelSplitConfirmationPage` (2026-11-03, Afsana: "match the design of the
 * receipt in Invite Flow V2's invite flow titled b2c guest checkout"): warm
 * paper, no tick or box, the thank-you ranged left over the confirmation
 * number, product and total on hairline rules. Two V3 differences: the
 * heading reads "Thank you for your order, Jordan!", and the rules are
 * secondary 300, one step darker than the paper, so they read.
 *
 * ⚠ IT WAS ONE OF THREE THE SAME DAY. V2's dark receipt as Classic and as a
 * torn Ticket sat beside it on a Design bar control (`invite-v3-receipt`)
 * until Afsana asked for both to go; with one left, the control went too.
 */
export function ConfirmationReceiptV3({
  first,
  confirmation,
  product,
  total,
}: {
  first: string
  confirmation: string
  product: string
  total: string
}) {
  return (
    <section aria-labelledby="order-thanks" style={RAIL}>
      <div style={RECEIPT}>
        <h1 id="order-thanks" style={THANKS}>
          Thank you for your order, {first}!
        </h1>
      </div>
      <dl style={FACTS}>
        <Fact term="Confirmation number" value={confirmation} wide />
        <Fact term="Product" value={product} />
        <Fact term="Order total" value={total} />
      </dl>
    </section>
  )
}

function Fact({ term, value, wide = false }: { term: string; value: ReactNode; wide?: boolean }) {
  return (
    <div style={FACT}>
      <dt style={FACT_TERM}>{term}</dt>
      <dd style={{ ...FACT_VALUE, letterSpacing: wide ? '0.08em' : undefined }}>{value}</dd>
    </div>
  )
}

/* ── Styles — V2's Light rail (`XcelSplitConfirmationPage`) ────────────── */

const RAIL: CSSProperties = {
  flex: '0 1 370px',
  boxSizing: 'border-box',
  padding: '48px 40px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  background: 'var(--color-secondary-200)',
}

const RECEIPT: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: 12,
  padding: '0 0 14px',
}

const THANKS: CSSProperties = {
  margin: 0,
  textAlign: 'left',
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 17,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const FACTS: CSSProperties = { margin: 0, display: 'flex', flexDirection: 'column', gap: 0 }

/* Secondary 300 on V3 — one step darker than the paper, so the rules read
   (2026-11-03, Afsana). V2's are `--color-e2e-split-rule-light`. */
const FACT: CSSProperties = {
  padding: '13px 0 2px',
  borderTop: '1px solid var(--color-secondary-300)',
}

const FACT_TERM: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const FACT_VALUE: CSSProperties = {
  margin: '6px 0 13px',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}
