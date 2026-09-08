import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Gem, Podcast } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import {
  passportMembershipFor,
  passportSavingsFor,
} from '@/data/membership/passportProgressFixtures'
import { Wrap } from '../v2/passportShared'

/**
 * Combined membership hero (v6) — a deliberate mix of aspects audited
 * across the existing membership versions, per stakeholder direction:
 *
 *   - **Surface**: a SOLID `--color-primary-700` band — no gradient and
 *     no radial glow (unlike v1/v2's gradients). Flatter, calmer, brand-
 *     forward.
 *   - **Layout**: two-column — headline + lead + CTAs on the left, a
 *     companion card region on the right (the v2/v4 structure).
 *   - **Aside**: the v2 *member* KPI stat cards — tenure, dollars saved,
 *     status + renewal, and the accented Upgrade card — reworked as
 *     translucent "glass" tiles that read against the solid teal.
 *
 * Member view only for now (`access="full"`). The non-member/join
 * variant is a follow-up — v6 currently falls back to the v2 join page
 * for non-members (see MembershipV6).
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │  ◈ FHEA Passport · Active                                          │
 *   │  Welcome back, Jordan.            ┌──────────┐ ┌──────────┐        │
 *   │  Everything your membership …     │ Member   │ │ Saved    │        │
 *   │  [ See what's new ] [ Podcast ]   │ for      │ │ $1,180   │        │
 *   │                                   └──────────┘ └──────────┘        │
 *   │                                   ┌──────────┐ ┌──────────┐        │
 *   │                                   │ Status   │ │ ↗ Upgrade│        │
 *   │                                   └──────────┘ └──────────┘        │
 *   └──────────────────────────────────────────────────────────────────┘
 */

const HERO_DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10))
  return HERO_DATE_FMT.format(new Date(y, m - 1, d))
}

/** Whole days between an ISO date and today (clamped at 0). */
function daysSince(iso: string): number {
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10))
  const start = new Date(y, m - 1, d).getTime()
  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000))
}

/* ─── surface ────────────────────────────────────────────────────────── */

// Solid primary-700 — explicitly NOT a gradient or radial glow.
const HERO_BG: CSSProperties = {
  background: 'var(--color-primary-700)',
  color: 'var(--color-text-inverse)',
}

const CHIP: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'var(--color-tertiary-100)',
  color: 'var(--color-tertiary-700)',
  borderRadius: 'var(--radius-sm)',
  padding: '0 8px',
  height: 22,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '20px',
  whiteSpace: 'nowrap',
  marginBottom: 14,
}

const H1: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 42,
  fontWeight: 800,
  lineHeight: 1.1,
  letterSpacing: '-0.01em',
  color: 'inherit',
}

const LEAD: CSSProperties = {
  margin: '14px 0 28px',
  fontFamily: 'var(--font-body)',
  fontSize: 17,
  lineHeight: 1.55,
  maxWidth: '42ch',
  color: 'rgb(255 255 255 / 0.9)',
}

export function MembershipCombinedHero() {
  const { brand } = useAccount()
  const membership = passportMembershipFor(brand)
  const savings = passportSavingsFor(brand)
  const daysAsMember = membership ? daysSince(membership.memberSince) : 0

  return (
    <header style={HERO_BG}>
      <Wrap
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
          gap: 48,
          alignItems: 'center',
          paddingTop: 52,
          paddingBottom: 52,
        }}
      >
        {/* ── left: chip + welcome + lead + CTAs ── */}
        <div>
          <span style={CHIP}>
            <Gem size={12} aria-hidden />
            FHEA Passport · {membership?.status ?? 'Active'}
          </span>
          <h1 style={H1}>Welcome back, Jordan.</h1>
          <p style={LEAD}>
            Everything your membership unlocks — unlimited CE, the skills library,
            exam prep, and AI career tools — lives here. Pick up where you left off
            or see what&rsquo;s new for members.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <PrimaryButton href="#whats-new">See what&rsquo;s new for members</PrimaryButton>
            <GhostButton href="/my-learning/podcasts">
              <Podcast size={16} aria-hidden />
              Listen to a CE podcast
            </GhostButton>
          </div>
        </div>

        {/* ── right: KPI stat cards (v2 member aspect) ── */}
        {membership && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 16,
            }}
          >
            <HeroStatCard
              label="Member for"
              value={`${daysAsMember.toLocaleString()} days`}
              meta={`Since ${fmtDate(membership.memberSince)}`}
            />
            {savings && (
              <HeroStatCard
                label="Saved with your membership"
                value={savings.amount}
                meta={savings.meta}
              />
            )}
            <HeroStatCard
              label="Membership status"
              value={membership.status}
              meta={`Renews ${fmtDate(membership.renews)}`}
            />
            {membership.upgrade && (
              <HeroUpgradeCard tier={membership.upgrade.tier} meta={membership.upgrade.meta} />
            )}
          </div>
        )}
      </Wrap>
    </header>
  )
}

/** Glass KPI card (label · big value · meta) — adapted from the v2 member
 *  hero to sit on the solid primary-700 surface. */
function HeroStatCard({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div
      style={{
        background: 'rgb(255 255 255 / 0.12)',
        border: '1px solid rgb(255 255 255 / 0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-secondary-200)',
        }}
      >
        {label}
      </span>
      <b style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: 28, lineHeight: 1.15, marginTop: 4 }}>
        {value}
      </b>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgb(255 255 255 / 0.75)', marginTop: 4 }}>
        {meta}
      </div>
    </div>
  )
}

/** Accented, actionable Upgrade KPI card. */
function HeroUpgradeCard({ tier, meta }: { tier: string; meta: string }) {
  return (
    <button
      type="button"
      onClick={() => console.info('cta:upgrade-membership')}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        background: 'var(--color-cta-500)',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        color: 'var(--color-text-inverse)',
        transition: 'background 160ms ease, box-shadow 160ms ease, transform 160ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--color-cta-600)'
        e.currentTarget.style.boxShadow = '0 8px 22px rgb(0 0 0 / 0.22)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--color-cta-500)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'none'
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgb(255 255 255 / 0.85)',
        }}
      >
        <ArrowRight size={12} aria-hidden />
        Upgrade
      </span>
      <b style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: 21, lineHeight: 1.15, marginTop: 4 }}>
        {tier}
      </b>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgb(255 255 255 / 0.8)', marginTop: 4 }}>
        {meta}
      </div>
    </button>
  )
}

/* ─── buttons (anchor-based so hash scroll + routing both work) ───────── */

const BTN_BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 15,
  borderRadius: 'var(--radius-pill)',
  padding: '13px 24px',
  textDecoration: 'none',
  border: '2px solid transparent',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  // On the teal surface a light fill reads as the primary affordance.
  return (
    <a
      href={href}
      style={{ ...BTN_BASE, background: 'var(--color-neutral-50)', color: 'var(--color-primary-700)' }}
    >
      {children}
    </a>
  )
}

function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  const style: CSSProperties = {
    ...BTN_BASE,
    background: 'rgb(255 255 255 / 0.08)',
    color: 'var(--color-text-inverse)',
    borderColor: 'rgb(255 255 255 / 0.4)',
  }
  // Hash links scroll within the page; everything else routes via the SPA.
  return href.startsWith('#') ? (
    <a href={href} style={style}>
      {children}
    </a>
  ) : (
    <Link to={href} style={style}>
      {children}
    </Link>
  )
}
