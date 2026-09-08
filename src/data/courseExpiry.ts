/**
 * Axis D — the course's time axis. Pure functions, no React.
 *
 * Spec: `public/prototypes/course-card-spec.html` §4a, decided
 * 2026-09-04. Five rulings; three of them are encoded here and each has an
 * obvious-looking wrong implementation:
 *
 *   • A COMPLETED COURSE NEVER WARNS (ruling 5). The deadline was met, so the
 *     date is irrelevant — checked FIRST, before `expiresAt` is even read.
 *   • The warning window is PER COURSE, defaulting to 60 (ruling 2). It is not
 *     a global constant, and it is deliberately NOT `EXPIRING_SOON_DAYS` from
 *     `learningFixtures` (30) — that is a licence renewal cycle, a different
 *     span. Neither should quietly adopt the other's number.
 *   • The `min(…, totalWindow / 2)` clamp is a guard, not a nicety: without it
 *     a course whose whole enrolment window is shorter than its configured
 *     countdown shows the badge from the day it is bought.
 *
 * ⚠ NO `Date` IS EVER CONSTRUCTED FROM AN ISO STRING HERE. `new Date('2026-03-14')`
 * parses as UTC and renders the previous day in a western timezone; this repo has
 * been bitten by it three times (see the `daysUntil` note in CLAUDE.md). Every
 * comparison below is date-only `Date.UTC` on both sides, so the answer does not
 * depend on the time of day the page is opened.
 */

/** No clock · inside the warning window · past the date. */
export type CourseExpiryState = 'none' | 'expiring-soon' | 'expired'

/** The standard countdown when a course sets no `warnDays` of its own. */
export const DEFAULT_WARN_DAYS = 60

/** The card's lifecycle values that matter to expiry. Structural rather than an
 *  import of `CourseStatus`, so this module stays free of component imports. */
type ExpiryInput = {
  status?: 'not-started' | 'in-progress' | 'completed' | 'failed'
  /** ISO yyyy-mm-dd. Absent ⇒ the course has no clock at all. */
  expiresAt?: string
  /** ISO yyyy-mm-dd. Absent ⇒ the `totalWindow / 2` clamp can't be computed;
   *  see `warnWindowFor`. */
  enrolledAt?: string
  /** This course's own countdown, in days. */
  warnDays?: number
}

const MS_PER_DAY = 86_400_000

/** `yyyy-mm-dd` → UTC midnight ms, or null when unparseable. */
function isoToUtcMs(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  return Date.UTC(y, mo - 1, d)
}

/** A `Date` reduced to UTC midnight of its LOCAL calendar day. The local parts
 *  are what a person means by "today"; putting them through `Date.UTC` makes the
 *  subtraction below time-of-day independent. */
function localDayToUtcMs(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Whole days from `today` to an ISO date. Negative once the date has passed;
 *  null when the string is unparseable. Date-only on both sides. */
export function daysUntilIso(iso: string | undefined, today: Date): number | null {
  if (!iso) return null
  const target = isoToUtcMs(iso)
  if (target == null) return null
  return Math.round((target - localDayToUtcMs(today)) / MS_PER_DAY)
}

/** Whole days between two ISO dates. Null when either is unparseable. */
export function daysBetweenIso(fromIso: string | undefined, toIso: string | undefined): number | null {
  if (!fromIso || !toIso) return null
  const a = isoToUtcMs(fromIso)
  const b = isoToUtcMs(toIso)
  if (a == null || b == null) return null
  return Math.round((b - a) / MS_PER_DAY)
}

/**
 * The effective warning window for a course: its own `warnDays` (default 60),
 * clamped to half the enrolment window.
 *
 * With no `enrolledAt` there is no window to halve, so the clamp is skipped and
 * the configured countdown stands. That is the safe degradation: the clamp only
 * ever SHORTENS the window, so skipping it can show the badge slightly early on
 * a record missing its enrolment date — never the reverse.
 */
export function warnWindowFor(course: ExpiryInput): number {
  const configured = course.warnDays ?? DEFAULT_WARN_DAYS
  const totalWindow = daysBetweenIso(course.enrolledAt, course.expiresAt)
  if (totalWindow == null || totalWindow <= 0) return configured
  return Math.min(configured, totalWindow / 2)
}

/**
 * Resolve a course's expiry state.
 *
 * `today` defaults to the caller's clock, but every prototype surface passes the
 * anchored `FIXTURE_TODAY` so the demo renders the same states whenever it is
 * opened. Tests pass an explicit, deliberately non-midnight `Date`.
 */
export function courseExpiryState(course: ExpiryInput, today: Date): CourseExpiryState {
  // Ruling 5, and it comes FIRST on purpose: a completed course never warns,
  // whatever its dates say. Reordering this below the `expiresAt` check would
  // still work today and would break the moment a completed course keeps a
  // passed expiry date — which is the normal case, not an edge one.
  if (course.status === 'completed') return 'none'
  const daysLeft = daysUntilIso(course.expiresAt, today)
  if (daysLeft == null) return 'none'
  if (daysLeft <= 0) return 'expired'
  return daysLeft <= warnWindowFor(course) ? 'expiring-soon' : 'none'
}

/**
 * `'yyyy-mm-dd'` → `'mm/dd/yyyy'`, zero-padded, 4-digit year — the ONE milestone
 * format both `Completed:` and `Expired:` use (decision 32). Returns the input
 * unchanged if it isn't an ISO date, so a malformed fixture shows something
 * rather than `NaN/NaN/NaN`.
 *
 * String surgery, no `Date`: see the file header.
 */
export function formatMilestoneDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return iso
  return `${m[2]}/${m[3]}/${m[1]}`
}
