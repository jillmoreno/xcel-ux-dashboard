// Shared catalog fixture types. One CatalogBundle per brand lives in
// ./cre.ts / ./elite.ts / ./stc.ts; the selector in ./index.ts picks one.

import type { MembershipTier } from '@/context/AccountContext'

/** Member tier keys (excludes non-member) — 'low' | 'mid' | 'high'. */
export type MemberTierKey = Exclude<MembershipTier, 'non-member'>

/**
 * Per-product membership entitlement. Drives the tier-aware commerce state
 * resolved by `resolveCommerceState` (src/data/commerce/entitlement.ts): which
 * tier gets it at $0, and whether a non-member can buy it à la carte at all.
 *
 * Both fields are OPTIONAL and backward-compatible:
 *  - `includedFromTier` omitted  → included from the brand's LOWEST member tier
 *    (i.e. included for any member — preserves the pre-tier behavior).
 *  - `memberExclusive` omitted   → false (non-members can buy it at `price`).
 */
export type ProductEntitlement = {
  /** Lowest member tier that includes this product at $0. Set to `'high'` for
   *  Passport-only items (a Lite member still pays). */
  includedFromTier?: MemberTierKey
  /** True → not purchasable à la carte; only obtainable via membership. A
   *  non-member sees a locked "Member Exclusive" state instead of a price. */
  memberExclusive?: boolean
}

export type Membership = {
  id: string
  title: string
  hours: number
  states: string[]
  price: number
  /** Optional discounted member price. When the active account is a member
   *  and `memberPrice` is undefined, the item is treated as "Included with
   *  membership"; when defined, both prices render side by side. */
  memberPrice?: number
  /** Tier-aware membership entitlement. Omit → included for any member. */
  entitlement?: ProductEntitlement
  /** Short one-line "what this is" blurb (~1-2 sentences). Surfaced on the
   *  image-forward Recommended "What's Trending" card. Optional — unset ⇒ the
   *  card synthesizes a generic line from the product's type + hours. */
  blurb?: string
  badge: 'mandatory' | 'elective'
}

export type Package = {
  id: string
  title: string
  hours: number
  states: string[]
  price: number
  memberPrice?: number
  /** Tier-aware membership entitlement. Omit → included for any member. */
  entitlement?: ProductEntitlement
  /** Short one-line "what this is" blurb. See `Membership.blurb`. */
  blurb?: string
  /** Freeform tags. Powers the Recommended for You page's package shelves —
   *  e.g. `'Topic Bundle'` for Elite's "In Depth Specialty Bundles" shelf.
   *  (The "Review Packages" shelf matches on `title` instead.) */
  tags?: string[]
}

export type DeliveryMode = 'online' | 'podcast' | 'in-person' | 'webinar'

/**
 * One selectable session offering for a live (webinar / in-person) course.
 * Powers the "Switch date/time" flow of the Already-Enrolled modal — a learner
 * already enrolled in one session can move to another. Demo-only shape today
 * (real sessions come from the LMS scheduling API).
 */
export type CourseSession = {
  /** Stable id — the enrolled session is referenced by `enrolledSessionId`. */
  id: string
  /** e.g. "Monday". */
  day: string
  /** e.g. "June 8, 2026". */
  date: string
  /** e.g. "9:00 am – 4:00 pm CT". */
  time: string
  /** Optional seats-remaining hint (drives the "N seats left" line + a
   *  sold-out disabled state when 0). Omit → no seat line. */
  seatsLeft?: number
}

/**
 * One alternate modality (delivery format) the same course is offered in.
 * Powers the "Switch format" flow of the Already-Enrolled modal. Each option
 * carries its own price + entitlement so the switch can surface a real
 * commerce state (member-included vs. priced vs. member-exclusive) via
 * `resolveCommerceState` — the enrolled learner may switch to a free format
 * or hit a price / upgrade wall on another.
 */
export type CourseModalityOption = {
  /** Stable id — the enrolled modality is referenced by `enrolledModality`. */
  id: string
  delivery: DeliveryMode
  /** Human label, e.g. "Self-paced Online" / "Live Webinar" / "In-Person Classroom". */
  label: string
  /** Short one-line descriptor under the label (format, pacing, venue). */
  blurb?: string
  /** À-la-carte price for this format. Feeds `resolveCommerceState`. */
  price: number
  /** Tier-aware entitlement for this format. Omit → included for any member
   *  (a clean, free switch). Set `memberExclusive` / `includedFromTier` to
   *  demo a priced or upgrade-gated switch target. */
  entitlement?: ProductEntitlement
}

export type IndividualCourse = {
  id: string
  title: string
  hours: number
  /** Full state names (or pseudo-states like "Federal" for STC). */
  states: string[]
  delivery: DeliveryMode
  price: number
  memberPrice?: number
  /** Tier-aware membership entitlement. Omit → included for any member. */
  entitlement?: ProductEntitlement
  rating: number
  ratingCount: number
  badge: 'mandatory' | 'elective'
  /** Short one-line "what this course is" blurb. See `Membership.blurb`. */
  blurb?: string
  /** Editorial marker: this online course is delivered as a live-streamed
   *  session. The Recommended "What's Trending" card shows a video-camera icon
   *  + "Livestream" label instead of the default "Online". Unset ⇒ "Online". */
  livestream?: boolean
  imageQuery: string
  imageUrl?: string
  schedule?: string
  location?: string
  /** Which profession/discipline this course is for (e.g. "Nursing",
   *  "Occupational Therapy"). Drives the Recommended for You page's Profession
   *  filter for multi-profession learners. Optional — unset ⇒ the brand's
   *  primary profession (the first membership profession), so single-profession
   *  brands + untagged courses just read as that primary discipline. */
  profession?: string
  /** Demo-only: the learner is ALREADY enrolled in this course. When true, the
   *  CourseSheet's primary CTA opens the "You're already enrolled" modal
   *  instead of the enroll-confirmation modal. Real data comes from the
   *  learner's enrollment record. */
  enrolled?: boolean
  /** Selectable sessions for a live course (drives the date/time switch).
   *  Only meaningful alongside `enrolled`. */
  sessions?: CourseSession[]
  /** Which `sessions[].id` the learner is currently enrolled in. */
  enrolledSessionId?: string
  /** Alternate delivery formats the same course is offered in (drives the
   *  modality switch). Only meaningful alongside `enrolled`. */
  modalities?: CourseModalityOption[]
  /** Which `modalities[].id` the learner is currently enrolled in. */
  enrolledModality?: string
  /** ISO yyyy-mm-dd. Powers the dashboard's "New this week" recommended shelf
   *  (`buildShelves` in `recommendedCategoriesFixtures.ts`). Optional — only
   *  authored on recently-added catalog entries; everything else falls
   *  outside the rolling 14-day window. */
  releasedAt?: string
  /** Editorial "new" flag — powers the Recommended for You page's "What's New"
   *  shelf (`buildRecommendedShelves`). Independent of the rolling `releasedAt`
   *  window the Home band's "New this week" shelf uses, so a course can be
   *  flagged new on the page without also entering that 14-day window. */
  isNew?: boolean
  /** Freeform interest / topic tags — matched against the learner's selected
   *  interests for the Recommended for You "My Interests" shelf. Unset ⇒ the
   *  course carries no interest tags (it won't surface in My Interests). */
  tags?: string[]
  /** Secondary pharmacology contact hours (a subset of `hours`). Powers Elite's
   *  "Pharmacology Hours" recommended shelf — a course qualifies when this is
   *  set and > 0. Unset ⇒ 0 (no pharmacology hours). */
  pharmacologyHours?: number
}

export type Option = { value: string; label: string }

export type FilterLabels = {
  /** Label for the "Profession" radio filter — replaced by Discipline (Elite)
   *  or Exam (STC). */
  professionFilter: string
  /** Label for the "Credit Hours" range slider — replaced by Study Hours
   *  (STC). */
  hoursFilter: string
  /** Label for the "Credit Type" checkbox filter — replaced by ANCC /
   *  State-Mandated (Elite) or Format (STC). */
  creditTypeFilter: string
  /** The two checkbox options under `creditTypeFilter`. */
  creditTypeOptions: Option[]
  /** Whether to show the "My Licensed States" / "Additional States" rail.
   *  STC de-emphasizes state since most exams are federal. */
  showStateRail: boolean
}

/**
 * Curated multi-course bundle surfaced by the dashboard's "Featured series
 * & collections" recommended shelf and rendered in the wider `SeriesCard`
 * (16:9 hero). Series live next to `Package` in the catalog model but read
 * editorially — a Masterclass-style instructor + theme bundle rather than
 * a CE renewal pack.
 */
export type Series = {
  id: string
  title: string
  /** Short editorial line under the title in the card (max ~80 chars). */
  blurb: string
  instructor: string
  instructorTitle?: string
  courseCount: number
  totalHours: number
  /** 16:9 hero image for the card and the sheet header. */
  imageUrl: string
  /** Resolves to entries in the brand's `individualCourses` array. Missing
   *  ids are silently skipped by the `SeriesSheet`. */
  courseIds: string[]
  badge?: 'mandatory' | 'elective'
}

export type CatalogBundle = {
  heroTitle: string
  heroSubtitle: string
  professionOptions: Option[]
  licensedStates: string[]
  additionalStates: string[]
  instructors: string[]
  memberships: Membership[]
  packages: Package[]
  individualCourses: IndividualCourse[]
  /** Optional curated series. Brands without curated content simply omit
   *  this field; the dashboard's Featured Series shelf hides for that brand. */
  series?: Series[]
  totalResults: number
  /** Active membership-access states. Courses in these states are member-
   *  access (no price, just Enroll) when account.membership === 'member'.
   *  Other brands may set this to an empty set if access is account-wide. */
  memberStates: Set<string>
  /** Per-brand state name → 2-letter abbreviation. */
  stateAbbr: Record<string, string>
  filterLabels: FilterLabels
}

/** Legacy export — kept so callers that imported STATE_ABBR from
 *  catalogFixtures continue to work. The CRE map is the canonical one. */
export const STATE_ABBR: Record<string, string> = {
  Alabama: 'AL',
  Florida: 'FL',
  Georgia: 'GA',
  Illinois: 'IL',
  'North Carolina': 'NC',
  'South Carolina': 'SC',
  Tennessee: 'TN',
  Virginia: 'VA',
  // Elite states
  Texas: 'TX',
  California: 'CA',
  'New York': 'NY',
  Pennsylvania: 'PA',
  // STC pseudo-state
  Federal: 'FED',
}
