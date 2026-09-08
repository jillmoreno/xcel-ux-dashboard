import type { CSSProperties } from 'react'
import { ArrowRight, Book, BookOpen, Gem, Podcast, Robot } from '@/icons'
import {
  passportMembershipFor,
  passportSavingsFor,
} from '@/data/membership/passportProgressFixtures'
import { useAccount } from '@/context/AccountContext'
import { Eyebrow, PassportButton, Wrap } from './passportShared'

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

/**
 * FHEA Passport hero. `variant="join"` is the non-member marketing hero
 * (headline + lead + CTAs + a glass "Your Passport includes" card).
 * `variant="member"` is the personalized active-membership hero with the
 * status pill + 3 stat cards.
 */
const HERO_BG: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  color: 'var(--color-text-inverse)',
  background:
    'radial-gradient(1200px 500px at 80% -10%, var(--color-secondary-600) 0%, transparent 55%), linear-gradient(135deg, var(--color-primary-800) 0%, var(--color-primary-600) 55%, var(--color-primary-500) 100%)',
}

const HERO_INCLUDES = [
  { Icon: Book, title: 'Video nursing skills library', sub: 'Hands-on technique refreshers, on demand' },
  { Icon: BookOpen, title: 'Pharmacology course library', sub: 'Stay current on medications & safety' },
  { Icon: Robot, title: 'Rubi AI career toolkit', sub: 'Interview prep, resume builder & career paths' },
  { Icon: Podcast, title: 'Nursing podcasts', sub: 'Also included with Passport Lite' },
] as const

export function PassportHero({ variant }: { variant: 'join' | 'member' }) {
  if (variant === 'member') return <MemberHero />
  return <JoinHero />
}

function JoinHero() {
  return (
    <header style={HERO_BG}>
      <Wrap
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: 48,
          alignItems: 'center',
          paddingTop: 64,
          paddingBottom: 64,
        }}
      >
        <div>
          <Eyebrow style={{ color: 'var(--color-secondary-200)' }}>FHEA Passport Membership</Eyebrow>
          <h1
            style={{
              margin: '12px 0 0',
              fontFamily: 'var(--font-heading)',
              fontSize: 54,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              color: 'inherit',
            }}
          >
            One membership for your
            <br />
            entire nursing career.
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 19,
              maxWidth: '33ch',
              color: 'rgb(255 255 255 / 0.9)',
              margin: '18px 0 28px',
            }}
          >
            Unlimited CE, a video skills library, specialty bundles, and AI career tools — all in
            one Passport built for nurses and NPs.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <PassportButton variant="light">Join FHEA Passport</PassportButton>
            <PassportButton variant="outline-light">See what's included</PassportButton>
          </div>
          <p style={{ marginTop: 18, fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgb(255 255 255 / 0.7)' }}>
            ANCC-accredited CE · Cancel anytime · Trusted by thousands of nurses
          </p>
        </div>

        <aside
          style={{
            background: 'rgb(255 255 255 / 0.1)',
            border: '1px solid rgb(255 255 255 / 0.22)',
            borderRadius: 'var(--radius-xl)',
            padding: 26,
            backdropFilter: 'blur(4px)',
          }}
        >
          <h3
            style={{
              margin: '0 0 16px',
              fontFamily: 'var(--font-heading)',
              fontSize: 16,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--color-secondary-200)',
            }}
          >
            Your Passport includes
          </h3>
          {HERO_INCLUDES.map(({ Icon, title, sub }, i) => (
            <div
              key={title}
              style={{
                display: 'flex',
                gap: 13,
                padding: '13px 0',
                borderTop: i === 0 ? 'none' : '1px solid rgb(255 255 255 / 0.16)',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 38,
                  height: 38,
                  flex: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgb(255 255 255 / 0.16)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon size={18} />
              </span>
              <div>
                <b style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: 15 }}>{title}</b>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgb(255 255 255 / 0.78)' }}>
                  {sub}
                </span>
              </div>
            </div>
          ))}
        </aside>
      </Wrap>
    </header>
  )
}

function MemberHero() {
  const { brand } = useAccount()
  const savings = passportSavingsFor(brand)
  const membership = passportMembershipFor(brand)
  const daysAsMember = membership ? daysSince(membership.memberSince) : 0
  return (
    <header
      style={{
        color: 'var(--color-text-inverse)',
        background:
          'radial-gradient(1000px 460px at 88% -20%, var(--color-secondary-600) 0%, transparent 55%), linear-gradient(135deg, var(--color-primary-800) 0%, var(--color-primary-600) 60%, var(--color-primary-500) 100%)',
      }}
    >
      <Wrap style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            {/* Membership chip — styled like the course-catalog
                "Included with membership" tag (Gem + tertiary tint,
                radius-sm). Status + renewal now live in the KPI cards
                below, so the chip just names the membership. */}
            <span
              // Matches the dashboard "Included with Membership" chip
              // (Gem + tertiary-100 fill + tertiary-700 ink, radius-sm,
              // 22px / 8px / gap 4). Uses the SOLID tertiary-100 fill
              // rather than the `cre-tag-pro` 25% wash, which only reads
              // on a white card — on this dark hero the solid fill keeps
              // the same light-peach chip appearance + legible text.
              style={{
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
              }}
            >
              <Gem size={12} aria-hidden />
              FHEA Passport
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontSize: 42,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
                color: 'inherit',
              }}
            >
              Welcome back, Jordan.
            </h1>
            <p style={{ margin: '14px 0 0', fontFamily: 'var(--font-body)', fontSize: 16, color: 'rgb(255 255 255 / 0.9)' }}>
              {membership
                ? `Thanks for being a member for ${daysAsMember.toLocaleString()} days — here's everything your Passport is unlocking right now.`
                : "Your Passport is in full swing — here's everything it's unlocking right now."}
            </p>
          </div>
        </div>

        {/* Membership KPIs — all keyed to *being a member*: tenure
            (a live day count), dollars saved, status + renewal, and an
            optional Upgrade card when a higher tier is available. */}
        {membership &&
          (() => {
            const cardCount = 2 + (savings ? 1 : 0) + (membership.upgrade ? 1 : 0)
            return (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cardCount}, minmax(0, 1fr))`,
                  gap: 16,
                  marginTop: 28,
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
                  label="Membership Status"
                  value={membership.status}
                  meta={`Renews ${fmtDate(membership.renews)}`}
                />
                {membership.upgrade && (
                  <HeroUpgradeCard
                    tier={membership.upgrade.tier}
                    meta={membership.upgrade.meta}
                  />
                )}
              </div>
            )
          })()}
      </Wrap>
    </header>
  )
}

/** Glass KPI card used in the member hero (label · big value · meta). */
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
      <b style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: 30, lineHeight: 1.15 }}>
        {value}
      </b>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgb(255 255 255 / 0.75)', marginTop: 4 }}>
        {meta}
      </div>
    </div>
  )
}

/** Accented, actionable KPI card prompting an upgrade to a higher tier. */
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
        boxShadow: 'none',
        transform: 'none',
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
      <b
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-heading)',
          fontSize: 22,
          lineHeight: 1.15,
        }}
      >
        {tier}
      </b>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgb(255 255 255 / 0.8)', marginTop: 4 }}>
        {meta}
      </div>
    </button>
  )
}
