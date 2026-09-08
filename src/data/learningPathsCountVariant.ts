import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  learningPathCardsFor,
  learningPathsFor,
  type LearningPathCardData,
  type LearningPathCategoryBreakdown,
  type LearningPathSheetStatus,
  type LearningPathStatus,
  type LearningPathSummary,
} from '@/data/learningFixtures'

/**
 * Build a Mandatory / Elective split (9 + 15 = 24 required hrs, mirroring the
 * Elite biennial shape) whose completed hours land on `progressPct`, returning
 * the breakdown plus the % the widget will derive from it. Synthesized paths use
 * this so they (a) always show the Mandatory/Elective lines and (b) have their
 * panel bar (`progressPct`) match the widget's breakdown-derived gauge exactly.
 */
function syncedBreakdown(progressPct: number): {
  mandatory: LearningPathCategoryBreakdown
  elective: LearningPathCategoryBreakdown
  progressPct: number
} {
  const mReq = 9
  const eReq = 15
  const total = mReq + eReq
  const completed = Math.round((progressPct / 100) * total)
  const mDone = Math.min(mReq, completed)
  const eDone = Math.min(eReq, Math.max(0, completed - mDone))
  return {
    mandatory: { completed: mDone, required: mReq },
    elective: { completed: eDone, required: eReq },
    progressPct: Math.round(((mDone + eDone) / total) * 100),
  }
}

/**
 * Demo-tools wiring for the `learning-paths-count` feature flag (defined
 * in `FeatureFlagContext`). Lets reviewers see how the dashboard's
 * Learning Paths count badge + the "My Learning Paths" slide-over look
 * when a learner has 1 / 2-3 / 10-12 / 40+ paths.
 *
 * Scope: only the dashboard's LP card and the shared slide-over picker
 * read these helpers. The LP detail page, Study Calendar, and Header
 * nav-dropdown intentionally keep the raw `learningPathsFor(brand)` so
 * the synthetic ids never land on a missing-path lookup.
 */

export const LEARNING_PATHS_COUNT_FLAG_KEY = 'learning-paths-count'

export type LearningPathsCountVariant = 'one' | 'realistic' | 'many' | 'lots'

/** Target list size per variant. `realistic` returns whatever the
 *  brand's authored fixture already has (today: 3). */
const TARGET_SIZE: Record<Exclude<LearningPathsCountVariant, 'realistic'>, number> = {
  one: 1,
  many: 11,
  lots: 42,
}

/** Title suffixes used to keep synthesized paths from reading as
 *  identical clones. The pool rotates through cohort labels, study
 *  modes, and module numbers so the slide-over reads like a real
 *  crowded list rather than the same three titles repeated. */
const TITLE_SUFFIXES = [
  '— Spring Cohort',
  '— Summer Cohort',
  '— Fall Cohort',
  '— Refresher',
  '— Fast Track',
  '— Practice Set',
  '— Audit Mode',
  '— Module 2',
  '— Module 3',
  '— Module 4',
  '— Advanced Track',
  '— Self-Paced',
]

/** License-state rotation for synthesized paths — a spread of real 2-letter
 *  state codes so a padded list reads as a multi-state license portfolio. Base
 *  paths keep their authored state; only the synthesized clones rotate through
 *  this pool. With the `lots` (40+) / `many` (10–12) count variants this yields
 *  well over six distinct states, so the Learning Paths landing State filter
 *  collapses behind its "Show all (N)" expander. */
const STATE_ROTATION = [
  'CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI',
  'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI',
]

/** Status rotation for synthesized paths — skips `expired` so a heavy
 *  list doesn't read as "all my enrollments are dead". */
const STATUS_ROTATION: LearningPathStatus[] = [
  'on-track',
  'at-risk',
  'behind',
  'not-started',
  'on-track',
  'completed',
]

/** Progress values matched to the status above (index-aligned). */
const PROGRESS_ROTATION = [62, 28, 15, 0, 78, 100]

/** Days since last activity, cycled to vary the picker's metadata. */
const LAST_ACTIVITY_ROTATION: (number | null)[] = [0, 1, 3, 7, 14, 21, 45, null]

/** Sheet-status spread for synthesized summaries — ensures the padded picker
 *  shows all five statuses, with a few **Expiring soon** + **Expired** entries
 *  so the My Learning Paths sheet's colored chips + per-card states are
 *  demoable (the old rotation skipped both). */
const SHEET_STATUS_ROTATION: LearningPathSheetStatus[] = [
  'in-progress',
  'expiring-soon',
  'completed',
  'not-started',
  'expired',
  'in-progress',
  'expiring-soon',
]

// Display dates per status (mm/dd/yyyy). Expired sit clearly in the past,
// expiring-soon just ahead, in-progress / not-started further out, completed a
// recent past date — so both the colored states and the Deadline sort read
// correctly across the demo period regardless of the exact run date.
const EXPIRED_DATES = ['11/30/2024', '03/31/2025', '08/31/2024', '01/31/2025']
const EXPIRING_DATES = ['07/05/2026', '07/14/2026', '06/29/2026', '07/21/2026']
const EXPIRING_DAYS = [12, 19, 5, 26]
const FUTURE_DATES = ['03/31/2027', '08/31/2027', '11/30/2027', '06/30/2027']
const COMPLETED_DATES = ['02/15/2026', '04/30/2026', '11/20/2025', '05/10/2026']
// When the path was actually finished — a bit before its license expiry above.
const COMPLETED_ON_DATES = ['12/20/2025', '02/28/2026', '10/15/2025', '03/22/2026']
const IN_PROGRESS_PCT = [62, 45, 34, 72]
const EXPIRING_PCT = [27, 13, 19, 8]
const EXPIRED_PCT = [56, 40, 12, 33]

/** Status-dependent summary fields for a synthesized path, keyed off its
 *  rotated sheet status + index. */
function sheetFieldsFor(
  status: LearningPathSheetStatus,
  i: number,
): Pick<
  LearningPathSummary,
  'sheetStatus' | 'progressPct' | 'licenseExpiresOn' | 'timeLeftLabel' | 'completedOn'
> {
  const k = i % 4
  switch (status) {
    case 'completed':
      return {
        sheetStatus: 'completed',
        progressPct: 100,
        licenseExpiresOn: COMPLETED_DATES[k],
        timeLeftLabel: undefined,
        completedOn: COMPLETED_ON_DATES[k],
      }
    case 'expired':
      return {
        sheetStatus: 'expired',
        progressPct: EXPIRED_PCT[k],
        licenseExpiresOn: EXPIRED_DATES[k],
        timeLeftLabel: undefined,
        completedOn: undefined,
      }
    case 'expiring-soon':
      return {
        sheetStatus: 'expiring-soon',
        progressPct: EXPIRING_PCT[k],
        licenseExpiresOn: EXPIRING_DATES[k],
        timeLeftLabel: `${EXPIRING_DAYS[k]} Days Left to Complete`,
        completedOn: undefined,
      }
    case 'not-started':
      return {
        sheetStatus: 'not-started',
        progressPct: 0,
        licenseExpiresOn: FUTURE_DATES[k],
        timeLeftLabel: `${120 + i} Days Left to Complete`,
        completedOn: undefined,
      }
    case 'in-progress':
    default:
      return {
        sheetStatus: 'in-progress',
        progressPct: IN_PROGRESS_PCT[k],
        licenseExpiresOn: FUTURE_DATES[k],
        timeLeftLabel: `${90 + i} Days Left to Complete`,
        completedOn: undefined,
      }
  }
}

/** Resolve the variant string from the flag system into our typed
 *  union, defaulting to `realistic` for unknown / undefined values. */
function normalizeVariant(raw: string | undefined): LearningPathsCountVariant {
  if (raw === 'one' || raw === 'many' || raw === 'lots') return raw
  return 'realistic'
}

/** Build a synthesized title from a base title + cycle index. */
function syntheticTitle(baseTitle: string, cycleIndex: number): string {
  const suffix = TITLE_SUFFIXES[cycleIndex % TITLE_SUFFIXES.length]
  return `${baseTitle} ${suffix}`
}

/** Inflate a `LearningPathCardData[]` to the target count by cloning
 *  base entries with rotated status / progress / last-activity so the
 *  list reads as varied rather than identical. */
function padCards(base: LearningPathCardData[], target: number): LearningPathCardData[] {
  if (base.length === 0 || base.length >= target) return base.slice(0, target)
  const out: LearningPathCardData[] = [...base]
  for (let i = base.length; i < target; i += 1) {
    const template = base[i % base.length]
    const cycle = Math.floor(i / base.length)
    const status = STATUS_ROTATION[i % STATUS_ROTATION.length]
    const progressPct = PROGRESS_ROTATION[i % PROGRESS_ROTATION.length]
    const hoursCompleted = Math.round((template.totalHours * progressPct) / 100)
    const lastActivityDays =
      LAST_ACTIVITY_ROTATION[i % LAST_ACTIVITY_ROTATION.length]
    out.push({
      ...template,
      id: `${template.id}--demo-${i}`,
      title: syntheticTitle(template.title, cycle - 1),
      status,
      progressPct,
      hoursCompleted,
      lastActivityDays,
      // Route the resume URL back at the template so a click from the
      // dashboard card (the synthesized ones won't be the topPath, but
      // be defensive anyway) lands somewhere real.
      resumeUrl: template.resumeUrl,
    })
  }
  return out
}

/** Inflate a `LearningPathSummary[]` to the target count. Mirrors
 *  `padCards` so the slide-over picker stays in sync with the
 *  dashboard count. */
function padSummaries(
  base: LearningPathSummary[],
  target: number,
): LearningPathSummary[] {
  if (base.length === 0 || base.length >= target) return base.slice(0, target)
  const out: LearningPathSummary[] = [...base]
  // Spread `lastViewedAt` backward in time so "Recently Viewed" sort
  // keeps real paths near the top.
  const baseTime = base[0]?.lastViewedAt
    ? new Date(base[0].lastViewedAt).getTime()
    : Date.now()
  for (let i = base.length; i < target; i += 1) {
    const template = base[i % base.length]
    const cycle = Math.floor(i / base.length)
    const status = SHEET_STATUS_ROTATION[i % SHEET_STATUS_ROTATION.length]
    const statusFields = sheetFieldsFor(status, i)
    // A Mandatory/Elective split that matches the status's progress, so every
    // synthesized path shows the breakdown lines + its panel bar matches the
    // widget gauge (overrides the breakdown inherited from the template).
    const breakdown = syncedBreakdown(statusFields.progressPct)
    const daysBack = i * 2
    const lastViewedAt = new Date(baseTime - daysBack * 86_400_000).toISOString()
    out.push({
      ...template,
      id: `${template.id}--demo-${i}`,
      title: syntheticTitle(template.title, cycle - 1),
      lastViewedAt,
      // Drop demo-flow + badge so synthesized entries don't masquerade
      // as the Create-Calendar demo path.
      kind: undefined,
      demoFlow: undefined,
      pathTitleBadge: undefined,
      // Rotate the license state so a padded list reads as a multi-state
      // portfolio (drives the Learning Paths landing State filter + its
      // "Show all" expander). Base paths keep their authored state.
      state: STATE_ROTATION[i % STATE_ROTATION.length],
      // Spread sheet statuses (incl Expiring soon + Expired) + matching
      // progress / deadline so the picker reads as a varied real list.
      ...statusFields,
      // …then the synced breakdown (overrides progressPct + the inherited split).
      ...breakdown,
    })
  }
  return out
}

export function applyCountVariantToCards(
  base: LearningPathCardData[],
  variant: LearningPathsCountVariant,
): LearningPathCardData[] {
  if (variant === 'realistic') return base
  if (variant === 'one') return base.slice(0, 1)
  return padCards(base, TARGET_SIZE[variant])
}

export function applyCountVariantToSummaries(
  base: LearningPathSummary[],
  variant: LearningPathsCountVariant,
): LearningPathSummary[] {
  if (variant === 'realistic') return base
  if (variant === 'one') return base.slice(0, 1)
  return padSummaries(base, TARGET_SIZE[variant])
}

/** Dashboard hook — returns the brand's LP cards, transformed by the
 *  active count variant. */
export function useLearningPathCardsForBrand(): LearningPathCardData[] {
  const { brand } = useAccount()
  const flag = useFeatureFlag(LEARNING_PATHS_COUNT_FLAG_KEY)
  // Default to a single path — the multi-path experience is opt-in (the Demo
  // Controls "Multiple learning paths" persona, or the flag set to a higher
  // count), so a disabled/unset flag reads as one path, not the authored 3.
  const variant = flag.enabled
    ? normalizeVariant(flag.variant)
    : 'one'
  return applyCountVariantToCards(learningPathCardsFor(brand), variant)
}

/** Slide-over picker hook — returns the brand's LP summaries,
 *  transformed by the active count variant. */
export function useLearningPathSummariesForBrand(): LearningPathSummary[] {
  const { brand } = useAccount()
  const flag = useFeatureFlag(LEARNING_PATHS_COUNT_FLAG_KEY)
  // Single path by default (see useLearningPathCardsForBrand) — multi is opt-in.
  const variant = flag.enabled
    ? normalizeVariant(flag.variant)
    : 'one'
  return applyCountVariantToSummaries(learningPathsFor(brand), variant)
}
