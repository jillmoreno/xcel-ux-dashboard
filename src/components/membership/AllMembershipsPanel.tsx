import type { CSSProperties } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { X } from '@/icons'
import type { MembershipRecord } from '@/context/AccountContext'
import { MembershipRenewalCard } from './MembershipRenewalCard'

/**
 * "Your Memberships" — a right-anchored slide-over listing every membership the
 * learner holds (`multiMembershipsFor(brand)`), opened from the Membership Hub
 * hero's "View All" link when the learner has more than one membership.
 *
 * Each card is a `MembershipRenewalCard` — the two-plane renewal card from the
 * copy review (tier-gradient identity header + a white body that answers "what
 * happens next with this membership" + one action). Full width of the sheet. The
 * active membership carries a 2px brand-primary ring, so selection never reads
 * as a tier color.
 * Clicking a card BODY selects it (loads it into the hero + the left-nav's first
 * slot); clicking Manage opens the Manage Membership sheet for that membership.
 */
type Props = {
  open: boolean
  onClose: () => void
  memberships: MembershipRecord[]
  activeId: string
  /** Card body → make this membership the active one. */
  onSelect: (id: string) => void
  /** Manage link → open the Manage Membership sheet for this membership. */
  onManage: (record: MembershipRecord) => void
}

export function AllMembershipsPanel({
  open,
  onClose,
  memberships,
  activeId,
  onSelect,
  onManage,
}: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Your Memberships">
      <header style={headerStyle}>
        <button
          type="button"
          aria-label="Close Your Memberships panel"
          onClick={onClose}
          className="cre-sheet-close"
          style={closeStyle}
        >
          <X size={14} aria-hidden />
          Close
        </button>
        <h2 style={titleStyle}>Your Memberships</h2>
        <p style={ledeStyle}>
          Select a membership to view it, or manage one directly.
        </p>
      </header>
      <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      <div style={bodyStyle}>
        {memberships.map((m) => (
          <MembershipRenewalCard
            key={m.id}
            record={m}
            selected={m.id === activeId}
            onSelect={() => onSelect(m.id)}
            // Every state's action routes to the Manage Membership sheet for
            // now — per the copy review that sheet is the one surface holding
            // auto-renewal, payment method, date/price and cancellation, so
            // "Renew now" / "Update payment method" / "Turn auto-renewal on"
            // all legitimately land there. TODO: deep-link to the right row.
            onAction={() => onManage(m)}
          />
        ))}
      </div>
    </Sheet>
  )
}

/* ─── styles (tokens only) ─────────────────────────────────────────────── */

const headerStyle: CSSProperties = {
  padding: '20px 24px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const closeStyle: CSSProperties = {
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

const titleStyle: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 24,
  lineHeight: '30px',
  color: 'var(--color-primary-700)',
}

const ledeStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const bodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px 24px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

