import type { CSSProperties } from 'react'
import { BenefitSections } from './v4/BenefitSections'

/**
 * Member "What's Included" category shelves — the scannable shelf layout
 * (compact header + a row of `tile` cards) used on the member Membership page
 * across brands. Renders one `BenefitSections` per id in `rows`, in order, so
 * the caller controls exactly which benefit sections appear (e.g. the ones the
 * member's tier INCLUDES, with the rest surfaced separately as upgrade bands).
 *
 * Data comes from `benefitRowsFor(brand)`; each item carries `tierTags: []` so
 * the Passport footer chips are suppressed (brands whose tiers aren't Passport),
 * and `membershipExclusive` puts a brand-neutral "Membership Exclusive" tag in
 * each section header.
 *
 * Generalized from the original CRE-only `CreMembershipShelves` so Elite /
 * Fitzgerald / STC reuse the same layout.
 */
export function MembershipBenefitShelves({ rows }: { rows: string[] }) {
  if (rows.length === 0) return null
  // Member-only surface; `full` access so nothing dims or shows an unlock chip.
  const common = {
    access: 'full',
    maxItems: 3,
    headerMode: 'always',
    headerStyle: 'compact',
    membershipExclusive: true,
    divider: false,
    noTopPadding: true,
    // Consistent "View All" on every included-benefit shelf (instead of each
    // row's per-fixture label — "Browse podcasts", "View all 7", etc.).
    exploreLabelOverride: 'View All',
  } as const

  return (
    <section aria-label="Membership benefits" style={listStyle}>
      {rows.map((id) => (
        <BenefitSections key={id} only={[id]} cardStyle={CARD_STYLE_BY_ROW[id] ?? 'tile'} {...common} />
      ))}
    </section>
  )
}

/** Per-section card treatment — most benefit rows use the colored `tile` card,
 *  but the Resource Library row uses `library-detail` (image-header cards from
 *  the real library resources) so it matches the standalone Resource Library
 *  page, and the CE Podcasts row uses `podcast` (the teal `cre-tile-header--
 *  podcast` tiles) so it matches the Course Catalog + Explore Membership podcast
 *  cards. Rows not listed fall back to `tile`. */
const CARD_STYLE_BY_ROW: Record<string, 'tile' | 'library-detail' | 'podcast' | 'catalog'> = {
  'learning-library': 'library-detail',
  podcasts: 'podcast',
  // Recommended CE Courses → the real Course Catalog card (IndividualCourseCard),
  // which opens the CourseSheet on click (each item carries a `catalogCourse`).
  'recommended-ce': 'catalog',
}

// Each band carries its own bottom padding (`noTopPadding`), so a small column
// gap sets the inter-section rhythm (matches ExploreMembershipProducts).
const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}
