import type { ComponentType, CSSProperties } from 'react'
import { CircleCheck, CreditCard, GraduationCap } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { memberSuccessStatsFor } from '@/data/membership/successStatsFixtures'
import { Wrap } from './v2/passportShared'

/**
 * "Member success" social-proof band for the Dashboard Rebrand's NON-MEMBER
 * dashboard landing. Sits below the "Your Learning" row (celebrate the
 * learner's own progress first) and above the Recommended strips (value
 * second). Three large credibility stats on a restrained surface — purely
 * informational, NO CTA buttons. Self-hides when the brand carries no stats
 * (everything but Elite today).
 *
 * Non-member only: `MembershipOverview` gates the render on `!isMember`.
 */
const ICONS: Record<string, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  credits: GraduationCap,
  savings: CreditCard,
  renewal: CircleCheck,
}

export function MemberSuccessStats() {
  const { brand } = useAccount()
  const stats = memberSuccessStatsFor(brand)
  if (stats.length === 0) return null
  return (
    <section aria-label="Member success" style={{ paddingTop: 4 }}>
      <Wrap style={{ padding: 0 }}>
        <div style={bandStyle}>
          <ul style={gridStyle}>
            {stats.map((stat) => {
              const Icon = stat.iconKey ? ICONS[stat.iconKey] : undefined
              return (
                <li key={stat.label} style={itemStyle}>
                  {Icon && (
                    <span aria-hidden style={iconWrapStyle}>
                      <Icon size={20} aria-hidden />
                    </span>
                  )}
                  <b style={valueStyle}>{stat.value}</b>
                  <span style={labelStyle}>{stat.label}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </Wrap>
    </section>
  )
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

const bandStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '24px 28px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const gridStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 24,
}

const itemStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 6,
}

const iconWrapStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  marginBottom: 2,
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-secondary-100)',
  color: 'var(--color-secondary-700)',
}

const valueStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 32,
  fontWeight: 800,
  lineHeight: 1.1,
  color: 'var(--color-text-primary)',
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: 1.4,
  color: 'var(--color-text-secondary)',
}
