import type { CSSProperties } from 'react'
import { ArrowRight, CircleCheck, LockSolid } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { MembershipBadge } from '@/components/ui/MembershipBadge'
import { tierBadgeIcon } from '@/components/ui/membershipTierBadge'
import { membershipPlanFor } from '@/data/membership/membershipScorecardFixtures'

/**
 * "Current Membership" — the passport-card treatment (Concept C).
 *
 * Renders the learner's plan as a physical membership card: brand eyebrow +
 * tier chip, plan name + line, a two-up Member since / Renews grid, and a
 * Manage Membership CTA with an auto-renew chip. A light renewal note sits
 * beneath the card.
 *
 * Brand-aware throughout — the tier label, tone, and badge glyph come from
 * `useAccount()`, so CRE/McKissock read Plus/Pro/Premier and Elite reads
 * Passport Lite/Passport without any per-brand code here.
 *
 * Graceful degrade (see `membershipScorecardFixtures` for why these are optional):
 *   - no `renewsOn`  → the Renews cell and the renewal note both drop.
 *   - `autoRenew` undefined → the auto-renew chip drops and the note reads
 *     "Renews on {date}" rather than "Renews automatically in N days".
 *   - non-member → a neutral "Free account" card + an Explore plans CTA.
 */
export function MembershipPassportCard({ onManage }: { onManage?: () => void } = {}) {
  const { brand, membership, tierLabel, tierTone } = useAccount()
  const isMember = membership === 'member'
  const plan = membershipPlanFor(brand, tierLabel)

  if (!isMember) return <NonMemberCard onExplore={onManage} />

  const hasRenewal = Boolean(plan.renewsOn)
  const knowsAutoRenew = plan.autoRenew !== undefined

  return (
    <div>
      <div style={cardStyle}>
        <span aria-hidden style={cardGlowStyle} />
        <div style={cardTopStyle}>
          <span style={cardBrandStyle}>Your membership</span>
          <MembershipBadge tone={tierTone} label={plan.planName} icon={tierBadgeIcon(tierTone)} />
        </div>
        <p style={cardNameStyle}>{plan.planName}</p>
        <p style={cardLineStyle}>{plan.planLine}</p>

        <div style={cardRowsStyle}>
          {plan.memberSince && (
            <div>
              <p style={cardRowKeyStyle}>Member since</p>
              <p style={cardRowValStyle}>{plan.memberSince}</p>
            </div>
          )}
          {hasRenewal && (
            <div>
              {/* Only say "Auto-Renews" when auto-renew is confirmed. With it
                  unknown (McKissock) the label falls back to "Renews", matching
                  the neutral note below — otherwise the card would assert an
                  auto-renewal the note declines to claim. */}
              <p style={cardRowKeyStyle}>{plan.autoRenew === true ? 'Auto-Renews' : 'Renews'}</p>
              <p style={cardRowValStyle}>
                {plan.renewsOn}
                {plan.daysRemaining != null && (
                  <span style={cardRowDaysStyle}> (in {plan.daysRemaining} days)</span>
                )}
              </p>
            </div>
          )}
        </div>

        <div style={{ ...cardFootStyle, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onManage ?? (() => console.info('cta:manage-membership'))}
            style={manageLinkStyle}
          >
            Manage Membership
            <ArrowRight size={14} aria-hidden />
          </button>
        </div>
      </div>

      {hasRenewal && (
        <p style={renewalNoteStyle}>
          <CircleCheck size={16} aria-hidden style={{ flexShrink: 0, color: 'var(--color-success-600)' }} />
          <span>
            {knowsAutoRenew && plan.autoRenew ? (
              <>
                Renews automatically in <b>{plan.daysRemaining} days</b>
                {plan.priceLabel ? <> — {plan.priceLabel}.</> : '.'} We&rsquo;ll email you before it does.
              </>
            ) : (
              <>
                Renews on <b>{plan.renewsOn}</b>
                {plan.priceLabel ? <> — {plan.priceLabel}.</> : '.'}
              </>
            )}
          </span>
        </p>
      )}
    </div>
  )
}

/** Non-member: a neutral card in the same footprint, pitching the plan. */
function NonMemberCard({ onExplore }: { onExplore?: () => void }) {
  return (
    <div>
      <div style={{ ...cardStyle, background: 'var(--color-neutral-800)' }}>
        <span aria-hidden style={cardGlowStyle} />
        <div style={cardTopStyle}>
          <span style={cardBrandStyle}>Your membership</span>
          <MembershipBadge tone="neutral" label="Non-Member" icon={LockSolid} />
        </div>
        <p style={cardNameStyle}>Free account</p>
        <p style={cardLineStyle}>No active membership</p>
        <div style={{ ...cardRowsStyle, gridTemplateColumns: '1fr' }}>
          <div>
            <p style={cardRowKeyStyle}>What you&rsquo;re missing</p>
            <p style={cardRowValStyle}>Member pricing, the full library, exam prep, and AI career tools</p>
          </div>
        </div>
        <div style={cardFootStyle}>
          <button type="button" onClick={onExplore ?? (() => console.info('cta:explore-plans'))} style={cardCtaStyle}>
            Explore plans
            <ArrowRight size={14} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── styles ──────────────────────────────────────────────────────── */

const cardStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  background: 'linear-gradient(145deg, var(--color-primary-700), var(--color-primary-900))',
  borderRadius: 'var(--radius-xl)',
  padding: 22,
  color: 'var(--color-text-inverse)',
}

// Soft secondary-tinted corner wash — decorative only.
const cardGlowStyle: CSSProperties = {
  position: 'absolute',
  right: -46,
  top: -46,
  width: 180,
  height: 180,
  borderRadius: '50%',
  background: 'color-mix(in srgb, var(--color-secondary-500) 16%, transparent)',
  pointerEvents: 'none',
}

const cardTopStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
}

const cardBrandStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgb(255 255 255 / 0.62)',
}

const cardNameStyle: CSSProperties = {
  position: 'relative',
  margin: '16px 0 2px',
  fontFamily: 'var(--font-heading)',
  fontSize: 21,
  fontWeight: 800,
  lineHeight: 1.15,
}

const cardLineStyle: CSSProperties = {
  position: 'relative',
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'rgb(255 255 255 / 0.62)',
}

const cardRowsStyle: CSSProperties = {
  position: 'relative',
  marginTop: 20,
  paddingTop: 16,
  borderTop: '1px solid rgb(255 255 255 / 0.22)',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: 12,
}

const cardRowKeyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgb(255 255 255 / 0.45)',
}

const cardRowValStyle: CSSProperties = {
  margin: '3px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.4,
}

const cardFootStyle: CSSProperties = {
  position: 'relative',
  marginTop: 18,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
}

const cardCtaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 38,
  padding: '0 16px',
  border: 'none',
  borderRadius: 'var(--radius-pill)',
  cursor: 'pointer',
  background: 'var(--color-surface-card)',
  color: 'var(--color-primary-800)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 800,
  whiteSpace: 'nowrap',
}

// The "(in N days)" qualifier after the renews date — lighter weight so the
// date stays the emphasis.
const cardRowDaysStyle: CSSProperties = {
  fontWeight: 400,
  color: 'rgb(255 255 255 / 0.62)',
}

// Manage Membership — a white link-style button (transparent, underlined),
// pinned bottom-right of the card.
const manageLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const renewalNoteStyle: CSSProperties = {
  margin: '12px 0 0',
  display: 'flex',
  alignItems: 'center',
  gap: 11,
  padding: '13px 15px',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: 1.5,
  color: 'var(--color-text-secondary)',
}
