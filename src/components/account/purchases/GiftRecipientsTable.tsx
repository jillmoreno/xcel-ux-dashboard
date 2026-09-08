import { useCallback, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { ChevronDown, Envelope, X } from '@/icons'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { GiftRecipientRecord } from '@/data/giftRecipientsFixtures'
import { GiftRecordDetail } from './GiftRecordDetail'
import { formatLongDate, formatOrderDate, itemCountLabel } from './giftRecipientsUtil'

/**
 * Gift Recipients — **the roster table** (the shipped layout).
 *
 * Built as Option B against a month-grouped card list, and now the only arm:
 * that card list was ARCHIVED on 2026-08-21 (render code still intact in
 * `GiftRecipientsPanel`, reachable via `?ff=gift-recipients-layout:cards`; see
 * `ARCHIVED_ITEMS` → `gift-recipients-card-list`). Same data, same record
 * detail, same filters — the difference is that this one is built for the
 * story's actual buyer: a manager with 100+ seats who needs to work a queue,
 * not read a feed.
 *
 * Two things the card list can't do:
 *   1. **Density** — one row per purchase, so ~15 records fit where 4 cards did.
 *   2. **Sorting in place** — every column header sorts (`aria-sort`), instead
 *      of a Sort dropdown that has to be re-opened per axis. Claim Status sorts
 *      unclaimed-first; Last Reminded sorts oldest-first (longest since chased)
 *      with dateless rows last in both directions.
 *
 * **Reminders are per record.** Each unclaimed row carries a "Send Reminder"
 * link; claimed rows render no action at all (nothing to chase — absent rather
 * than disabled, so the manager never has to work out why a control is dead).
 * The label stays "Send Reminder" whether or not one has gone out, because the
 * Last Reminded column already answers that.
 *
 * A GUIDED BULK FLOW was built here and archived the same day: a top-right CTA
 * filtered to Unclaimed, revealed a checkbox per row, and sent to the picked
 * cohort. It came out because reminders are per-record in the story's scope
 * ("just a history + reminder") and because it depended on two unanswered
 * questions — the reminder cooldown, and whether a bulk send needs its own
 * confirm dialog. The code is intact and unreferenced in
 * `GiftRecipientsBulkReminder.tsx`; the panel's `sendReminders(records[])`
 * already takes a LIST, so restoring it is a re-wire, not a rebuild.
 *
 * Chrome (semantic `<table>`, header/body cell tokens, sortable header buttons
 * with a rotating chevron) is modeled on `MyCoursesTable` / `LearningPathsTable`
 * so it reads as the same app — including the clickable row: the WHOLE row opens
 * that purchase's detail in a right-anchored `Sheet` (hover/focus wash + a
 * `primary-300` left accent via `.cre-gift-table-row` — one color for every row,
 * since it marks pointer/keyboard position and claim status is already stated by
 * the pill).
 *
 * The sheet — not an inline expanding row — is deliberate for a roster: an
 * expanding row pushes every following row down, so on a 100-seat table the
 * thing you were comparing against jumps off screen. The sheet leaves the list
 * where it is, and renders the SAME `GiftRecordDetail` the cards use.
 */

type SortKey = 'recipient' | 'orderDate' | 'package' | 'status' | 'reminded'

type SortState = { key: SortKey | null; dir: 'asc' | 'desc' }

// Item count is a SUB-LINE under the package name, not a column of its own:
// it's a property of the package, so it belongs with it, and it isn't something
// a roster is sorted by. Same `itemCountLabel` the sheet's package card uses, so
// the two surfaces always agree.
const COLUMNS: { key: SortKey; label: string; width: string }[] = [
  // Recipient keeps the widest share — it carries two lines, and `EmailText`
  // gives long addresses a break before the `@` so they wrap cleanly here.
  { key: 'recipient', label: 'Recipient', width: '30%' },
  { key: 'orderDate', label: 'Order Date', width: '14%' },
  { key: 'package', label: 'Package', width: '24%' },
  { key: 'status', label: 'Claim Status', width: '16%' },
  { key: 'reminded', label: 'Last Reminded', width: '16%' },
]

/** Shown in the Last Reminded column when there's no date to show — a claimed
 *  recipient (nothing to chase) or an unclaimed one never chased yet. A dash
 *  says "no date" without implying a zero. */
const EM_DASH = '—'

/**
 * An email address with a break opportunity before the `@`, so a long one wraps
 * as "praghunathan" / "@cavellcapital.com" instead of splitting mid-domain
 * ("cavellcapital.c" / "om"). `<wbr>` adds no character and no space — it only
 * tells the browser where a break is allowed — so the address stays selectable
 * and copyable as one string.
 */
function EmailText({ email }: { email: string }) {
  const at = email.indexOf('@')
  if (at <= 0) return <>{email}</>
  return (
    <>
      {email.slice(0, at)}
      <wbr />
      {email.slice(at)}
    </>
  )
}

/** Unclaimed sorts FIRST — the rows that need action lead the ascending sort. */
function statusRank(record: GiftRecipientRecord): number {
  return record.status === 'unclaimed' ? 0 : 1
}

/**
 * The one-line claim story for the detail sheet's header, under the title. The
 * pill above it says Unclaimed / Claimed; this says what the pill can't —
 * whether an unclaimed rep has been chased yet, or how far a claimed one has
 * got. Never null: "not chased yet" is itself the answer a manager needs.
 */
function claimSummary(record: GiftRecipientRecord, reminderSentOn?: string): string {
  if (record.status === 'unclaimed') {
    return reminderSentOn
      ? `Reminder sent ${formatLongDate(reminderSentOn)}`
      : 'No reminder sent yet'
  }
  const detail = record.claimDetail ?? 'Claimed'
  return record.claimedOn ? `${detail} · ${formatLongDate(record.claimedOn)}` : detail
}

export function GiftRecipientsTable({
  records,
  sentReminders,
  onSendReminders,
}: {
  /** Already filtered + sorted by the panel; column sorting layers on top. */
  records: GiftRecipientRecord[]
  /** recordId → ISO date a reminder went out (fixture or this session). */
  sentReminders: Record<string, string>
  /** Send to one or many — the panel's single send path (a list, so a restored bulk flow reuses it). */
  onSendReminders: (records: GiftRecipientRecord[]) => void
}) {
  // `null` = keep the panel's order (its Sort control still applies).
  const [sort, setSort] = useState<SortState>({ key: null, dir: 'asc' })
  // Which record's detail sheet is open (`null` = closed). Held as the id, not
  // the record, so a re-sort or a reminder send can't leave a stale copy behind.
  const [sheetId, setSheetId] = useState<string | null>(null)

  // A record's last-reminded date: this session's send wins over the fixture's,
  // so sorting by Last Reminded reflects reminders sent since the page loaded.
  const remindedOn = useCallback(
    (r: GiftRecipientRecord) => sentReminders[r.id] ?? r.lastReminderSentOn,
    [sentReminders],
  )

  const rows = useMemo(() => {
    if (sort.key == null) return records
    const { key, dir } = sort
    const factor = dir === 'asc' ? 1 : -1
    return [...records].sort((a, b) => {
      switch (key) {
        case 'recipient':
          return a.recipient.name.localeCompare(b.recipient.name) * factor
        case 'orderDate':
          return a.orderDate.localeCompare(b.orderDate) * factor
        case 'package':
          return a.package.title.localeCompare(b.package.title) * factor
        case 'status':
          return (statusRank(a) - statusRank(b)) * factor
        case 'reminded': {
          // Rows with no reminder date sort LAST in either direction — there's
          // nothing to compare, and burying them keeps the chased ones together.
          const av = remindedOn(a)
          const bv = remindedOn(b)
          if (!av && !bv) return 0
          if (!av) return 1
          if (!bv) return -1
          return av.localeCompare(bv) * factor
        }
        default:
          return 0
      }
    })
  }, [records, sort, remindedOn])

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )

  const sheetRecord = sheetId == null ? null : (records.find((r) => r.id === sheetId) ?? null)

  const ariaSort = (key: SortKey): 'ascending' | 'descending' | 'none' =>
    sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'

  return (
    <div>
      <div style={tableWrapStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
          <colgroup>
            {COLUMNS.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
            <col style={{ width: 132 }} />
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
                    style={{ ...HEADER_CELL, ...(i === 0 && { paddingLeft: 24 }) }}
                  >
                    <button type="button" onClick={() => toggleSort(col.key)} style={headerButtonStyle}>
                      {col.label}
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
              <th scope="col" style={{ ...HEADER_CELL, paddingRight: 24, textAlign: 'right' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((record) => {
              const unclaimed = record.status === 'unclaimed'
              const reminderSentOn = sentReminders[record.id] ?? record.lastReminderSentOn
              const openSheet = () => setSheetId(record.id)
              return (
                <tr
                  key={record.id}
                  className="cre-gift-table-row"
                  // Clicking the ROW opens that purchase's sheet — the single
                  // interaction, with no per-row link competing for the click.
                  //
                  // `tabIndex` makes it keyboard-reachable and Enter/Space
                  // activate it, but there is deliberately NO `role="button"`:
                  // that would override the <tr>'s implicit `row` role and break
                  // table navigation for a screen reader. A focusable row keeps
                  // both — AT still reads it as a row of cells, and it can be
                  // operated without a mouse.
                  tabIndex={0}
                  aria-haspopup="dialog"
                  onClick={openSheet}
                  onKeyDown={(e: KeyboardEvent<HTMLTableRowElement>) => {
                    // Ignore keys that bubbled from a control inside the row
                    // (the Remind button, the email link) — those own
                    // their own Enter/Space.
                    if (e.target !== e.currentTarget) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openSheet()
                    }
                  }}
                >
                  <td style={{ ...BODY_CELL, paddingLeft: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 14 }}>
                        {record.recipient.name}
                      </span>
                      {/* A real mailto — the manager's fallback when a reminder
                          isn't enough. `stopPropagation` so mailing someone
                          doesn't also open their sheet. */}
                      <a
                        href={`mailto:${record.recipient.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="cre-gift-email"
                        style={emailLinkStyle}
                      >
                        <EmailText email={record.recipient.email} />
                      </a>
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
                        {formatOrderDate(record.orderDate)}
                      </span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {record.orderNumber}
                      </span>
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
                        {record.package.title}
                      </span>
                      {/* Same `itemCountLabel` the sheet's package card uses, off
                          the same `package.items` array — so the roster and the
                          sheet can't disagree about how many items there are. */}
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {itemCountLabel(record.package.items.length)}
                      </span>
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <StatusBadge tone={unclaimed ? 'warning' : 'info'}>
                      {unclaimed ? 'Unclaimed' : 'Claimed'}
                    </StatusBadge>
                  </td>
                  {/* Last Reminded — its own column, so "when did I last chase
                      this person?" is scannable down the list instead of tucked
                      under a status pill. A date ONLY for unclaimed rows; a
                      claimed recipient has nothing to chase, so it reads as a
                      dash even if a reminder was sent before they claimed. */}
                  <td style={{ ...BODY_CELL, fontSize: 14, color: 'var(--color-text-primary)' }}>
                    {unclaimed && reminderSentOn ? formatOrderDate(reminderSentOn) : EM_DASH}
                  </td>
                  <td style={{ ...BODY_CELL, paddingRight: 24, textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                      {unclaimed && (
                        <button
                          type="button"
                          // Sends without opening the sheet.
                          onClick={(e) => {
                            e.stopPropagation()
                            onSendReminders([record])
                          }}
                          // One label whether or not a reminder has gone out —
                          // "Resend" said the same thing the Claim Status
                          // column's "Reminded {date}" line already says, and
                          // two labels for one action read as two actions.
                          className="cre-gift-row-cta"
                          style={linkActionStyle}
                          aria-label={`Send reminder to ${record.recipient.name}`}
                        >
                          Send Reminder
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detail sheet — the row's target. Renders the SAME GiftRecordDetail the
          card list uses, so the two arms can't drift on content. Unlike the
          cards (where the reminder would duplicate the row's own), the sheet
          DOES show it: it's the focused view of one record, and a manager who
          opened it to check the package shouldn't have to close it to act. */}
      <Sheet
        open={sheetRecord != null}
        onClose={() => setSheetId(null)}
        title={sheetRecord ? `Purchase for ${sheetRecord.recipient.name}` : ''}
      >
        {sheetRecord && (
          <>
            {/* Standard panel header — close top-left, title, divider — the same
                shape as CourseDetailsPanel / the Edit-Calendar panels. `Sheet`
                renders the title only for `aria-labelledby`, so the visible
                header is the caller's job. */}
            <header style={sheetHeaderStyle}>
              <button
                type="button"
                aria-label="Close purchase details panel"
                onClick={() => setSheetId(null)}
                className="cre-sheet-close"
                style={sheetCloseStyle}
              >
                <X size={14} aria-hidden />
                Close
              </button>
              {/* Name + email are one identity unit, so they sit tight together
                  (2px) while the claim line below takes the header's own gap. */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h2 style={sheetTitleStyle}>{sheetRecord.recipient.name}</h2>
                  {/* Claim status sits at the header's right edge — `auto` keeps
                      it there even if a long name wraps the row. */}
                  <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    <StatusBadge tone={sheetRecord.status === 'unclaimed' ? 'warning' : 'info'}>
                      {sheetRecord.status === 'unclaimed' ? 'Unclaimed' : 'Claimed'}
                    </StatusBadge>
                  </span>
                </div>
                {/* Kept a real mailto — it's the manager's fallback when a
                    reminder isn't enough. */}
                <a href={`mailto:${sheetRecord.recipient.email}`} style={sheetEmailStyle}>
                  {sheetRecord.recipient.email}
                </a>
              </div>
              {/* Rule between WHO this is (name + email) and WHERE THEY'RE AT
                  (the claim line). Inset to the header's padding — an
                  intra-header separator, not the full-bleed rule that used to
                  sit under the whole header. */}
              <div
                aria-hidden
                style={{ height: 1, background: 'var(--color-border-subtle)', marginTop: 2 }}
              />
              {/* Action + status on one line: the reminder CTA leads, and the
                  muted claim line is pushed to the row's right edge beside it.
                  The claim line carries what the pill can't — how far a claimed
                  rep has got, or whether an unclaimed one has been chased.
                  Claimed records have no CTA, so the line simply sits left. */}
              <div style={sheetActionRowStyle}>
                {sheetRecord.status === 'unclaimed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onSendReminders([sheetRecord])}
                  >
                    <Envelope size={14} aria-hidden />
                    {/* One label, same as the row's — the muted claim line
                        above already says whether a reminder went out. */}
                    Send Reminder
                  </Button>
                )}
                <span
                  style={{
                    ...sheetClaimLineStyle,
                    // Right-aligned only when there's a CTA to sit opposite.
                    ...(sheetRecord.status === 'unclaimed' && { marginLeft: 'auto' }),
                  }}
                >
                  {claimSummary(
                    sheetRecord,
                    sentReminders[sheetRecord.id] ?? sheetRecord.lastReminderSentOn,
                  )}
                </span>
              </div>
            </header>
            <div style={sheetBodyStyle}>
              <GiftRecordDetail
                record={sheetRecord}
                reminderSentOn={sentReminders[sheetRecord.id] ?? sheetRecord.lastReminderSentOn}
                onSendReminder={() => onSendReminders([sheetRecord])}
                // The header carries all three now — the pill + claim line for
                // status, the title block for recipient + email, and the CTA
                // beside the claim line — so the in-detail copies would repeat.
                hideClaimStatus
                hideRecipient
                hideReminder
              />
            </div>
          </>
        )}
      </Sheet>
    </div>
  )
}

/* ─── styles ────────────────────────────────────────────────────────────── */

const tableWrapStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-neutral-light)',
  borderRadius: 'var(--radius-xl)',
  overflowX: 'auto',
}

const HEADER_CELL: CSSProperties = {
  verticalAlign: 'top',
  // Long-form, NOT the `padding` shorthand: the first column's paddingLeft
  // toggles if a column is ever added/removed, and React warns
  // (and can mis-render) when a shorthand and its longhand mix across renders.
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
  textAlign: 'left',
}

const BODY_CELL: CSSProperties = {
  // Long-form for the same reason as HEADER_CELL.
  paddingTop: 12,
  paddingRight: 16,
  paddingBottom: 12,
  paddingLeft: 16,
  borderBottom: '1px solid var(--color-neutral-light)',
  color: 'var(--color-neutral-dark)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
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

const sheetHeaderStyle: CSSProperties = {
  padding: '20px 20px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const sheetCloseStyle: CSSProperties = {
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

const sheetActionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginTop: 2,
}

const sheetClaimLineStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

// No divider under the header (removed by design), so the body's top padding is
// trimmed — 20px on top of the header's 16px read as an accidental gap once the
// rule was gone.
const sheetBodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px 20px 24px',
}

const sheetEmailStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-action)',
  wordBreak: 'break-word',
}

/**
 * Recipient email — the cyan (tertiary) ramp, as a link.
 *
 * `tertiary-700` is the LIGHTEST cyan stop that clears WCAG AA for this 12px
 * text: on white, 300 is 1.79:1, 400 is 2.21:1, 500 is 2.74:1 and even 600 only
 * reaches 4.12:1 — all under the 4.5:1 floor, and an email address you can't
 * read is worse than a grey one. 700 is 6.53:1 and still reads as cyan.
 */
const emailLinkStyle: CSSProperties = {
  color: 'var(--color-tertiary-700)',
  wordBreak: 'break-word',
}

const linkActionStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-action)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
