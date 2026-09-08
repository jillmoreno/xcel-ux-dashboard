import type { CSSProperties } from 'react'
import { useAccount } from '@/context/AccountContext'
import { BenefitSections } from './v4/BenefitSections'

/**
 * Member "What's New" product layout (Dashboard Rebrand learner-focused shell,
 * behind the `explore-membership-layout = product-cards` flag). Redesigned to
 * Figma `322:2` — five full-width sections under the section hero, each a
 * compact header (eyebrow + tier chips + title + a trailing "view all" link,
 * `headerStyle="compact"`) over one row of cards:
 *
 *   1. CE Podcasts        → teal podcast tiles (`podcast`)
 *   2. Exam & Cert Prep   → navy gradient tile cards (`tile`, `exam-specialties`)
 *   3. Transitions        → teal gradient tile cards (`tile`, `transitions`)
 *   4. AI Career Tools    → the three Rubi tool cards (`launch`)
 *   5. Resource Library   → image-header detail cards (`library-detail`)
 *
 * Access resolves from the account tier (Passport ⇒ `full`, Passport Lite ⇒
 * `lite` so Passport-only cards show the gated "Unlock with Passport"
 * treatment). This only renders for a member. Elite-only data
 * (`benefitRowsFor` returns `[]` otherwise, so each section self-hides). The
 * page hero `<h1>` is owned by the rebrand's `MembershipSectionHero`; these are
 * the `<h2>` sections below it. The Exam/Transitions data + the podcast/library
 * card styles are rebrand-scoped (`scope: 'rebrand'` rows), so the older
 * Explore-Dashboard membership pages (V4/V5/V7) are unaffected.
 */
export function ExploreMembershipProducts({
  onOpenResource,
  exploreLabelOverride,
}: {
  /** Passed by the Dashboard Rebrand shell so the Resource Library cards open
   *  the Learning Resources Viewer in-shell instead of navigating to
   *  `/resources/:id`. Absent on the standalone `/membership` Benefits tab. */
  onOpenResource?: (resourceId: string) => void
  /** Override every section's Explore link label (e.g. a consistent "View All").
   *  Absent ⇒ each section keeps its fixture label. */
  exploreLabelOverride?: string
} = {}) {
  const { access: acctAccess } = useAccount()
  const access = acctAccess === 'full' ? 'full' : 'lite'
  return (
    <div style={listStyle}>
      {/* 1. CE Podcasts — teal podcast tiles. */}
      <BenefitSections
        only={['podcasts']}
        exploreLabelOverride={exploreLabelOverride}
        access={access}
        cardStyle="podcast"
        maxItems={3}
        headerMode="always"
        headerStyle="compact"
        divider={false}
        noTopPadding
      />
      {/* 2. Exam & Certification Prep — navy gradient tiles. */}
      <BenefitSections
        only={['exam-specialties']}
        exploreLabelOverride={exploreLabelOverride}
        access={access}
        cardStyle="tile"
        maxItems={3}
        headerMode="always"
        headerStyle="compact"
        divider={false}
        noTopPadding
      />
      {/* 3. Transitions in Practice — teal gradient tiles. */}
      <BenefitSections
        only={['transitions']}
        exploreLabelOverride={exploreLabelOverride}
        access={access}
        cardStyle="tile"
        maxItems={3}
        headerMode="always"
        headerStyle="compact"
        divider={false}
        noTopPadding
      />
      {/* 4. AI Career Tools — three Rubi tool cards. The per-card tier chips are
          replaced by a single "Membership Exclusive" tag beside the heading. */}
      <BenefitSections
        only={['career-tools']}
        exploreLabelOverride={exploreLabelOverride}
        access={access}
        cardStyle="launch"
        maxItems={3}
        headerMode="always"
        headerStyle="compact"
        divider={false}
        noTopPadding
        membershipExclusive
      />
      {/* 5. Resource Library — image-header detail cards. Cards open the
          Learning Resources Viewer (in-shell in the rebrand via
          `onOpenResource`, else the standalone `/resources/:id` route). */}
      <BenefitSections
        only={['learning-library']}
        exploreLabelOverride={exploreLabelOverride}
        access={access}
        cardStyle="library-detail"
        maxItems={3}
        headerMode="always"
        headerStyle="compact"
        divider={false}
        noTopPadding
        onOpenResource={onOpenResource}
      />
    </div>
  )
}

// Each section band carries its own 44px bottom padding (`noTopPadding`), so a
// small column gap is enough to set the inter-section rhythm.
const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}
