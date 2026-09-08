import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from '@/icons'
import { MemberSuccessStats } from './MemberSuccessStats'
import { ExplorePassportPlans } from './ExplorePassportPlans'

/**
 * Non-member "Explore Membership" body for the Dashboard Rebrand shell
 * (`PlatformShell` renders this for the `m-whats-new` section when the
 * account is a non-member). A modern SaaS-style comparison view:
 *
 *   1. `MemberSuccessStats` — "Members go further" social-proof band
 *                            (2.4M credit hours · $1,180 saved · 92% renew).
 *   2. `ExplorePassportPlans` — the Elite Passport Lite vs. Passport CE
 *                            Membership comparison (1-year terms, sale price +
 *                            promo, "Most Popular" on the full Passport).
 *   3. A single closing "Become a member" CTA.
 *
 * The section's gradient hero already supplies the `<h1>` + search, so this
 * composition renders no page title of its own. Members instead get
 * `<MembershipBenefitsPanel embedded />` (the benefit jump-off heroes).
 */
export function ExploreMembershipNonMember() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* The non-member treatment of the two sections — a "Free account" card + the
          scorecard reframed as potential savings — was REMOVED on 2026-08-25
          (decision #3 on the feature gateway). It printed $1,180 twice within
          two blocks: once as a hypothetical "Potential savings", and again
          just below in MemberSuccessStats as "$1,180 average member saves
          annually". The success stats state it as a fact about members rather
          than a promise to this one, so they keep it; dropping the sections
          also takes the non-member from three join CTAs down to two.
          MembershipSections still serves the MEMBER page. */}
      <MemberSuccessStats />
      <section style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h2 style={headingStyle}>Choose your plan</h2>
        <p style={subStyle}>
          Every plan unlocks the full Elite Learning experience — pick the coverage
          that fits your license and your team.
        </p>
        <ExplorePassportPlans />
      </section>
      <div style={ctaWrapStyle}>
        <Link to="/membership/plans" style={ctaStyle}>
          Become a member
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </div>
  )
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--text-heading-2xl)',
  fontWeight: 600,
  lineHeight: 'var(--text-heading-2xl--line-height)',
  color: 'var(--color-text-primary)',
}

const subStyle: CSSProperties = {
  margin: 0,
  maxWidth: '60ch',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-body-sm)',
  lineHeight: 'var(--text-body-sm--line-height)',
  color: 'var(--color-text-secondary)',
}

const ctaWrapStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  paddingTop: 4,
}

const ctaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 48,
  padding: '0 28px',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-heading)',
  fontSize: 16,
  fontWeight: 700,
  textDecoration: 'none',
}
