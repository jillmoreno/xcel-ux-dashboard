import type { CSSProperties, ReactNode } from 'react'
import { CircleCheckSolid } from '@/icons'

/**
 * INVITE FLOW V3'S ORDER RECEIPT — 2026-11-03, Afsana: "update the
 * confirmation design to mimic the attached image, which is what currently
 * occurs in Invite Flow V2. create 4 versions so that we can choose 1" —
 * then, of the four, "keep the classic and ticket design only" (Inline and
 * Total first went the same day).
 *
 * The left half of `InvitedConfirmationPageV3`. Both versions are V2's
 * dark receipt (`XcelSplitConfirmationPage`, its dark arm) — the same navy
 * ground, teal rules and labels, green tick and serif thank-you, on the same
 * `--color-e2e-split-*` tokens — and differ in how they are arranged. The
 * Design bar's `invite-v3-receipt` picks one:
 *
 *   classic   V2's: the tick and "Thank you for your order, Jordan!"
 *             centred in an outlined box, a dashed tear line, then
 *             Confirmation number, Product and Order total on teal rules.
 *   ticket    the whole receipt one outlined ticket, torn across the middle.
 */
export type ReceiptVersion = 'classic' | 'ticket'

export function ConfirmationReceiptV3({
  version,
  first,
  confirmation,
  product,
  total,
}: {
  version: ReceiptVersion
  first: string
  confirmation: string
  product: string
  total: string
}) {
  /* The name last, not on its own line first as V2 has it (2026-11-03,
     Afsana: "Thank you for your order, Jordan!"). */
  const thanks = (
    <h1 id="order-thanks" style={THANKS}>
      Thank you for your order, {first}!
    </h1>
  )

  if (version === 'ticket') {
    return (
      <section aria-labelledby="order-thanks" style={RAIL}>
        <div style={TICKET}>
          <div style={TICKET_TOP}>
            <Tick />
            {thanks}
          </div>
          {/* The tear, with a notch cut from each edge. */}
          <div aria-hidden style={TEAR}>
            <span style={{ ...NOTCH, left: -9, clipPath: 'inset(0 0 0 50%)' }} />
            <span style={PERFORATION_FILL} />
            <span style={{ ...NOTCH, right: -9, clipPath: 'inset(0 50% 0 0)' }} />
          </div>
          <dl style={{ ...FACTS, padding: '4px 18px 10px' }}>
            <Fact term="Confirmation number" value={confirmation} wide />
            <Fact term="Product" value={product} />
            <Fact term="Order total" value={total} last />
          </dl>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="order-thanks" style={RAIL}>
      <div style={RECEIPT}>
        <Tick />
        {thanks}
      </div>
      <span aria-hidden style={PERFORATION} />
      <dl style={FACTS}>
        <Fact term="Confirmation number" value={confirmation} wide />
        <Fact term="Product" value={product} />
        <Fact term="Order total" value={total} />
      </dl>
    </section>
  )
}

/* V2's tick, with its arrival ring (`cre-e2e-order-tick*` in `tokens.css`). */
function Tick() {
  return (
    <span style={TICK_WRAP}>
      <span aria-hidden className="cre-e2e-order-tick-ring" style={TICK_RING} />
      <CircleCheckSolid
        size={28}
        aria-hidden
        className="cre-e2e-order-tick"
        style={{ color: 'var(--color-e2e-split-tick)', display: 'block', position: 'relative' }}
      />
    </span>
  )
}

function Fact({ term, value, wide = false, last = false }: { term: string; value: ReactNode; wide?: boolean; last?: boolean }) {
  return (
    <div style={last ? { ...FACT, borderBottom: 'none' } : FACT}>
      <dt style={FACT_TERM}>{term}</dt>
      <dd style={{ ...FACT_VALUE, letterSpacing: wide ? '0.08em' : undefined }}>{value}</dd>
    </div>
  )
}

/* ── Styles — V2's dark rail (`XcelSplitConfirmationPage`) ─────────────── */

const RAIL: CSSProperties = {
  flex: '0 1 340px',
  boxSizing: 'border-box',
  padding: '40px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  background: 'var(--color-e2e-split-rail)',
}

const RECEIPT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 14,
  padding: '22px 18px 26px',
  border: '1px solid var(--color-e2e-split-line)',
  /* Rounded on V3, as the Ticket is (2026-11-03, Afsana); V2's is square. */
  borderRadius: 6,
}

const TICK_WRAP: CSSProperties = {
  position: 'relative',
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const TICK_RING: CSSProperties = {
  position: 'absolute',
  inset: -6,
  borderRadius: '50%',
  border: '2px solid var(--color-e2e-split-tick)',
  pointerEvents: 'none',
}

const THANKS: CSSProperties = {
  margin: 0,
  textAlign: 'center',
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 20,
  lineHeight: '28px',
  color: 'var(--color-fixed-light)',
}

const PERFORATION: CSSProperties = {
  display: 'block',
  height: 1,
  borderTop: '1px dashed var(--color-e2e-split-line)',
}

const FACTS: CSSProperties = { margin: 0, display: 'flex', flexDirection: 'column', gap: 0 }

const FACT: CSSProperties = {
  padding: '12px 2px 14px',
  borderBottom: '1px solid var(--color-e2e-split-line)',
}

const FACT_TERM: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-e2e-split-label)',
}

const FACT_VALUE: CSSProperties = {
  margin: '5px 0 0',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-fixed-light)',
}

/* ticket */
const TICKET: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid var(--color-e2e-split-line)',
  borderRadius: 6,
}

const TICKET_TOP: CSSProperties = { ...RECEIPT, border: 'none' }

const TEAR: CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center', height: 18 }

const PERFORATION_FILL: CSSProperties = { ...PERFORATION, flex: '1 1 auto', margin: '0 14px' }

/* A half-circle bitten from the edge, in the rail's own colour. */
const NOTCH: CSSProperties = {
  position: 'absolute',
  top: 0,
  width: 18,
  height: 18,
  boxSizing: 'border-box',
  borderRadius: '50%',
  border: '1px solid var(--color-e2e-split-line)',
  background: 'var(--color-e2e-split-rail)',
}
