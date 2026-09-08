import { useCallback, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, Download, Envelope, Eye, EyeSlash, Gift } from '@/icons'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PillTabs } from '@/components/ui/PillTabs'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toast } from '@/components/ui/Toast'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { giftRecipientsFor, type GiftRecipientRecord } from '@/data/giftRecipientsFixtures'
import { GiftRecordDetail } from './GiftRecordDetail'
import { GiftRecipientsTable } from './GiftRecipientsTable'
import {
  filterAndSortRecords,
  formatOrderDate,
  GIFT_SORT_OPTIONS,
  GIFT_STATUS_TABS,
  groupRecords,
  itemCountLabel,
  readLayout,
  readSort,
  readStatusFilter,
  todayIso,
} from './giftRecipientsUtil'

/**
 * Gift Recipients — purchase-for-others history + reminders.
 *
 * The manager story: a firm buys exam prep on behalf of its new registered reps,
 * then needs to confirm what it bought, for whom, and whether each recipient has
 * CLAIMED (logged in to) their access — plus a nudge for the ones who haven't.
 * Deliberately the "history + reminder" pattern from the user story, not a new
 * workspace: a filterable list of records, each expandable to the order detail,
 * with one action (Send Reminder) on the unclaimed ones.
 *
 * UX modeled on the McKissock account purchases view: a search + Status + Sort
 * toolbar, records bucketed under collapsible month headings, and a per-record
 * "View Details / Hide Details" toggle that expands the recipient + order +
 * package-contents detail in place (no navigation, no modal).
 *
 * Search / status / sort live in the URL (`?q=`, `?status=`, `?sort=`) per the
 * app-wide filter convention, so a manager can share or bookmark a view (e.g.
 * "everyone who hasn't claimed").
 *
 * STC-only today — `giftRecipientsFor` returns `[]` for every other brand, which
 * renders the "not available" empty state. Reminder sending is a stub
 * (`console.info` + a Toast + in-session state); nothing persists.
 */
export function GiftRecipientsPanel() {
  const { brand } = useAccount()
  const records = useMemo(() => giftRecipientsFor(brand), [brand])

  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const status = readStatusFilter(params.get('status'))
  const sort = readSort(params.get('sort'))

  // Which records are expanded, and which have been reminded THIS session
  // (keyed by record id → the ISO date the reminder went out). Both are local:
  // there's no persistence layer for the prototype.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [sentReminders, setSentReminders] = useState<Record<string, string>>({})
  // One recipient → name them (and their email — the manager's next question is
  // "to which address?"); a bulk send → just the count.
  const [toast, setToast] = useState<{ count: number; name?: string; email?: string } | null>(null)

  // Reminder placement — the flag's variant decides whether Send Reminder lives
  // inside the expanded detail (the reference UX) or on the collapsed row, so a
  // manager working a long unclaimed list never has to expand a record.
  // Cards only: the roster table has its own row action + bulk bar.
  const reminderPlacement = useFeatureFlag('gift-recipients-reminder').variant ?? 'detail'
  const reminderOnRow = reminderPlacement === 'row'

  // THE A/B: Option A (`cards`, default) = month-grouped expandable cards, the
  // reference UX. Option B (`table`) = the roster — dense sortable table with
  // checkbox selection + bulk reminders, built for the 100+-seat manager. One
  // dev-handoff tile each, both pinned via `?ff=gift-recipients-layout:<value>`
  // so a stakeholder's link always opens the arm it names.
  const layout = readLayout(useFeatureFlag('gift-recipients-layout').variant)
  const isTable = layout === 'table'

  /** Write one filter param, dropping it when it's back to its default so a
   *  plain view keeps a clean URL. Resets nothing else (expansion is local). */
  const setParam = useCallback(
    (key: string, value: string, defaultValue: string) => {
      const next = new URLSearchParams(params)
      if (value === defaultValue) next.delete(key)
      else next.set(key, value)
      setParams(next, { replace: true })
    },
    [params, setParams],
  )

  const visible = useMemo(
    () => filterAndSortRecords(records, { query, status, sort }),
    [records, query, status, sort],
  )
  const groups = useMemo(() => groupRecords(visible, sort), [visible, sort])

  const filtersActive = query !== '' || status !== 'all'

  /**
   * Send to one recipient or many — the card action, the table's row action and
   * its bulk bar all funnel through here, so a single send and a bulk send can't
   * drift in what they log, stamp, or announce.
   */
  const sendReminders = useCallback((batch: GiftRecipientRecord[]) => {
    if (batch.length === 0) return
    // TODO(api): POST the reminder(s) to the notification service. The prototype
    // stamps the send locally so each record's "Reminder sent …" state is visible.
    console.info('gift-recipients:send-reminder', {
      count: batch.length,
      recipients: batch.map((r) => ({
        recordId: r.id,
        orderNumber: r.orderNumber,
        email: r.recipient.email,
      })),
    })
    const stamp = todayIso()
    setSentReminders((prev) => {
      const next = { ...prev }
      for (const r of batch) next[r.id] = stamp
      return next
    })
    setToast(
      batch.length === 1
        ? { count: 1, name: batch[0].recipient.name, email: batch[0].recipient.email }
        : { count: batch.length },
    )
  }, [])

  /**
   * Export the roster. Stubbed — a real export should hand back the CURRENTLY
   * VISIBLE rows (filters + sort applied), which is why it logs them: a manager
   * who filtered to "unclaimed in August" expects that file, not all 12 records.
   * CSV export is still an open decision on the handoff tiles.
   */
  const downloadRoster = useCallback(() => {
    // TODO(api): generate the export server-side (CSV) and stream it back.
    console.info('gift-recipients:download', {
      count: visible.length,
      filters: { query, status, sort },
      recordIds: visible.map((r) => r.id),
    })
  }, [visible, query, status, sort])

  // No records for this brand at all — the feature doesn't apply here.
  if (records.length === 0) {
    return (
      <EmptyState
        icon={<Gift size={24} aria-hidden />}
        title="No gifted purchases"
        description="Purchases you make on behalf of someone else will show up here, along with whether they've claimed their access."
      />
    )
  }

  return (
    <div>
      <p style={ledeStyle}>
        Courses you purchased for others. Send a reminder to recipients who have not claimed
        their access.
      </p>

      {/* Toolbar — the app's standard top-filter shape (same as My Courses /
          Learning Paths): a full-width search field on its own row, then the
          segmented status PillTabs with the result total beside them and Sort
          pushed right. Status is the PRIMARY filter, so it reads as tabs rather
          than a dropdown; the total replaces per-pill counts. */}
      <div style={toolbarStyle}>
        <SearchInput
          label="Search gift recipients"
          placeholder="Recipient's name or email"
          value={query}
          onChange={(e) => setParam('q', e.target.value, '')}
          // 360px — the same width as the My Courses / Certificates page search
          // fields, so it doesn't stretch across the whole column.
          style={{ width: 360, maxWidth: '100%' }}
        />
        <div style={filterRowStyle}>
          <PillTabs
            label="Filter by claim status"
            items={GIFT_STATUS_TABS}
            active={status}
            onChange={(id) => setParam('status', id, 'all')}
            size="compact"
          />
          <span style={resultsCountStyle}>
            Showing {visible.length} {visible.length === 1 ? 'Result' : 'Results'}
          </span>
          {/* Right group — the secondary Sort control (cards only; the roster
              sorts from its column headers, so a dropdown would be a second
              competing sort) followed by Download, the page's one remaining
              link CTA, pinned last so it sits at the row's far right. (The
              top-right "Send Reminder" CTA that used to lead the bulk flow was
              archived — reminders are per-record now.) `auto` pins the whole
              group to the row's right edge. */}
          <div style={rightGroupStyle}>
            {!isTable && (
              <div style={sortControlStyle}>
                <span style={controlLabelStyle}>Sort</span>
                <Select
                  label="Sort recipients"
                  options={GIFT_SORT_OPTIONS}
                  value={sort}
                  onChange={(e) => setParam('sort', e.target.value, 'newest')}
                  style={{ minWidth: 168 }}
                />
              </div>
            )}
            <button
              type="button"
              onClick={downloadRoster}
              className="cre-gift-cta"
              style={ctaLinkStyle}
            >
              <Download size={16} aria-hidden />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Filtered-to-nothing — distinct from the no-records-at-all state above,
          and it offers the way back out. */}
      {groups.length === 0 ? (
        <div style={noResultsStyle}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            No recipients match your filters
          </p>
          <p style={{ margin: '4px 0 12px', fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Try a different name or email, or clear the status filter.
          </p>
          {filtersActive && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const next = new URLSearchParams(params)
                next.delete('q')
                next.delete('status')
                setParams(next, { replace: true })
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : isTable ? (
        // Option B — the roster. It takes the already filtered+sorted list flat
        // (no month grouping: a sortable table's own Order Date column is the
        // better tool for "when did I buy this", and month headers would fight
        // a column sort).
        <div style={{ marginTop: 24 }}>
          <GiftRecipientsTable
            records={visible}
            sentReminders={sentReminders}
            onSendReminders={sendReminders}
          />
        </div>
      ) : (
        groups.map((group) => {
          const collapsed = collapsedGroups[group.id] === true
          return (
            <section key={group.id} style={{ marginTop: 28 }}>
              {group.label != null && (
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedGroups((prev) => ({ ...prev, [group.id]: !collapsed }))
                  }
                  aria-expanded={!collapsed}
                  style={groupHeaderStyle}
                >
                  <span style={groupTitleStyle}>
                    {group.label}{' '}
                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                      ({group.records.length})
                    </span>
                  </span>
                  {collapsed ? (
                    <ChevronDown size={16} aria-hidden />
                  ) : (
                    <ChevronUp size={16} aria-hidden />
                  )}
                </button>
              )}
              {!collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {group.records.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      open={expanded[record.id] === true}
                      onToggle={() =>
                        setExpanded((prev) => ({ ...prev, [record.id]: !prev[record.id] }))
                      }
                      reminderSentOn={sentReminders[record.id] ?? record.lastReminderSentOn}
                      onSendReminder={() => sendReminders([record])}
                      reminderOnRow={reminderOnRow}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })
      )}

      {/* One send names the recipient + address; a bulk send reports the count
          (listing 40 addresses would be noise, and the rows already stamp
          "Reminded {date}" individually). */}
      <Toast
        open={toast != null}
        onClose={() => setToast(null)}
        title={toast && toast.count > 1 ? `Reminders sent to ${toast.count} recipients` : 'Reminder sent'}
        tone="success"
      >
        {toast == null
          ? ''
          : toast.count > 1
            ? `Each one got an email with a link to claim their access.`
            : `We emailed ${toast.name} at ${toast.email} with a link to claim their access.`}
      </Toast>
    </div>
  )
}

/* ─── record card ───────────────────────────────────────────────────────── */

function RecordCard({
  record,
  open,
  onToggle,
  reminderSentOn,
  onSendReminder,
  reminderOnRow,
}: {
  record: GiftRecipientRecord
  open: boolean
  onToggle: () => void
  reminderSentOn?: string
  onSendReminder: () => void
  reminderOnRow: boolean
}) {
  const unclaimed = record.status === 'unclaimed'
  const detailsId = `gift-record-${record.id}`

  return (
    // The card is the container-query container for its row (see
    // `.cre-gift-record-card` in tokens.css).
    <article className="cre-gift-record-card" style={cardStyle}>
      {/* Grid row (`.cre-gift-record-row`) — columns are explicitly sized so
          Purchased for / Order Date / Summary line up down the list. The
          `--reminder` modifier reserves the wider actions column and rides on
          EVERY row of the list (not just the unclaimed ones with a button), so
          a mixed list stays on one shared template. */}
      <div
        className={`cre-gift-record-row${reminderOnRow ? ' cre-gift-record-row--reminder' : ''}`}
        style={rowStyle}
      >
        {/* Claim status leads the row — it's the column a manager scans. Amber
            for unclaimed (needs action), info-blue for claimed (informational);
            each pairs its color with the word, never color alone. */}
        <StatusBadge tone={unclaimed ? 'warning' : 'info'}>
          {unclaimed ? 'Unclaimed' : 'Claimed'}
        </StatusBadge>
        <Field label="Purchased for">
          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {record.recipient.name}
          </span>
        </Field>
        <Field label="Order Date">{formatOrderDate(record.orderDate)}</Field>
        <Field label="Summary">{itemCountLabel(record.package.items.length)}</Field>
        <div style={rowActionsStyle}>
          {/* Flag variant `row`: the reminder sits on the collapsed row so a
              long unclaimed list can be worked without expanding each record. */}
          {reminderOnRow && unclaimed && (
            <Button variant="secondary" size="sm" onClick={onSendReminder}>
              <Envelope size={14} aria-hidden />
              {reminderSentOn ? 'Resend reminder' : 'Send Reminder'}
            </Button>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={detailsId}
            style={detailsToggleStyle}
          >
            {open ? <EyeSlash size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            {open ? 'Hide Details' : 'View Details'}
          </button>
        </div>
      </div>

      {open && (
        <div id={detailsId} style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--color-border-subtle)' }}>
          <GiftRecordDetail
            record={record}
            reminderSentOn={reminderSentOn}
            onSendReminder={onSendReminder}
            // Flag variant `row` already puts the reminder on the collapsed
            // row, so a second copy in the detail would be redundant.
            hideReminder={reminderOnRow}
          />
        </div>
      )}
    </article>
  )
}

/** One label-over-value cell on the collapsed row. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <span style={fieldLabelStyle}>{label}</span>
      <span style={fieldValueStyle}>{children}</span>
    </div>
  )
}

/* ─── styles ────────────────────────────────────────────────────────────── */

/**
 * Page-level link CTA — the brand CTA ramp (`--color-cta-500`) as a text link
 * with a leading glyph. Not a `Button`: these are utilities beside the content,
 * and a filled button here would outrank the actual per-record actions.
 *
 * `cta-500` clears WCAG AA on white in every brand, though STC is the tightest
 * (its CTA ramp aliases the teal secondary — 4.58:1). If these ever need more
 * headroom, `cta-600` (6.53:1) is the one-token swap; `ExploreLink` already
 * takes that approach for CTA links on light panels.
 *
 * Callers must carry `className="cre-gift-cta"` for the hover/focus underline
 * (tokens.css) — the same affordance every other link-style CTA in this feature
 * has, so a text link never reads as interactive by color alone.
 */
const ctaLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  // NO `color` HERE — it lives on `.cre-gift-cta` in tokens.css. An inline
  // colour beats the stylesheet, which is what stopped the dark theme from
  // ever correcting it; `cta-500` failed AA in both themes (a11y C6).
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const ledeStyle: CSSProperties = {
  margin: 0,
  maxWidth: 640,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-secondary)',
}

// Two stacked rows on the page background (no card) — search above, filters
// below — so the search reads as the page's search and the tabs as its filter.
const toolbarStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  marginTop: 20,
}

const filterRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 16,
}

// Everything on the right of the filter row — Sort, then the page CTAs. `auto`
// pins the group right and keeps it there as the row wraps on a narrow column.
const rightGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 24,
  marginLeft: 'auto',
}

const sortControlStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
}

// Result total beside the tabs (replaces per-pill counts).
const resultsCountStyle: CSSProperties = {
  flexShrink: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
}

const controlLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
}

const noResultsStyle: CSSProperties = {
  marginTop: 24,
  padding: '32px 24px',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  fontFamily: 'var(--font-body)',
  textAlign: 'center',
}

const groupHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  gap: 12,
  padding: '0 4px 12px',
  background: 'transparent',
  border: 'none',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  textAlign: 'left',
}

// Month heading — font-body 18/700, the same "section lead" treatment the
// dashboard widget headers use (there's no 18px heading token).
const groupTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 18,
  lineHeight: '26px',
  fontWeight: 700,
}

const cardStyle: CSSProperties = {
  padding: 20,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
}

// Layout (grid template + the narrow-width flex fallback) lives in
// `.cre-gift-record-row` — inline styles can't hold a media query. This only
// carries what the class doesn't.
const rowStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
}

const rowActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  // Right-aligns the actions inside their grid cell — and still pushes them to
  // the row's right edge in the narrow flex fallback.
  marginLeft: 'auto',
}

const fieldLabelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const fieldValueStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

const detailsToggleStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-action)',
  cursor: 'pointer',
}

