import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Gem, Podcast } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import {
  passportMembershipFor,
  passportSavingsFor,
} from '@/data/membership/passportProgressFixtures'
import { Wrap } from '../v2/passportShared'
import type { MembershipAccess } from './sharedUtil'

/**
 * Membership-first hero. The headline answers the PRD's core member
 * question — "what do I get with my membership?" — and the page's primary
 * job (discovering new benefits) is the first CTA. Progress is
 * deliberately demoted to a compact, opt-in snapshot on the right with a
 * link out to the full dashboard — never the headline.
 *
 * `access="full"` → active member; `access="lite"` → Passport Lite /
 * non-member join framing.
 */

const HERO_BAND: CSSProperties = {
  background: 'var(--color-primary-600)',
}

const CHIP: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'var(--color-tertiary-100)',
  color: 'var(--color-tertiary-700)',
  borderRadius: 'var(--radius-pill)',
  padding: '4px 12px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.02em',
}

const H1: CSSProperties = {
  margin: '14px 0 0',
  fontFamily: 'var(--font-heading)',
  fontSize: 30,
  fontWeight: 800,
  lineHeight: 1.12,
  letterSpacing: '-0.01em',
  color: 'var(--color-text-inverse)',
}

const LEAD: CSSProperties = {
  margin: '12px 0 26px',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: 1.5,
  color: 'rgb(255 255 255 / 0.85)',
  maxWidth: '46ch',
}

export function MembershipFirstHero({ access }: { access: MembershipAccess }) {
  return access === 'full' ? <MemberHero /> : <JoinHero />
}

function MemberHero() {
  const { brand } = useAccount()
  const membership = passportMembershipFor(brand)
  const savings = passportSavingsFor(brand)
  return (
    <header style={HERO_BAND}>
      <Wrap
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          paddingTop: 48,
          paddingBottom: 48,
        }}
      >
        <div>
          <span style={CHIP}>
            <Gem size={13} aria-hidden />
            Elite Passport · Active
          </span>
          <h1 style={H1}>Welcome back, Jordan — here&rsquo;s everything your membership unlocks.</h1>
          <p style={{ ...LEAD, marginBottom: 0 }}>
            New courses, podcasts, exam prep, and AI career tools are added between renewals.
            This is where you find what&rsquo;s new and jump into anything included with your
            Passport.
          </p>
        </div>

        {membership && <HeroKpis membership={membership} savings={savings} />}
      </Wrap>
    </header>
  )
}

/** Membership KPI strip lining the bottom of the hero — inline stat chips
 *  (transparent, white text, hairline dividers) on the teal band, with the
 *  Upgrade card kept as-is at the end. */
function HeroKpis({
  membership,
  savings,
}: {
  membership: NonNullable<ReturnType<typeof passportMembershipFor>>
  savings: ReturnType<typeof passportSavingsFor>
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', flex: '1 1 480px', minWidth: 0 }}>
        <StatChip
          first
          label="Member for"
          value={`${daysSince(membership.memberSince).toLocaleString()} days`}
          sub={`Since ${formatRenew(membership.memberSince)}`}
        />
        {savings && (
          <>
            <StatDivider />
            <StatChip label="Saved with your membership" value={savings.amount} sub={savings.meta} />
          </>
        )}
        <StatDivider />
        <StatChip
          label="Membership Status"
          value={membership.status}
          sub={`Renews ${formatRenew(membership.renews)}`}
        />
      </div>
      {membership.upgrade && (
        <KpiUpgradeCard tier={membership.upgrade.tier} meta={membership.upgrade.meta} />
      )}
    </div>
  )
}

/** Hairline divider between stat chips. */
function StatDivider() {
  return (
    <span
      aria-hidden
      style={{ alignSelf: 'stretch', width: 1, background: 'rgb(255 255 255 / 0.22)', flexShrink: 0 }}
    />
  )
}

/** Inline stat chip — uppercase label / value / sub, white on the teal. */
function StatChip({
  label,
  value,
  sub,
  first = false,
}: {
  label: string
  value: string
  sub: string
  first?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: first ? '4px 22px 4px 0' : '4px 22px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgb(255 255 255 / 0.7)',
        }}
      >
        {label}
      </span>
      <b
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 24,
          fontWeight: 800,
          lineHeight: 1.15,
          color: 'var(--color-text-inverse)',
        }}
      >
        {value}
      </b>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgb(255 255 255 / 0.7)' }}>
        {sub}
      </span>
    </div>
  )
}

/** Accented Upgrade KPI — solid CTA fill reads on the light hero. */
function KpiUpgradeCard({ tier, meta }: { tier: string; meta: string }) {
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
        padding: '16px 18px',
        color: 'var(--color-text-inverse)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgb(255 255 255 / 0.85)',
        }}
      >
        <ArrowRight size={12} aria-hidden />
        Upgrade
      </span>
      <b style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: 18, lineHeight: 1.2, margin: '4px 0 0' }}>
        {tier}
      </b>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgb(255 255 255 / 0.8)', marginTop: 4 }}>
        {meta}
      </div>
    </button>
  )
}

function daysSince(iso: string): number {
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10))
  const start = new Date(y, m - 1, d).getTime()
  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000))
}

function JoinHero() {
  return (
    <header style={HERO_BAND}>
      <Wrap style={{ paddingTop: 52, paddingBottom: 52, maxWidth: 820 }}>
        <span style={CHIP}>
          <Gem size={13} aria-hidden />
          Elite Passport membership
        </span>
        <h1 style={H1}>Continuing education for nurses — all in one place.</h1>
        <p style={LEAD}>
          ANCC-accredited courses, CE podcasts, certification exam prep, and AI career tools.
          Preview anything free — most courses count toward your license renewal.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <PrimaryButton href="#whats-new">Explore membership benefits</PrimaryButton>
          <GhostButton href="/my-learning/podcasts">
            <Podcast size={16} aria-hidden />
            Listen to a CE podcast
          </GhostButton>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'rgb(255 255 255 / 0.85)',
            }}
          >
            Unlimited CE from{' '}
            <b style={{ color: 'var(--color-text-inverse)' }}>$48/yr</b>
          </span>
        </div>
      </Wrap>
    </header>
  )
}

const RENEW_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
function formatRenew(iso: string): string {
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10))
  return RENEW_FMT.format(new Date(y, m - 1, d))
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
  return (
    <a
      href={href}
      style={{ ...BTN_BASE, background: 'var(--color-action)', color: 'var(--color-text-inverse)' }}
    >
      {children}
    </a>
  )
}

function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  const isHash = href.startsWith('#')
  const style: CSSProperties = {
    ...BTN_BASE,
    background: 'transparent',
    color: 'var(--color-text-inverse)',
    borderColor: 'rgb(255 255 255 / 0.55)',
  }
  return isHash ? (
    <a href={href} style={style}>
      {children}
    </a>
  ) : (
    <Link to={href} style={style}>
      {children}
    </Link>
  )
}
