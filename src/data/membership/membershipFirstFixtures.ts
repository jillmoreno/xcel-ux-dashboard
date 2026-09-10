import type { Brand } from '@/context/AccountContext'
import type { IndividualCourse } from '@/data/catalog/types'

/**
 * Fixtures for the Membership v4 ("Membership-First — Sections") page.
 *
 * This version reframes the membership surface around **discoverability of
 * new benefits** (the PRD's primary job — "Dashboard Discoverability:
 * Membership First") rather than progress. The data here is organized to
 * make that reframe possible:
 *
 *   - `justLaunchedFor`   → the "Just launched for members" spine (NEW
 *                           tags, spans content types, not just CE).
 *   - `benefitRowsFor`    → named horizontal benefit rows across every
 *                           content type (library, podcasts, exam prep,
 *                           career tools), each deep-linkable.
 *   - `progressSnapshotFor`→ the compact, secondary progress snapshot
 *                           (CE + skills + certs) surfaced as an
 *                           opt-in link, never the headline.
 *   - `additionalBenefitsFor` → the "explore everything else" band
 *                           (partner offers, discounts, community).
 *
 * Elite-scoped for this pass (matches the v2/v3 brand gate); other brands
 * return empty and fall back to v1.
 *
 * TODO(data): replace each selector with the benefit-aggregation endpoint
 * once the Membership service publishes one. Shapes stay additive.
 */

/** Content type a benefit/item represents — lets the UI tag items by kind
 *  so the page reads as "more than courses" (a core PRD requirement). */
export type MembershipContentType =
  | 'course'
  | 'podcast'
  | 'tool'
  | 'bundle'
  | 'certificate'
  | 'video'
  | 'partner'

/** Icon keys resolved to `@/icons` components in the component layer — the
 *  data layer stays free of React imports. */
export type MembershipFirstIconKey =
  | 'video'
  | 'podcast'
  | 'award'
  | 'robot'
  | 'briefcase'
  | 'book-open'
  | 'books'
  | 'file-lines'
  | 'flag'
  | 'graduation-cap'
  | 'heart'
  | 'heart-pulse'
  | 'users'
  | 'gem'

/** Which membership tier unlocks an item — drives the Passport / Lite
 *  tags and the gated "Unlock with Passport" treatment. */
export type MembershipFirstTier = 'passport' | 'lite' | 'both'

/* ─── "Just launched for members" — the discoverability spine ─────────── */

export type JustLaunchedItem = {
  id: string
  /** Short kicker shown above the title, e.g. "New AI tool". */
  kicker: string
  title: string
  /** 1 sentence, benefit framing. */
  blurb: string
  contentType: MembershipContentType
  /** Human label for the content-type chip ("Podcast", "AI tool"…). */
  contentLabel: string
  iconKey: MembershipFirstIconKey
  tier: MembershipFirstTier
  /** Accent tone for the card — teal (default), cta (Rubi AI), gold. */
  accent: 'teal' | 'cta' | 'gold'
  /** Primary action label, e.g. "Listen now", "Start a session". */
  ctaLabel: string
  href: string
  /** Optional real cover-art image URL. When present the card media renders
   *  the photo; on load error it falls back to the designed cover. */
  image?: string
  /** Optional short uppercase label shown on the designed cover (e.g. a
   *  format or specialty string). Ignored when `image` is set. */
  coverLabel?: string
}

const JUST_LAUNCHED_BY_BRAND: Record<Brand, JustLaunchedItem[]> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: [],
}

export function justLaunchedFor(brand: Brand): JustLaunchedItem[] {
  return JUST_LAUNCHED_BY_BRAND[brand]
}

/* ─── Named benefit rows — across content types, deep-linkable ────────── */

/** Header tier chip for the rebrand What's New compact header. */
export type BenefitTierChip = 'open' | 'lite' | 'passport'

export type BenefitRowItem = {
  id: string
  title: string
  /** Meta line, e.g. "5 CE hrs · Critical Care" or "3 episodes". */
  meta: string
  /** CE-podcast card (rebrand What's New `podcast` cardStyle): the episode +
   *  duration line, e.g. "Ep. 42 · 1 hr". */
  episodeMeta?: string
  /** CE-podcast card credit chips, divider-separated, e.g.
   *  `['Mandatory', '1 Hour', 'NC']`. */
  creditChips?: string[]
  /** Optional short feature bullets — rendered as a small dotted list under
   *  the meta line on the rebrand's catalog-style cards (AI Career Tools).
   *  Keep each to ~3-5 words. */
  bullets?: string[]
  iconKey: MembershipFirstIconKey
  contentType: MembershipContentType
  tier: MembershipFirstTier
  isNew?: boolean
  /** Marks the item as a full-Passport upsell — the rebrand's catalog-style
   *  cards swap its "Included with Passport Lite" footer for an "Unlock with
   *  Passport" CTA chip. */
  upsell?: boolean
  /** Display-only override for the rebrand exam-prep `TileCard`'s footer tier
   *  chips, left→right (e.g. `['lite', 'passport']` shows Passport Lite then
   *  Passport). Absent ⇒ a single "Passport" chip. Does NOT affect gating /
   *  the shared `tier` field (so the standalone V4/V5 cards are unchanged). */
  tierTags?: ('lite' | 'passport')[]
  href: string
  /** Bridge to the Course Catalog card + sheet: when set, the rebrand's
   *  `catalog` cardStyle renders the real `IndividualCourseCard` (which opens the
   *  catalog CourseSheet on click) from this course instead of the lo-fi tile.
   *  Authored inline so the shelf keeps its curated titles without polluting the
   *  Course Catalog fixtures. */
  catalogCourse?: IndividualCourse
}

export type BenefitRow = {
  id: string
  /** Uppercase eyebrow, e.g. "GET CERTIFIED". */
  eyebrow: string
  title: string
  /** 1-line value prop for the whole section. */
  blurb: string
  /** Optional subtext shown under the title in the COMPACT header (the member
   *  "Included with Your Membership" shelves). Compact normally drops the blurb;
   *  a row that sets `subtext` renders this line beneath its title. */
  subtext?: string
  /** Trailing link label, e.g. "Explore tools" / "View all". */
  exploreLabel: string
  exploreHref: string
  /** Card tone for the row's icon medallions. */
  accent: 'teal' | 'cta' | 'gold'
  /** true → render as the immersive podcast row ("Earn CE while you
   *  listen") instead of the standard card row. */
  podcast?: boolean
  /** Rebrand What's New compact-header tier chips, left→right (e.g.
   *  `['passport', 'lite']`). Absent ⇒ no chips. `open` = "Open to all". */
  tierChips?: BenefitTierChip[]
  /** Optional band-gradient override for the `tile` cards (else derived from
   *  `accent` via `coverGradient`). The rebrand Exam & Cert Prep tiles pass a
   *  navy gradient to read distinct from the teal Transitions tiles. */
  tileGradient?: string
  /** Rebrand-scoped row: excluded from the standalone "all rows" render (V4),
   *  surfaced only when explicitly requested via `only`. Keeps the new What's
   *  New sections off the older Explore-Dashboard membership pages. */
  scope?: 'rebrand'
  items: BenefitRowItem[]
}

/**
 * XCEL Solutions (insurance licensing).
 *
 * ⚠ THIS IS THE ONE `src/data/membership/` MAP XCEL FILLS IN, and its 21
 * neighbours are all empty for this brand. That is not an oversight: despite
 * living under `membership/`, `benefitRowsFor` is NOT membership content — it
 * feeds the Explore-group RAIL SECTIONS (Exam & Cert Prep, AI Career Tools),
 * which XCEL keeps. STC populates it for exactly the same reason. Do not
 * "tidy" this to `[]` to match the rest of the file.
 *
 * ⚠ ROW IDs ARE LOAD-BEARING. `MembershipV7`'s `SectionContent` selects rows by
 * id — `only={['exam-prep']}` / `only={['career-tools']}` — and there is no
 * fallback when the filter matches nothing (`BenefitSections`, `only` branch).
 * A row named `xcel-exam-prep` would render an EMPTY section, so these must
 * stay `exam-prep` and `career-tools` verbatim.
 */
const XCEL_BENEFIT_ROWS: BenefitRow[] = [
  {
    id: 'exam-prep',
    eyebrow: 'Pass the first time',
    title: 'Exam & Cert Prep',
    blurb: "The 3-Part Training Program — pre-license education, prep review, then the exam simulators.",
    subtext:
      'Build the foundation, review what the exam actually tests, then prove you are ready on three weighted simulators before you sit.',
    exploreLabel: 'Browse exam prep',
    exploreHref: '/catalog',
    accent: 'cta',
    tileGradient: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-800))',
    scope: 'rebrand',
    items: [
      {
        id: 'xcel-prelicense',
        title: 'Pre-License Education',
        meta: 'Part 1 · meets the state requirement',
        iconKey: 'graduation-cap',
        contentType: 'course',
        tier: 'both',
        tierTags: [],
        href: '/catalog?q=pre-licensing',
      },
      {
        id: 'xcel-prep-review',
        title: 'Prep Review Course',
        meta: 'Part 2 · unlocked by Part 1',
        iconKey: 'book-open',
        contentType: 'course',
        tier: 'both',
        tierTags: [],
        href: '/catalog?q=prep-review',
      },
      {
        id: 'xcel-simulators',
        title: 'Exam Simulators',
        meta: 'Part 3 · three, weighted to your state exam',
        iconKey: 'award',
        contentType: 'course',
        tier: 'both',
        tierTags: [],
        href: '/catalog?q=exam-simulator',
      },
      {
        id: 'xcel-livestream',
        title: 'Livestream Exam Review',
        meta: 'Weekly · 1–2 days by line of authority',
        iconKey: 'file-lines',
        contentType: 'course',
        tier: 'both',
        tierTags: [],
        href: '/catalog?q=livestream-review',
      },
    ],
  },
  {
    id: 'career-tools',
    eyebrow: 'Study with an AI partner',
    // Matches XCEL's rail label (`careerToolsLabelFor` in PlatformSideNav),
    // which became "Rubi AI Tools" on 2026-09-10. Rubi is still an exam study
    // aid here rather than the career/CV tool it is on Elite — that is what the
    // blurb below says; only the name changed.
    title: 'Rubi AI Tools',
    blurb: 'Rubi™ — instant explanations, worked examples, and practice questions on demand.',
    subtext:
      "Ask Rubi anything from your course. It explains step by step, generates fresh practice questions, and answers in your language — built on XCEL's own curriculum, so what it tells you matches what you are studying.",
    exploreLabel: 'Meet Rubi',
    exploreHref: '/catalog?q=rubi',
    accent: 'cta',
    scope: 'rebrand',
    items: [
      {
        id: 'xcel-rubi-explain',
        title: 'Instant Explanations',
        meta: 'Step-by-step worked examples',
        bullets: [
          'Ask about anything in your course',
          'Worked step by step, not just answered',
          'Grounded in the XCEL curriculum',
        ],
        iconKey: 'robot',
        contentType: 'tool',
        tier: 'both',
        tierTags: [],
        href: '/catalog?q=rubi',
      },
      {
        id: 'xcel-rubi-practice',
        title: 'Practice on Demand',
        meta: 'New questions whenever you want them',
        bullets: [
          'Fresh questions generated on request',
          'Targeted at the topic you just studied',
          'Unlimited — practise until it sticks',
        ],
        iconKey: 'file-lines',
        contentType: 'tool',
        tier: 'both',
        tierTags: [],
        href: '/catalog?q=rubi-practice',
      },
      {
        id: 'xcel-rubi-languages',
        title: 'Multi-Language Support',
        meta: 'Study in the language you think in',
        bullets: [
          'Ask and get answers in your language',
          'The same curriculum, not a summary',
          'Available across every course',
        ],
        iconKey: 'flag',
        contentType: 'tool',
        tier: 'both',
        tierTags: [],
        href: '/catalog?q=rubi-languages',
      },
    ],
  },
]

const BENEFIT_ROWS_BY_BRAND: Record<Brand, BenefitRow[]> = {
  xcel: XCEL_BENEFIT_ROWS,
}

export function benefitRowsFor(brand: Brand): BenefitRow[] {
  return BENEFIT_ROWS_BY_BRAND[brand]
}

/* ─── Compact progress snapshot — secondary, opt-in (never the headline) ─ */

export type ProgressSnapshotStat = {
  label: string
  value: string
  meta: string
}

export type ProgressSnapshot = {
  /** Stats span content types, not just CE (skills + certs too). */
  stats: ProgressSnapshotStat[]
  /** Link to the full progress dashboard. */
  href: string
}

const PROGRESS_SNAPSHOT_BY_BRAND: Record<Brand, ProgressSnapshot | null> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: null,
}

export function progressSnapshotFor(brand: Brand): ProgressSnapshot | null {
  return PROGRESS_SNAPSHOT_BY_BRAND[brand]
}

/* ─── "Explore everything else" band ──────────────────────────────────── */

export type AdditionalBenefit = {
  id: string
  title: string
  blurb: string
  iconKey: MembershipFirstIconKey
  href: string
}

const ADDITIONAL_BENEFITS_BY_BRAND: Record<Brand, AdditionalBenefit[]> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: [],
}

export function additionalBenefitsFor(brand: Brand): AdditionalBenefit[] {
  return ADDITIONAL_BENEFITS_BY_BRAND[brand]
}
