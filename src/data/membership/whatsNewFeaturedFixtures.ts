import type { Brand } from '@/context/AccountContext'

/* ─── What's New — Featured Hero + "Just launched" rail (Dashboard Rebrand) ───
   Drives the flag-gated `WhatsNewFeatured` block at the top of the What's New
   section AND the Marketing Focused band's rotating What's New carousel
   (`MarketingFocusedBand`). Elite was authored first; CRE, McKissock, and STC
   were added so their Marketing Focused carousels populate instead of showing
   the reserved "Image carousel" empty state. Brands with no slides still return
   `[]` so the block/carousel self-hides.
   Visual source: `explorations/whats-new-hero/hero-plus-scroll-rail.html`.
   TODO(data): placeholder copy — confirm real featured items + meta with each
   brand's content team. CRE copy is themed from colibrirealestate.com
   (AI MasterTracks, CNE, exam prep, CE membership, Luxury Home Marketing).

   NOTE on `tier`: the Marketing Focused carousel does not render the tier pill
   today (only the never-wired `WhatsNewFeatured` hero would), so the value is
   cosmetic for CRE/McKissock/STC — 'open' marks free content, 'passport' the
   premium lines. Revisit if the featured hero is wired for these brands, since
   they use Plus/Pro/Premier (RE) or a single Member tier (STC), not Passport. */

/** Membership tier the hero slide is gated behind (drives the pill). */
export type WhatsNewTier = 'passport' | 'lite' | 'open'

/** Primary + secondary CTA labels for one audience. */
export type WhatsNewCtaPair = { primary: string; secondary: string }

export type WhatsNewFeaturedSlide = {
  id: string
  /** Eyebrow above the headline, e.g. "Featured pathway · Transitions in Practice". */
  eyebrow: string
  tier: WhatsNewTier
  title: string
  desc: string
  /** Byline shown beside the avatar. */
  byline: string
  /** CTA labels for a member vs a non-member. */
  memberCta: WhatsNewCtaPair
  nonMemberCta: WhatsNewCtaPair
}

/** Content kind → drives the rail card's cover gradient + icon. */
export type WhatsNewKind = 'pathway' | 'exam' | 'tool' | 'podcast' | 'template'

export type WhatsNewLaunchCard = {
  id: string
  /** Display label for the content-type row, e.g. "Exam prep". */
  contentType: string
  iconKey: WhatsNewKind
  title: string
  /** Meta line, e.g. "200+ items · Self-paced". */
  meta: string
  coverAccent: WhatsNewKind
}

/* ─── CRE · Colibri Real Estate ───────────────────────────────────────────
   Themed from colibrirealestate.com: Professional Development (AI MasterTracks,
   CNE), Exam Prep / Free Practice Exam, CE Membership, Luxury Home Marketing. */
const CRE_FEATURED: WhatsNewFeaturedSlide[] = [
  {
    id: 'cre-ai-mastertracks',
    eyebrow: 'New · Professional Development',
    tier: 'passport',
    title: 'AI MasterTracks for Agents',
    desc: 'Put AI to work in your business — draft listings, prep clients, and win back hours with a guided, agent-first track.',
    byline: 'Self-paced Professional Development · led by top-producing agents.',
    memberCta: { primary: 'Start the track', secondary: "See what's included" },
    nonMemberCta: { primary: 'Explore the track', secondary: 'Preview a lesson free' },
  },
  {
    id: 'cre-negotiation-expert',
    eyebrow: 'Featured certification · Negotiation',
    tier: 'passport',
    title: 'Become a Certified Negotiation Expert',
    desc: 'Master the skills to secure the best deals, close faster, and deliver unmatched value with the industry-recognized CNE designation.',
    byline: 'Earn the CNE® designation · Real Estate Negotiation Institute.',
    memberCta: { primary: 'Start CNE', secondary: 'How it works' },
    nonMemberCta: { primary: 'Get certified', secondary: 'See the curriculum' },
  },
  {
    id: 'cre-free-practice-exam',
    eyebrow: 'Exam ready · Free for everyone',
    tier: 'open',
    title: 'Free Real Estate Practice Exam',
    desc: 'Do you have what it takes? Tackle sample questions on contracts, commissions, and more — then walk into exam day with confidence.',
    byline: '10 sample questions · instant scoring.',
    memberCta: { primary: 'Take the exam', secondary: 'Browse exam prep' },
    nonMemberCta: { primary: 'Take the exam', secondary: 'Browse exam prep' },
  },
  {
    id: 'cre-ce-membership',
    eyebrow: 'Renew with confidence · Continuing Education',
    tier: 'passport',
    title: 'Unlimited CE Membership',
    desc: 'Complete required state CE with flexible courses, expert instructors, and engaging topics — all in one membership that renews with you.',
    byline: 'State-approved CE · single- and multi-state plans.',
    memberCta: { primary: 'Browse CE courses', secondary: 'Manage membership' },
    nonMemberCta: { primary: 'Explore membership', secondary: 'See plans' },
  },
]

const CRE_LAUNCHES: WhatsNewLaunchCard[] = [
  { id: 'cre-l-ai', contentType: 'Pathway', iconKey: 'pathway', title: 'AI MasterTracks for Agents', meta: 'Self-paced · Pathway', coverAccent: 'pathway' },
  { id: 'cre-l-cne', contentType: 'Certification', iconKey: 'pathway', title: 'Certified Negotiation Expert (CNE)', meta: '12 hrs · Designation', coverAccent: 'pathway' },
  { id: 'cre-l-cpme', contentType: 'Certification', iconKey: 'pathway', title: 'Certified Property Management Expert', meta: 'Self-paced · Designation', coverAccent: 'exam' },
  { id: 'cre-l-exam', contentType: 'Exam prep', iconKey: 'exam', title: 'Free Real Estate Practice Exam', meta: '10 questions · Free', coverAccent: 'exam' },
  { id: 'cre-l-ethics', contentType: 'Podcast', iconKey: 'podcast', title: 'Ethics on the Go: Quick Cases', meta: '6 episodes · CE credit', coverAccent: 'podcast' },
  { id: 'cre-l-luxury', contentType: 'Pathway', iconKey: 'pathway', title: 'Institute for Luxury Home Marketing', meta: 'Self-paced · Specialization', coverAccent: 'pathway' },
  { id: 'cre-l-listing', contentType: 'Podcast', iconKey: 'podcast', title: 'Listing Strategy in a Cooling Market', meta: '1 hr · Podcast', coverAccent: 'podcast' },
]

/* ─── McKissock · Real Estate / Appraisal ─────────────────────────────────
   Appraisal CE + professional development themes. */
const MCKISSOCK_FEATURED: WhatsNewFeaturedSlide[] = [
  {
    id: 'mck-uspap',
    eyebrow: 'Required · 2026–2027 cycle',
    tier: 'passport',
    title: '2026–2027 USPAP Update Course',
    desc: 'Stay compliant with the latest Uniform Standards of Professional Appraisal Practice — the update every appraiser needs this cycle.',
    byline: '7 hrs · AQB-approved · led by certified instructors.',
    memberCta: { primary: 'Start the update', secondary: "See what's covered" },
    nonMemberCta: { primary: 'Enroll now', secondary: 'See the curriculum' },
  },
  {
    id: 'mck-pro-membership',
    eyebrow: 'Best value · Unlimited CE',
    tier: 'passport',
    title: 'The Appraiser CE Membership',
    desc: 'One membership, unlimited continuing education — knock out your required hours with hundreds of courses from industry experts.',
    byline: 'Unlimited courses · single- and multi-state coverage.',
    memberCta: { primary: 'Browse CE', secondary: 'Manage membership' },
    nonMemberCta: { primary: 'Explore membership', secondary: 'See plans' },
  },
  {
    id: 'mck-residential-market',
    eyebrow: 'New appraisal CE',
    tier: 'lite',
    title: 'Residential Market Analysis & Highest and Best Use',
    desc: 'Sharpen the analysis behind every credible report — market conditions, adjustments, and defensible highest-and-best-use conclusions.',
    byline: '7 hrs · elective CE.',
    memberCta: { primary: 'Start the course', secondary: 'Preview a lesson' },
    nonMemberCta: { primary: 'Enroll now', secondary: 'Preview a lesson' },
  },
  {
    id: 'mck-green-building',
    eyebrow: 'Trending topic',
    tier: 'lite',
    title: 'Appraising Green & High-Performance Homes',
    desc: 'Value solar, efficiency upgrades, and green features with confidence as buyers and lenders increasingly ask for them.',
    byline: '4 hrs · elective CE.',
    memberCta: { primary: 'Start the course', secondary: 'See details' },
    nonMemberCta: { primary: 'Enroll now', secondary: 'See details' },
  },
]

const MCKISSOCK_LAUNCHES: WhatsNewLaunchCard[] = [
  { id: 'mck-l-uspap', contentType: 'Required CE', iconKey: 'pathway', title: '2026–2027 USPAP Update', meta: '7 hrs · AQB-approved', coverAccent: 'pathway' },
  { id: 'mck-l-market', contentType: 'Appraisal CE', iconKey: 'exam', title: 'Residential Market Analysis', meta: '7 hrs · Elective', coverAccent: 'exam' },
  { id: 'mck-l-green', contentType: 'Appraisal CE', iconKey: 'pathway', title: 'Appraising Green Homes', meta: '4 hrs · Elective', coverAccent: 'pathway' },
  { id: 'mck-l-manufactured', contentType: 'Appraisal CE', iconKey: 'exam', title: 'Appraising Manufactured Homes', meta: '4 hrs · Elective', coverAccent: 'exam' },
  { id: 'mck-l-ethics', contentType: 'Podcast', iconKey: 'podcast', title: 'Business Practices & Ethics', meta: '6 episodes · CE credit', coverAccent: 'podcast' },
  { id: 'mck-l-templates', contentType: 'Template', iconKey: 'template', title: 'Adjustment Support Toolkit', meta: 'Download · 4 templates', coverAccent: 'template' },
  { id: 'mck-l-land', contentType: 'Appraisal CE', iconKey: 'exam', title: 'Land & Site Valuation', meta: '7 hrs · Elective', coverAccent: 'exam' },
]

/* ─── STC · Securities Training (Financial Services) ───────────────────────
   Securities & insurance licensing exam prep themes. */
const STC_FEATURED: WhatsNewFeaturedSlide[] = [
  {
    id: 'stc-sie',
    eyebrow: 'New · Exam prep',
    tier: 'passport',
    title: 'SIE Exam Prep, Reimagined',
    desc: 'Your first step into the securities industry — a refreshed SIE course with adaptive practice and a readiness score that updates as you go.',
    byline: 'Adaptive practice · Greenlight pass guarantee.',
    memberCta: { primary: 'Start SIE prep', secondary: "See what's covered" },
    nonMemberCta: { primary: 'Start SIE prep', secondary: 'Preview a set free' },
  },
  {
    id: 'stc-series-7',
    eyebrow: 'Top exam prep · Series 7',
    tier: 'passport',
    title: 'Series 7 Top-Off Course',
    desc: 'Pass the General Securities Representative exam with the prep top firms trust — video, practice exams, and final-review sessions.',
    byline: '700+ practice questions · live final review.',
    memberCta: { primary: 'Start Series 7', secondary: 'See the curriculum' },
    nonMemberCta: { primary: 'Explore Series 7', secondary: 'Preview a set free' },
  },
  {
    id: 'stc-greenlight',
    eyebrow: 'Pass with confidence',
    tier: 'open',
    title: 'The Greenlight Readiness Check',
    desc: 'Score high on our final practice exam and get the Greenlight — the signal that thousands of candidates trust before exam day.',
    byline: 'Included with every exam prep course.',
    memberCta: { primary: 'Take a practice exam', secondary: 'How it works' },
    nonMemberCta: { primary: 'Take a practice exam', secondary: 'How it works' },
  },
  {
    id: 'stc-series-63',
    eyebrow: 'New · State licensing',
    tier: 'lite',
    title: 'Series 63 Crash Course',
    desc: 'The Uniform Securities Agent State Law exam, distilled — focused review, targeted practice, and the rules you actually get tested on.',
    byline: 'Focused review · rapid practice sets.',
    memberCta: { primary: 'Start Series 63', secondary: 'See details' },
    nonMemberCta: { primary: 'Explore Series 63', secondary: 'See details' },
  },
]

const STC_LAUNCHES: WhatsNewLaunchCard[] = [
  { id: 'stc-l-sie', contentType: 'Exam prep', iconKey: 'exam', title: 'SIE Exam Prep', meta: '300+ items · Self-paced', coverAccent: 'exam' },
  { id: 'stc-l-s7', contentType: 'Exam prep', iconKey: 'exam', title: 'Series 7 Top-Off', meta: '700+ items · Self-paced', coverAccent: 'exam' },
  { id: 'stc-l-s63', contentType: 'Exam prep', iconKey: 'exam', title: 'Series 63 Crash Course', meta: '150+ items · Self-paced', coverAccent: 'exam' },
  { id: 'stc-l-s66', contentType: 'Exam prep', iconKey: 'exam', title: 'Series 66 Prep', meta: '200+ items · Self-paced', coverAccent: 'exam' },
  { id: 'stc-l-s24', contentType: 'Exam prep', iconKey: 'pathway', title: 'Series 24 Principal Prep', meta: 'Self-paced · Pathway', coverAccent: 'pathway' },
  { id: 'stc-l-podcast', contentType: 'Podcast', iconKey: 'podcast', title: 'Pass the Exam: Study Sessions', meta: '8 episodes · 30 min ea', coverAccent: 'podcast' },
  { id: 'stc-l-insurance', contentType: 'Exam prep', iconKey: 'exam', title: 'Life & Health Insurance Licensing', meta: 'Self-paced · Exam prep', coverAccent: 'exam' },
]

const FEATURED_BY_BRAND: Record<Brand, WhatsNewFeaturedSlide[]> = {
  // TODO(data): no XCEL marketing slides authored yet — the carousel falls back
  // to its reserved dashed empty state rather than showing another brand's copy.
  xcel: [],
}

const LAUNCHES_BY_BRAND: Record<Brand, WhatsNewLaunchCard[]> = {
  // TODO(data): see FEATURED_BY_BRAND above.
  xcel: [],
}

export function whatsNewFeaturedFor(brand: Brand): WhatsNewFeaturedSlide[] {
  return FEATURED_BY_BRAND[brand]
}

export function whatsNewLaunchesFor(brand: Brand): WhatsNewLaunchCard[] {
  return LAUNCHES_BY_BRAND[brand]
}
