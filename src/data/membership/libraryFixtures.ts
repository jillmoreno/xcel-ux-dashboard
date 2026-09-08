import type { Brand } from '@/context/AccountContext'
import { createImagePicker } from '@/utils/topicImage'

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

/* ─── McKissock (Real Estate / Appraisal) ──────────────────────────── */

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

/* ─── STC (Financial Services) ─────────────────────────────────────── */

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
