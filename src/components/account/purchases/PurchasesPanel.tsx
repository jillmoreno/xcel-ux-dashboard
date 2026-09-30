import { useMemo, useState, type CSSProperties } from 'react'
import { ChevronDown, ChevronUp, Eye, EyeSlash } from '@/icons'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { AccountSectionPlaceholder } from '@/components/account/AccountSectionLayout'
import { profileFor } from '@/data/accountProfileFixtures'
import {
  formatOrderDate,
  groupPurchasesByMonth,
  purchasesFor,
  type PurchaseRecord,
} from '@/data/purchasesFixtures'
import { AddressPair, ReceiptBox, ReceiptHeading } from './purchaseReceiptBits'
import { PurchasesLedgerPanel } from './PurchasesLedgerPanel'

/**
 * The flag gate, as a COMPONENT rather than a branch in the shell.
 *
 * `renderBody` in `PlatformShell` is a plain function, not a component, so it
 * cannot call `useFeatureFlag` — reading the flag there would be a hook in a
 * non-component and React would throw. Wrapping it here keeps the shell's
 * account branch a one-liner and puts the fallbacks next to the things they
 * fall back from.
 *
 * TWO FLAGS, AND THEY ANSWER DIFFERENT QUESTIONS — the order matters.
 * `account-purchases-ledger` asks whether the section is BUILT at all (off ⇒
 * the not-built-yet placeholder it shipped with); only then does
 * `purchases-layout` choose which arm. Reading the layout flag first would let
 * `?ff=purchases-layout:table` appear to work while the section is meant to be
 * dark.
 */
export function PurchasesSection() {
  const ledgerOn = useFeatureFlag('account-purchases-ledger').enabled
  const layout = useFeatureFlag('purchases-layout').variant
  if (!ledgerOn) return <AccountSectionPlaceholder id="purchases" />
  /* Anything that is not the table arm falls back to cards — an unknown or
     absent variant lands on the shipped behaviour rather than on a blank. */
  return layout === 'table' ? <PurchasesLedgerPanel /> : <PurchasesPanel />
}

/**
 * My Purchases — the order ledger, ported from the reference design and
 * retoned to XCEL.
 *
 * ⚠ THE REFERENCE WAS A DIFFERENT PRODUCT, and two of its patterns did not
 * survive the port because they were artefacts of that product's commerce
 * model, not of this layout:
 *
 *  - Its totals netted to **$0.00** via a discount equal to the subtotal —
 *    that is an all-access MEMBERSHIP absorbing the price of a course.
 *    `supportsMembership('xcel')` is false; here real money is charged, so a
 *    $0.00 total would read as a failed transaction rather than a benefit.
 *  - Its line items were **per-state CE certificates** ("Certificate - AR /
 *    AK / AZ"), which is multi-state CE reporting. XCEL's line items are what
 *    the package contains.
 *
 * WHAT DID SURVIVE is the ledger shape — month groups, a count per month, one
 * collapsible card per order, Billed To / Sold By, the receipt table, and
 * Download Receipt. That shape assumes purchases ACCUMULATE, which they do
 * here: a learner buys a package, adds tools, and comes back for a second line
 * of authority.
 *
 * Every group but the newest starts collapsed, and every card starts with its
 * details hidden — so the section opens as a scannable history and expands into
 * a receipt only where asked.
 */
export function PurchasesPanel() {
  const { brand, membership } = useAccount()
  const isMember = membership === 'member'
  const records = useMemo(() => purchasesFor(brand), [brand])
  const groups = useMemo(() => groupPurchasesByMonth(records), [records])
  const profile = useMemo(() => profileFor(brand, isMember), [brand, isMember])

  /* Collapsed state is keyed by month, and stores the CLOSED ones — so the
     newest group is open by default without having to seed the set from the
     data, and a group that appears later (a new order) is open too. */
  const [closedMonths, setClosedMonths] = useState<Set<string>>(
    () => new Set(groups.slice(1).map((g) => g.key)),
  )

  if (groups.length === 0) {
    return (
      <EmptyState
        title="No purchases yet"
        description="Courses and packages you buy will appear here, with a receipt for each order."
      />
    )
  }

  return (
    /* `cre-account-actions` re-points `--color-action` at the home page's blue
       for this surface — Download Receipt and the Show/Hide Details toggles.
       See the class note in tokens.css for why this is a token override rather
       than a restyled button. */
    <div className="cre-account-actions" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {groups.map((group) => {
        const open = !closedMonths.has(group.key)
        return (
          <section key={group.key}>
            <button
              type="button"
              onClick={() =>
                setClosedMonths((prev) => {
                  const next = new Set(prev)
                  if (next.has(group.key)) next.delete(group.key)
                  else next.add(group.key)
                  return next
                })
              }
              aria-expanded={open}
              style={monthHeaderStyle}
            >
              <span style={monthLabelStyle}>{group.label}</span>
              {/* The count is what makes a collapsed month worth collapsing —
                  it says how much is hidden without opening it. */}
              <span style={monthCountStyle}>({group.records.length})</span>
              <span aria-hidden style={{ marginLeft: 'auto', display: 'inline-flex' }}>
                {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </button>
            {open && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
                {group.records.map((record) => (
                  <OrderCard
                    key={record.id}
                    record={record}
                    billedToName={profile.personal.name}
                    billedTo={profile.personal.billing}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

/* ─── one order ────────────────────────────────────────────────────────── */

function OrderCard({
  record,
  billedToName,
  billedTo,
}: {
  record: PurchaseRecord
  billedToName: string
  billedTo: { line1: string; cityState: string; postal: string }
}) {
  const [showDetails, setShowDetails] = useState(false)
  const isRefund = record.kind === 'refund'

  return (
    <article style={cardStyle}>
      <header style={cardHeaderStyle}>
        <span
          style={{
            ...pillStyle,
            /* Tone carries the ONE thing a glance needs from this row: money
               went out, or money came back. */
            background: isRefund ? 'var(--color-neutral-75)' : 'var(--color-success-100)',
            color: isRefund ? 'var(--color-text-secondary)' : 'var(--color-success-700)',
          }}
        >
          {isRefund ? 'Refund' : 'Purchase'}
        </span>
        <FactPair label="Order Date" value={formatOrderDate(record.orderDate)} />
        <FactPair label="Order Number" value={record.orderNumber} />
        <FactPair
          label="Summary"
          value={`${record.lineItems.length} item${record.lineItems.length === 1 ? '' : 's'}`}
        />
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          aria-expanded={showDetails}
          className="cre-link-action"
          style={detailsToggleStyle}
        >
          {showDetails ? <EyeSlash size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </header>

      {showDetails && (
        <div style={cardBodyStyle}>
          <div style={addressColumnStyle}>
            <AddressPair billedToName={billedToName} billedTo={billedTo} />
          </div>

          <div style={receiptColumnStyle}>
            <ReceiptHeading />
            <ReceiptBox record={record} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <Button
                variant="primary"
                size="md"
                onClick={() => console.info('purchases:download-receipt', record.orderNumber)}
                style={{ height: 48, padding: '0 24px', fontSize: 15 }}
              >
                Download Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

/* ─── small parts ──────────────────────────────────────────────────────── */

function FactPair({ label, value }: { label: string; value: string }) {
  return (
    <span style={factStyle}>
      <span style={factLabelStyle}>{label}</span>
      <span style={factValueStyle}>{value}</span>
    </span>
  )
}

/* ─── styles (tokens only) ─────────────────────────────────────────────── */

const monthHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '4px 0',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--color-text-primary)',
  textAlign: 'left',
}

const monthLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 18,
  lineHeight: '26px',
}

const monthCountStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text-secondary)',
}

const cardStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '18px 20px',
}

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 28,
  flexWrap: 'wrap',
}

const pillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 12px',
  borderRadius: 999,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
}

const factStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }

const factLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
}

const factValueStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
}

const detailsToggleStyle: CSSProperties = {
  marginLeft: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-action)',
  cursor: 'pointer',
}

const cardBodyStyle: CSSProperties = {
  display: 'flex',
  gap: 32,
  flexWrap: 'wrap',
  marginTop: 20,
  paddingTop: 20,
  borderTop: '1px solid var(--color-border-subtle)',
}

const addressColumnStyle: CSSProperties = {
  flex: '1 1 220px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}

const receiptColumnStyle: CSSProperties = { flex: '2 1 380px', minWidth: 0 }

