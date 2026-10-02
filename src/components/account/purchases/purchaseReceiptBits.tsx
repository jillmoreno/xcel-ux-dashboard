import type { CSSProperties } from 'react'
import { SOLD_BY_INVENTED, formatMoney, type PurchaseRecord } from '@/data/purchasesFixtures'

/**
 * The receipt itself — the address blocks and the line-item / totals box —
 * shared by BOTH Purchases layouts.
 *
 * The `purchases-layout` A/B forks the LAYOUT (month-grouped cards vs. a sorted
 * table with a detail sheet) and deliberately does not fork this. A receipt
 * that renders one way inside a card and another inside a sheet would make the
 * comparison about the receipt rather than about the layout, which is the
 * "fork the layout, import the data" rule in CLAUDE.md applied one level up.
 *
 * Extracted from `OrderCard` when the table arm was built; the cards arm renders
 * exactly what it always did.
 */

/* ─── addresses ────────────────────────────────────────────────────────── */

export function AddressBlock({
  heading,
  name,
  line1,
  cityState,
  postal,
}: {
  heading: string
  name: string
  line1: string
  cityState: string
  postal: string
}) {
  return (
    <div>
      <span style={addressHeadingStyle}>{heading}</span>
      <address style={addressBodyStyle}>
        <span style={addressNameStyle}>{name}</span>
        <span>{line1}</span>
        <span>{cityState}</span>
        <span>{postal}</span>
      </address>
    </div>
  )
}

/** Billed To + Sold By as one stacked pair — the combination both arms show. */
export function AddressPair({
  billedToName,
  billedTo,
}: {
  billedToName: string
  billedTo: { line1: string; cityState: string; postal: string }
}) {
  return (
    <>
      <AddressBlock
        heading="Billed To:"
        name={billedToName}
        line1={billedTo.line1}
        cityState={billedTo.cityState}
        postal={billedTo.postal}
      />
      <AddressBlock
        heading="Sold By:"
        name={SOLD_BY_INVENTED.name}
        line1={SOLD_BY_INVENTED.line1}
        cityState={SOLD_BY_INVENTED.cityState}
        postal={SOLD_BY_INVENTED.postal}
      />
    </>
  )
}

/* ─── receipt box ──────────────────────────────────────────────────────── */

export function ReceiptBox({ record }: { record: PurchaseRecord }) {
  return (
    <div style={receiptBoxStyle}>
      <div style={receiptSectionStyle}>
        {record.lineItems.map((item, i) => (
          <div key={`${record.id}-li-${i}`} style={receiptRowStyle}>
            {/* The first line is the thing bought; the rest are what it
                contains, so only the first carries weight. */}
            <span style={i === 0 ? receiptLeadLabelStyle : receiptLabelStyle}>{item.label}</span>
            <span style={i === 0 ? receiptLeadAmountStyle : receiptAmountStyle}>
              {/* "Included", never "$0.00" — a zero here would read as a charge
                  that failed rather than a component covered by the package
                  above it. */}
              {item.amount === 'included' ? 'Included' : formatMoney(item.amount)}
            </span>
          </div>
        ))}
      </div>

      <div style={receiptSectionStyle}>
        <SummaryRow label="Subtotal" value={formatMoney(record.subtotal)} />
        <SummaryRow label="Tax" value={formatMoney(record.tax)} />
        {/* Hidden at zero rather than shown as "$0.00" — a discount row reading
            nothing is a promise the order did not keep. */}
        {record.discount > 0 && (
          <SummaryRow label="Discount" value={`(${formatMoney(-record.discount)})`} />
        )}
      </div>

      <div style={totalRowStyle}>
        <span style={totalLabelStyle}>Total</span>
        <span style={totalValueStyle}>{formatMoney(record.total)}</span>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={receiptRowStyle}>
      <span style={receiptLabelStyle}>{label}</span>
      <span style={receiptAmountStyle}>{value}</span>
    </div>
  )
}

/* ─── styles (tokens only) ─────────────────────────────────────────────── */

/** "Receipt:" — the label above the box. A COMPONENT rather than an exported
 *  style object: a file that exports both components and plain values loses
 *  Fast Refresh (`react-refresh/only-export-components`), so editing anything
 *  here would full-reload the page and close whatever sheet you were looking
 *  at. Same reason `profileFormStyles.ts` exists next door. */
export function ReceiptHeading() {
  return <span style={headingStyle}>Receipt:</span>
}

const headingStyle: CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
}

const addressHeadingStyle: CSSProperties = headingStyle

const addressBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontStyle: 'normal',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const addressNameStyle: CSSProperties = { fontWeight: 700 }

const receiptBoxStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
}

const receiptSectionStyle: CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid var(--color-border-subtle)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const receiptRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 16,
}

const receiptLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const receiptLeadLabelStyle: CSSProperties = { ...receiptLabelStyle, fontWeight: 700 }

const receiptAmountStyle: CSSProperties = {
  flex: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  fontVariantNumeric: 'tabular-nums',
}

const receiptLeadAmountStyle: CSSProperties = { ...receiptAmountStyle, fontWeight: 700 }

const totalRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 16,
  padding: '16px',
}

const totalLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 17,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const totalValueStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 17,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  fontVariantNumeric: 'tabular-nums',
}
