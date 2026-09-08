/**
 * Dashboard Rebrand — progress-state personas + the Onboarding Flow hand-off.
 *
 * Feeds the `dashboard-progress-state` demo feature flag (4 populated states)
 * AND the standalone Onboarding Flow's hand-off (`personaFromSetup`). Each
 * variant resolves to a demo persona the Dashboard Rebrand overview consumes in
 * place of the default `progressPath`, so a reviewer can walk the dashboard's
 * Current Learning Path through: 0% → some progress (On Track / At Risk) → 100%
 * renewal-ready — and so a learner who just finished onboarding lands on a
 * populated dashboard that reflects what they entered.
 *
 * Now covers **all four brands** (CRE · McKissock · Elite · STC) via per-brand
 * `BrandProgressProfile`s: a brand-true continuing-education renewal cycle
 * (Real Estate CE · Appraiser CE · Nursing CE · Securities CE) with its own
 * title, required-hour split, license expiry, and Jump Back In courses. Brands
 * without a profile (e.g. Fitzgerald) return `null` and fall back to today's
 * default learning-path resolution.
 *
 * TODO(data): the required-hour totals, renewal dates, and Jump Back In courses
 * are representative demo values — replace once real per-license progress exists.
 */
import type { Brand } from '@/context/AccountContext'
import type { CourseCardData } from '@/components/courses/CourseCard'
import type { LearningPathSummary, LearningPathCategoryBreakdown, LearningPathCategory } from '@/data/learningFixtures'
import type { HomeStatus } from '@/components/learning/learningPathsHomeUtil'
import { educationTypesFor, type EducationType } from '@/data/onboarding/onboardingContent'

export type DashboardProgressVariant =
  // Setup complete, 0% logged — On Track. The state a learner lands on after
  // finishing the Onboarding Flow (kept for that hand-off; not in the demo-bar
  // picker, which uses `not-started` for the true "Not Started" compliance state).
  | 'setup-complete-0'
  // Explicit "Not Started" compliance state — 0% AND the not-started status band.
  | 'not-started'
  | 'progress-on-track'
  | 'progress-at-risk'
  // Behind pace while the license is still valid (more time left than At Risk,
  // but under-progressed for the time remaining).
  | 'progress-off-track'
  // Past the renewal/completion deadline with the requirement unmet.
  | 'progress-expired'
  | 'complete-100'
  // Persona-only "nothing in the queue" states that drive the Jump Back In
  // discovery empty branch (not in the compliance picker). `completed-empty` =
  // finished everything, nothing left to launch (celebratory copy). `new-empty`
  // = brand-new learner with nothing started or queued (get-started copy). Both
  // send the learner to the Course Catalog.
  | 'completed-empty'
  | 'new-empty'

export type DashboardProgressPersona = {
  /** Setup wizard complete? Always true now that the new-user gate lives in the
   *  standalone Onboarding Flow — kept on the type so consumers stay unchanged. */
  setupComplete: boolean
  /** A `LearningPathSummary`-shaped demo path (with mandatory/elective breakdown
   *  so the segmented gauge works) the dashboard renders instead of the default. */
  path: LearningPathSummary
  /** Explicit status — drives the Current Learning Path status band directly. */
  status: HomeStatus
  /** Resume course id (informational; the course itself rides on
   *  `path.jumpBackIn`). */
  jumpBackInId?: string
  /** Demo renewal override for the band's Deadline / Time Remaining cells. */
  renewal?: { deadline: string; weeksLeft: number }
  /** Renewal-ready treatment (100% complete): swap the resume card for a
   *  "Requirements met" state + a View certificate / Start next cycle CTA. */
  renewalReady?: boolean
  /** How the Jump Back In slot renders (auto-derived per variant):
   *   - `resume`    → an in-progress course ("Jump Back In" / "Resume course").
   *   - `up-next`   → a queued, not-started course ("Up Next" / "Launch course").
   *   - `discovery` → nothing to resume or launch — the empty state that sends
   *                   the learner to the Course Catalog. */
  jumpBackInMode?: 'resume' | 'up-next' | 'discovery'
  /** Copy tone for the `discovery` empty state: `completed` (all caught up) vs
   *  `new` (get started). Only set when `jumpBackInMode === 'discovery'`. */
  discoveryTone?: 'completed' | 'new'
}

/* ─── Per-brand progress profile ─────────────────────────────────────────── */

type BrandProgressProfile = {
  pathId: string
  /** Renewal-cycle title shown as the Current Learning Path name. */
  title: string
  category: string
  /** Two-letter state shown in the path meta. */
  state: string
  /** Total required hours (mandatory + elective). */
  mandatoryReq: number
  electiveReq: number
  /** License expiry (mm/dd/yyyy) shown on the path. */
  licenseExpiresOn: string
  /** Jump Back In course for the 0% state (not started). */
  upNext: CourseCardData
  /** Jump Back In course for the on-track state (~mid progress). */
  resumeMid: CourseCardData
  /** Jump Back In course for the at-risk state (early progress). */
  resumeEarly: CourseCardData
  /** Education-type-aware labels for the two gauge segments + the deadline stat
   *  cell. CE profiles omit these (→ the "Mandatory" / "Elective" / "License
   *  Expires" defaults); QE profiles set them per-brand so the same gauge reads
   *  as a get-licensed journey with a "Target Date". */
  mandatoryLabel?: string
  electiveLabel?: string
  deadlineLabel?: string
  /**
   * Generalized requirement categories (N > 2) for this journey. When set,
   * `personaFor` scales each category's completed hours by the progress ratio
   * and puts the list on the path — the gauge/legend/detail then render N
   * categories (superseding Mandatory/Elective). `required` is the per-category
   * hour requirement. Used by the QE "Multiple Categories" journeys.
   */
  categories?: { key: string; label: string; required: number }[]
}

/**
 * Per-brand progress profiles, keyed by education type.
 *
 * This used to be two sibling maps (`BRAND_PROFILES` for CE, `BRAND_QE_PROFILES`
 * for QE) with a hardcoded two-way branch in `profileFor`. Adding XCEL's third
 * type (`exam-prep`) as a third sibling plus a second `if` would have worked
 * and would have rotted, so the three collapse into one record here and
 * `profileFor` walks a declared fallback chain instead.
 */
const PROFILES: Record<EducationType, Partial<Record<Brand, BrandProgressProfile>>> = {
  ce: {
    // Insurance producer CE renewal (Florida Life & Health). The two category
    // names are XCEL's OWN two CE flavours — Initial Training (which adds annuity
    // and long-term care for L&H, flood for P&C) and Refresher Training — rather
    // than the generic Mandatory / Elective.
    // TODO(data): the 10/14 split is representative. XCEL publishes no per-state
    // hour breakdown in the brand file, and CE deadlines are NOT uniform — they
    // can fall on the licence anniversary or the licensee's date of birth, and
    // are not annual in every state. Do not generalise this fixture into a rule.
    xcel: {
      pathId: 'xcel-fl-lh-ce',
      title: 'Florida Life & Health CE',
      category: 'Insurance Continuing Education',
      state: 'FL',
      mandatoryReq: 10,
      electiveReq: 14,
      licenseExpiresOn: '10/31/2026',
      mandatoryLabel: 'Initial Training',
      electiveLabel: 'Refresher Training',
      upNext: { id: 'jbi-xcel-ce-ethics', title: 'Insurance Ethics', hours: 5, state: 'FL', delivery: 'online', badge: 'mandatory', status: 'not-started', progress: 0 },
      resumeMid: { id: 'jbi-xcel-ce-ltc', title: 'Long-Term Care Initial Training', hours: 8, state: 'FL', delivery: 'online', badge: 'mandatory', status: 'in-progress', progress: 45 },
      resumeEarly: { id: 'jbi-xcel-ce-annuity', title: 'Annuity Initial Training', hours: 4, state: 'FL', delivery: 'online', badge: 'mandatory', status: 'in-progress', progress: 20 },
    },
  },

  /* ─── QE (Qualifying / pre-licensing) ──────────────────────────────────────
   * Only the brands whose dashboard demos a get-licensed journey. Same shape as
   * the CE profiles — the `mandatory` segment reads as required coursework, the
   * `elective` segment as exam-prep / electives — so the two-segment gauge +
   * Deadline / Time Remaining band reuse works unchanged. Fitzgerald has no
   * entry, so it falls back to CE. */
  qe: {
    // Insurance pre-licensing (Florida Life & Health) — Part 1 of the 3-Part
    // Training Program. `Target Date` rather than `License Expires`: a
    // candidate has no licence to expire yet. The `exam-prep` entry below
    // shares this path id and covers Parts 2–3.
    xcel: {
      pathId: 'xcel-fl-lh-prelicensing',
      title: 'Florida Life & Health Pre-Licensing',
      category: 'Insurance Pre-Licensing',
      state: 'FL',
      mandatoryReq: 24,
      electiveReq: 16,
      licenseExpiresOn: '06/12/2026',
      mandatoryLabel: 'Pre-License Education',
      electiveLabel: 'Exam Prep',
      deadlineLabel: 'Target Date',
      // The 3-Part Training Program plus the study tool that follows it, as
      // four requirement categories summing to the 24 + 16 split above. This
      // is what the "Multiple categories (QE)" demo persona exists to show —
      // without it XCEL renders the plain two-segment gauge and that persona
      // is indistinguishable from the default view.
      categories: [
        { key: 'pre-license', label: 'Pre-License Education', required: 24 },
        { key: 'prep-review', label: 'Prep Review Course', required: 8 },
        { key: 'simulators', label: 'Exam Simulators', required: 6 },
        { key: 'exam-cram', label: 'Exam Cram', required: 2 },
      ],
      upNext: { id: 'jbi-xcel-qe-lh', title: 'Life & Health Pre-License Course', hours: 24, state: 'FL', delivery: 'online', badge: 'mandatory', status: 'not-started', progress: 0 },
      resumeMid: { id: 'jbi-xcel-qe-lh', title: 'Life & Health Pre-License Course', hours: 24, state: 'FL', delivery: 'online', badge: 'mandatory', status: 'in-progress', progress: 45 },
      resumeEarly: { id: 'jbi-xcel-qe-lh', title: 'Life & Health Pre-License Course', hours: 24, state: 'FL', delivery: 'online', badge: 'mandatory', status: 'in-progress', progress: 20 },
    },
  },

  /* ─── Exam prep (XCEL only) ────────────────────────────────────────────────
   * XCEL is the only brand that sells exam preparation as a product of its own,
   * so it is the only entry here. Every other brand bundles exam prep into its
   * qualifying education, and `profileFor`'s fallback chain resolves them to
   * their `qe` (then `ce`) profile.
   *
   * DECIDED 2026-09-04: this is NOT a fourth learning path — it shares the
   * pre-licensing path's `pathId`. XCEL's 3-Part Training Program is ONE
   * journey (Pre-License Education → Prep Review Course → Exam Simulators), so
   * a separate path would split one curriculum in two and show a candidate two
   * paths for one licence. What differs is the FRAMING: `qe` above is Part 1
   * (the state hour requirement), and this is Parts 2–3 (the run-up to the
   * exam) — hence the smaller hour totals, the tighter window, and the
   * "Exam Date" deadline label.
   */
  'exam-prep': {
    xcel: {
      pathId: 'xcel-fl-lh-prelicensing',
      title: 'Florida Life & Health Exam Prep',
      category: 'Insurance Exam Preparation',
      state: 'FL',
      mandatoryReq: 14,
      electiveReq: 8,
      licenseExpiresOn: '06/12/2026',
      mandatoryLabel: 'Prep Review',
      electiveLabel: 'Exam Simulators',
      // A pre-licensing candidate has no licence to expire — the date that
      // matters is when they sit.
      deadlineLabel: 'Exam Date',
      // The 3-Part Program's Parts 2 and 3, as the two gauge segments.
      categories: [
        { key: 'prep-review', label: 'Prep Review Course', required: 8 },
        { key: 'study-tools', label: 'Study Tools & Reviews', required: 6 },
        { key: 'simulators', label: 'Exam Simulators', required: 8 },
      ],
      upNext: { id: 'jbi-xcel-ep-prep', title: 'Prep Review Course', hours: 8, state: 'FL', delivery: 'online', badge: 'mandatory', status: 'not-started', progress: 0 },
      resumeMid: { id: 'jbi-xcel-ep-sim1', title: 'Exam Simulator 1', hours: 2, state: 'FL', delivery: 'online', badge: 'mandatory', status: 'in-progress', progress: 45 },
      resumeEarly: { id: 'jbi-xcel-ep-cram', title: 'Exam Cram', hours: 2, state: 'FL', delivery: 'video', badge: 'elective', status: 'in-progress', progress: 20 },
    },
  },
}

/**
 * Fallback chain, declared once: `exam-prep` → `qe` → `ce`.
 *
 * A brand degrades to the nearest journey it actually has, so no caller gets
 * `undefined` for a brand that has any profile at all. Written as a walk over
 * an ordered list rather than a stack of `if`s so a fourth education type is a
 * one-line change here instead of another branch.
 */
const PROFILE_FALLBACK: Record<EducationType, EducationType[]> = {
  ce: ['ce'],
  qe: ['qe', 'ce'],
  'exam-prep': ['exam-prep', 'qe', 'ce'],
}

function profileFor(brand: Brand, educationType: EducationType): BrandProgressProfile | undefined {
  for (const t of PROFILE_FALLBACK[educationType]) {
    const found = PROFILES[t][brand]
    if (found) return found
  }
  return undefined
}

/**
 * Whether the Demo Controls bar shows the Education dropdown for this brand.
 *
 * REDEFINED 2026-09-04. It used to mean "has a QE profile", which was the same
 * question only while there were exactly two education types. It now means
 * "switching the dropdown would actually change the dashboard" — the number of
 * DISTINCT personas the brand's offered types resolve to, after `profileFor`'s
 * fallback chain has collapsed the ones that alias.
 *
 * Two weaker definitions were considered and are both wrong:
 *
 *   - "has more than one PROFILE entry" — would miss that two entries can be
 *     for types the brand does not offer.
 *   - "offers more than one TYPE" (`educationTypesFor(brand).length > 1`) —
 *     reads well and is wrong for Fitzgerald, which lists qe + ce but has no
 *     progress profile of either kind. That would have turned its dropdown on
 *     as a control with two options and no effect. Every brand lists at least
 *     two types, so that version would also never return false for anyone.
 *
 * Answers, unchanged from before this widening except for the new brand:
 * CRE · McKissock · Elite · STC · XCEL true, Fitzgerald false.
 */
export function dashboardEducationSupported(brand: Brand): boolean {
  const personas = new Set(educationTypesFor(brand).map((t) => profileFor(brand, t.type)))
  personas.delete(undefined)
  return personas.size > 1
}

/** Total required hours for a brand's demo renewal cycle (0 when no profile). */
function setupReqHoursFor(brand: Brand): number {
  const p = PROFILES.ce[brand]
  return p ? p.mandatoryReq + p.electiveReq : 0
}
export { setupReqHoursFor }

/** Legacy alias, kept for back-compat with call sites that still import the
 *  Elite-era name. Now resolves XCEL's required hours — the constant is the
 *  ACTIVE brand's total, and there is only one brand. */
export const ELITE_SETUP_REQ_HOURS = setupReqHoursFor('xcel')

/* ─── Shared per-variant templates (brand-agnostic demo values) ──────────── */

// Completed fractions of each category's requirement, per variant. Applied to a
// brand's mandatory/elective requirement to derive the gauge (Elite's original
// 6/9 + 8/15 on-track and 3/9 + 3/15 at-risk fall out of these ratios).
// Uniform per-category ratios so the derived overall % lands on the demo
// targets (0% · ~15% · ~63% · 100%) across every brand's hour split (integer
// rounding keeps it within a couple points of the label). `progress-expired`
// sits mid-way (~40%) with the requirement unmet.
const PROGRESS_RATIOS: Record<DashboardProgressVariant, { m: number; e: number }> = {
  'setup-complete-0': { m: 0, e: 0 },
  'not-started': { m: 0, e: 0 },
  'progress-on-track': { m: 0.63, e: 0.63 },
  'progress-at-risk': { m: 0.15, e: 0.15 },
  // Behind pace: only ~20% done with the license still valid.
  'progress-off-track': { m: 0.2, e: 0.2 },
  'progress-expired': { m: 0.4, e: 0.4 },
  'complete-100': { m: 1, e: 1 },
  // Finished everything (100%) but nothing left in the queue → discovery.
  'completed-empty': { m: 1, e: 1 },
  // Brand-new learner, nothing started or queued → discovery.
  'new-empty': { m: 0, e: 0 },
}

const RENEWAL_BY_VARIANT: Record<DashboardProgressVariant, { deadline: string; weeksLeft: number }> = {
  'setup-complete-0': { deadline: '08/28/2027', weeksLeft: 110 },
  'not-started': { deadline: '08/28/2027', weeksLeft: 110 },
  'progress-on-track': { deadline: '12/15/2026', weeksLeft: 22 },
  // At Risk = under 30 days left (and the requirement <25% done).
  'progress-at-risk': { deadline: '08/05/2026', weeksLeft: 3 },
  // Off Track = still ~3 months of runway, but well behind the pace needed.
  'progress-off-track': { deadline: '10/20/2026', weeksLeft: 12 },
  // Expired = deadline already passed, requirement unmet.
  'progress-expired': { deadline: '06/30/2026', weeksLeft: 0 },
  'complete-100': { deadline: '07/31/2026', weeksLeft: 40 },
  'completed-empty': { deadline: '07/31/2026', weeksLeft: 40 },
  'new-empty': { deadline: '08/28/2027', weeksLeft: 110 },
}

const STATUS_BY_VARIANT: Record<DashboardProgressVariant, HomeStatus> = {
  // The onboarding hand-off destination reads as On Track (a fresh, on-schedule
  // plan) — distinct from the picker's explicit Not Started state below.
  'setup-complete-0': 'on-track',
  'not-started': 'not-started',
  'progress-on-track': 'on-track',
  'progress-at-risk': 'at-risk',
  'progress-off-track': 'off-track',
  'progress-expired': 'expired',
  'complete-100': 'completed',
  'completed-empty': 'completed',
  'new-empty': 'not-started',
}

function breakdown(required: number, ratio: number): LearningPathCategoryBreakdown {
  return { completed: Math.round(required * ratio), required }
}

function buildPath(
  profile: BrandProgressProfile,
  mandatory: LearningPathCategoryBreakdown,
  elective: LearningPathCategoryBreakdown,
  jumpBackIn?: CourseCardData,
  categories?: LearningPathCategory[],
): LearningPathSummary {
  // When a category list is present it drives the totals (the gauge reads it);
  // otherwise fall back to the Mandatory/Elective sum.
  const totalRequired = categories?.length
    ? categories.reduce((s, c) => s + c.required, 0)
    : mandatory.required + elective.required
  const totalCompleted = categories?.length
    ? categories.reduce((s, c) => s + c.completed, 0)
    : mandatory.completed + elective.completed
  const progressPct = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0
  return {
    id: profile.pathId,
    title: profile.title,
    category: profile.category,
    state: profile.state,
    hours: totalRequired,
    licenseExpiresOn: profile.licenseExpiresOn,
    progressPct,
    lastViewedAt: '2026-05-20T08:15:00Z',
    mandatory,
    elective,
    categories,
    // Education-type-aware labels (CE default when the profile omits them).
    mandatoryLabel: profile.mandatoryLabel,
    electiveLabel: profile.electiveLabel,
    deadlineLabel: profile.deadlineLabel,
    jumpBackIn,
  }
}

function personaFor(profile: BrandProgressProfile, variant: DashboardProgressVariant): DashboardProgressPersona {
  const ratio = PROGRESS_RATIOS[variant]
  const mandatory = breakdown(profile.mandatoryReq, ratio.m)
  const elective = breakdown(profile.electiveReq, ratio.e)
  // Scaled category list (QE multi-category journeys). Each category's completed
  // hours = its requirement × the progress ratio (uniform m===e across states).
  const categories: LearningPathCategory[] | undefined = profile.categories?.map((c) => ({
    key: c.key,
    label: c.label,
    required: c.required,
    completed: Math.round(c.required * ratio.m),
  }))
  // The discovery states (`completed-empty` / `new-empty`) have nothing to
  // resume or launch.
  const isDiscovery = variant === 'completed-empty' || variant === 'new-empty'
  // "Empty path — add courses" (`new-empty`) — the learner has a path with real
  // license requirements but hasn't added any courses yet. Distinct from
  // `completed-empty` (100% done, nothing next), which keeps its completed course
  // list. Only `new-empty` flags the path as having no courses so the detail
  // panel swaps its course list for the "Add your first course" prompt.
  const isNewEmpty = variant === 'new-empty'
  // Not-started states surface the "up next" course; partial states resume
  // where the learner left off; complete-100 swaps Jump Back In for the
  // renewal-ready card; the discovery states have no course at all.
  const jumpBackIn = isDiscovery
    ? undefined
    : variant === 'setup-complete-0' || variant === 'not-started'
      ? profile.upNext
      : variant === 'progress-on-track'
        ? profile.resumeMid
        : variant === 'progress-at-risk' || variant === 'progress-expired'
          ? profile.resumeEarly
          : undefined // complete-100 → renewal-ready card replaces Jump Back In
  // Jump Back In slot mode — auto-derived from the variant. A not-started course
  // is "Up Next" (launch), a partial course is "Resume", and the discovery
  // states send the learner to the catalog.
  const jumpBackInMode: 'resume' | 'up-next' | 'discovery' = isDiscovery
    ? 'discovery'
    : variant === 'setup-complete-0' || variant === 'not-started'
      ? 'up-next'
      : 'resume'
  const discoveryTone: 'completed' | 'new' | undefined =
    variant === 'completed-empty' ? 'completed' : variant === 'new-empty' ? 'new' : undefined
  return {
    setupComplete: true,
    status: STATUS_BY_VARIANT[variant],
    jumpBackInId: jumpBackIn?.id,
    jumpBackInMode,
    discoveryTone,
    renewal: RENEWAL_BY_VARIANT[variant],
    renewalReady: variant === 'complete-100',
    // Carry the state's time + deadline onto the path so the detail panel's
    // Time Remaining ("Xd" / "N wks" / "Y yr, N wks") AND License Expires read
    // the same state-specific values (instead of the static LICENSE_TRACKER),
    // and agree with the dashboard band that opened the panel.
    path: {
      ...buildPath(profile, mandatory, elective, jumpBackIn, categories),
      weeksRemaining: RENEWAL_BY_VARIANT[variant].weeksLeft,
      licenseExpiresOn: RENEWAL_BY_VARIANT[variant].deadline,
      statusOverride: STATUS_BY_VARIANT[variant],
      // Empty path — no courses added yet. Drives the detail panel's
      // "Add your first course" empty state (undefined for every other state,
      // which keeps their authored course lists).
      coursesAdded: isNewEmpty ? false : undefined,
    },
  }
}

/**
 * Resolve the `dashboard-progress-state` flag variant to a demo persona for the
 * brand. Returns `null` for brands without a progress profile so callers fall
 * back to today's default learning-path resolution.
 */
export function dashboardProgressPersonaFor(
  brand: Brand,
  variant: string | undefined,
  educationType: EducationType = 'ce',
): DashboardProgressPersona | null {
  const profile = profileFor(brand, educationType)
  if (!profile) return null
  const v = (variant ?? 'progress-on-track') as DashboardProgressVariant
  const safe: DashboardProgressVariant = PROGRESS_RATIOS[v] ? v : 'progress-on-track'
  return personaFor(profile, safe)
}

/**
 * The five compliance states shown in the Demo Controls "Progress" picker, in
 * display order. Each maps to a `dashboard-progress-state` flag variant + the
 * `HomeStatus` it produces, so the demo bar and the Feature Flag panel stay in
 * sync. (`setup-complete-0` is intentionally excluded — it's the onboarding
 * hand-off destination, not a compliance state a reviewer picks.)
 */
export type ProgressPickerOption = {
  variant: DashboardProgressVariant
  label: string
  status: HomeStatus
}

export const DASHBOARD_PROGRESS_PICKER: ProgressPickerOption[] = [
  { variant: 'not-started', label: 'Not Started · 0%', status: 'not-started' },
  { variant: 'progress-on-track', label: 'On Track · ~63%', status: 'on-track' },
  { variant: 'progress-at-risk', label: 'At Risk · ~15%', status: 'at-risk' },
  { variant: 'progress-expired', label: 'Expired', status: 'expired' },
  { variant: 'complete-100', label: 'Completed · 100%', status: 'completed' },
]

/**
 * Enrich the brand's setup-complete-0 persona with the wizard's collected data
 * (expiration + the first selected course of interest) so finishing the
 * Onboarding Flow flips the dashboard to a populated Current Learning Path that
 * reflects what the learner just entered — while keeping the brand's coherent
 * renewal-cycle title + state. Falls back to `null` for brands without a
 * profile.
 */
export function personaFromSetup(
  brand: Brand,
  data: {
    licenseType: string
    expires: string
    courses: string[]
    modalities: string[]
  },
): DashboardProgressPersona | null {
  const base = dashboardProgressPersonaFor(brand, 'setup-complete-0')
  if (!base) return null
  const firstCourse = data.courses[0]
  const jumpBackIn: CourseCardData | undefined = firstCourse
    ? { id: 'jbi-setup-first', title: firstCourse, hours: 2, state: base.path.state ?? 'National', delivery: 'online', badge: 'elective', status: 'not-started', progress: 0 }
    : base.path.jumpBackIn
  const licenseExpiresOn = fmtDate(data.expires) ?? base.path.licenseExpiresOn
  return {
    ...base,
    path: { ...base.path, licenseExpiresOn, jumpBackIn },
  }
}

/** Format an ISO date input value (yyyy-mm-dd) as mm/dd/yyyy; `null` if empty. */
function fmtDate(iso: string): string | null {
  if (!iso) return null
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  return `${m}/${d}/${y}`
}
