import type { CSSProperties } from 'react'
import { useAccount } from '@/context/AccountContext'
import {
  membershipScorecardFor,
  type MembershipScorecard as MembershipScorecardData,
} from '@/data/membership/membershipScorecardFixtures'

/**
 * "Membership Scorecard" — a single KPI strip (Concept E, savings-led).
 *
 * The savings figure leads as a tertiary-toned hero cell, with the four learning
 * metrics as compact cells beside it — so "value realized" stays the headline
 * while the whole thing reads as one row of KPIs. Members read "value returned";
 * non-members read the same figure as "potential savings" — matching the framing
 * the non-member KPI band already uses — so the section is meaningful in both.
 *
 * (The earlier payback meter — "$196 paid / 6× returned" — was removed; the
 * `card.paidAmount` / `multiple` / `paybackDate` fields are no longer rendered.)
 *
 * Graceful degrade: no `savingsAmount` → the hero cell drops and the metric
 * cells stand alone as an equal strip (STC, the $0 new-user fixture).
 */
export function MembershipScorecard() {
  const { brand, membership } = useAccount()
  const isMember = membership === 'member'
  return (
    <MembershipScorecardPanel
      card={membershipScorecardFor(brand)}
      valueTitle={isMember ? 'Member savings' : 'Potential savings'}
      valueLabel={
        isMember
          ? 'saved on member pricing since you joined'
          : 'you could save each year with a membership'
      }
    />
  )
}

/**
 * The presentational scorecard — takes an already-resolved card so the same
 * panel serves the single-membership view and the multi-membership roll-up
 * (which aggregates across memberships rather than reading one brand fixture).
 */
export function MembershipScorecardPanel({
  card,
  valueTitle = 'Member savings',
  valueLabel = 'saved on member pricing since you joined',
}: {
  card: MembershipScorecardData
  /** Short uppercase KEY on the savings hero cell (member vs non-member framing). */
  valueTitle?: string
  /** Caption under the savings figure — member vs non-member vs roll-up framing. */
  valueLabel?: string
}) {
  const showValue = Boolean(card.savingsAmount)

  return (
    <div style={panelStyle}>
      {showValue && (
        <div style={heroStyle}>
          <span aria-hidden style={heroGlowStyle} />
          <p style={heroKeyStyle}>{valueTitle}</p>
          <p style={heroValStyle}>{card.savingsAmount}</p>
          <p style={heroSubStyle}>{valueLabel}</p>
        </div>
      )}

      <div style={showValue ? metricsStyle : metricsFullStyle}>
        {card.metrics.map((m) => (
          <div key={m.key} style={tileStyle}>
            <p style={tileValStyle}>{m.value}</p>
            <p style={tileKeyStyle}>{m.label}</p>
            <p style={tileSubStyle}>{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── styles ──────────────────────────────────────────────────────── */

// The strip itself: hero cell + metrics block sit side by side on wide widths
// and stack when the metrics block can't keep its ~420px basis (no media
// queries needed — flex-wrap handles the reflow).
const panelStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-xl)',
  overflow: 'hidden',
  display: 'flex',
  flexWrap: 'wrap',
}

// Savings hero — a tertiary (cyan) gradient cell, distinct from the navy primary
// and teal secondary used elsewhere. Grows to fill leftover width but yields the
// bulk to the metrics block (which has a far larger flex-grow).
const heroStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  flex: '1 1 240px',
  minWidth: 0,
  padding: '22px 24px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  color: 'var(--color-text-inverse)',
  background: 'linear-gradient(140deg, var(--color-tertiary-600), var(--color-tertiary-800))',
}

// Decorative lighter-cyan corner wash.
const heroGlowStyle: CSSProperties = {
  position: 'absolute',
  right: -50,
  top: -50,
  width: 170,
  height: 170,
  borderRadius: '50%',
  background: 'color-mix(in srgb, var(--color-tertiary-300) 30%, transparent)',
  pointerEvents: 'none',
}

const heroValStyle: CSSProperties = {
  position: 'relative',
  margin: '8px 0 0',
  fontFamily: 'var(--font-heading)',
  fontSize: 40,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: '-0.02em',
  color: 'var(--color-text-inverse)',
}

// Eyebrow above the figure.
const heroKeyStyle: CSSProperties = {
  position: 'relative',
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: 'rgb(255 255 255 / 0.85)',
}

const heroSubStyle: CSSProperties = {
  position: 'relative',
  margin: '8px 0 0',
  maxWidth: '28ch',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: 1.5,
  color: 'rgb(255 255 255 / 0.72)',
}

// Metrics block beside the hero — a far larger flex-grow so it claims the
// remaining width, with the four tiles auto-fitting inside it.
const metricsStyle: CSSProperties = {
  flex: '999 1 420px',
  minWidth: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))',
}

// No savings hero (STC / $0 fixture) — the metrics span the full strip as an
// equal grid, matching the pre-Concept-E tile layout.
const metricsFullStyle: CSSProperties = {
  flex: '1 1 100%',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
}

const tileStyle: CSSProperties = {
  padding: '18px 20px',
  borderRight: '1px solid var(--color-border-subtle)',
  minWidth: 0,
}

const tileValStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 26,
  fontWeight: 800,
  lineHeight: 1,
  color: 'var(--color-primary-800)',
}

const tileKeyStyle: CSSProperties = {
  margin: '7px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const tileSubStyle: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}
