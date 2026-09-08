// TODO(data): replace with real Learning Path API integration.
// Source-of-truth Figma frame: file Nf5WhNJqxn9YVqDLT0MWOl, node 1:2462.

import type { CertSmallData } from '@/components/courses/CertSmall'
import type { CourseCardData, CourseStatus } from '@/components/courses/CourseCard'
import type { HomeStatus } from '@/components/learning/learningPathsHomeUtil'
import type { PathBannerData } from '@/components/learning/PathBanner'
import type { Brand } from '@/context/AccountContext'
import type { StatusOverride } from '@/data/studyCalendarFixtures'
import { imageForIndex } from '@/utils/courseImage'

/**
 * Per-path summary used by both the active-path banner and the
 * "My Learning Paths" slide-over picker.
 */
export type LearningPathCategoryBreakdown = {
  /** Hours / courses completed in this category. */
  completed: number
  /** Hours / courses required in this category. */
  required: number
}

/**
 * A single named requirement category on a learning path — the generalization
 * of the fixed Mandatory / Elective pair to an arbitrary list (e.g. an
 * appraiser QE path with Basic Principles / Procedures / USPAP / Bias & Fair
 * Housing / Supervisor-Trainee). Colors are assigned by index from the shared
 * brand-ramp palette (`categoryColorFor`), so the taxonomy stays color-agnostic.
 */
export type LearningPathCategory = LearningPathCategoryBreakdown & {
  /** Stable key for React lists. */
  key: string
  /** Display name (e.g. "USPAP"). */
  label: string
}

/**
 * Lightweight per-path status used ONLY by the "My Learning Paths" sheet
 * (its filter chips + per-card badge/colors). Deliberately separate from the
 * richer `LearningPathCardData.status` (on-track / at-risk / behind / …) so
 * the sheet can speak in license-deadline terms without disturbing the
 * dashboard card's pacing model.
 */
export type LearningPathSheetStatus =
  | 'in-progress'
  | 'not-started'
  | 'completed'
  | 'expiring-soon'
  | 'expired'

export type LearningPathSummary = {
  id: string
  title: string
  category: string
  /** Jurisdiction / regulator. Omitted for federal exam prep that isn't tied to a state. */
  state?: string
  hours: number
  licenseExpiresOn?: string
  /**
   * Weeks left until {@link licenseExpiresOn} / the renewal deadline. Drives the
   * detail panel's "Time Remaining" stat (formatted years+weeks → weeks → a
   * day countdown under 30 days). Set on the progress-state personas so the
   * stat reflects each compliance state; unset ⇒ the panel falls back to the
   * global `LICENSE_TRACKER`.
   */
  weeksRemaining?: number
  /**
   * Explicit compliance status for the detail panel's status band. Set on the
   * progress-state personas (from their `HomeStatus`) so the band shows the
   * intended state — On Track / At Risk / Off Track / Completed / Expired / Not
   * Started — with its correct label + color, instead of the panel re-deriving a
   * coarse 3-state guess from weeks/percent. Unset ⇒ the panel derives as before.
   */
  statusOverride?: HomeStatus
  /** Exam date for one-time certification prep paths (e.g. FINRA series exams). */
  examDate?: string
  /** Date the path was completed (mm/dd/yyyy) — drives the "Completed On" tile
   *  on completed learning-path cards. Set only on completed paths. */
  completedOn?: string
  timeLeftLabel?: string
  progressPct: number
  /** ISO timestamp for "Recently Viewed" sort. */
  lastViewedAt: string
  /**
   * Explicit sheet status override. Real authored fixtures omit this and let
   * {@link sheetStatusFor} derive the status from progress + deadline; the
   * synthesized (count-variant) paths set it so the demo list shows a realistic
   * spread including Expiring soon + Expired.
   */
  sheetStatus?: LearningPathSheetStatus
  /**
   * Optional Mandatory / Elective breakdown — used by the CE Goal Tracker
   * "Overall Course Progress" widget. When set, the widget derives both
   * the donut percentage and the category counts from these values.
   */
  mandatory?: LearningPathCategoryBreakdown
  elective?: LearningPathCategoryBreakdown
  /**
   * Generalized requirement categories (N > 2). When set, this is the source of
   * truth for the gauge/legend/detail list and supersedes `mandatory`/`elective`
   * (which stay the 2-category default when `categories` is absent). Colors are
   * assigned by index via `categoryColorFor`. Per the surface rule: 2 categories
   * render the segmented gauge + legend everywhere; more than 2 show only the
   * overall-% gauge on the dashboard and the full list in the detail panel.
   */
  categories?: LearningPathCategory[]
  /**
   * Whether the learner has added any courses to this path yet. Defaults to
   * `true` (omitted). Set `false` for the brand-new "empty path" state — the
   * detail panel's Progress tab then shows a "no courses yet" empty state
   * instead of the gauge + course lists (the learner hasn't enrolled in
   * anything). In production this mirrors an empty course query.
   */
  coursesAdded?: boolean
  /**
   * Optional education-type-aware labels for the two gauge segments + the
   * deadline stat cell. Unset ⇒ the CE defaults ("Mandatory" / "Elective" /
   * "License Expires"). QE (qualifying / exam-prep) personas set these per-brand
   * (e.g. "Required Courses" / "Elective" / "Target Date") so the same gauge +
   * Current Learning Path band reads as a get-licensed journey. Display-only —
   * they don't affect any derivation.
   */
  mandatoryLabel?: string
  electiveLabel?: string
  deadlineLabel?: string
  /**
   * The course the dashboard's "Jump Back In" widget surfaces when this path is
   * the learner's active path (so switching paths from the My Learning Paths
   * sheet re-points Jump Back In too). Optional — when omitted, Jump Back In
   * falls back to the brand's first in-progress course from `myCoursesFor`.
   */
  jumpBackIn?: CourseCardData
  /**
   * Discriminator that flips a path between real production content
   * and a demo-flow scaffold. Demo paths live next to real paths in
   * the picker but route to a specific stakeholder-demo experience
   * (currently only Create Calendar) instead of the regular tab.
   */
  kind?: 'real' | 'demo'
  /**
   * When `kind === 'demo'`, picks which demo flow the path activates.
   * Union is intentionally extensible so future demo flows (Edit
   * Calendar, Pacing Adjustment, etc.) can land as additional values
   * without churning every callsite.
   */
  demoFlow?: 'create-calendar' | 'create-calendar-panel'
  /** Optional small pill rendered next to the title in the path
   *  picker (e.g., "Demo"). Decorative only — has no functional
   *  meaning beyond labeling. */
  pathTitleBadge?: string
  /**
   * Page-layout variant for the Learning Path detail view. Default
   * keeps Study Calendar as a tab (current STC behavior).
   * `'study-calendar-inline'` promotes the calendar to a top-level
   * section above the tabs, with a "View" toggle that swaps the body
   * between the calendar and the standard Learning Path stack.
   * `'study-calendar-stacked'` shows the calendar AND a Learning Path
   * tab row stacked together on one page — no toggle.
   * `'study-calendar-in-tab'` mirrors the default STC layout (Mandatory
   * above tabs) but renders the redesigned InlineStudyCalendar inside the
   * Study Calendar tab instead of the legacy StudyCalendarPanel — useful
   * for A/B comparing the in-tab vs above-tabs calendar placements.
   */
  layoutVariant?:
    | 'default'
    | 'study-calendar-inline'
    | 'study-calendar-stacked'
    | 'study-calendar-in-tab'
}

/* ============================================================================
 * Per-brand Learning Path summaries
 *
 * Each brand carries 2–3 paths reflecting what its e-commerce site actually
 * sells. The first entry in each list is the brand's "default active" path —
 * what the banner / dashboard / nav badge resolve to when the URL doesn't
 * carry an `?id=`. Content sourced 2026-05-20 from:
 *   - cre: https://www.colibrirealestate.com (NC CE renewal — 8 hrs)
 *   - mckissock: https://www.mckissock.com (2026-2027 USPAP cycle)
 *   - elite: https://www.elitelearning.com/nursing/ (FL biennial 24 hrs)
 *   - stc: https://www.stcusa.com (Series 79 / 7 / 63 exam prep)
 * ========================================================================== */

const _LEARNING_PATHS_BY_BRAND: Record<Brand, LearningPathSummary[]> = {
  // XCEL Solutions — insurance licensing. Three paths: the flagship Life &
  // Health pre-licensing journey (the 3-Part Training Program, on-track), a
  // Property & Casualty pre-licensing path not yet started, and the separate
  // CE renewal cycle. The two pre-licensing paths carry an `examDate` rather
  // than a `licenseExpiresOn` — a candidate has no licence to expire yet.
  //
  // DECIDED 2026-09-04: `exam-prep` does NOT get a fourth path. The 3-Part
  // Program is ONE journey (Pre-License Education → Prep Review Course →
  // Exam Simulators), so the `exam-prep` education type rides THIS path and
  // frames Parts 2–3; only the progress persona differs. See the
  // `exam-prep` entry in dashboardProgressFixtures.
  xcel: [
    {
      id: 'xcel-fl-lh-prelicensing',
      title: 'Florida Life & Health Pre-Licensing',
      category: 'Insurance Pre-Licensing',
      state: 'FL',
      hours: 40,
      examDate: '06/12/2026',
      timeLeftLabel: '3 Weeks Left to Exam',
      progressPct: 30,
      lastViewedAt: '2026-05-19T08:15:00Z',
      mandatory: { completed: 12, required: 24 },
      elective: { completed: 0, required: 16 },
      // Adopts the in-tab Study Plan — XCEL is the second brand with one
      // (see `supportsStudyPlan`).
      layoutVariant: 'study-calendar-in-tab',
    },
    {
      id: 'xcel-fl-pc-prelicensing',
      title: 'Florida Property & Casualty Pre-Licensing',
      category: 'Insurance Pre-Licensing',
      state: 'FL',
      hours: 40,
      examDate: '09/04/2026',
      timeLeftLabel: '15 Weeks Left to Exam',
      progressPct: 0,
      lastViewedAt: '2026-04-28T10:00:00Z',
      mandatory: { completed: 0, required: 24 },
      elective: { completed: 0, required: 16 },
      layoutVariant: 'study-calendar-in-tab',
    },
    {
      id: 'xcel-fl-lh-ce',
      title: 'Florida Life & Health CE',
      category: 'Insurance Continuing Education',
      state: 'FL',
      hours: 24,
      licenseExpiresOn: '10/31/2026',
      // CE deadlines are NOT uniform across states — they can fall on the
      // licence anniversary or the licensee's date of birth, and are not
      // annual everywhere. This fixture picks one concrete date; do not
      // generalise it into a rule.
      timeLeftLabel: '22 Weeks Left to Renewal',
      progressPct: 25,
      lastViewedAt: '2026-05-12T14:00:00Z',
      mandatory: { completed: 5, required: 10 },
      elective: { completed: 1, required: 14 },
    },
  ],
}

export function learningPathsFor(brand: Brand): LearningPathSummary[] {
  return _LEARNING_PATHS_BY_BRAND[brand]
}

export function activePathIdFor(brand: Brand): string {
  return _LEARNING_PATHS_BY_BRAND[brand][0].id
}

/** Days from today until a `mm/dd/yyyy` date (negative when past), or `null`
 *  when the string is absent / unparseable. Used by the sheet for the
 *  expiring-soon / expired derivation + the Deadline sort. */
const MS_PER_DAY = 86_400_000
function daysUntilUsDate(value: string | undefined): number | null {
  if (!value) return null
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim())
  if (!m) return null
  const date = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]))
  if (Number.isNaN(date.getTime())) return null
  return Math.round((date.getTime() - Date.now()) / MS_PER_DAY)
}

/** A deadline within this many days reads as "expiring soon". */
const EXPIRING_SOON_DAYS = 30

/**
 * Resolve a path's sheet status. Honors an explicit `sheetStatus` (set on the
 * synthesized count-variant paths) first; otherwise derives it:
 *   - `completed`      → progress ≥ 100
 *   - `expired`        → the license deadline is in the past
 *   - `expiring-soon`  → the deadline is within {@link EXPIRING_SOON_DAYS}
 *   - `not-started`    → 0% progress
 *   - `in-progress`    → everything else
 */
export function sheetStatusFor(path: LearningPathSummary): LearningPathSheetStatus {
  if (path.sheetStatus) return path.sheetStatus
  if (path.progressPct >= 100) return 'completed'
  const days = daysUntilUsDate(path.licenseExpiresOn)
  if (days != null) {
    if (days < 0) return 'expired'
    if (days <= EXPIRING_SOON_DAYS) return 'expiring-soon'
  }
  if (path.progressPct === 0) return 'not-started'
  return 'in-progress'
}

/** Numeric days-to-deadline for the sheet's "Deadline (soonest)" sort.
 *  Completed paths (no live deadline) and paths without a parseable deadline
 *  sort last (Infinity); expired paths come back negative so they lead. */
export function sheetDeadlineDays(path: LearningPathSummary): number {
  if (sheetStatusFor(path) === 'completed') return Number.POSITIVE_INFINITY
  return daysUntilUsDate(path.licenseExpiresOn) ?? Number.POSITIVE_INFINITY
}

/** Back-compat export — resolved CRE, the LMS's default brand; now XCEL, which
 *  is both default and only. Prefer `learningPathsFor(brand)` in new code. */
export const LEARNING_PATHS: LearningPathSummary[] = _LEARNING_PATHS_BY_BRAND.xcel

/** ID of the path currently surfaced in the in-page banner / dashboard.
 *  Defaults to CRE — prefer `activePathIdFor(brand)` in new code. */
export const ACTIVE_PATH_ID = LEARNING_PATHS[0].id

/* ─── LearningPathCard — richer per-path snapshot for the Dashboard's
   "Your Learning Paths & Licenses" list. Decoupled from `LearningPathSummary`
   so the picker / banner can stay on the lean shape while the card surfaces
   enrolled / expires / time-spent / last-activity. */

export type LearningPathStatus =
  | 'not-started'
  | 'on-track'
  | 'at-risk'
  | 'behind'
  | 'completed'
  | 'expired'

export type CredentialType = 'CE' | 'License' | 'Path' | 'Post-Licensing' | 'Exam Prep'

export type LearningPathCardData = {
  id: string
  title: string
  programType: string
  credentialType: CredentialType
  jurisdiction: string
  totalHours: number
  status: LearningPathStatus
  progressPct: number
  hoursCompleted: number
  /** ISO YYYY-MM-DD or null when not yet enrolled. */
  enrolledDate: string | null
  /** ISO YYYY-MM-DD or null when no deadline set. */
  expiresDate: string | null
  daysLeftToComplete: number | null
  totalTimeSpent: { hours: number } | null
  lastActivityDays: number | null
  resumeUrl: string
}

// TODO(data): replace with real API once Learning Path service ships.
// Brand-aware path cards keep the dashboard's "Your Learning Paths & Licenses"
// list in sync with each brand's e-commerce catalog (see _LEARNING_PATHS_BY_BRAND).
const _LEARNING_PATH_CARDS_BY_BRAND: Record<Brand, LearningPathCardData[]> = {
  // XCEL — mirrors `_LEARNING_PATHS_BY_BRAND.xcel`. `jurisdiction` is the
  // licensing STATE (insurance is state-regulated), unlike STC's 'FINRA'.
  xcel: [
    {
      id: 'xcel-fl-lh-prelicensing',
      title: 'Florida Life & Health Pre-Licensing',
      programType: 'Insurance Pre-Licensing',
      credentialType: 'Exam Prep',
      jurisdiction: 'FL',
      totalHours: 40,
      status: 'on-track',
      progressPct: 30,
      hoursCompleted: 12,
      enrolledDate: '2026-02-16',
      expiresDate: '2026-06-12',
      daysLeftToComplete: 24,
      totalTimeSpent: { hours: 11 },
      lastActivityDays: 1,
      resumeUrl: '/my-learning/path?path=xcel-fl-lh-prelicensing',
    },
    {
      id: 'xcel-fl-pc-prelicensing',
      title: 'Florida Property & Casualty Pre-Licensing',
      programType: 'Insurance Pre-Licensing',
      credentialType: 'Exam Prep',
      jurisdiction: 'FL',
      totalHours: 40,
      status: 'not-started',
      progressPct: 0,
      hoursCompleted: 0,
      enrolledDate: null,
      expiresDate: null,
      daysLeftToComplete: 108,
      totalTimeSpent: null,
      lastActivityDays: null,
      resumeUrl: '/my-learning/path?path=xcel-fl-pc-prelicensing',
    },
    {
      id: 'xcel-fl-lh-ce',
      title: 'Florida Life & Health CE',
      programType: 'Insurance Continuing Education',
      credentialType: 'CE',
      jurisdiction: 'FL',
      totalHours: 24,
      status: 'on-track',
      progressPct: 25,
      hoursCompleted: 6,
      enrolledDate: '2026-01-08',
      expiresDate: '2026-10-31',
      daysLeftToComplete: 165,
      totalTimeSpent: { hours: 5.5 },
      lastActivityDays: 9,
      resumeUrl: '/my-learning/path?path=xcel-fl-lh-ce',
    },
  ],
}

export function learningPathCardsFor(brand: Brand): LearningPathCardData[] {
  return _LEARNING_PATH_CARDS_BY_BRAND[brand]
}

/** Back-compat export — defaults to CRE. Prefer `learningPathCardsFor(brand)`. */
export const LEARNING_PATH_CARDS: LearningPathCardData[] = _LEARNING_PATH_CARDS_BY_BRAND.xcel

/**
 * Convert a summary to the legacy PathBannerData shape.
 *
 * When `taskCounts` is provided (paths that have a Study Calendar), the
 * total-hours pill is swapped for a "X of Y Tasks Complete" pill so the
 * banner surfaces concrete progress instead of static catalog hours.
 * Paths without a calendar keep the hours pill as before.
 */
export function pathBannerData(
  path: LearningPathSummary,
  taskCounts?: { completed: number; total: number },
): PathBannerData {
  const progressPill = taskCounts
    ? `${taskCounts.completed} of ${taskCounts.total} Tasks Complete`
    : `${path.hours} Hours`
  return {
    title: `${path.title}  -  ${path.hours} Hours`,
    progressLabel: `${path.progressPct}% Complete`,
    progressPct: path.progressPct,
    pills: [
      path.category,
      ...(path.state ? [path.state] : []),
      progressPill,
      ...(path.licenseExpiresOn ? [`License Expires ${path.licenseExpiresOn}`] : []),
      ...(path.examDate ? [`Exam Date ${path.examDate}`] : []),
      ...(path.timeLeftLabel ? [path.timeLeftLabel] : []),
    ],
  }
}

/** Back-compat shim — existing consumers reach for this. */
export const ACTIVE_PATH: PathBannerData = pathBannerData(LEARNING_PATHS[0])

/**
 * @deprecated Demo user state now lives in `AccountContext` as
 * per-brand `DemoUser` fixtures, exposed via `useAccount().user`. This
 * back-compat shim is left in place for one release in case external
 * consumers reach for it; delete in the next iteration.
 */
export const MEMBER_USER = {
  firstName: 'Sarah',
  lastName: 'Cook',
  initials: 'SC',
  email: 'sarah.cook@gmail.com',
  avatarUrl: '/brand/sarah.jpg',
  quote:
    "Just learn a little more than I knew yesterday. I'm doing this for my family.",
  isMember: true,
  isPro: true,
}

/* ============================================================================
 * Per-brand Learning Path content — Mandatory courses, hours, and issued certs.
 *
 * Each brand's list is authored from the matching `src/data/catalog/<brand>.ts`
 * catalog so the Learning Path page reads as a coherent slice of that brand's
 * curriculum:
 *   - cre: real-estate broker / agent CE
 *   - mckissock: appraisal CE (USPAP, methods, fair housing)
 *   - elite: nursing CE (state-renewal modules)
 *   - stc: securities exam prep (SIE, Series 7/63/65/66)
 *
 * Consumers (LearningPathPage Mandatory section, ContinueLearningTabs Jump
 * Back In / What's Next, the Certificates panel) take a `brand` and use the
 * `*For(brand)` helpers below. Legacy default exports point at CRE so any
 * unupdated consumer keeps working.
 * ========================================================================== */

const _MANDATORY_BY_BRAND: Record<Brand, CourseCardData[]> = {
  // XCEL — the Part 1 (Pre-License Education) course list for the Life &
  // Health path, plus the Part 2 / Part 3 artefacts that unlock after it.
  //
  // NOTE the three Exam Simulators are authored as ordinary sequential
  // courses. XCEL unlocks each one only after the previous is complete, and
  // `CourseCardData` has no `prerequisite` / `locked` field to express that —
  // so the ORDER carries the dependency and nothing enforces it. Modelling it
  // properly is a follow-up, not something to fake with `gated` (which means
  // "not purchased", a different thing entirely).
  xcel: [
    {
      id: 'lp-xcel-lh-part1',
      title: 'Life & Health Pre-License Course',
      hours: 24,
      state: 'FL',
      delivery: 'online',
      badge: 'mandatory',
      status: 'in-progress',
      progress: 50,
    },
    {
      id: 'lp-xcel-lh-prep-review',
      title: 'Prep Review Course',
      hours: 8,
      state: 'FL',
      delivery: 'online',
      badge: 'mandatory',
    },
    {
      id: 'lp-xcel-sim-1',
      title: 'Exam Simulator 1',
      hours: 2,
      state: 'FL',
      delivery: 'online',
      badge: 'mandatory',
    },
    {
      id: 'lp-xcel-sim-2',
      title: 'Exam Simulator 2',
      hours: 2,
      state: 'FL',
      delivery: 'online',
      badge: 'mandatory',
    },
    {
      id: 'lp-xcel-sim-3',
      title: 'Exam Simulator 3',
      hours: 2,
      state: 'FL',
      delivery: 'online',
      badge: 'mandatory',
    },
    {
      id: 'lp-xcel-livestream',
      title: 'Livestream Exam Review',
      hours: 6,
      state: 'FL',
      delivery: 'video',
      badge: 'elective',
    },
    {
      id: 'lp-xcel-exam-cram',
      title: 'Exam Cram',
      hours: 2,
      state: 'FL',
      delivery: 'video',
      badge: 'elective',
    },
  ],
}

/**
 * Per-status progression for the seven Series 79 mandatory cards.
 * Mirrors `applyStatusOverride`'s calendar-task transformation so the
 * cards and the Study Calendar tell the same story when reviewers
 * flip the `study-calendar-status` feature flag.
 *
 * Each row is keyed by `CourseCardData.id` and carries one entry per
 * override variant. `match` is the default fixture state (Series 79's
 * natural pacing is "On Track", so `match` mirrors `on-track`).
 *
 * Cards earlier in the sequence (Study Manual → Class Recording)
 * progress first, matching the natural order a learner would tackle
 * the material.
 */
type CardStatusEntry = {
  status?: CourseCardData['status']
  progress?: CourseCardData['progress']
}

/**
 * Returns the per-brand Mandatory course list with image URLs applied.
 *
 * Pass `pathId` to scope to a specific Learning Path. Two STC-specific
 * overrides layer on top of the brand-wide list:
 *
 * - `series-79-15day` swaps the whole list for the seven Series 79
 *   Top-Off study materials (Study Manual, On Demands, Chapter
 *   Quizzes, Flashcards, Progress Exams, Final Exams, Class
 *   Recording) per stcusa.com's reference layout. Each card's
 *   `status` / `progress` is then layered on from
 *   `_SERIES_79_STATUS_PROGRESSION` keyed by `statusOverride`, so the
 *   same `study-calendar-status` feature flag that transforms the
 *   Study Calendar tasks downstream also drives the card statuses.
 * - The remaining 0%-progress paths in `STC_NOT_STARTED_PATH_IDS`
 *   strip `status` / `progress` from the shared brand list so cards
 *   render at 0% to match the path's 0% Complete banner.
 *
 * `statusOverride` is optional — when omitted (e.g., the dashboard's
 * static-data callers), Series 79 falls back to `'match'` so callers
 * outside the Learning Path page still get sensible defaults.
 */
/**
 * QE (qualifying / exam-prep / pre-licensing) course lists, keyed by the QE
 * demo path ids in `PROFILES.qe` (dashboardProgressFixtures). These
 * drive the Learning Path detail panel's course lists when the dashboard is in
 * QE mode. Mandatory-badge hours sum to the profile's `mandatoryReq`, elective
 * to `electiveReq`, so the panel's section totals line up with the gauge.
 * Representative demo curricula (CA salesperson pre-licensing · TX Licensed
 * Residential appraiser QE · FINRA SIE content outline).
 * TODO(data): swap ids/hrefs for the real per-jurisdiction QE catalog.
 */
const _QE_COURSES_BY_PATH_ID: Record<string, CourseCardData[]> = {
  // California real estate salesperson pre-licensing — 3 courses / 135 hrs.
  'cre-ca-re-qe': [
    { id: 'qe-cre-principles', title: 'Real Estate Principles', hours: 45, state: 'CA', delivery: 'online', badge: 'mandatory', status: 'completed', certificateHref: '/my-learning/certificates' },
    { id: 'qe-cre-practice', title: 'Real Estate Practice', hours: 45, state: 'CA', delivery: 'online', badge: 'mandatory', status: 'in-progress' },
    { id: 'qe-cre-finance', title: 'Real Estate Finance (Elective)', hours: 45, state: 'CA', delivery: 'online', badge: 'elective' },
  ],
  // Texas Licensed Residential appraiser qualifying education — 150 hrs.
  'mck-tx-appraiser-qe': [
    { id: 'qe-mck-principles', title: 'Basic Appraisal Principles', hours: 30, state: 'TX', delivery: 'online', badge: 'mandatory', status: 'completed', certificateHref: '/my-learning/certificates' },
    { id: 'qe-mck-procedures', title: 'Basic Appraisal Procedures', hours: 30, state: 'TX', delivery: 'online', badge: 'mandatory', status: 'in-progress' },
    { id: 'qe-mck-uspap', title: '15-Hour National USPAP Course', hours: 15, state: 'TX', delivery: 'online', badge: 'mandatory' },
    { id: 'qe-mck-market', title: 'Residential Market Analysis & Highest and Best Use', hours: 15, state: 'TX', delivery: 'online', badge: 'mandatory' },
    { id: 'qe-mck-site', title: 'Residential Site Valuation & Cost Approach', hours: 15, state: 'TX', delivery: 'online', badge: 'elective' },
    { id: 'qe-mck-sales', title: 'Residential Sales Comparison & Income Approaches', hours: 30, state: 'TX', delivery: 'online', badge: 'elective' },
    { id: 'qe-mck-report', title: 'Residential Report Writing & Case Studies', hours: 15, state: 'TX', delivery: 'online', badge: 'elective' },
  ],
  // FINRA Securities Industry Essentials (SIE) — content outline sections.
  'stc-sie-qe': [
    { id: 'qe-stc-capmarkets', title: 'Knowledge of Capital Markets', hours: 4, state: 'NY', delivery: 'online', badge: 'mandatory', status: 'completed' },
    { id: 'qe-stc-products', title: 'Understanding Products and Their Risks', hours: 6, state: 'NY', delivery: 'online', badge: 'mandatory', status: 'in-progress' },
    { id: 'qe-stc-trading', title: 'Trading, Customer Accounts & Prohibited Activities', hours: 6, state: 'NY', delivery: 'online', badge: 'mandatory' },
    { id: 'qe-stc-regframework', title: 'Overview of the Regulatory Framework', hours: 4, state: 'NY', delivery: 'online', badge: 'mandatory' },
    { id: 'qe-stc-practice', title: 'SIE Practice Exams', hours: 6, state: 'NY', delivery: 'online', badge: 'elective' },
    { id: 'qe-stc-readiness', title: 'SIE Final Readiness Review', hours: 4, state: 'NY', delivery: 'online', badge: 'elective' },
  ],
}

/** True when `pathId` is one of the QE (qualifying / exam-prep) demo paths that
 *  carries its own curriculum in `_QE_COURSES_BY_PATH_ID`. Lets the detail panel
 *  opt into deriving per-course statuses from the live progress breakdown. */
export function isQeDemoPath(pathId?: string): boolean {
  return Boolean(pathId && _QE_COURSES_BY_PATH_ID[pathId])
}

/**
 * Assign per-course statuses from a completed-hours budget: walking the list in
 * order, each course is `complete` while the budget covers its full hours,
 * `in-progress` for the one course the budget partially covers, then
 * `not-started`. Lets a course list react to a live gauge (e.g. the dashboard's
 * progress-state persona) instead of carrying fixed statuses. Pure — returns new
 * course objects, leaving the fixtures untouched.
 */
export function coursesWithDerivedStatus(
  courses: CourseCardData[],
  completedHours: number,
): CourseCardData[] {
  let budget = Math.max(0, completedHours)
  return courses.map((c) => {
    let status: CourseStatus
    let progress = c.progress
    if (budget >= c.hours) {
      status = 'completed'
      budget -= c.hours
    } else if (budget > 0) {
      status = 'in-progress'
      // Partial completion of THIS course = the leftover budget over its hours,
      // clamped to 1–99% so a derived in-progress row always shows a real, non-
      // zero, non-complete percentage in step with the gauge.
      progress = Math.max(1, Math.min(99, Math.round((budget / c.hours) * 100)))
      budget = 0
    } else {
      status = 'not-started'
    }
    return { ...c, status, progress }
  })
}

export function mandatoryCoursesFor(
  brand: Brand,
  pathId?: string,
  statusOverride: StatusOverride = 'match',
): CourseCardData[] {
  // QE demo paths have their own curricula (keyed by path id), independent of
  // the brand's CE list.
  if (pathId && _QE_COURSES_BY_PATH_ID[pathId]) {
    return _QE_COURSES_BY_PATH_ID[pathId].map((c, i) => ({ ...c, imageUrl: imageForIndex(i) }))
  }
  // Series 79 has its own dedicated 7-item lineup — short-circuit the
  // shared brand list entirely. Apply per-index hero images so the
  // cards still pick up the same imagery rotation other paths use,
  // then layer the per-status progression on top so the card states
  // react to the `study-calendar-status` feature flag.
  // STC's Series 79 15-day path had its own hand-authored card list, kept out
  // of the shared brand list because its curriculum did not fit the shape. It
  // went with the brand; XCEL's paths all come from `_MANDATORY_BY_BRAND`.
  const list = _MANDATORY_BY_BRAND[brand].map((c, i) => ({ ...c, imageUrl: imageForIndex(i) }))
  // The not-started override was STC-only (`STC_NOT_STARTED_PATH_IDS`), used to
  // render a path's cards at 0% while keeping their gated/purchase chips. No
  // XCEL path is in that set, so the branch is gone with the brand.
  return list
}

/**
 * Resolve a learning-path course id (from any brand's Mandatory/Elective list or
 * QE curriculum) to the fields the Learning Launcher header needs. Lets the
 * launcher open the ACTUAL course a learner clicked in the Learning Path detail
 * panel — these ids live in the learning fixtures, not the catalog, so the
 * catalog-only lookup would otherwise fall back to a representative course.
 * Returns `null` when the id isn't a learning-path course.
 */
export function findLearningCourseById(id: string): { title: string; states: string[] } | null {
  const all: CourseCardData[] = [
    ...Object.values(_MANDATORY_BY_BRAND).flat(),
    ...Object.values(_QE_COURSES_BY_PATH_ID).flat(),
  ]
  const c = all.find((x) => x.id === id)
  return c ? { title: c.title, states: c.state ? [c.state] : [] } : null
}

const _MANDATORY_HOURS_BY_BRAND: Record<Brand, { earned: number; required: number }> = {
 // USPAP 7 + Bias 7 federal mandatory
 // SIE + S7 prep hours
  xcel: { earned: 12, required: 40 }, // FL Life & Health pre-licensing hours
}

export function mandatoryHoursFor(brand: Brand): { earned: number; required: number } {
  return _MANDATORY_HOURS_BY_BRAND[brand]
}

/**
 * License-renewal requirements for a Learning Path, surfaced on the Learning
 * Path detail panel's Requirements tab (the board's rules + an hours facts box).
 * Keyed by path id; returns `undefined` when a path has no authored
 * requirements (the panel then shows a small empty state).
 *
 * TODO(data): replace the hand-authored copy with the real per-jurisdiction
 * CE-requirement service. Only the Elite Florida Nursing path is authored today.
 */
export type PathRequirements = {
  totalHours: number
  mandatoryHours: number
  electiveHours: number
  renewalCycleYears: number
  /** Heading above the rules list, e.g. the issuing board + cadence. */
  heading: string
  /** The board's renewal rules, one bullet each. */
  items: string[]
  /**
   * Optional richer breakdown rendered below the flat `items` summary — each
   * a titled sub-section (e.g. "First renewal — salesperson") with an optional
   * lead-in line + its own list of rules. For jurisdictions whose requirements
   * branch by scenario (first vs. subsequent renewal, license type, …).
   */
  sections?: { title: string; intro?: string; items: string[] }[]
  /** Optional closing caveat, rendered as a highlighted note (e.g. the
   *  CE-credit-expiry rule). */
  note?: string
}

const _PATH_REQUIREMENTS_BY_ID: Record<string, PathRequirements> = {
  'elite-fl-nursing-ce': {
    totalHours: 24,
    mandatoryHours: 9,
    electiveHours: 15,
    renewalCycleYears: 2,
    heading: 'Florida Board of Nursing — biennial CE requirements:',
    items: [
      '2 hours — Prevention of Medical Errors',
      '2 hours — Florida Laws and Rules governing nursing practice',
      '2 hours — Recognizing Impairment in the Workplace',
      '1 hour — Human Trafficking (one-time requirement)',
      '2 hours — Domestic Violence (every third renewal)',
      '15 hours — General / elective continuing education in the practice area',
      'One-time 1-hour HIV/AIDS course for first renewal after initial licensure',
    ],
  },
  // California salesperson/broker CE renewal (the CRE compliance-persona path).
  'cre-ca-re-ce': {
    totalHours: 45,
    mandatoryHours: 18,
    electiveHours: 27,
    renewalCycleYears: 4,
    heading: 'California DRE — CE renewal requirements at a glance:',
    items: [
      'Total CE — 45 hours per 4-year license period',
      'Consumer Protection — minimum 18 hours',
      'Mandatory subjects — included within the 45 hours',
      'Remaining hours — Consumer Protection or Consumer Service courses',
    ],
    sections: [
      {
        title: 'First renewal — salesperson',
        intro: 'The 45 hours must include:',
        items: [
          '3 hrs — Ethics',
          '3 hrs — Agency',
          '3 hrs — Trust Fund Handling',
          '3 hrs — Risk Management',
          '3 hrs — Fair Housing (must include an interactive/participatory component with role-play)',
          '2 hrs — Implicit Bias',
          '18+ hrs — Consumer Protection',
          'Remaining hours — Consumer Protection or Consumer Service',
        ],
      },
      {
        title: 'First renewal — broker',
        intro: 'Same as the salesperson requirements, plus one additional mandatory subject:',
        items: ['3 hrs — Management & Supervision'],
      },
      {
        title: 'Second or subsequent renewal',
        intro: '45 total hours, structured as:',
        items: [
          'A 9-hour survey course covering the seven mandatory subjects — Ethics, Agency, Trust Fund Handling, Risk Management, Management & Supervision, Fair Housing, Implicit Bias — or individual courses covering those subjects',
          'At least 18 hours — Consumer Protection',
          'Remaining hours — Consumer Protection or Consumer Service',
        ],
      },
    ],
    note: 'CE must be completed during the applicable 4-year license period. Courses from a previous renewal generally can’t be reused — CE credit expires four years after completion.',
  },
  // ── QE (qualifying / exam-prep) requirements. `renewalCycleYears: 0` — no
  //    renewal cycle applies pre-licensure, so the panel hides that fact. ──
  'cre-ca-re-qe': {
    totalHours: 135,
    mandatoryHours: 90,
    electiveHours: 45,
    renewalCycleYears: 0,
    heading: 'California DRE — salesperson pre-licensing requirements:',
    items: [
      '45 hours — Real Estate Principles (required)',
      '45 hours — Real Estate Practice (required)',
      '45 hours — one approved statutory elective course',
      'Pass the course final exams, then sit for the state salesperson exam',
    ],
  },
  'mck-tx-appraiser-qe': {
    totalHours: 150,
    mandatoryHours: 90,
    electiveHours: 60,
    renewalCycleYears: 0,
    heading: 'TALCB — Licensed Residential appraiser qualifying education:',
    items: [
      '30 hours — Basic Appraisal Principles',
      '30 hours — Basic Appraisal Procedures',
      '15 hours — National USPAP Course',
      '75 hours — residential market analysis, valuation, and report-writing coursework',
      'Complete required experience hours, then pass the National exam',
    ],
  },
  'stc-sie-qe': {
    totalHours: 30,
    mandatoryHours: 20,
    electiveHours: 10,
    renewalCycleYears: 0,
    heading: 'FINRA — Securities Industry Essentials (SIE) exam prep:',
    items: [
      'Knowledge of Capital Markets',
      'Understanding Products and Their Risks',
      'Trading, Customer Accounts & Prohibited Activities',
      'Overview of the Regulatory Framework',
      'Practice exams + a final readiness review before scheduling the SIE',
    ],
  },
}

/** Renewal requirements for a path, or `undefined` when none are authored. The
 *  `brand` arg is accepted for parity with the other `*For` selectors + future
 *  per-brand defaults; lookup is by path id today. */
export function pathRequirementsFor(
  _brand: Brand,
  pathId: string,
): PathRequirements | undefined {
  return _PATH_REQUIREMENTS_BY_ID[pathId]
}

const _CERTS_BY_BRAND: Record<Brand, CertSmallData[]> = {
  // XCEL — the certificates a licensing candidate + a renewing producer
  // accumulate: the pre-licensing completions each state requires before you
  // may sit the exam, then the CE topics. Titles follow XCEL's own lines of
  // authority and CE structure (Initial vs. Refresher Training, with annuity
  // and long-term care added for L&H and flood for P&C).
  xcel: [
    { id: 'xcel-cert-1', title: 'Life & Health Pre-Licensing — Completion', hours: 40, tier: 'mandatory' },
    { id: 'xcel-cert-2', title: 'Property & Casualty Pre-Licensing — Completion', hours: 40, tier: 'mandatory' },
    { id: 'xcel-cert-3', title: 'Personal Lines Pre-Licensing — Completion', hours: 20, tier: 'elective' },
    { id: 'xcel-cert-4', title: 'Annuity Initial Training', hours: 4, tier: 'designated-mandatory' },
    { id: 'xcel-cert-5', title: 'Long-Term Care Initial Training', hours: 8, tier: 'designated-mandatory' },
    { id: 'xcel-cert-6', title: 'Long-Term Care Refresher Training', hours: 4, tier: 'elective' },
    { id: 'xcel-cert-7', title: 'Flood Insurance (NFIP) Training', hours: 3, tier: 'elective' },
    { id: 'xcel-cert-8', title: 'Insurance Ethics', hours: 5, tier: 'mandatory' },
  ],
}

export function issuedCertificatesFor(brand: Brand): CertSmallData[] {
  return _CERTS_BY_BRAND[brand]
}

/* Legacy default exports — they pointed at CRE, the LMS's default brand, so
   any unupdated consumer still worked. They resolve XCEL now, which is both the
   default and the only brand. Prefer the `*For(brand)` helpers above. */
export const MANDATORY_COURSES = mandatoryCoursesFor('xcel')
export const MANDATORY_HOURS = _MANDATORY_HOURS_BY_BRAND.xcel
export const ISSUED_CERTIFICATES = _CERTS_BY_BRAND.xcel
