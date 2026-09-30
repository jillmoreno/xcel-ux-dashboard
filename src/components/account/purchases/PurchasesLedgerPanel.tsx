import { useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { ChevronDown, ChevronRight, X } from '@/icons'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Sheet } from '@/components/ui/Sheet'
import { useAccount } from '@/context/AccountContext'
import { profileFor } from '@/data/accountProfileFixtures'
import {
  formatMoney,
  formatOrderDate,
  purchasesFor,
  type PurchaseRecord,
} from '@/data/purchasesFixtures'
import { AddressPair, ReceiptBox, ReceiptHeading } from './purchaseReceiptBits'

/**
 * My Purchases — the TABLE arm of `purchases-layout`.
 *
 * One flat sortable ledger; clicking a row opens that order's receipt in a
 * right-anchored `Sheet`. The cards arm (`PurchasesPanel`) is untouched and
 * still reachable via `?ff=purchases-layout:cards`.
 *
 * TWO THINGS THE CARDS ARM DID THAT THIS ONE DELIBERATELY DOES NOT:
 *
 *  - **No month grouping.** `groupPurchasesByMonth` is not called here. Groups
 *    exist to make a long list scannable by collapsing it; a table that sorts
 *    on every column answers the same question better, and month headings would
 *    fight any sort other than Order Date. The helper stays exported for the
 *    cards arm.
 *  - **No inline expansion.** There is exactly one interaction per row, and it
 *    opens the sheet. The cards arm's "Show Details" toggle meant a row could
 *    be tall or short depending on history, which is what makes a long ledger
 *    hard to scan.
 *
 * Chrome is lifted from `GiftRecipientsTable` — the roster that won this repo's
 * earlier card-vs-table A/B — so the two account tables read as one component:
 * semantic `<table>`, `aria-sort` on every header, the shared
 * `.cre-gift-table-row` hover wash and focus ring.
 */

type SortKey = 'orderDate' | 'orderNumber' | 'summary' | 'status' | 'total'

type SortState = { key: SortKey; dir: 'asc' | 'desc' }

const COLUMNS: { key: SortKey; label: string; width: string; alignRight?: boolean }[] = [
  { key: 'orderDate', label: 'Order Date', width: '14%' },
  { key: 'orderNumber', label: 'Order Number', width: '18%' },
  { key: 'summary', label: 'Summary', width: '38%' },
  { key: 'status', label: 'Status', width: '14%' },
  { key: 'total', label: 'Total', width: '16%', alignRight: true },
]

/** Lead line item, plus how many others the order carried. */
function summaryOf(record: PurchaseRecord): { lead: string; more: number } {
  return { lead: record.lineItems[0]?.label ?? '—', more: Math.max(0, record.lineItems.length - 1) }
}

export function PurchasesLedgerPanel() {
  const { brand, membership } = useAccount()
  const isMember = membership === 'member'
  const records = useMemo(() => purchasesFor(brand), [brand])
  const profile = useMemo(() => profileFor(brand, isMember), [brand, isMember])

  /* Newest first — the same default the cards arm opens with, so switching
     variants does not also change what is at the top. */
  const [sort, setSort] = useState<SortState>({ key: 'orderDate', dir: 'desc' })
  const [openId, setOpenId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const { key, dir } = sort
    const factor = dir === 'asc' ? 1 : -1
    return [...records].sort((a, b) => {
      switch (key) {
        case 'orderDate':
          return a.orderDate.localeCompare(b.orderDate) * factor
        case 'orderNumber':
          return a.orderNumber.localeCompare(b.orderNumber) * factor
        case 'summary':
          return summaryOf(a).lead.localeCompare(summaryOf(b).lead) * factor
        case 'status':
          return a.kind.localeCompare(b.kind) * factor
        case 'total':
          /* NUMERIC, not lexicographic. A refund's -89 has to sort below 72.76
             rather than beside it, which a string compare on the formatted
             value would get wrong ("-$89.00" < "$144.00" by character). */
          return (a.total - b.total) * factor
      }
    })
  }, [records, sort])

  const toggleSort = (key: SortKey) =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  const ariaSort = (key: SortKey): 'ascending' | 'descending' | 'none' =>
    sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'

  /* Resolved from the id rather than held as an object, so a re-sort cannot
     leave the sheet showing a stale copy of the record. */
  const openRecord = rows.find((r) => r.id === openId) ?? null

  if (records.length === 0) {
    return (
      <EmptyState
        title="No purchases yet"
        description="Courses and packages you buy will appear here, with a receipt for each order."
      />
    )
  }

  return (
    <div className="cre-account-actions">
      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <colgroup>
            {COLUMNS.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
            <col style={{ width: 44 }} />
          </colgroup>
          <thead>
            <tr>
              {COLUMNS.map((col, i) => {
                const active = sort.key === col.key
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={ariaSort(col.key)}
                    style={{
                      ...HEADER_CELL,
                      ...(i === 0 && { paddingLeft: 24 }),
                      ...(col.alignRight && { textAlign: 'right' }),
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      style={{
                        ...headerButtonStyle,
                        ...(col.alignRight && { flexDirection: 'row-reverse' }),
                      }}
                    >
                      {col.label}
                      {/* One glyph, rotated — the ACTIVE column is the one at
                          full opacity, and its direction is the rotation. Two
                          separate up/down icons would make "unsorted" and
                          "ascending" different shapes as well as different
                          opacities, which is more signal than the state needs. */}
                      <ChevronDown
                        size={12}
                        aria-hidden
                        style={{
                          flexShrink: 0,
                          opacity: active ? 1 : 0.35,
                          transform: active && sort.dir === 'desc' ? 'rotate(180deg)' : 'none',
                          transition: 'transform 120ms ease',
                        }}
                      />
                    </button>
                  </th>
                )
              })}
              {/* The chevron column has no label — it is an affordance, and a
                  header over it would imply something sortable. */}
              <th scope="col" style={{ ...HEADER_CELL, paddingRight: 24 }}>
                <span className="cre-sr-only">Open receipt</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((record, rowIndex) => {
              const { lead, more } = summaryOf(record)
              const isRefund = record.kind === 'refund'
              const open = () => setOpenId(record.id)
              /* The last row draws NO bottom rule. `BODY_CELL` gives every row
                 one so rows are separated from each other; under the final row
                 it separates the table from nothing, and lands a second
                 full-width line just inside the wrapper's own rounded border —
                 two parallel rules with a dead gap between them.
                 ⚠ `GiftRecipientsTable`, which this chrome came from, has the
                 same latent issue and has not been changed. */
              const cell: CSSProperties =
                rowIndex === rows.length - 1 ? { ...BODY_CELL, borderBottom: 'none' } : BODY_CELL
              return (
                <tr
                  key={record.id}
                  className="cre-gift-table-row"
                  /*
                   * The ROW is the target — there is no "view" link competing
                   * for the click.
                   *
                   * `tabIndex` makes it keyboard-reachable and Enter/Space
                   * activate it, but there is deliberately NO `role="button"`:
                   * that would override the <tr>'s implicit `row` role and
                   * break table navigation for a screen reader. A focusable row
                   * keeps both. Same reasoning as `GiftRecipientsTable`.
                   */
                  tabIndex={0}
                  aria-haspopup="dialog"
                  onClick={open}
                  onKeyDown={(e: KeyboardEvent<HTMLTableRowElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      open()
                    }
                  }}
                >
                  <td style={{ ...cell, paddingLeft: 24, whiteSpace: 'nowrap' }}>
                    {formatOrderDate(record.orderDate)}
                  </td>
                  <td style={{ ...cell, whiteSpace: 'nowrap' }}>{record.orderNumber}</td>
                  <td style={cell}>
                    <span style={summaryLeadStyle}>{lead}</span>
                    {more > 0 && <span style={summaryMoreStyle}> +{more} more</span>}
                  </td>
                  <td style={cell}>
                    <span
                      style={{
                        ...statusTagStyle,
                        ...(isRefund ? refundTagStyle : purchaseTagStyle),
                      }}
                    >
                      {isRefund ? 'Refund' : 'Purchase'}
                    </span>
                  </td>
                  <td
                    style={{
                      ...cell,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                      /* A refund is money coming BACK — it is not an error and
                         not a warning, so it is quietened rather than coloured.
                         Red here would read as "something went wrong with this
                         order". */
                      ...(isRefund
                        ? { color: 'var(--color-text-tertiary)', fontWeight: 400 }
                        : { color: 'var(--color-text-primary)', fontWeight: 700 }),
                    }}
                  >
                    {formatMoney(record.total)}
                  </td>
                  <td style={{ ...cell, paddingRight: 24, textAlign: 'right' }}>
                    <ChevronRight size={14} aria-hidden style={{ color: 'var(--color-neutral-600)' }} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mounted whenever a row is chosen; `Sheet` owns Escape and the backdrop,
          so all three dismiss gestures resolve to the same `onClose`. */}
      <Sheet
        open={openRecord != null}
        onClose={() => setOpenId(null)}
        title={openRecord?.orderNumber ?? 'Order'}
      >
        {openRecord && (
          <ReceiptSheetBody
            record={openRecord}
            billedToName={profile.personal.name}
            billedTo={profile.personal.billing}
            onClose={() => setOpenId(null)}
          />
        )}
      </Sheet>
    </div>
  )
}

/* ─── sheet body ───────────────────────────────────────────────────────── */

function ReceiptSheetBody({
  record,
  billedToName,
  billedTo,
  onClose,
}: {
  record: PurchaseRecord
  billedToName: string
  billedTo: { line1: string; cityState: string; postal: string }
  onClose: () => void
}) {
  const count = record.lineItems.length
  return (
    /* `display: contents` so the wrapper carries the account-blue token
       override without becoming a flex item of the Sheet's panel. The class
       has to be repeated in here rather than inherited from the table above,
       because a Sheet portals to document.body and inherits nothing from that
       tree — the same reason the Profile edit panels each carry their own. */
    <div className="cre-account-actions" style={{ display: 'contents' }}>
      <header style={sheetHeaderStyle}>
        <button
          type="button"
          aria-label={`Close receipt for ${record.orderNumber}`}
          onClick={onClose}
          className="cre-sheet-close"
          style={closeButtonStyle}
        >
          <X size={14} aria-hidden />
          Close
        </button>
        <h2 style={sheetTitleStyle}>{record.orderNumber}</h2>
        {/* Kind first: it is the one fact that changes how the numbers below
            should be read. */}
        <p style={sheetSubtitleStyle}>
          {record.kind === 'refund' ? 'Refund' : 'Purchase'} · {formatOrderDate(record.orderDate)} ·{' '}
          {count} item{count === 1 ? '' : 's'}
        </p>
      </header>
      <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      <div style={sheetBodyStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <AddressPair billedToName={billedToName} billedTo={billedTo} />
        </div>
        <div>
          <ReceiptHeading />
          <ReceiptBox record={record} />
        </div>
      </div>

      <footer style={sheetFooterStyle}>
        <Button
          variant="primary"
          size="md"
          onClick={() => console.info('purchases:download-receipt', record.orderNumber)}
          style={{ width: '100%', height: 52, fontSize: 16 }}
        >
          Download Receipt
        </Button>
      </footer>
    </div>
  )
}

/* ─── styles (tokens only) ─────────────────────────────────────────────── */

const tableWrapStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-neutral-light)',
  borderRadius: 'var(--radius-xl)',
  overflowX: 'auto',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'var(--font-body)',
}

/** Long-form padding, NOT the shorthand — the first column's `paddingLeft`
 *  toggles per column, and React warns when a shorthand and its longhand mix
 *  across renders. Same note as `GiftRecipientsTable`. */
const HEADER_CELL: CSSProperties = {
  verticalAlign: 'top',
  paddingTop: 16,
  paddingRight: 16,
  paddingBottom: 12,
  paddingLeft: 16,
  background: 'var(--color-surface-card)',
  borderBottom: '2px solid var(--color-neutral-500)',
  color: 'var(--color-neutral-dark)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '18px',
  whiteSpace: 'nowrap',
}

const BODY_CELL: CSSProperties = {
  paddingTop: 12,
  paddingRight: 16,
  paddingBottom: 12,
  paddingLeft: 16,
  borderBottom: '1px solid var(--color-neutral-light)',
  color: 'var(--color-neutral-dark)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 400,
  lineHeight: '18px',
  verticalAlign: 'middle',
}

const headerButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  padding: 0,
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
}

const summaryLeadStyle: CSSProperties = { color: 'var(--color-text-primary)' }

const summaryMoreStyle: CSSProperties = { color: 'var(--color-text-tertiary)' }

/** Square (4px), not a pill — the roster's pills mark a STATE that changes
 *  (claimed / unclaimed); this marks what the order is, which never changes.
 *  The squarer corner keeps the two from reading as the same control. */
const statusTagStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  borderRadius: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

/** Mixed toward white rather than the raw `success-100`: at one tag per row the
 *  solid token tiles into a green column that pulls the eye away from the
 *  Total. Lightening it keeps it a highlight instead of a badge. */
const purchaseTagStyle: CSSProperties = {
  background: 'color-mix(in srgb, var(--color-success-100) 45%, white)',
  color: 'var(--color-success-700)',
}

const refundTagStyle: CSSProperties = {
  background: 'var(--color-neutral-75)',
  color: 'var(--color-text-secondary)',
}

const sheetHeaderStyle: CSSProperties = {
  padding: '20px 24px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const closeButtonStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
  cursor: 'pointer',
  padding: 0,
}

const sheetTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 22,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

const sheetSubtitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const sheetBodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px 24px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}

const sheetFooterStyle: CSSProperties = {
  padding: '20px 24px',
  background: 'var(--color-neutral-light)',
}
