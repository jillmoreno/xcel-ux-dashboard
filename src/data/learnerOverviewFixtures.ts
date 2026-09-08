// TODO(data): replace with real Learner Overview API integration once the
// momentum / engagement service ships. The streak data is conceptually a
// single number per learner (aggregated across paths) — do not introduce
// per-path streak counters here.

import type { Brand } from '@/context/AccountContext'
import {
  Award,
  BadgeCheckThin,
  BookOpen,
  CalendarDay,
  CalendarPen,
  Crown,
  Gem,
  GraduationCap,
} from '@/icons'

export type StreakActivity = {
  /** ISO date string (YYYY-MM-DD) for the most recent 30 days, oldest first. */
  date: string
  /** Whether the learner logged any activity that day. */
  active: boolean
  /**
   * Minutes of learning activity logged that day. Optional so older
   * fixtures and snapshot tests don't break — components that need it
   * fall back to `active ? 1 : 0`.
   *
   * TODO(data): real API should always populate this. The fallback
   * path is for transition only.
   */
  minutes?: number
}

/** Intensity buckets, in minutes. Tune with the analytics team — these
 *  are placeholders that produced a readable distribution against the
 *  current demo fixture. */
export const STREAK_INTENSITY = {
  none: 0, // inactive
  low: 15, // < 15 min
  medium: 45, // 15 – 44 min
  high: 60, // 45 – 59 min
  // ≥ 60 min → "very high"
} as const

export type IntensityLevel = 'none' | 'low' | 'medium' | 'high' | 'veryHigh'

/** Bucketizes a minutes value into one of five intensity levels. The
 *  bar-chart Zone B in the Streak Hero reads from this — bar color +
 *  height are driven by the resulting level, not by the raw minutes. */
export function intensityLevelForMinutes(min: number): IntensityLevel {
  if (min <= 0) return 'none'
  if (min < STREAK_INTENSITY.low) return 'low'
  if (min < STREAK_INTENSITY.medium) return 'medium'
  if (min < STREAK_INTENSITY.high) return 'high'
  return 'veryHigh'
}

export type LearningStreak = {
  current: number // consecutive active days
  longest: number // all-time best
  lastActivityDate: string // ISO YYYY-MM-DD — used to derive Today/Yesterday/N days ago
  daysThisWeek: number // 0..7, derived but stored for fixture clarity
  bestStreakThisMonth: number
  recent30: StreakActivity[]
}

/**
 * @deprecated TODO(deprecate): The `Milestone` taxonomy was superseded by
 * the richer `Achievement` model in `src/data/achievements/`. The new
 * model carries category, status, progress, rarity, and unlock-condition
 * fields the dashboard widget + Passport page both need. Keep this type
 * exported for one release so external consumers (none in-repo at time
 * of writing) have a migration window; delete in the release after.
 */
export type MilestoneIconKey =
  | 'streak7'
  | 'streak30'
  | 'firstCert'
  | 'fiveCourses'
  | 'renewed'
  | 'pathDone'
  | 'premium1y'
  | 'streak100'

/**
 * @deprecated TODO(deprecate): see `MilestoneIconKey` above.
 */
export type Milestone = {
  id: string
  title: string
  /** ISO YYYY-MM-DD; omit for locked. */
  earnedOn?: string
  iconKey: MilestoneIconKey
  locked?: boolean
}

// 30 days ending 2026-05-20 (today). CRE demo: a 5-day current streak
// well below the all-time PB of 41 ("36 days to beat it"). The trailing
// five days (May 16 → 20) are active; May 15 is the streak-breaking
// inactive day. Earlier in the month: several short 3–4 day runs
// interleaved with rest days, giving the bar chart visible texture.
export const LEARNING_STREAK: LearningStreak = {
  current: 5,
  longest: 41,
  lastActivityDate: '2026-05-20',
  daysThisWeek: 5,
  bestStreakThisMonth: 5,
  recent30: [
    { date: '2026-04-21', active: true, minutes: 22 },
    { date: '2026-04-22', active: true, minutes: 18 },
    { date: '2026-04-23', active: false, minutes: 0 },
    { date: '2026-04-24', active: true, minutes: 35 },
    { date: '2026-04-25', active: true, minutes: 28 },
    { date: '2026-04-26', active: true, minutes: 50 },
    { date: '2026-04-27', active: false, minutes: 0 },
    { date: '2026-04-28', active: true, minutes: 12 },
    { date: '2026-04-29', active: true, minutes: 30 },
    { date: '2026-04-30', active: true, minutes: 65 },
    { date: '2026-05-01', active: true, minutes: 25 },
    { date: '2026-05-02', active: false, minutes: 0 },
    { date: '2026-05-03', active: false, minutes: 0 },
    { date: '2026-05-04', active: true, minutes: 15 },
    { date: '2026-05-05', active: true, minutes: 40 },
    { date: '2026-05-06', active: true, minutes: 55 },
    { date: '2026-05-07', active: true, minutes: 28 },
    { date: '2026-05-08', active: true, minutes: 72 },
    { date: '2026-05-09', active: false, minutes: 0 },
    { date: '2026-05-10', active: true, minutes: 18 },
    { date: '2026-05-11', active: true, minutes: 33 },
    { date: '2026-05-12', active: true, minutes: 21 },
    { date: '2026-05-13', active: true, minutes: 8 },
    { date: '2026-05-14', active: false, minutes: 0 },
    { date: '2026-05-15', active: false, minutes: 0 }, // streak break
    { date: '2026-05-16', active: true, minutes: 32 }, // current streak starts
    { date: '2026-05-17', active: true, minutes: 45 },
    { date: '2026-05-18', active: true, minutes: 28 },
    { date: '2026-05-19', active: true, minutes: 52 },
    { date: '2026-05-20', active: true, minutes: 65 }, // today
  ],
}

/**
 * The trailing 7 days of activity, Sunday → Saturday in the user's local
 * week. Drives the Streak Hero's right zone. CRE default — matches the
 * last 7 entries of `LEARNING_STREAK.recent30` above (5 active days,
 * with Sun + Mon inactive as the streak-breaking days). Per-brand
 * variants live in `_STREAK_THIS_WEEK_BY_BRAND` below.
 *
 * TODO(data): when the real API ships, return either the 7-cell array
 * verbatim or `recent30` and have the component slice — pick whichever
 * the engagement service produces natively.
 */
export const STREAK_THIS_WEEK: ReadonlyArray<StreakActivity> = [
  { date: '2026-05-14', active: false }, // Sun — streak break
  { date: '2026-05-15', active: false }, // Mon — streak break
  { date: '2026-05-16', active: true }, // Tue — current streak starts
  { date: '2026-05-17', active: true }, // Wed
  { date: '2026-05-18', active: true }, // Thu
  { date: '2026-05-19', active: true }, // Fri
  { date: '2026-05-20', active: true }, // Sat — today
]

/* ─── Per-brand streak variants ───────────────────────────────────────
 *
 * Each brand shows a different streak narrative so the demo surfaces
 * the full caption matrix + intensity range across the four brands:
 *
 *   - CRE        →  5 / 41   ("36 days to beat it"; mid-window recovery)
 *   - McKissock  → 14 / 14   ("Tied with your personal best")
 *   - Elite      → 22 / 18   ("New personal best · 4 days ahead")
 *   - STC        →  0 / 35   ("Start a new streak today" — lapsed)
 *
 * CRE pulls from `LEARNING_STREAK` / `STREAK_THIS_WEEK` above so tests
 * that mock those exports still affect the default (cre) brand. The
 * other three brands live in the maps below; `learningStreakFor(brand)`
 * + `streakThisWeekFor(brand)` route to the right one.
 * ─────────────────────────────────────────────────────────────────── */


const _MCK_THIS_WEEK: ReadonlyArray<StreakActivity> = [
  { date: '2026-05-14', active: true },
  { date: '2026-05-15', active: true },
  { date: '2026-05-16', active: true },
  { date: '2026-05-17', active: true },
  { date: '2026-05-18', active: true },
  { date: '2026-05-19', active: true },
  { date: '2026-05-20', active: true },
]

// Elite — 22-day streak, longest 18. "New personal best · 4 days ahead."
// April 28 is the last inactive day; from April 29 onward the strip is
// solid active days with healthy intensity, including a couple of 60+
// power sessions.
const _ELITE_STREAK: LearningStreak = {
  current: 22,
  longest: 18,
  lastActivityDate: '2026-05-20',
  daysThisWeek: 7,
  bestStreakThisMonth: 22,
  recent30: [
    { date: '2026-04-21', active: false, minutes: 0 },
    { date: '2026-04-22', active: true, minutes: 22 },
    { date: '2026-04-23', active: true, minutes: 30 },
    { date: '2026-04-24', active: false, minutes: 0 },
    { date: '2026-04-25', active: true, minutes: 18 },
    { date: '2026-04-26', active: false, minutes: 0 },
    { date: '2026-04-27', active: true, minutes: 25 },
    { date: '2026-04-28', active: false, minutes: 0 }, // streak break
    { date: '2026-04-29', active: true, minutes: 20 }, // 22-day streak begins
    { date: '2026-04-30', active: true, minutes: 35 },
    { date: '2026-05-01', active: true, minutes: 40 },
    { date: '2026-05-02', active: true, minutes: 28 },
    { date: '2026-05-03', active: true, minutes: 55 },
    { date: '2026-05-04', active: true, minutes: 32 },
    { date: '2026-05-05', active: true, minutes: 45 },
    { date: '2026-05-06', active: true, minutes: 22 },
    { date: '2026-05-07', active: true, minutes: 65 },
    { date: '2026-05-08', active: true, minutes: 38 },
    { date: '2026-05-09', active: true, minutes: 50 },
    { date: '2026-05-10', active: true, minutes: 28 },
    { date: '2026-05-11', active: true, minutes: 42 },
    { date: '2026-05-12', active: true, minutes: 30 },
    { date: '2026-05-13', active: true, minutes: 58 },
    { date: '2026-05-14', active: true, minutes: 35 },
    { date: '2026-05-15', active: true, minutes: 48 },
    { date: '2026-05-16', active: true, minutes: 25 },
    { date: '2026-05-17', active: true, minutes: 52 },
    { date: '2026-05-18', active: true, minutes: 40 },
    { date: '2026-05-19', active: true, minutes: 62 },
    { date: '2026-05-20', active: true, minutes: 75 }, // today, new PB
  ],
}

const _ELITE_THIS_WEEK: ReadonlyArray<StreakActivity> = [
  { date: '2026-05-14', active: true },
  { date: '2026-05-15', active: true },
  { date: '2026-05-16', active: true },
  { date: '2026-05-17', active: true },
  { date: '2026-05-18', active: true },
  { date: '2026-05-19', active: true },
  { date: '2026-05-20', active: true },
]

// STC — 0-day current streak, longest 35. "Start a new streak today."
// Several small streaks earlier in the month including a 4-day run
// ending May 15. From May 16 → 20 the user lapsed — 5 consecutive days
// inactive, today included. The PB lives outside this 30-day window.
const _STC_STREAK: LearningStreak = {
  current: 0,
  longest: 35,
  lastActivityDate: '2026-05-20',
  daysThisWeek: 2,
  bestStreakThisMonth: 4,
  recent30: [
    { date: '2026-04-21', active: true, minutes: 15 },
    { date: '2026-04-22', active: true, minutes: 25 },
    { date: '2026-04-23', active: true, minutes: 30 },
    { date: '2026-04-24', active: true, minutes: 40 },
    { date: '2026-04-25', active: true, minutes: 35 },
    { date: '2026-04-26', active: true, minutes: 28 },
    { date: '2026-04-27', active: true, minutes: 45 }, // 7-day run ends here
    { date: '2026-04-28', active: false, minutes: 0 },
    { date: '2026-04-29', active: true, minutes: 12 },
    { date: '2026-04-30', active: true, minutes: 20 },
    { date: '2026-05-01', active: true, minutes: 15 },
    { date: '2026-05-02', active: true, minutes: 30 },
    { date: '2026-05-03', active: false, minutes: 0 },
    { date: '2026-05-04', active: false, minutes: 0 },
    { date: '2026-05-05', active: true, minutes: 10 },
    { date: '2026-05-06', active: true, minutes: 25 },
    { date: '2026-05-07', active: true, minutes: 35 },
    { date: '2026-05-08', active: true, minutes: 40 },
    { date: '2026-05-09', active: false, minutes: 0 },
    { date: '2026-05-10', active: false, minutes: 0 },
    { date: '2026-05-11', active: false, minutes: 0 },
    { date: '2026-05-12', active: true, minutes: 18 },
    { date: '2026-05-13', active: true, minutes: 22 },
    { date: '2026-05-14', active: true, minutes: 30 },
    { date: '2026-05-15', active: true, minutes: 15 }, // last activity
    { date: '2026-05-16', active: false, minutes: 0 }, // lapse begins
    { date: '2026-05-17', active: false, minutes: 0 },
    { date: '2026-05-18', active: false, minutes: 0 },
    { date: '2026-05-19', active: false, minutes: 0 },
    { date: '2026-05-20', active: false, minutes: 0 }, // today, still no activity
  ],
}

const _STC_THIS_WEEK: ReadonlyArray<StreakActivity> = [
  { date: '2026-05-14', active: true },
  { date: '2026-05-15', active: true },
  { date: '2026-05-16', active: false },
  { date: '2026-05-17', active: false },
  { date: '2026-05-18', active: false },
  { date: '2026-05-19', active: false },
  { date: '2026-05-20', active: false }, // today — "not yet"
]

/** Streak fixture. XCEL already resolved to the exported `LEARNING_STREAK` —
 *  it had no case of its own and fell to `default` — so this is the same data
 *  it always rendered, not a substitution. Kept exported so tests that mock
 *  that export still affect the render. */
export function learningStreakFor(_brand: Brand): LearningStreak {
  return LEARNING_STREAK
}

/** "This week" fixture. Same note as `learningStreakFor`: XCEL fell to the
 *  `default` arm, so `STREAK_THIS_WEEK` is unchanged behaviour. */
export function streakThisWeekFor(_brand: Brand): ReadonlyArray<StreakActivity> {
  return STREAK_THIS_WEEK
}

/**
 * @deprecated TODO(deprecate): Replaced by `ACHIEVEMENT_CATALOG` (static
 * brand-agnostic definitions) + the per-brand `userStateMapFor` maps in
 * `src/data/achievements/byBrand.ts`. The dashboard widget reads the new
 * shape via `achievementsFor(brand)`. Kept for one release for any
 * downstream consumer; delete next.
 */
export const MILESTONES: Milestone[] = [
  { id: 'm-streak-7', title: '7-day streak', earnedOn: '2026-04-15', iconKey: 'streak7' },
  { id: 'm-first-cert', title: 'First certificate earned', earnedOn: '2026-03-02', iconKey: 'firstCert' },
  { id: 'm-five-courses', title: '5 courses completed', earnedOn: '2026-04-28', iconKey: 'fiveCourses' },
  { id: 'm-streak-30', title: '30-day streak', earnedOn: '2026-05-08', iconKey: 'streak30' },
  { id: 'm-renewed', title: 'License renewed', earnedOn: '2026-02-10', iconKey: 'renewed' },
  { id: 'm-path-done', title: 'Path completed', earnedOn: '2025-12-19', iconKey: 'pathDone' },
  { id: 'm-streak-100', title: '100-day streak', iconKey: 'streak100', locked: true },
  { id: 'm-premium-1y', title: 'Premium member 1-year', iconKey: 'premium1y', locked: true },
]

/* ─── Dashboard hero band stats ──────────────────────────────────────
 *
 * The four KPIs displayed in the merged Dashboard hero band (credits /
 * progress / certificates / savings). One fixture per brand so brand
 * switching surfaces a believably different demo narrative.
 *
 * STC is the new-user demo brand: zero credits, zero certs, zero
 * savings — fires the faded-stats state in `DashboardHeroBand`.
 *
 * TODO(data): production swaps this for the learner-stats endpoint.
 * ──────────────────────────────────────────────────────────────────── */

export type DashboardStats = {
  /** Completed-credits count this cycle (used for the "Credits" chip). */
  creditsEarned: number
  /** Total credits required this cycle — denominator on the "of N" sub. */
  creditsTotal: number
  /** Overall % across all active learning paths. Render rounded to one
   *  decimal, then drop a trailing `.0` (so "7.5%" / "12%"). */
  overallProgressPct: number
  /** Lifetime certificate count. */
  certificatesCount: number
  /** Total $ saved this year via membership. The hero band formats
   *  with `Intl.NumberFormat` so "$842" / "$1,234" both render right. */
  savedAmount: number
}

const _DASHBOARD_STATS: Record<Brand, DashboardStats> = {
  // New-user demo brand: zero values across the board — fires the
  // faded-stats state in DashboardHeroBand.
  // XCEL — a pre-licensing candidate part-way through Part 1 of the 3-Part
  // Program. `savedAmount` is 0: XCEL has no membership, so there are no
  // membership savings to report (the surfaces that would show it are
  // suppressed for this brand anyway).
  xcel: {
    creditsEarned: 12,
    creditsTotal: 40,
    overallProgressPct: 30,
    certificatesCount: 1,
    savedAmount: 0,
  },
}

export function dashboardStatsFor(brand: Brand): DashboardStats {
  return _DASHBOARD_STATS[brand]
}

/**
 * @deprecated TODO(deprecate): Replaced by `iconForAchievement` in
 * `src/data/achievements/index.ts`, which works against the new
 * `AchievementIconKey` union (57 keys vs this file's 8).
 */
export function iconForMilestone(key: MilestoneIconKey) {
  switch (key) {
    case 'streak7':
      return CalendarDay
    case 'streak30':
      return CalendarPen
    case 'firstCert':
      return Award
    case 'fiveCourses':
      return BadgeCheckThin
    case 'renewed':
      return BookOpen
    case 'pathDone':
      return GraduationCap
    case 'premium1y':
      return Crown
    case 'streak100':
      return Gem
  }
}
