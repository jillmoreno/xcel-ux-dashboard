import type { CSSProperties, ReactNode } from 'react'
import { Envelope } from '@/icons'
import { Button } from '@/components/ui/Button'
import type { GiftRecipientRecord } from '@/data/giftRecipientsFixtures'
import { formatLongDate, itemCountLabel } from './giftRecipientsUtil'

/**
 * The expanded detail for one gift-purchase record — recipient, who paid, claim
 * status, and the package contents.
 *
 * Shared by BOTH Gift Recipients layouts (the card list and the roster table)
 * so the two options differ only in how records are *listed*, never in what a
 * record says. That's the whole point of the A/B: if the detail drifted, a
 * stakeholder comparing them couldn't tell layout from content.
 */
export function GiftRecordDetail({
  record,
  reminderSentOn,
  onSendReminder,
  /** Hide the in-detail reminder button (the roster table puts the action in
   *  its bulk bar / row instead, so a second copy here would be redundant). */
  hideReminder = false,
  /**
   * Hide the "Claim status" block. Set by the roster's detail sheet, whose
   * header already carries the Unclaimed / Claimed pill.
   *
   * NOTE the cost: this block is also where the claimed-progress line
   * ("Claimed and in progress" + "Claimed {date}") and the "Reminder sent
   * {date}" stamp live, so hiding it drops those too. The roster's ROW shows
   * "Reminded {date}" inline, but the claimed-progress detail then appears only
   * in the card arm. Left as a prop rather than deleted so the card list — which
   * has no header badge — keeps all of it.
   */
  hideClaimStatus = false,
  /** Hide the "Recipient" block. Set by the roster's detail sheet, whose header
   *  already carries the recipient's name + `mailto:` email. */
  hideRecipient = false,
}: {
  record: GiftRecipientRecord
  reminderSentOn?: string
  onSendReminder: () => void
  hideReminder?: boolean
  hideClaimStatus?: boolean
  hideRecipient?: boolean
}) {
  const unclaimed = record.status === 'unclaimed'

  return (
    <div style={detailStyle}>
      <div style={detailColumnStyle}>
        {!hideRecipient && (
          <DetailBlock label="Recipient:">
            <span style={detailValueStyle}>{record.recipient.name}</span>
            <a href={`mailto:${record.recipient.email}`} style={emailLinkStyle}>
              {record.recipient.email}
            </a>
          </DetailBlock>
        )}
        <DetailBlock label="Gifted by:">
          <span style={detailValueStyle}>{record.giftedBy}</span>
          {/* Order number + when it was placed. The date lives here rather than
              in a header sub-line so the detail is self-contained — it reads the
              same whether it's an expanded card body or the roster's sheet. */}
          <span style={detailMutedStyle}>
            Order {record.orderNumber} · Ordered {formatLongDate(record.orderDate)}
          </span>
        </DetailBlock>
        {!hideClaimStatus && (
          <DetailBlock label="Claim status:">
            {unclaimed ? (
              <>
                <span style={detailValueStyle}>Not yet claimed</span>
                {reminderSentOn && (
                  <span style={detailMutedStyle}>
                    Reminder sent {formatLongDate(reminderSentOn)}
                  </span>
                )}
              </>
            ) : (
              <>
                <span style={detailValueStyle}>{record.claimDetail ?? 'Claimed'}</span>
                {record.claimedOn && (
                  <span style={detailMutedStyle}>Claimed {formatLongDate(record.claimedOn)}</span>
                )}
              </>
            )}
          </DetailBlock>
        )}
        {/* The action sits with the claim status it acts on. Repeat sends are
            allowed — the copy just switches so the manager knows one already
            went out. */}
        {!hideReminder && unclaimed && (
          <div style={{ paddingTop: 4 }}>
            <Button variant="primary" size="sm" onClick={onSendReminder}>
              <Envelope size={14} aria-hidden />
              {reminderSentOn ? 'Resend reminder' : 'Send Reminder'}
            </Button>
          </div>
        )}
      </div>

      <div style={detailColumnStyle}>
        <span style={detailLabelStyle}>Package contents:</span>
        <div style={packageCardStyle}>
          <div style={packageHeaderStyle}>
            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {record.package.title}
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {itemCountLabel(record.package.items.length)}
            </span>
          </div>
          <ul style={packageListStyle}>
            {record.package.items.map((item) => (
              <li key={item.id} style={packageItemStyle}>
                <span aria-hidden style={bulletStyle} />
                {item.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/** One label + stacked value lines inside the expanded detail. */
function DetailBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={detailLabelStyle}>{label}</span>
      {children}
    </div>
  )
}

/* ─── styles ────────────────────────────────────────────────────────────── */

const detailStyle: CSSProperties = {
  display: 'grid',
  // Two columns on desktop, stacking below ~880px card width.
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
  gap: 32,
  fontFamily: 'var(--font-body)',
}

const detailColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  minWidth: 0,
}

const detailLabelStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

const detailValueStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: '22px',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const detailMutedStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-secondary)',
}

const emailLinkStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-action)',
  wordBreak: 'break-word',
}

const packageCardStyle: CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
}

const packageHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border-subtle)',
  fontSize: 14,
}

const packageListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
}

/** Small solid bullet in the brand primary — a plain list marker. (These were
 *  check-circles, which read as "verified/complete" per line; the items are just
 *  what's in the package, so a bullet is the honest marker.) */
const bulletStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-600)',
  flexShrink: 0,
}

const packageItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 16px',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}
