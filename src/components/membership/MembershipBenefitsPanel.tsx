import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { benefitRowsFor } from '@/data/membership/membershipFirstFixtures'
import { EmptyState } from '@/components/ui/EmptyState'
import { Megaphone } from '@/icons'
import { BenefitHeroSections } from './v5/BenefitHeroSections'
import { ExploreMembershipProducts } from './ExploreMembershipProducts'
import { WhatsNewQuickFilter } from './WhatsNewQuickFilter'
import { WhatsNewUpsellBand } from './WhatsNewUpsellBand'
import { MembershipSections } from './MembershipSections'
import { MembershipUpgradeNudge } from './MembershipUpgradeNudge'
import { PassportPlanComparison } from './v2/PassportPlanComparison'
import { PlanTierStrip } from './PlanTierStrip'

/**
 * "Membership Benefits" tab body for the v1 `/membership` page. Branches on
 * `useAccount().membership`:
 *
 *   - **Member**     → a short intro → benefit jump-off heroes
 *                      (`BenefitHeroSections variant="member"`) → a slim
 *                      Lite→full upgrade nudge (Passport Lite members only).
 *   - **Non-member** → a marketing lead-in → benefit heroes in the
 *                      `marketing` variant (Learn more + Become a member,
 *                      gated chips on Passport-only benefits) → the Passport
 *                      vs. Passport Lite plan comparison (its `#plans` anchor
 *                      is the "Become a member" scroll target) → a final
 *                      "Become a member" CTA.
 *
 * The page's canonical tab-title `<h2>` ("Membership Benefits") is printed by
 * `MembershipLandingPage`; this panel renders no title of its own.
 *
 * Also reused as the Dashboard Rebrand shell's "Explore Membership" section
 * body — pass `embedded` there so the member intro line is dropped (the
 * shell's gradient section hero already frames it).
 */
export function MembershipBenefitsPanel({
  embedded = false,
  onOpenResource,
  exploreLabelOverride,
}: {
  embedded?: boolean
  /** Dashboard Rebrand shell: open the Resource Library cards' resource viewer
   *  in-shell instead of navigating to `/resources/:id`. */
  onOpenResource?: (resourceId: string) => void
  /** Override each product section's Explore link label (e.g. a consistent
   *  "View All"). Absent ⇒ each section keeps its fixture label. */
  exploreLabelOverride?: string
} = {}) {
  const { membership } = useAccount()
  // The rebrand shell (embedded) shows the member What's New to everyone —
  // non-members get the same content, with per-item upsell handled on click
  // later. The standalone /membership Benefits tab keeps the non-member join view.
  if (embedded) return <MemberBenefits embedded onOpenResource={onOpenResource} exploreLabelOverride={exploreLabelOverride} />
  return membership === 'member' ? (
    <MemberBenefits embedded={embedded} onOpenResource={onOpenResource} exploreLabelOverride={exploreLabelOverride} />
  ) : (
    <NonMemberBenefits />
  )
}

function MemberBenefits({
  embedded,
  onOpenResource,
  exploreLabelOverride,
}: {
  embedded: boolean
  onOpenResource?: (resourceId: string) => void
  exploreLabelOverride?: string
}) {
  const { brand } = useAccount()
  // `ExploreMembershipProducts` renders ONLY these five Elite What's New rows
  // (via `only=[…]`). A brand with none of them (CRE's rows are the different
  // AI-MasterTracks / Learning-Snacks / Certifications set, surfaced on the
  // Membership section — not here) would render an empty chrome + void, so show
  // a friendly "coming soon" instead. Checking the specific ids (not just
  // `.length`) keeps this correct as other brands gain unrelated rows.
  const WHATS_NEW_ROW_IDS = [
    'podcasts',
    'exam-specialties',
    'transitions',
    'career-tools',
    'learning-library',
  ]
  const hasContent = benefitRowsFor(brand).some((r) => WHATS_NEW_ROW_IDS.includes(r.id))
  if (!hasContent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <EmptyState
          icon={<Megaphone size={24} aria-hidden />}
          title="New benefits are on the way"
          description="We're still curating what's new for your membership. Check back soon to see the latest courses, podcasts, and tools added between renewals."
        />
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Dropped when embedded in the rebrand shell — its "Explore Membership"
          hero already carries the framing copy. */}
      {!embedded && (
        <p style={introStyle}>
          Everything your Passport unlocks — pick a benefit and jump straight in.
        </p>
      )}
      {/* Rebrand only: the Passport upsell band directly under the section hero
          (Figma 323:279) — the inset `card` treatment matching the dashboard
          overview — then the sticky quick-filter / section-jump bar (Figma 322:19). */}
      {/* Current Membership + Membership Scorecard (Concept C) — behind the
          `membership-sections` flag, which returns null when off. */}
      {embedded && <MembershipSections />}
      {embedded && <WhatsNewUpsellBand variant="card" />}
      {embedded && <WhatsNewQuickFilter />}
      {/* Real products as clickable cards per section. */}
      <ExploreMembershipProducts onOpenResource={onOpenResource} exploreLabelOverride={exploreLabelOverride} />
      {/* The rebrand Explore Membership drops the upgrade nudge (the plan banner
          + Manage Plan CTA above already own the membership-status messaging);
          the standalone /membership Benefits tab keeps it. */}
      {!embedded && <MembershipUpgradeNudge />}
    </div>
  )
}

function NonMemberBenefits() {
  // Optional plans layout: `comparison` (default — Passport vs. Passport Lite,
  // the Elite-native model) or the generic 3-up `strip`.
  const planLayout = useFeatureFlag('benefits-plans-layout').variant ?? 'comparison'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <BenefitsMarketingLead />
      <BenefitHeroSections variant="marketing" />
      {planLayout === 'strip' ? (
        // PlanTierStrip has no id of its own — wrap it so the "Become a
        // member" #plans anchor still has a scroll target.
        <div id="plans">
          <PlanTierStrip />
        </div>
      ) : (
        // PassportPlanComparison already exposes `id="plans"` via its <Block>.
        <PassportPlanComparison />
      )}
      <FinalJoinCta />
    </div>
  )
}

/** Trimmed, Elite-appropriate marketing lead-in (mirrors MembershipUpsellHero's
 *  gradient band, with benefit-framed copy). The "Become a member" CTA anchors
 *  to the in-page plan comparison. */
function BenefitsMarketingLead() {
  return (
    <section aria-label="Membership benefits overview" style={leadBandStyle}>
      <span style={leadEyebrowStyle}>Elite Passport</span>
      <h3 style={leadHeadingStyle}>Everything your nursing career needs — in one membership.</h3>
      <p style={leadSubStyle}>
        Unlimited CE, certification exam prep, accredited CE podcasts, and AI
        career tools — built by nurses, for nurses. Explore what's included,
        then pick the plan that fits.
      </p>
      <a href="#plans" style={leadCtaStyle}>
        Become a member
        <ArrowRight size={15} aria-hidden />
      </a>
    </section>
  )
}

/** Final conversion CTA below the plans. */
function FinalJoinCta() {
  return (
    <div style={finalWrapStyle}>
      <Link to="/membership/plans" style={finalCtaStyle}>
        Become a member
        <ArrowRight size={16} aria-hidden />
      </Link>
    </div>
  )
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

const introStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-body-sm)',
  lineHeight: 'var(--text-body-sm--line-height)',
  color: 'var(--color-text-secondary)',
}

const leadBandStyle: CSSProperties = {
  background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-800))',
  borderRadius: 'var(--radius-lg)',
  padding: '40px 40px 44px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 12,
}

const leadEyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--color-warning-500)',
}

const leadHeadingStyle: CSSProperties = {
  margin: 0,
  maxWidth: '20ch',
  fontFamily: 'var(--font-heading)',
  fontSize: 32,
  fontWeight: 700,
  lineHeight: 1.15,
  letterSpacing: '-0.01em',
  color: 'var(--color-neutral-50)',
}

const leadSubStyle: CSSProperties = {
  margin: 0,
  maxWidth: '58ch',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: 1.55,
  color: 'var(--color-primary-100)',
}

const leadCtaStyle: CSSProperties = {
  marginTop: 8,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 44,
  padding: '0 20px',
  background: 'var(--color-warning-500)',
  color: 'var(--color-neutral-900)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 700,
  textDecoration: 'none',
}

const finalWrapStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  paddingTop: 8,
}

const finalCtaStyle: CSSProperties = {
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
