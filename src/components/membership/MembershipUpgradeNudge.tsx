import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Gem } from '@/icons'
import { useAccount } from '@/context/AccountContext'

/**
 * Slim Lite→full Passport upgrade nudge, shown beneath the member benefit
 * heroes on the "Membership Benefits" tab.
 *
 * Renders ONLY for a lower-tier (Passport Lite) member — gated on the account
 * `access` resolving to `lite` (a member on any tier below the brand's highest).
 * Full-Passport members (`access === 'full'`) and non-members render nothing.
 */
export function MembershipUpgradeNudge() {
  const { access } = useAccount()
  if (access !== 'lite') return null

  return (
    <Link
      to="/membership/plans"
      style={bannerStyle}
      aria-label="On Passport Lite? Upgrade to the full Passport to unlock the full library and AI Career Tools"
    >
      <span style={iconStyle} aria-hidden>
        <Gem size={16} />
      </span>
      <span style={copyStyle}>
        <strong style={leadStyle}>On Passport Lite?</strong>
        <span style={subStyle}>Unlock the full library + AI Career Tools.</span>
      </span>
      <span style={ctaStyle}>
        Upgrade
        <ArrowRight size={14} aria-hidden />
      </span>
    </Link>
  )
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

const bannerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '14px 18px',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-primary-100)',
  border: '1px solid color-mix(in srgb, var(--color-primary-500) 28%, transparent)',
  color: 'var(--color-primary-800)',
  textDecoration: 'none',
}

const iconStyle: CSSProperties = {
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  width: 32,
  height: 32,
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-tertiary-700)',
}

const copyStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: 6,
  flex: 1,
  minWidth: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: 1.4,
}

const leadStyle: CSSProperties = {
  fontWeight: 700,
  color: 'var(--color-primary-800)',
}

const subStyle: CSSProperties = {
  color: 'var(--color-primary-700)',
}

const ctaStyle: CSSProperties = {
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 14,
  color: 'var(--color-primary-700)',
}
