import type { Brand } from '@/context/AccountContext'
import { createImagePicker } from '@/utils/topicImage'

// Topic-relevant cover photos for the CRE library (same Unsplash-licensed
// pool + picker the CRE catalog / course cards use, so the library covers
// match the rest of the CRE surfaces). One picker per module load dedupes the
// photos across the CRE set; each resource passes a `imageQuery` topic below.
// Other brands: Elite ships local `/library/*.png` artwork; McKissock / STC
// keep their designed `heroBackground` + `heroLabel` covers (TODO(data): give
// them a photo pool too if desired).
const pickCreImage = createImagePicker()

/**
 * Member Learning Library content — surfaced inside the
 * `/membership?tab=library` panel.
 *
 * Per-brand fixture: each brand carries its own resource catalog
 * tuned to that profession's content shelves. Resources route to the
 * existing `/resources/:id` detail page; the detail fixture stays at
 * `src/data/resourceFixtures.ts` (single canonical record for now)
 * because the detail page isn't the focus of this build. When the
 * detail page goes per-brand, we'll join on `id` between the two
 * fixture files.
 *
 * TODO(data): swap for an `/api/library?brand=…` endpoint once the
 * content service publishes a real library index. Shape stays
 * additive so adding fields here won't break consumers.
 */

/**
 * Canonical asset format set. Drives the Content Type filter
 * checkbox list in `<LibraryFilterRail>`. The original union
 * (infographic | video | guide | qa) was expanded to match the
 * screenshot's 6-option filter — existing `guide` rows map to
 * `article` (short read) or `e-book` (longer read) by duration, and
 * `qa` rows map to `webinar-recording`.
 */
export type LibraryResourceType =
  | 'article'
  | 'e-book'
  | 'infographic'
  | 'template'
  | 'video'
  | 'webinar-recording'

/** Engagement status — drives the Status filter ("Viewed" / "Not
 *  Viewed"). Will be sourced from the engagement service once the
 *  per-user library-history endpoint ships; today it's a static
 *  fixture flag so reviewers can see the filter behavior. */
export type LibraryViewedStatus = boolean

/** Top-level Category — drives the Category pill row above the
 *  grid. Distinct from `LibraryResourceType`, which is the asset
 *  format. */
export type LibraryCategory =
  | 'career-tips'
  | 'clinical-skills'
  | 'diagnosis'
  | 'medical-reference'
  | 'qa-sessions'
  | 'practice-management'
  | 'contracts-closings'
  | 'mls-listings'
  | 'compliance'
  | 'appraisal-methods'
  | 'risk-management'
  | 'securities-licensing'
  | 'insurance-licensing'

export type LibraryResource = {
  id: string
  title: string
  /** Short description shown below the title, 2-3 line clamp. */
  description: string
  type: LibraryResourceType
  category: LibraryCategory
  /** Which profession this resource belongs to (drives the Learning Library
   *  Profession filter row when a learner has multiple professions). Optional —
   *  when unset, the resource reads as the brand's primary profession (the first
   *  membership's, e.g. Nursing for Elite). TODO(data): most Elite content is
   *  Nursing today; a spread is tagged Occupational / Physical Therapy so the
   *  demo filter shows results per profession until real content is authored. */
  profession?: string
  /** Average member rating, 0-5, one decimal place. */
  rating: number
  /** Optional content-specific tag pill ("Injections", "IV"). Shown
   *  next to the rating in the card footer. */
  tag?: string
  /** Estimated minutes to consume — drives the Content Length
   *  filter once that filter goes from placeholder to functional. */
  durationMinutes: number
  /** Hero illustration block. Color tokens drive a tinted background
   *  + a heading wordmark since we don't ship real artwork yet. */
  heroBackground: string
  heroAccent: string
  /** Big stylized text rendered over the hero block — gives each
   *  card a distinct identity in the grid without licensed art. */
  heroLabel: string
  /** Optional path to a hero image (relative to /public). When set,
   *  the card renders this image as a background-cover thumbnail
   *  instead of the `heroBackground` gradient + `heroLabel`
   *  wordmark. Used by Elite resources that ship with licensed
   *  artwork (Elite Learning skill-refresher set). Drop the file
   *  under `public/library/` and reference as `/library/<slug>.png`. */
  imageUrl?: string
  /** Optional path to a real PDF asset (relative to /public). When
   *  set, the detail page renders an embedded PDF reader instead of
   *  the variant-specific body — readers get the full browser PDF
   *  experience (zoom, page nav, download) without us shipping a
   *  bespoke viewer. Drop the file under `public/library/` and
   *  reference as `/library/<slug>.pdf`. */
  pdfUrl?: string
  /** Optional path to a non-PDF downloadable asset (DOCX, XLSX, ZIP,
   *  etc.) relative to /public. Used by Template-type resources and
   *  also wired to the title-row "Download" text-link in the shell.
   *  When both `pdfUrl` and `downloadUrl` are set, the PDF wins for
   *  the embedded reader; the title-row Download link still resolves
   *  to whichever URL is set (PDF takes precedence). */
  downloadUrl?: string
  /** Engagement state — drives the Status filter. Optional so any
   *  resource that hasn't been marked one way or the other reads as
   *  unviewed. */
  viewed?: LibraryViewedStatus
}

type LibraryConfig = {
  /** Eyebrow above the hero title — e.g. "Real Estate" or
   *  "Nursing". */
  eyebrow: string
  /** Hero band H2 — e.g. "Real Estate Skills Refresher Library". */
  title: string
  /** Hero description copy — 1-2 sentences of context. */
  description: string
  resources: LibraryResource[]
}

/** Map of category key → human label, used by the Category pill
 *  row + the result count copy. */
export const CATEGORY_LABELS: Record<LibraryCategory, string> = {
  'career-tips': 'Career Tips',
  'clinical-skills': 'Clinical Skills',
  diagnosis: 'Diagnosis',
  'medical-reference': 'Medical Reference',
  'qa-sessions': 'Q&A Sessions',
  'practice-management': 'Practice Management',
  'contracts-closings': 'Contracts & Closings',
  'mls-listings': 'MLS & Listings',
  compliance: 'Compliance',
  'appraisal-methods': 'Appraisal Methods',
  'risk-management': 'Risk Management',
  'securities-licensing': 'Securities Licensing',
  'insurance-licensing': 'Insurance Licensing',
}

export const TYPE_LABELS: Record<LibraryResourceType, string> = {
  article: 'Article',
  'e-book': 'E-book',
  infographic: 'Infographic',
  template: 'Template',
  video: 'Video',
  'webinar-recording': 'Webinar Recording',
}

/* ─── CRE (Real Estate) ────────────────────────────────────────────── */

const CRE_RESOURCES: LibraryResource[] = [
  {
    id: 'cre-closing-checklist',
    title: 'The 30-day Closing Checklist',
    description:
      'A printable checklist mapping every milestone from offer accepted to keys delivered.',
    type: 'template',
    category: 'contracts-closings',
    rating: 4.8,
    tag: 'Closings',
    durationMinutes: 6,
    heroBackground:
      'linear-gradient(135deg, var(--color-secondary-200), var(--color-secondary-400))',
    heroAccent: 'var(--color-secondary-800)',
    heroLabel: 'CLOSING CHECKLIST',
    imageUrl: pickCreImage('checklist'),
    viewed: true,
  },
  {
    id: 'cre-counter-offer-scripts',
    title: 'Counter-offer scripts that win',
    description:
      'Ten battle-tested counter-offer scripts for buyer and listing agents — with the why behind each.',
    type: 'e-book',
    category: 'career-tips',
    rating: 4.7,
    durationMinutes: 18,
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-200), var(--color-primary-500))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: 'COUNTER OFFERS',
    imageUrl: pickCreImage('contract'),
  },
  {
    id: 'cre-mls-tags',
    title: 'MLS field-by-field walkthrough',
    description:
      'A 12-minute walkthrough of every MLS field that affects search rank, with examples.',
    type: 'video',
    category: 'mls-listings',
    rating: 4.6,
    tag: 'MLS',
    durationMinutes: 12,
    heroBackground:
      'linear-gradient(135deg, var(--color-tertiary-300), var(--color-tertiary-600))',
    heroAccent: 'var(--color-text-inverse)',
    heroLabel: 'MLS LISTINGS',
    imageUrl: pickCreImage('listing'),
  },
  {
    id: 'cre-buyer-rep-do-dont',
    title: 'Buyer representation: 12 do’s and don’ts',
    description:
      'A quick reference card on the conversations that protect you and the buyer.',
    type: 'infographic',
    category: 'contracts-closings',
    rating: 4.5,
    tag: 'Buyers',
    durationMinutes: 5,
    heroBackground:
      'linear-gradient(135deg, var(--color-warning-100), var(--color-warning-500))',
    heroAccent: 'var(--color-neutral-900)',
    heroLabel: 'BUYER REP 101',
    imageUrl: pickCreImage('agency'),
  },
  {
    id: 'cre-compliance-roundup',
    title: 'Quarterly compliance round-up',
    description:
      'The 7 NAR / state-level rule changes most likely to bite agents this quarter.',
    type: 'webinar-recording',
    category: 'compliance',
    rating: 4.9,
    durationMinutes: 32,
    heroBackground:
      'linear-gradient(135deg, var(--color-info-200), var(--color-info-600))',
    heroAccent: 'var(--color-info-900)',
    heroLabel: 'COMPLIANCE Q&A',
    imageUrl: pickCreImage('ethics'),
    viewed: true,
  },
  {
    id: 'cre-listing-photos',
    title: 'Listing photos that move homes',
    description:
      "What a top broker's photographer looks for before, during, and after the shoot.",
    type: 'video',
    category: 'mls-listings',
    rating: 4.7,
    tag: 'Photos',
    durationMinutes: 15,
    heroBackground:
      'linear-gradient(135deg, var(--color-tertiary-200), var(--color-tertiary-500))',
    heroAccent: 'var(--color-tertiary-900)',
    heroLabel: 'LISTING PHOTOS',
    imageUrl: pickCreImage('house'),
  },
  {
    id: 'cre-fha-quick-ref',
    title: 'FHA loan quick-reference',
    description:
      'Eligibility rules, common pitfalls, and the documents your buyer should expect.',
    type: 'e-book',
    category: 'contracts-closings',
    rating: 4.4,
    durationMinutes: 22,
    heroBackground:
      'linear-gradient(135deg, var(--color-cta-200), var(--color-cta-500))',
    heroAccent: 'var(--color-cta-900)',
    heroLabel: 'FHA LOANS',
    imageUrl: pickCreImage('house'),
  },
  {
    id: 'cre-mentorship-paths',
    title: 'Finding (and keeping) a mentor',
    description:
      "How experienced agents structure mentorship — without it eating the senior's calendar.",
    type: 'webinar-recording',
    category: 'career-tips',
    rating: 4.6,
    durationMinutes: 28,
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-200), var(--color-primary-600))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: 'MENTORSHIP',
    imageUrl: pickCreImage('broker'),
  },
  {
    id: 'cre-listings-cma',
    title: 'Pricing with a defensible CMA',
    description:
      'A walkthrough of comparable selection, weighting, and how to talk price with a seller.',
    type: 'video',
    category: 'mls-listings',
    rating: 4.5,
    tag: 'Pricing',
    durationMinutes: 11,
    heroBackground:
      'linear-gradient(135deg, var(--color-success-100), var(--color-success-500))',
    heroAccent: 'var(--color-success-900)',
    heroLabel: 'CMA PRICING',
    imageUrl: pickCreImage('appraisal'),
  },
  {
    id: 'cre-team-vs-solo',
    title: 'Team vs. solo: making the call',
    description:
      'A side-by-side on splits, branding, leads, and lifestyle to inform the choice.',
    type: 'infographic',
    category: 'practice-management',
    rating: 4.3,
    durationMinutes: 7,
    heroBackground:
      'linear-gradient(135deg, var(--color-warning-200), var(--color-warning-600))',
    heroAccent: 'var(--color-neutral-900)',
    heroLabel: 'TEAM OR SOLO',
    imageUrl: pickCreImage('millennials'),
  },
  {
    id: 'cre-fair-housing',
    title: 'Fair housing language that holds up',
    description:
      'Phrases that look harmless but can trigger fair-housing complaints — with safer alternatives.',
    type: 'article',
    category: 'compliance',
    rating: 4.8,
    durationMinutes: 8,
    heroBackground:
      'linear-gradient(135deg, var(--color-error-100), var(--color-error-500))',
    heroAccent: 'var(--color-text-inverse)',
    heroLabel: 'FAIR HOUSING',
    imageUrl: pickCreImage('fairhousing'),
    viewed: true,
  },
  {
    id: 'cre-vacation-rentals',
    title: 'Vacation rental fundamentals',
    description:
      'Zoning, licensing, and the buyer questions that surface most often.',
    type: 'video',
    category: 'practice-management',
    rating: 4.2,
    tag: 'STR',
    durationMinutes: 14,
    heroBackground:
      'linear-gradient(135deg, var(--color-info-100), var(--color-info-500))',
    heroAccent: 'var(--color-info-900)',
    heroLabel: 'VACATION RENTALS',
    imageUrl: pickCreImage('house'),
  },
]

/* ─── McKissock (Real Estate / Appraisal) ──────────────────────────── */

const MCKISSOCK_RESOURCES: LibraryResource[] = [
  {
    id: 'mck-uspap-update',
    title: 'USPAP changes you need to know',
    description:
      'The 2026 USPAP updates broken down by record-keeping, scope of work, and competency.',
    type: 'e-book',
    category: 'appraisal-methods',
    rating: 4.9,
    tag: 'USPAP',
    durationMinutes: 24,
    viewed: true,
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-200), var(--color-primary-600))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: 'USPAP 2026',
  },
  {
    id: 'mck-sales-comparison',
    title: 'The sales comparison approach, in 10 minutes',
    description:
      'A whiteboard walkthrough of comp selection, adjustments, and reconciliation.',
    type: 'video',
    category: 'appraisal-methods',
    rating: 4.7,
    durationMinutes: 10,
    heroBackground:
      'linear-gradient(135deg, var(--color-secondary-200), var(--color-secondary-500))',
    heroAccent: 'var(--color-secondary-900)',
    heroLabel: 'SALES COMPARISON',
  },
  {
    id: 'mck-cost-approach',
    title: 'When the cost approach actually fits',
    description:
      'Use cases, common errors, and a checklist for unusual or new-construction work.',
    type: 'infographic',
    category: 'appraisal-methods',
    rating: 4.5,
    durationMinutes: 6,
    heroBackground:
      'linear-gradient(135deg, var(--color-cta-200), var(--color-cta-500))',
    heroAccent: 'var(--color-cta-900)',
    heroLabel: 'COST APPROACH',
  },
  {
    id: 'mck-bias-in-appraisal',
    title: 'Reducing bias in appraisal',
    description:
      'A practical guide to language, sourcing, and review steps that limit bias risk.',
    type: 'e-book',
    category: 'compliance',
    rating: 4.8,
    tag: 'Fair Practice',
    durationMinutes: 28,
    heroBackground:
      'linear-gradient(135deg, var(--color-warning-100), var(--color-warning-500))',
    heroAccent: 'var(--color-neutral-900)',
    heroLabel: 'BIAS IN APPRAISAL',
  },
  {
    id: 'mck-client-conversations',
    title: 'Hard client conversations',
    description:
      'Scripts for when the value comes in low, the client pushes back, or the timeline slips.',
    type: 'webinar-recording',
    category: 'career-tips',
    rating: 4.6,
    durationMinutes: 36,
    viewed: true,
    heroBackground:
      'linear-gradient(135deg, var(--color-info-100), var(--color-info-500))',
    heroAccent: 'var(--color-info-900)',
    heroLabel: 'CLIENT TALK',
  },
  {
    id: 'mck-rural-properties',
    title: 'Rural property appraisal pitfalls',
    description:
      'Acreage, outbuildings, water rights, and the comps you wish you had found sooner.',
    type: 'video',
    category: 'appraisal-methods',
    rating: 4.5,
    durationMinutes: 17,
    heroBackground:
      'linear-gradient(135deg, var(--color-success-100), var(--color-success-500))',
    heroAccent: 'var(--color-success-900)',
    heroLabel: 'RURAL APPRAISAL',
  },
  {
    id: 'mck-defensible-files',
    title: 'Building a defensible workfile',
    description:
      'What reviewers look for, what gets missed, and a one-page audit checklist.',
    type: 'infographic',
    category: 'risk-management',
    rating: 4.7,
    tag: 'Workfile',
    durationMinutes: 8,
    heroBackground:
      'linear-gradient(135deg, var(--color-tertiary-200), var(--color-tertiary-500))',
    heroAccent: 'var(--color-tertiary-900)',
    heroLabel: 'DEFENSIBLE FILES',
  },
  {
    id: 'mck-state-licensing',
    title: "What your state license actually allows",
    description:
      'A quick map of the differences between Trainee, Licensed, Certified Residential, and Certified General.',
    type: 'article',
    category: 'career-tips',
    rating: 4.4,
    durationMinutes: 14,
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-500))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: 'LICENSE TIERS',
  },
  {
    id: 'mck-fast-comp-research',
    title: 'Comp research, three minutes faster',
    description:
      'A workflow tweak top appraisers use to cut MLS research time without losing fidelity.',
    type: 'video',
    category: 'appraisal-methods',
    rating: 4.3,
    tag: 'Workflow',
    durationMinutes: 9,
    heroBackground:
      'linear-gradient(135deg, var(--color-cta-100), var(--color-cta-500))',
    heroAccent: 'var(--color-cta-900)',
    heroLabel: 'FAST COMPS',
  },
  {
    id: 'mck-condo-quirks',
    title: 'Condo and PUD quirks',
    description:
      'HOA documents, ownership distinctions, and the data points lenders actually want.',
    type: 'infographic',
    category: 'appraisal-methods',
    rating: 4.2,
    durationMinutes: 5,
    heroBackground:
      'linear-gradient(135deg, var(--color-warning-200), var(--color-warning-600))',
    heroAccent: 'var(--color-neutral-900)',
    heroLabel: 'CONDO & PUD',
  },
]

/* ─── Elite (Nursing) ──────────────────────────────────────────────── */
//
// Elite is the canonical brand for the Learning Library — its content
// mirrors the real Elite Learning skill-refresher catalog (titles,
// descriptions, ratings). Each entry ships with a hero image
// (public/library/elite-*.png) sourced from the live partner
// `learn.elitelearning.com` artwork. Categories used:
//   - Clinical Skills      (videos, infographics, templates)
//   - Medical Reference    (printable cheat sheets)
//   - Diagnosis            (short-form video explainers)
//   - Career Tips          (Career Night webinars + articles)

const ELITE_RESOURCES: LibraryResource[] = [
  {
    id: 'elite-must-know-meds',
    title: '50 Must-Know Medications for Nurses',
    description:
      'A handy printable cheat sheet reviewing 50 must-know medications for nurses.',
    type: 'infographic',
    category: 'medical-reference',
    rating: 5.0,
    durationMinutes: 8,
    viewed: true,
    imageUrl: '/library/elite-must-know-meds.png',
    // Real PDF — the detail page swaps the InfographicBody mock for
    // the browser's embedded PDF reader.
    pdfUrl: '/library/elite-must-know-meds.pdf',
    heroBackground:
      'linear-gradient(135deg, var(--color-warning-200), var(--color-warning-500))',
    heroAccent: 'var(--color-neutral-900)',
    heroLabel: 'MUST-KNOW MEDS',
  },
  {
    id: 'elite-intradermal-injections',
    title: 'Intradermal Injections',
    description: 'Review of intradermal injections.',
    type: 'video',
    category: 'clinical-skills',
    rating: 4.6,
    tag: 'Injections',
    durationMinutes: 6,
    imageUrl: '/library/elite-intradermal-injections.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-info-200), var(--color-info-500))',
    heroAccent: 'var(--color-info-900)',
    heroLabel: 'INTRADERMAL INJECTIONS',
  },
  {
    id: 'elite-ekg-cheat-sheet',
    title: 'EKG Cheat Sheet',
    description: 'Handy resource sheet covering EKG strips.',
    type: 'infographic',
    category: 'medical-reference',
    rating: 4.8,
    tag: 'EKG',
    durationMinutes: 7,
    imageUrl: '/library/elite-ekg-cheat-sheet.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-tertiary-200), var(--color-tertiary-500))',
    heroAccent: 'var(--color-tertiary-900)',
    heroLabel: 'EKG QUICK VIEW',
  },
  {
    id: 'elite-pulmonary-embolism',
    title: 'Pulmonary Embolism',
    description: 'Overview of pulmonary embolism.',
    type: 'video',
    category: 'diagnosis',
    rating: 4.8,
    durationMinutes: 11,
    imageUrl: '/library/elite-pulmonary-embolism.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-error-100), var(--color-error-500))',
    heroAccent: 'var(--color-text-inverse)',
    heroLabel: 'PULMONARY EMBOLISM',
  },
  {
    id: 'elite-iv-piggyback',
    title: '"IV Piggyback" AKA Secondary IV Tubing',
    description:
      'Review of secondary IV tubing set up; also known as IV piggyback.',
    type: 'video',
    category: 'clinical-skills',
    rating: 4.4,
    tag: 'IV',
    durationMinutes: 9,
    imageUrl: '/library/elite-iv-piggyback.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-200), var(--color-primary-500))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: 'IV PIGGYBACK',
  },
  {
    id: 'elite-mastering-interview-er',
    title: 'Mastering the Interview - ER',
    description: 'Tips for mastering an interview for the Emergency Department.',
    type: 'video',
    category: 'career-tips',
    rating: 4.7,
    durationMinutes: 12,
    imageUrl: '/library/elite-mastering-interview-er.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-info-200), var(--color-info-600))',
    heroAccent: 'var(--color-text-inverse)',
    heroLabel: 'INTERVIEW PREP',
  },
  {
    id: 'elite-apical-pulse',
    title: 'Apical Pulse Assessment',
    description: 'Review on how to find and assess the apical pulse.',
    type: 'video',
    category: 'clinical-skills',
    rating: 4.9,
    tag: 'Assessment',
    durationMinutes: 7,
    imageUrl: '/library/elite-apical-pulse.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-secondary-200), var(--color-secondary-500))',
    heroAccent: 'var(--color-secondary-900)',
    heroLabel: 'APICAL PULSE',
  },
  {
    id: 'elite-ostomy-care',
    title: 'Ostomy Cheat Sheet',
    description: 'Handy resource sheet covering ostomy care.',
    type: 'infographic',
    category: 'clinical-skills',
    rating: 3.7,
    durationMinutes: 6,
    imageUrl: '/library/elite-ostomy-care.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-tertiary-200), var(--color-tertiary-500))',
    heroAccent: 'var(--color-tertiary-900)',
    heroLabel: 'OSTOMY CARE',
  },
  {
    id: 'elite-common-veins',
    title: 'Common Vein Locations',
    description: 'Tips for finding veins in common locations.',
    type: 'video',
    category: 'clinical-skills',
    rating: 3.9,
    durationMinutes: 8,
    imageUrl: '/library/elite-common-veins.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-200), var(--color-primary-500))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: 'VEIN LOCATIONS',
  },
  {
    id: 'elite-head-to-toe-assessment',
    title: 'Head to Toe Assessment',
    description:
      'A printable head-to-toe assessment template walking through patient information, vitals, and per-system notes.',
    type: 'template',
    category: 'clinical-skills',
    rating: 4.6,
    tag: 'Assessment',
    durationMinutes: 5,
    imageUrl: '/library/elite-head-to-toe-assessment.png',
    // Real 19-page PDF — the detail page swaps the TemplateBody
    // "Preview Unavailable" surface for the browser's embedded PDF
    // reader so members can review the assessment inline before
    // downloading.
    pdfUrl: '/library/elite-head-to-toe-assessment.pdf',
    heroBackground:
      'linear-gradient(135deg, var(--color-cta-200), var(--color-cta-500))',
    heroAccent: 'var(--color-cta-900)',
    heroLabel: 'HEAD TO TOE',
  },
  {
    id: 'elite-syncope',
    title: 'Syncope',
    description:
      'A quick refresher on syncope — causes, common red flags, and the bedside workup most providers expect.',
    type: 'video',
    category: 'diagnosis',
    rating: 4.4,
    durationMinutes: 6,
    imageUrl: '/library/elite-syncope.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-300))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: 'SYNCOPE',
  },
  {
    id: 'elite-thyroid-storm',
    title: 'Thyroid Storm',
    description:
      'How to spot thyroid storm early — the lab triad, presenting symptoms, and the escalation steps.',
    type: 'video',
    category: 'diagnosis',
    rating: 4.6,
    durationMinutes: 7,
    viewed: true,
    imageUrl: '/library/elite-thyroid-storm.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-info-100), var(--color-info-300))',
    heroAccent: 'var(--color-info-900)',
    heroLabel: 'THYROID STORM',
  },
  {
    id: 'elite-12-lead-ekg',
    title: '12-Lead EKG Placement',
    description:
      'A bedside walkthrough of correct 12-lead EKG placement — including the swap-prone Wilson and Einthoven landmarks.',
    type: 'video',
    category: 'clinical-skills',
    rating: 4.7,
    tag: 'EKG',
    durationMinutes: 10,
    imageUrl: '/library/elite-12-lead-ekg.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-400))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: '12 LEAD EKG',
  },
  {
    id: 'elite-new-grad-pitfalls',
    title: '10 Common Pitfalls for New Grad Nurses',
    description:
      'Nurse Mike walks through the 10 pitfalls he sees most often in first-year RNs — and how to avoid each.',
    type: 'webinar-recording',
    category: 'career-tips',
    rating: 4.8,
    durationMinutes: 42,
    viewed: true,
    imageUrl: '/library/elite-new-grad-pitfalls.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-info-100), var(--color-info-400))',
    heroAccent: 'var(--color-info-900)',
    heroLabel: 'NEW GRAD PITFALLS',
  },
  {
    id: 'elite-surviving-night-shift',
    profession: 'Physical Therapy',
    title: 'Surviving Night Shift',
    description:
      'Sleep windows, light timing, and the small habits that keep you sharp by hour 9 of a 12.',
    type: 'article',
    category: 'career-tips',
    rating: 4.3,
    durationMinutes: 7,
    imageUrl: '/library/elite-surviving-night-shift.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-info-200), var(--color-info-500))',
    heroAccent: 'var(--color-info-900)',
    heroLabel: 'NIGHT SHIFT',
  },

  // TODO(library-copy): the 20 entries below ship with real Elite
  // artwork but placeholder description text. Titles are taken from
  // each image's visible headline. Fill in the real descriptions +
  // refine the type / category / rating / duration once the engagement
  // team confirms the source-of-truth metadata.
  {
    id: 'elite-intracranial-pressure',
    title: 'Increased Intracranial Pressure',
    description: 'Description coming soon.',
    type: 'video',
    category: 'diagnosis',
    rating: 4.5,
    durationMinutes: 6,
    imageUrl: '/library/elite-intracranial-pressure.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-300))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: 'ICP',
  },
  {
    id: 'elite-abnormal-lung-sounds',
    title: 'Abnormal Lung Sounds',
    description: 'Description coming soon.',
    type: 'video',
    category: 'clinical-skills',
    rating: 4.6,
    durationMinutes: 7,
    imageUrl: '/library/elite-abnormal-lung-sounds.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-secondary-200), var(--color-secondary-500))',
    heroAccent: 'var(--color-secondary-900)',
    heroLabel: 'LUNG SOUNDS',
  },
  {
    id: 'elite-iv-tubing-changing',
    title: 'IV Tubing Changing',
    description: 'Description coming soon.',
    type: 'video',
    category: 'clinical-skills',
    rating: 4.4,
    tag: 'IV',
    durationMinutes: 6,
    imageUrl: '/library/elite-iv-tubing-changing.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-tertiary-200), var(--color-tertiary-500))',
    heroAccent: 'var(--color-tertiary-900)',
    heroLabel: 'IV TUBING',
  },
  {
    id: 'elite-ng-tube-insertion',
    title: 'NG Tube Insertion',
    description: 'Description coming soon.',
    type: 'infographic',
    category: 'clinical-skills',
    rating: 4.5,
    durationMinutes: 5,
    imageUrl: '/library/elite-ng-tube-insertion.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-cta-200), var(--color-cta-500))',
    heroAccent: 'var(--color-cta-900)',
    heroLabel: 'NG TUBE',
  },
  {
    id: 'elite-drawing-up-meds',
    title: 'Drawing Up Meds',
    description: 'Description coming soon.',
    type: 'video',
    category: 'clinical-skills',
    rating: 4.7,
    durationMinutes: 5,
    imageUrl: '/library/elite-drawing-up-meds.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-info-200), var(--color-info-500))',
    heroAccent: 'var(--color-info-900)',
    heroLabel: 'DRAWING UP MEDS',
  },
  {
    id: 'elite-suppository-insertion',
    title: 'Suppository Insertion',
    description: 'Description coming soon.',
    type: 'video',
    category: 'clinical-skills',
    rating: 4.2,
    durationMinutes: 5,
    imageUrl: '/library/elite-suppository-insertion.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-tertiary-100), var(--color-tertiary-400))',
    heroAccent: 'var(--color-tertiary-900)',
    heroLabel: 'SUPPOSITORY',
  },
  {
    id: 'elite-central-line-dressing',
    title: 'Central Line Dressing',
    description: 'Description coming soon.',
    type: 'video',
    category: 'clinical-skills',
    rating: 4.6,
    durationMinutes: 8,
    imageUrl: '/library/elite-central-line-dressing.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-secondary-200), var(--color-secondary-500))',
    heroAccent: 'var(--color-secondary-900)',
    heroLabel: 'CENTRAL LINE',
  },
  {
    id: 'elite-urinary-tract-infection',
    title: 'Urinary Tract Infection',
    description: 'Description coming soon.',
    type: 'video',
    category: 'diagnosis',
    rating: 4.4,
    durationMinutes: 6,
    imageUrl: '/library/elite-urinary-tract-infection.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-cta-100), var(--color-cta-400))',
    heroAccent: 'var(--color-cta-900)',
    heroLabel: 'UTI',
  },
  {
    id: 'elite-reconstitute-powder-medication',
    title: 'Reconstitute Powder Medication',
    description: 'Description coming soon.',
    type: 'video',
    category: 'clinical-skills',
    rating: 4.3,
    durationMinutes: 6,
    imageUrl: '/library/elite-reconstitute-powder-medication.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-tertiary-200), var(--color-tertiary-500))',
    heroAccent: 'var(--color-tertiary-900)',
    heroLabel: 'RECONSTITUTE',
  },
  {
    id: 'elite-iv-insertion',
    title: 'IV Insertion',
    description: 'Description coming soon.',
    type: 'video',
    category: 'clinical-skills',
    rating: 4.7,
    tag: 'IV',
    durationMinutes: 8,
    imageUrl: '/library/elite-iv-insertion.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-tertiary-100), var(--color-tertiary-400))',
    heroAccent: 'var(--color-tertiary-900)',
    heroLabel: 'IV INSERTION',
  },
  {
    id: 'elite-critical-communication-skills',
    profession: 'Occupational Therapy',
    title: 'Critical Communication Skills',
    description:
      'A printable guide to high-stakes communication in healthcare settings — how to structure handoffs, deliver difficult news, and de-escalate tense conversations without losing trust.',
    type: 'article',
    category: 'career-tips',
    rating: 4.5,
    durationMinutes: 9,
    imageUrl: '/library/elite-critical-communication-skills.png',
    // Real PDF asset — the detail page swaps the standard variant
    // body for an embedded `<PdfBody>` reader when this is set, so
    // members can browse the document inline.
    pdfUrl: '/library/elite-critical-communication-skills.pdf',
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-400))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: 'COMMUNICATION',
  },
  {
    id: 'elite-surviving-day-shift',
    profession: 'Physical Therapy',
    title: 'Surviving Day Shift',
    description: 'Description coming soon.',
    type: 'article',
    category: 'career-tips',
    rating: 4.2,
    durationMinutes: 6,
    imageUrl: '/library/elite-surviving-day-shift.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-warning-100), var(--color-warning-400))',
    heroAccent: 'var(--color-neutral-900)',
    heroLabel: 'DAY SHIFT',
  },
  {
    id: 'elite-9-ways-use-your-degree',
    profession: 'Occupational Therapy',
    title: '9 Cool Ways to Use Your Degree',
    description: 'Description coming soon.',
    type: 'article',
    category: 'career-tips',
    rating: 4.4,
    durationMinutes: 8,
    imageUrl: '/library/elite-9-ways-use-your-degree.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-info-100), var(--color-info-400))',
    heroAccent: 'var(--color-info-900)',
    heroLabel: '9 WAYS',
  },
  {
    id: 'elite-conquering-new-grad-fears',
    profession: 'Occupational Therapy',
    title: 'Conquering New Grad Fears',
    description: 'Description coming soon.',
    type: 'webinar-recording',
    category: 'career-tips',
    rating: 4.6,
    durationMinutes: 38,
    imageUrl: '/library/elite-conquering-new-grad-fears.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-secondary-100), var(--color-secondary-400))',
    heroAccent: 'var(--color-secondary-900)',
    heroLabel: 'NEW GRAD FEARS',
  },
  {
    id: 'elite-navigating-mistakes',
    title: 'Navigating Mistakes as a New Grad Nurse',
    description: 'Description coming soon.',
    type: 'webinar-recording',
    category: 'career-tips',
    rating: 4.5,
    durationMinutes: 35,
    imageUrl: '/library/elite-navigating-mistakes.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-cta-100), var(--color-cta-400))',
    heroAccent: 'var(--color-cta-900)',
    heroLabel: 'NAVIGATING MISTAKES',
  },
  {
    id: 'elite-youre-not-alone',
    profession: 'Physical Therapy',
    title: "You're Not Alone — Support Systems for New Grads",
    description: 'Description coming soon.',
    type: 'webinar-recording',
    category: 'career-tips',
    rating: 4.7,
    durationMinutes: 32,
    imageUrl: '/library/elite-youre-not-alone.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-400))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: 'YOU\'RE NOT ALONE',
  },
  {
    id: 'elite-beyond-the-bedside',
    profession: 'Occupational Therapy',
    title: 'Beyond the Bedside — Opportunities Outside the Hospital',
    description: 'Description coming soon.',
    type: 'webinar-recording',
    category: 'career-tips',
    rating: 4.5,
    durationMinutes: 40,
    imageUrl: '/library/elite-beyond-the-bedside.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-info-100), var(--color-info-400))',
    heroAccent: 'var(--color-info-900)',
    heroLabel: 'BEYOND BEDSIDE',
  },
  {
    id: 'elite-learn-more-earn-more',
    profession: 'Occupational Therapy',
    title: 'Learn More, Earn More',
    description: 'Description coming soon.',
    type: 'webinar-recording',
    category: 'career-tips',
    rating: 4.6,
    durationMinutes: 36,
    imageUrl: '/library/elite-learn-more-earn-more.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-tertiary-100), var(--color-tertiary-400))',
    heroAccent: 'var(--color-tertiary-900)',
    heroLabel: 'LEARN MORE EARN MORE',
  },
  {
    id: 'elite-youre-hired',
    profession: 'Physical Therapy',
    title: "You're Hired — Advice for Your First Year",
    description: 'Description coming soon.',
    type: 'webinar-recording',
    category: 'career-tips',
    rating: 4.8,
    durationMinutes: 38,
    imageUrl: '/library/elite-youre-hired.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-secondary-100), var(--color-secondary-400))',
    heroAccent: 'var(--color-secondary-900)',
    heroLabel: 'YOU\'RE HIRED',
  },
  {
    id: 'elite-9-unexpected-perks',
    profession: 'Physical Therapy',
    title: '9 Unexpected Perks for the New Grad Nurse',
    description: 'Description coming soon.',
    type: 'webinar-recording',
    category: 'career-tips',
    rating: 4.4,
    durationMinutes: 30,
    imageUrl: '/library/elite-9-unexpected-perks.png',
    heroBackground:
      'linear-gradient(135deg, var(--color-info-200), var(--color-info-500))',
    heroAccent: 'var(--color-info-900)',
    heroLabel: '9 PERKS',
  },
  {
    id: 'elite-nursing-career-compass-2024',
    title: '2024 Nursing Career Compass',
    description:
      "Elite Learning's 2024 Nursing Career Compass provides insights into several popular career paths for students, new graduates, and nurses looking to make a change.",
    type: 'e-book',
    category: 'career-tips',
    rating: 5.0,
    // Card pill ships singular — "Career Compass" is the more
    // specific tag and matches the fixture's filter-pill style.
    // The "Nursing" tag in the design reference is implied by
    // the brand context.
    tag: 'Career Compass',
    durationMinutes: 25,
    // Hero image is the e-book's actual cover (extracted from
    // page 1 of the source PDF via Quick Look).
    imageUrl: '/library/elite-nursing-career-compass-2024.png',
    // Real 18-page PDF — the detail page's PDF body short-circuits
    // the standard `<EbookBody>` magazine viewer and renders the
    // browser's embedded reader instead.
    pdfUrl: '/library/elite-nursing-career-compass-2024.pdf',
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-200), var(--color-primary-500))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: 'CAREER COMPASS',
  },
  {
    id: 'elite-cover-letter-template',
    title: 'New Nurse Cover Letter Template',
    description:
      'A handy cover letter template for nurses just starting their job search — drop your details in and customize for each application.',
    type: 'template',
    category: 'career-tips',
    rating: 4.5,
    tag: 'Cover Letter',
    durationMinutes: 5,
    // No preview ships for Templates (the body renders the
    // "Preview Unavailable" surface) — clicking Download pulls
    // the real Word doc.
    downloadUrl: '/library/elite-cover-letter-template.docx',
    heroBackground:
      'linear-gradient(135deg, var(--color-cta-200), var(--color-cta-500))',
    heroAccent: 'var(--color-cta-900)',
    heroLabel: 'COVER LETTER',
  },
]

/* ─── STC (Financial Services) ─────────────────────────────────────── */

const STC_RESOURCES: LibraryResource[] = [
  {
    id: 'stc-series-7-anatomy',
    title: 'Series 7 exam anatomy',
    description:
      'A breakdown of the four exam sections, weighting, and where most candidates lose points.',
    type: 'e-book',
    category: 'securities-licensing',
    rating: 4.8,
    tag: 'Series 7',
    durationMinutes: 22,
    viewed: true,
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-200), var(--color-primary-500))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: 'SERIES 7 ANATOMY',
  },
  {
    id: 'stc-suitability-101',
    title: 'Suitability 101 for new reps',
    description:
      "What FINRA's Rule 2111 actually requires — with worked examples.",
    type: 'video',
    category: 'compliance',
    rating: 4.6,
    durationMinutes: 13,
    heroBackground:
      'linear-gradient(135deg, var(--color-info-200), var(--color-info-500))',
    heroAccent: 'var(--color-info-900)',
    heroLabel: 'SUITABILITY 101',
  },
  {
    id: 'stc-options-cheatsheet',
    title: 'Options strategies cheat sheet',
    description:
      'Long / short / spread / straddle / strangle, with break-even and risk at a glance.',
    type: 'infographic',
    category: 'securities-licensing',
    rating: 4.7,
    tag: 'Options',
    durationMinutes: 7,
    heroBackground:
      'linear-gradient(135deg, var(--color-cta-200), var(--color-cta-500))',
    heroAccent: 'var(--color-cta-900)',
    heroLabel: 'OPTIONS CHEAT',
  },
  {
    id: 'stc-municipal-bonds',
    title: 'Municipal bonds without the panic',
    description:
      'GO vs. revenue, tax treatments, and the candidates most likely to actually fit a client.',
    type: 'video',
    category: 'securities-licensing',
    rating: 4.5,
    durationMinutes: 16,
    heroBackground:
      'linear-gradient(135deg, var(--color-secondary-200), var(--color-secondary-500))',
    heroAccent: 'var(--color-secondary-900)',
    heroLabel: 'MUNI BONDS',
  },
  {
    id: 'stc-state-insurance-overlap',
    title: 'When state insurance lines overlap',
    description:
      'A primer on the states with the trickiest pre-licensing overlaps and how to plan around them.',
    type: 'e-book',
    category: 'insurance-licensing',
    rating: 4.3,
    durationMinutes: 24,
    heroBackground:
      'linear-gradient(135deg, var(--color-warning-200), var(--color-warning-600))',
    heroAccent: 'var(--color-neutral-900)',
    heroLabel: 'INSURANCE OVERLAP',
  },
  {
    id: 'stc-client-objections',
    title: 'Handling the top 10 client objections',
    description:
      'Live walkthroughs from a senior advisor, with the why behind each response.',
    type: 'webinar-recording',
    category: 'career-tips',
    rating: 4.7,
    durationMinutes: 38,
    viewed: true,
    heroBackground:
      'linear-gradient(135deg, var(--color-tertiary-200), var(--color-tertiary-500))',
    heroAccent: 'var(--color-tertiary-900)',
    heroLabel: 'OBJECTION HANDLING',
  },
  {
    id: 'stc-aml-essentials',
    title: 'AML essentials for advisors',
    description:
      'What anti-money-laundering oversight actually looks like at the desk level.',
    type: 'infographic',
    category: 'compliance',
    rating: 4.4,
    tag: 'AML',
    durationMinutes: 6,
    heroBackground:
      'linear-gradient(135deg, var(--color-success-100), var(--color-success-500))',
    heroAccent: 'var(--color-success-900)',
    heroLabel: 'AML ESSENTIALS',
  },
  {
    id: 'stc-retirement-accounts',
    title: 'Retirement account types in one page',
    description:
      "IRAs, 401(k)s, SEPs, SIMPLEs, and Roths — with each one's contribution and tax wrinkle.",
    type: 'infographic',
    category: 'securities-licensing',
    rating: 4.6,
    durationMinutes: 5,
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-500))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: 'RETIREMENT ACCTS',
  },
  {
    id: 'stc-first-90-days',
    title: 'Your first 90 days as a new rep',
    description:
      'A book of plays from advisors who survived (and a few who almost didn’t).',
    type: 'e-book',
    category: 'career-tips',
    rating: 4.5,
    durationMinutes: 30,
    heroBackground:
      'linear-gradient(135deg, var(--color-info-100), var(--color-info-500))',
    heroAccent: 'var(--color-info-900)',
    heroLabel: 'FIRST 90 DAYS',
  },
  {
    id: 'stc-fixed-vs-variable',
    title: 'Fixed vs. variable annuities, side by side',
    description:
      "A 9-minute video that finally makes the cost / benefit comparison click.",
    type: 'video',
    category: 'securities-licensing',
    rating: 4.2,
    tag: 'Annuities',
    durationMinutes: 9,
    heroBackground:
      'linear-gradient(135deg, var(--color-cta-100), var(--color-cta-500))',
    heroAccent: 'var(--color-cta-900)',
    heroLabel: 'ANNUITIES',
  },
]

/**
 * XCEL Solutions (insurance licensing) — a small set drawn from the artefacts
 * the 3-Part Training Program actually ships: review notes, state requirement
 * charts, the flashcard deck, and an exam-day walkthrough. Deliberately short.
 * TODO(data): swap for the real Resource Center feed; five items is enough to
 * exercise the Category / Type / Status filters, not a content set.
 */
const XCEL_RESOURCES: LibraryResource[] = [
  {
    id: 'xcel-lh-review-notes',
    title: 'Life & Health review notes',
    description:
      'The Part 1 review notes condensed to the terms and numbers the state exam actually asks for.',
    type: 'e-book',
    category: 'insurance-licensing',
    rating: 4.8,
    tag: 'Life & Health',
    durationMinutes: 25,
    viewed: true,
    heroBackground:
      'linear-gradient(135deg, var(--color-primary-200), var(--color-primary-500))',
    heroAccent: 'var(--color-primary-900)',
    heroLabel: 'L&H REVIEW NOTES',
  },
  {
    id: 'xcel-state-requirements',
    title: 'State licensing requirements at a glance',
    description:
      'Pre-license hours, exam provider, and fees for every state, DC, and the U.S. Virgin Islands.',
    type: 'infographic',
    category: 'insurance-licensing',
    rating: 4.7,
    durationMinutes: 6,
    heroBackground:
      'linear-gradient(135deg, var(--color-secondary-200), var(--color-secondary-500))',
    heroAccent: 'var(--color-secondary-900)',
    heroLabel: 'STATE REQUIREMENTS',
  },
  {
    id: 'xcel-flashcards',
    title: '800+ flashcards',
    description:
      'The full flashcard deck, sorted by topic — the fastest way to find the terms that are not sticking.',
    type: 'template',
    category: 'insurance-licensing',
    rating: 4.9,
    tag: 'Exam Prep',
    durationMinutes: 15,
    heroBackground:
      'linear-gradient(135deg, var(--color-tertiary-200), var(--color-tertiary-500))',
    heroAccent: 'var(--color-tertiary-900)',
    heroLabel: '800+ FLASHCARDS',
  },
  {
    id: 'xcel-exam-day',
    title: 'Exam day, start to finish',
    description:
      'What to bring, what the testing centre does, and what happens in the 24 hours before you sit.',
    type: 'article',
    category: 'career-tips',
    rating: 4.6,
    durationMinutes: 9,
    heroBackground:
      'linear-gradient(135deg, var(--color-info-200), var(--color-info-500))',
    heroAccent: 'var(--color-info-900)',
    heroLabel: 'EXAM DAY',
  },
  {
    id: 'xcel-ce-deadlines',
    title: 'CE deadlines are not annual',
    description:
      'Why your renewal may fall on your licence anniversary or your birthday, and how to find yours.',
    type: 'article',
    category: 'compliance',
    rating: 4.5,
    durationMinutes: 7,
    heroBackground:
      'linear-gradient(135deg, var(--color-warning-200), var(--color-warning-500))',
    heroAccent: 'var(--color-warning-900)',
    heroLabel: 'CE DEADLINES',
  },
]

/* ─── per-brand selector ───────────────────────────────────────────── */

const CONFIG_BY_BRAND: Record<Brand, LibraryConfig> = {
  cre: {
    eyebrow: 'Real Estate',
    title: 'Real Estate Skills Library',
    description:
      'Quick reference guides, walkthrough videos, and printable cheat sheets — built with senior brokers and real-estate attorneys.',
    resources: CRE_RESOURCES,
  },
  mckissock: {
    eyebrow: 'Appraisal',
    title: 'Appraiser Skills Library',
    description:
      "Methodology refreshers, USPAP updates, and the workfile templates Certified Generals actually keep on their desks.",
    resources: MCKISSOCK_RESOURCES,
  },
  elite: {
    eyebrow: 'Nursing',
    title: 'Skills Refresher Learning Library',
    description:
      'Concise reference guides, 90 second skills refresher videos, and handy charts built in collaboration with our sister company SimpleNursing.',
    resources: ELITE_RESOURCES,
  },
  fitzgerald: {
    eyebrow: 'Nursing',
    title: 'Skills Refresher Learning Library',
    description:
      'Concise reference guides, 90 second skills refresher videos, and handy charts built in collaboration with our sister company SimpleNursing.',
    resources: ELITE_RESOURCES,
  },
  stc: {
    eyebrow: 'Financial Services',
    title: 'Securities & Insurance Library',
    description:
      'Exam-prep refreshers, compliance primers, and the desk-side cheat sheets advisors keep coming back to.',
    resources: STC_RESOURCES,
  },
  xcel: {
    eyebrow: 'Insurance',
    title: 'Insurance Licensing Library',
    description:
      'Review notes, state requirement charts, and the flashcard deck — the reference side of the 3-Part Training Program.',
    resources: XCEL_RESOURCES,
  },
}

export function libraryConfigFor(brand: Brand): LibraryConfig {
  return CONFIG_BY_BRAND[brand]
}

/** Every category present in the brand's resource set, in the order
 *  they first appear. Drives the Category pill row at the top of
 *  the results column so a brand only sees the categories with
 *  actual content. */
export function categoriesForBrand(brand: Brand): LibraryCategory[] {
  const seen = new Set<LibraryCategory>()
  const ordered: LibraryCategory[] = []
  for (const resource of libraryConfigFor(brand).resources) {
    if (seen.has(resource.category)) continue
    seen.add(resource.category)
    ordered.push(resource.category)
  }
  return ordered
}

/** Looks up a single resource by `id` across every brand. The
 *  `/resources/:id` detail page uses this so a direct URL works
 *  regardless of which brand the user's account is set to. Returns
 *  `null` when the id isn't in any brand catalog. */
export function findLibraryResourceById(
  id: string,
): { resource: LibraryResource; brand: Brand } | null {
  for (const brand of Object.keys(CONFIG_BY_BRAND) as Brand[]) {
    const match = CONFIG_BY_BRAND[brand].resources.find((r) => r.id === id)
    if (match) return { resource: match, brand }
  }
  return null
}

/** Sorted list of every distinct `tag` value present in the brand's
 *  resource set. Drives the Tags accordion checkboxes — a brand only
 *  sees tags that actually exist in its catalog, never the union of
 *  all brand tags. */
export function tagsForBrand(brand: Brand): string[] {
  const seen = new Set<string>()
  for (const resource of libraryConfigFor(brand).resources) {
    if (resource.tag) seen.add(resource.tag)
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b))
}

/** Min / max `durationMinutes` across the brand's resource set —
 *  drives the Content Length range slider's bounds. Returns
 *  `[0, 60]` as a sane default if a brand has no resources. */
export function lengthRangeForBrand(brand: Brand): [number, number] {
  const durations = libraryConfigFor(brand).resources.map(
    (r) => r.durationMinutes,
  )
  if (durations.length === 0) return [0, 60]
  return [
    Math.min(...durations),
    Math.max(...durations),
  ]
}
