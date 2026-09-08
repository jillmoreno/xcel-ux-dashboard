// TODO(data): replace with real My Courses API integration.
// Source-of-truth Figma frame: file RGRnFD7BpWONzTCaDARDr0, node 4044:35731.
//
// The `enrolledAt` dates below are RELATIVE TO FIXTURE_TODAY (2026-05-11):
// several records per brand are tuned to fall inside the
// RECENTLY_ADDED_WINDOW_DAYS window so the Recently Added pill tab has
// something to show in the prototype. Real data will replace these via the
// API integration at the TODO above.

import type { CourseCardData } from '@/components/courses/CourseCard'
import type { Brand } from '@/context/AccountContext'
import { createImagePicker } from '@/utils/topicImage'

/**
 * Axis C — the lifecycle. Four mutually exclusive values, and `archived` is NOT
 * one of them (decision 34).
 *
 * ⚠ It used to be. `'archived'` sat in this union as a fourth value, which made
 * the ruling in decision 33 — "archiving changes nothing on the card" —
 * impossible to honour: archiving a FAILED course would overwrite its status and
 * take the Failed badge with it. Archiving is a LOCATION (axis E), so it is a
 * separate boolean below. Never merge the two fields again.
 */
export type MyCourseStatus = 'not-started' | 'in-progress' | 'completed' | 'failed'

export type MyCourseRecord = CourseCardData & {
  rating: number
  price: number
  myStatus: MyCourseStatus
  /**
   * Axis E — a LOCATION, orthogonal to `myStatus`. Which collection in My
   * Courses the record lives in; it changes nothing about how the card renders
   * (decision 33), so there is no archived treatment to design.
   */
  archived?: boolean
  enrolledAt: string // ISO date (YYYY-MM-DD, local)
  /** Optional course expiration — when present, table view shows it in the
   * Course Expiration column and derives Days to Complete, and the card derives
   * its expiry badge from it (`courseExpiry.ts`). Most courses have no clock. */
  expiresAt?: string
}

export const RECENTLY_ADDED_WINDOW_DAYS = 15

/** Demo "today" — anchors `isRecentlyAdded` calls in components against a
 * fixed date instead of the host clock so the Recently Added pill tab
 * surfaces the same courses regardless of when the prototype is opened.
 * Matches the date the fixture `enrolledAt` values were authored against
 * (see file header). The project's other fixtures (study calendar, streak)
 * anchor to 2026-05-20 — kept distinct here so the Recently Added window
 * lines up with the fixture data without re-dating every record. */
export const FIXTURE_TODAY = new Date(2026, 4, 11)

/**
 * Returns true when the record was added to the learner's library within
 * the last RECENTLY_ADDED_WINDOW_DAYS calendar days, inclusive of day
 * RECENTLY_ADDED_WINDOW_DAYS itself.
 *
 * Computed against the start of today in the user's local timezone so that a
 * course enrolled at any time on day -N still counts — i.e. no Date.now()
 * arithmetic that could trip over hours/minutes.
 *
 * Defaults `now` to `FIXTURE_TODAY` (the demo's anchored "today") so
 * production prototype runs always show the same set; tests pass an explicit
 * `now` via `vi.setSystemTime(...)`.
 */
export function isRecentlyAdded(
  record: { enrolledAt: string },
  now: Date = FIXTURE_TODAY,
): boolean {
  const parts = record.enrolledAt.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return false
  const enrolled = new Date(parts[0], parts[1] - 1, parts[2])
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const cutoff = new Date(startOfToday)
  cutoff.setDate(cutoff.getDate() - RECENTLY_ADDED_WINDOW_DAYS)
  return enrolled >= cutoff && enrolled <= startOfToday
}

/* ============================================================================
 * Per-brand My Courses fixtures
 *
 * Each brand carries a library that mirrors what its e-commerce site
 * actually enrolls users in (see `_LEARNING_PATHS_BY_BRAND` in
 * learningFixtures.ts for the matching paths):
 *   - cre: NC + GA real estate CE
 *   - mckissock: USPAP + TX appraisal CE
 *   - elite: FL biennial nursing CE (mandatory topics + electives)
 *   - stc: Series exam prep (SIE / 7 / 63 / 65 / 66 / 79 / etc.)
 *
 * Mixes statuses (in-progress / not-started / completed / archived) per
 * brand so the My Courses filter tabs always have something to show.
 * ========================================================================== */

/**
 * XCEL Solutions — an insurance pre-licensing candidate's library: the 3-Part
 * Training Program's own artefacts plus the CE topics a producer renews with.
 * Prices are 0 because these arrive bundled in the Premier package rather than
 * being bought individually.
 */
const _XCEL_COURSES: MyCourseRecord[] = [
  {
    id: 'mc-xcel-lh-prelicense',
    title: 'Life & Health Pre-License Course',
    hours: 24,
    state: 'FL',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.8,
    price: 0,
    myStatus: 'in-progress',
    progress: 50,
    status: 'in-progress',
    enrolledAt: '2026-05-04',
    expiresAt: '2027-05-04',
  },
  {
    id: 'mc-xcel-prep-review',
    title: 'Prep Review Course',
    hours: 8,
    state: 'FL',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.9,
    price: 0,
    myStatus: 'not-started',
    progress: 0,
    status: 'not-started',
    enrolledAt: '2026-05-04',
  },
  {
    id: 'mc-xcel-livestream-review',
    title: 'Livestream Exam Review — Life & Health',
    hours: 6,
    state: 'FL',
    // A live weekly session; `CourseDelivery` has no 'webinar' option here, so
    // 'video' is the closest match (same substitution the CRE fixtures make).
    delivery: 'video',
    badge: 'elective',
    rating: 4.7,
    price: 0,
    myStatus: 'not-started',
    progress: 0,
    status: 'not-started',
    enrolledAt: '2026-05-04',
  },
  {
    id: 'mc-xcel-exam-cram',
    title: 'Exam Cram — Life & Health',
    hours: 2,
    state: 'FL',
    delivery: 'video',
    badge: 'elective',
    rating: 4.6,
    price: 0,
    myStatus: 'not-started',
    progress: 0,
    status: 'not-started',
    enrolledAt: '2026-05-04',
  },
  {
    id: 'mc-xcel-annuity-training',
    title: 'Annuity Initial Training',
    hours: 4,
    state: 'FL',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.5,
    price: 0,
    myStatus: 'completed',
    progress: 100,
    status: 'completed',
    enrolledAt: '2026-02-20',
    completedOn: '2026-03-18',
  },
  {
    id: 'mc-xcel-ltc-training',
    title: 'Long-Term Care Initial Training',
    hours: 8,
    state: 'FL',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.4,
    price: 0,
    myStatus: 'in-progress',
    progress: 25,
    status: 'in-progress',
    enrolledAt: '2026-03-11',
  },
  {
    id: 'mc-xcel-ethics',
    title: 'Insurance Ethics',
    hours: 5,
    state: 'FL',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.6,
    price: 0,
    myStatus: 'not-started',
    progress: 0,
    status: 'not-started',
    enrolledAt: '2026-05-06',
  },

  /* ── State coverage for the card's time + outcome axes ──────────────────
     The seven rows above are the LEARNER STORY: one candidate part-way through
     the 3-Part Program. The six below exist so the fixture set covers every
     state `CourseCard` can express — expiring-soon, expired, failed with and
     without a score, and the two negative cases that are easy to get wrong.
     `CourseExpiry.test.ts` asserts this coverage directly, so a state losing
     its record fails a test rather than quietly disappearing from the demo.

     Every date is relative to FIXTURE_TODAY (2026-05-11). Read `warnWindowFor`
     before editing one: the countdown is clamped to HALF the enrolment window,
     so shortening `enrolledAt` can silently move a row out of `expiring-soon`.
     ─────────────────────────────────────────────────────────────────────── */
  {
    // EXPIRING SOON — 21 days left of a 137-day window (clamp 68), so the
    // default 60-day countdown applies and the badge shows.
    id: 'mc-xcel-flood-nfip',
    title: 'Flood Insurance (NFIP) Training',
    hours: 3,
    state: 'FL',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.3,
    price: 0,
    myStatus: 'in-progress',
    progress: 60,
    status: 'in-progress',
    enrolledAt: '2026-01-15',
    expiresAt: '2026-06-01',
  },
  {
    // EXPIRING SOON via the CLAMP rather than the default: 14 days left of a
    // 54-day window, so the effective countdown is 27, not 60. The pair matters
    // — the two paths into this state are why `warnWindowFor` exists.
    id: 'mc-xcel-annuity-suitability',
    title: 'Annuity Suitability Update',
    hours: 4,
    state: 'FL',
    delivery: 'online',
    badge: 'elective',
    rating: 4.2,
    price: 0,
    myStatus: 'in-progress',
    progress: 30,
    status: 'in-progress',
    enrolledAt: '2026-04-01',
    expiresAt: '2026-05-25',
  },
  {
    // EXPIRED, and carrying real progress — a bar with nothing in it demos
    // nothing, which is what `ExpiredProgress.test.ts` guards. Still
    // `in-progress`: expiry is the clock axis, not the outcome axis.
    id: 'mc-xcel-pc-prelicense-lapsed',
    title: 'Property & Casualty Pre-License Course',
    hours: 20,
    state: 'FL',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.5,
    price: 0,
    myStatus: 'in-progress',
    progress: 45,
    status: 'in-progress',
    enrolledAt: '2025-10-20',
    expiresAt: '2026-04-20',
  },
  {
    // NO BADGE despite being 45 days out — `warnDays: 14` is this course's own
    // countdown. The negative case: without it, 45 days would warn under the
    // 60-day default, and a per-course countdown that silently did nothing
    // would look like it worked.
    id: 'mc-xcel-health-marketplace',
    title: 'Health Insurance Marketplace and ACA Update',
    hours: 3,
    state: 'FL',
    delivery: 'online',
    badge: 'elective',
    rating: 4.1,
    price: 0,
    myStatus: 'in-progress',
    progress: 15,
    status: 'in-progress',
    enrolledAt: '2026-01-01',
    expiresAt: '2026-06-25',
    warnDays: 14,
  },
  {
    // FAILED, with a score — the status row reads "Failed: 62%".
    id: 'mc-xcel-pc-practice-exam',
    title: 'Property & Casualty Practice Exam',
    hours: 2,
    state: 'FL',
    delivery: 'online',
    badge: 'elective',
    rating: 4.0,
    price: 0,
    myStatus: 'failed',
    progress: 100,
    status: 'failed',
    enrolledAt: '2026-03-02',
    score: 62,
  },
  {
    // FAILED, with NO score — the platform does not always know one. The badge
    // renders either way; only the status row differs.
    id: 'mc-xcel-ethics-assessment',
    title: 'Insurance Ethics Assessment',
    hours: 1,
    state: 'FL',
    delivery: 'online',
    badge: 'elective',
    rating: 4.0,
    price: 0,
    myStatus: 'failed',
    progress: 100,
    status: 'failed',
    enrolledAt: '2026-03-09',
  },
  {
    // ARCHIVED **and** failed — the regression case for decisions 33-34. The
    // old model stored `archived` inside `myStatus`, so setting it overwrote
    // the outcome. Archiving is a LOCATION; it changes nothing about how the
    // card resolves, which is what the test asserts by stripping the flag and
    // comparing.
    id: 'mc-xcel-adjuster-law-archived',
    title: 'Florida Adjuster Law and Ethics Update',
    hours: 5,
    state: 'FL',
    delivery: 'online',
    badge: 'elective',
    rating: 3.9,
    price: 0,
    myStatus: 'failed',
    progress: 100,
    status: 'failed',
    enrolledAt: '2025-11-14',
    score: 58,
    archived: true,
  },
]

const _MY_COURSES_BY_BRAND: Record<Brand, MyCourseRecord[]> = {
  xcel: _XCEL_COURSES,
}

/** Per-brand image-URL cache. The picker is stateful per closure — we
 *  create one once per brand at first access and memoize the resulting
 *  array so re-renders return the same data without re-walking the
 *  pool. */
const _IMAGE_CACHE = new Map<Brand, MyCourseRecord[]>()

/** Returns the per-brand My Courses library with image URLs applied.
 *  Each brand gets its own image picker (fresh closure with empty state),
 *  so My Course records never repeat an image inside the brand. There
 *  may be overlap with the catalog's picks since they're separate
 *  closures — that's fine because the surfaces don't render side-by-side. */
export function myCoursesFor(brand: Brand): MyCourseRecord[] {
  const cached = _IMAGE_CACHE.get(brand)
  if (cached) return cached
  const pickImage = createImagePicker()
  const list = _MY_COURSES_BY_BRAND[brand].map((c) => ({
    ...c,
    // My Course records don't carry an `imageQuery`, so the picker falls
    // through to its flat pool — still topic-varied, still unique within
    // this brand's My Courses set.
    imageUrl: pickImage(undefined),
  }))
  _IMAGE_CACHE.set(brand, list)
  return list
}

/** Back-compat export — resolved CRE, the LMS's default brand; now XCEL, which
 *  is both default and only. Prefer `myCoursesFor(brand)` in new code. */
export const MY_COURSES: MyCourseRecord[] = myCoursesFor('xcel')

export const TOTAL_MY_COURSES = MY_COURSES.length
