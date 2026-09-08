import type { ComponentType, CSSProperties } from 'react'
import { AwardSolid, Flag, Library, Package } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { membershipStatBarFor } from '@/data/membership/successStatsFixtures'

/**
 * Membership "what's included" stat bar — social proof above the plan cards
 * on the NON-MEMBER Explore Membership page. A single horizontal row of
 * credibility stats (CE hours / products / accreditation / coverage) on a
 * restrained surface. Same informational, no-CTA treatment as
 * `MemberSuccessStats`. Self-hides when the brand carries no stats.
 */
const ICONS: Record<string, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  library: Library,
  tools: Package,
  accredited: AwardSolid,
  states: Flag,
}

export function MembershipStatBar() {
  const { brand } = useAccount()
  const stats = membershipStatBarFor(brand)
  if (stats.length === 0) return null
  return (
    <ul aria-label="What's included with membership" style={barStyle}>
      {stats.map((stat, i) => {
        const Icon = stat.iconKey ? ICONS[stat.iconKey] : undefined
        return (
          <li key={stat.label} style={itemStyle}>
            {i > 0 && <span aria-hidden style={dividerStyle} />}
            <div style={cellStyle}>
              {Icon && (
                <span aria-hidden style={iconWrapStyle}>
                  <Icon size={18} aria-hidden />
                </span>
              )}
              <b style={valueStyle}>{stat.value}</b>
              <span style={labelStyle}>{stat.label}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

const barStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: '20px 24px',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 0,
}

const itemStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const dividerStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 1,
  height: '64%',
  background: 'var(--color-border-subtle)',
}

const cellStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 4,
  padding: '0 12px',
}

const iconWrapStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  marginBottom: 2,
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-secondary-100)',
  color: 'var(--color-secondary-700)',
}

const valueStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 26,
  fontWeight: 800,
  lineHeight: 1.1,
  color: 'var(--color-text-primary)',
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: 1.35,
  color: 'var(--color-text-secondary)',
}
