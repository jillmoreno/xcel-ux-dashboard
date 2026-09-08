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

const _CRE_COURSES: MyCourseRecord[] = [
  {
    id: 'mc-il-6hr-core',
    title: 'Illinois 6-Hour Core',
    hours: 6,
    state: 'IL',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.6,
    price: 0,
    myStatus: 'not-started',
    enrolledAt: '2026-05-01',
    expiresAt: '2027-09-10',
  },
  {
    id: 'mc-sexual-harassment-prevention',
    title: 'Sexual Harassment Prevention Training',
    hours: 1,
    state: 'IL',
    delivery: 'online',
    badge: 'elective',
    rating: 4.7,
    price: 0,
    myStatus: 'in-progress',
    progress: 40,
    status: 'in-progress',
    enrolledAt: '2026-05-04',
    expiresAt: '2026-09-08',
  },
  {
    id: 'mc-ga-license-law-1',
    title: 'Georgia Real Estate License Law',
    hours: 3,
    state: 'GA',
    delivery: 'video',
    badge: 'elective',
    rating: 4.6,
    price: 29,
    myStatus: 'in-progress',
    progress: 40,
    status: 'in-progress',
    enrolledAt: '2026-04-01',
    expiresAt: '2027-04-01',
  },
  {
    id: 'mc-millennials',
    title: 'Millennials are Changing Real Estate: Are you ready?',
    hours: 4,
    state: 'GA',
    delivery: 'video',
    badge: 'elective',
    rating: 4.4,
    price: 39,
    myStatus: 'in-progress',
    progress: 70,
    status: 'in-progress',
    enrolledAt: '2026-03-15',
  },
  {
    /**
     * Completed on purpose, and the certificate is what makes it interesting:
     * `cert-cre-ar-bpos-survey` is `action-required` against THIS course, so
     * the card shows `Certificate Pending`. That is the real sequence — you
     * finish the course, then owe a survey before the certificate issues — and
     * it is the only way the Pending arm of the footer marker is reachable: the
     * marker only renders on a completed course, so an action-required
     * certificate pointing at an unfinished one is invisible.
     */
    id: 'mc-bpo',
    title: 'Performing Quality BPOs',
    hours: 4,
    state: 'GA',
    delivery: 'video',
    badge: 'elective',
    rating: 4.5,
    price: 39,
    myStatus: 'completed',
    status: 'completed',
    progress: 100,
    enrolledAt: '2026-03-02',
    completedOn: '2026-04-08',
  },
  {
    id: 'mc-real-property',
    title: 'Real Property Appraisals',
    hours: 4,
    state: 'GA',
    delivery: 'video',
    badge: 'elective',
    rating: 4.7,
    price: 39,
    myStatus: 'not-started',
    enrolledAt: '2026-04-22',
  },
  {
    id: 'mc-implicit-bias',
    title: 'Implicit Bias Awareness and Cultural Competency',
    hours: 4,
    state: 'GA',
    delivery: 'video',
    badge: 'elective',
    rating: 4.8,
    price: 39,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2026-02-10',
    completedOn: '2026-03-06',
  },
  {
    id: 'mc-workforce-housing',
    title: 'Workforce Housing: Solutions for Homes and Financing',
    hours: 4,
    state: 'GA',
    delivery: 'video',
    badge: 'elective',
    rating: 4.3,
    price: 39,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2026-02-18',
    completedOn: '2026-03-21',
  },
  {
    id: 'mc-agency-law',
    title: 'Agency Law',
    hours: 4,
    state: 'GA',
    delivery: 'video',
    badge: 'elective',
    rating: 4.6,
    price: 39,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2026-01-22',
    completedOn: '2026-03-04',
  },
  {
    id: 'mc-fair-housing',
    title: 'Fair Housing',
    hours: 4,
    state: 'GA',
    delivery: 'video',
    badge: 'elective',
    rating: 4.5,
    price: 39,
    // Migrated from `myStatus: 'archived'`. Archiving is a LOCATION now, so the
    // record keeps the status it actually had and the card keeps its Completed
    // badge (decision 33).
    myStatus: 'completed',
    status: 'completed',
    archived: true,
    enrolledAt: '2025-11-04',
    completedOn: '2026-01-09',
  },
  {
    id: 'mc-ga-license-law-2',
    title: 'Georgia Real Estate License Law',
    hours: 3,
    state: 'GA',
    delivery: 'video',
    badge: 'elective',
    rating: 4.6,
    price: 29,
    /**
     * ⚠ THE REGRESSION CASE for decisions 33-34, and the reason `archived` had
     * to leave `MyCourseStatus`. Under the old model this record read
     * `myStatus: 'archived'` — setting it DESTROYED the fact that the course was
     * failed, so the Failed badge and the `Failed: 58%` row went with it. It must
     * now render identically to the same course un-archived. Guarded by
     * `CourseExpiry.test.ts`.
     */
    myStatus: 'failed',
    status: 'failed',
    archived: true,
    score: 58,
    progress: 100,
    enrolledAt: '2025-09-18',
  },
  {
    id: 'mc-millennials-2',
    title: 'Millennials are Changing Real Estate: Are you ready?',
    hours: 3,
    state: 'GA',
    delivery: 'video',
    badge: 'elective',
    rating: 4.4,
    price: 29,
    myStatus: 'in-progress',
    progress: 20,
    status: 'in-progress',
    enrolledAt: '2026-04-25',
  },
  {
    id: 'mc-millennials-3',
    title: 'Millennials are Changing Real Estate: Are you ready?',
    hours: 3,
    state: 'GA',
    delivery: 'video',
    badge: 'elective',
    rating: 4.4,
    price: 29,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2026-02-25',
    completedOn: '2026-03-15',
  },
  {
    id: 'mc-millennials-4',
    title: 'Millennials are Changing Real Estate: Are you ready?',
    hours: 3,
    state: 'GA',
    delivery: 'video',
    badge: 'elective',
    rating: 4.4,
    price: 29,
    myStatus: 'not-started',
    enrolledAt: '2026-04-30',
  },
  /* ── Axis D · the time axis, and axis C's fourth value ──────────────────
   *
   * Six records added 2026-09-05 to exercise the states the card can now
   * express. Every date below is RELATIVE TO `FIXTURE_TODAY` (2026-05-11); if
   * that anchor ever moves, these move with it or they stop demonstrating
   * anything. Day counts are stated per record so a re-date is arithmetic
   * rather than guesswork.
   */
  {
    // EXPIRING SOON, and the `min()` clamp record. 30-day enrolment window with
    // no `warnDays`, so the effective window is min(60, 30/2) = 15, not 60.
    // WITHOUT THE CLAMP this course would have carried the badge from the day it
    // was bought — the whole window is shorter than the default countdown. With
    // it, the badge appears at 15 days out; today is 10 days out, so it shows
    // "10 Days to Complete" and the progress fill turns warning-500.
    id: 'mc-cre-1031-exchange',
    title: '1031 Exchanges: A Practical Guide',
    hours: 3,
    state: 'GA',
    delivery: 'online',
    badge: 'elective',
    rating: 4.5,
    price: 39,
    myStatus: 'in-progress',
    status: 'in-progress',
    progress: 45,
    enrolledAt: '2026-04-21',
    expiresAt: '2026-05-21',
  },
  {
    // LONGER-THAN-DEFAULT countdown: `warnDays: 90` on a 231-day window, so the
    // effective window is min(90, 115) = 90 and the badge is on at 70 days out.
    // Under the standard 60 it would show nothing. This is the record that
    // proves the countdown is PER COURSE — a 15-hour course warrants more
    // notice than a 2-hour elective.
    id: 'mc-cre-broker-prelicense',
    title: 'Georgia Broker Pre-License Course',
    hours: 15,
    state: 'GA',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.7,
    price: 199,
    myStatus: 'in-progress',
    status: 'in-progress',
    progress: 20,
    warnDays: 90,
    enrolledAt: '2025-12-01',
    expiresAt: '2026-07-20',
  },
  {
    // SHORTER-THAN-DEFAULT countdown: `warnDays: 14`, and 45 days out — so NO
    // badge. Under the standard 60 this card would be warning already. The
    // opposite demonstration to the record above, and the reason 60 is a
    // default rather than a constant.
    id: 'mc-cre-property-management',
    title: 'Property Management Essentials',
    hours: 4,
    state: 'GA',
    delivery: 'video',
    badge: 'elective',
    rating: 4.3,
    price: 49,
    myStatus: 'not-started',
    status: 'not-started',
    warnDays: 14,
    enrolledAt: '2026-01-05',
    expiresAt: '2026-06-25',
  },
  {
    // EXPIRED — 58 days past the date. Cover desaturates, the status row reads
    // `Expired: 03/14/2026` / `30%`, the track renders FROZEN in dark charcoal
    // (`--color-progress-fill-expired`), and the footer carries `Enrol again →`.
    //
    // `progress: 30` is what that bar draws. It used to be here as a deliberate
    // trap — the card hid it, and rendering it was the regression — until the
    // rule was reversed on 2026-09-08: the number is a record of work done, not
    // an offer to resume it. This is now the fixture that DEMOS the state, so
    // keep it non-zero; a frozen bar at 0% shows nothing.
    // (`ExpiredProgress.test.ts` asserts some brand still has one.)
    id: 'mc-cre-commercial-leasing',
    title: 'Commercial Leasing Fundamentals',
    hours: 5,
    state: 'GA',
    delivery: 'online',
    badge: 'elective',
    rating: 4.2,
    price: 59,
    myStatus: 'in-progress',
    status: 'in-progress',
    progress: 30,
    enrolledAt: '2025-12-14',
    expiresAt: '2026-03-14',
  },
  {
    // FAILED, WITH a score. Row reads `Failed: 62%` on the left and `100%` on
    // the right — you finished the course, you just didn't pass. Progress and
    // score are different numbers and the row holds both.
    id: 'mc-cre-appraisal-basics-exam',
    title: 'Appraisal Basics — Final Exam',
    hours: 2,
    state: 'GA',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.1,
    price: 0,
    myStatus: 'failed',
    status: 'failed',
    score: 62,
    progress: 100,
    enrolledAt: '2026-02-06',
  },
  {
    // FAILED, WITHOUT a score — the platform doesn't always know one. The badge
    // must render either way; the row just omits the number and reads `Failed`.
    id: 'mc-cre-contracts-assessment',
    title: 'Contracts & Disclosures Assessment',
    hours: 2,
    state: 'GA',
    delivery: 'online',
    badge: 'non-credit',
    rating: 4.0,
    price: 0,
    myStatus: 'failed',
    status: 'failed',
    progress: 100,
    enrolledAt: '2026-03-19',
  },
]

const _MCKISSOCK_COURSES: MyCourseRecord[] = [
  // The two "already enrolled" catalog demo courses (see c-mck-income-approach /
  // c-mck-fair-housing in src/data/catalog/mckissock.ts). Carried here — under
  // the SAME ids so the card links resolve to the same course detail — so a
  // course the learner already holds shows up in My Courses, matching the
  // Enrolled treatment the catalog card + Course Details sheet now give it.
  {
    id: 'c-mck-income-approach',
    title: 'Income Approach Case Studies',
    hours: 7,
    state: 'TX',
    // CourseCard's delivery union has no `webinar`; `video` is the nearest My
    // Courses equivalent of the catalog's live webinar.
    delivery: 'video',
    badge: 'elective',
    rating: 4.6,
    price: 89,
    myStatus: 'in-progress',
    progress: 20,
    status: 'in-progress',
    enrolledAt: '2026-05-05',
  },
  {
    id: 'c-mck-fair-housing',
    title: 'Fair Housing & Bias in Appraisals',
    hours: 4,
    state: 'TX',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.9,
    price: 49,
    myStatus: 'not-started',
    enrolledAt: '2026-05-09',
  },
  {
    id: 'mc-mck-uspap-26-27',
    title: '2026-2027 7-Hour National USPAP Update Course',
    hours: 7,
    state: 'Federal',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.7,
    price: 0,
    myStatus: 'in-progress',
    progress: 65,
    status: 'in-progress',
    enrolledAt: '2026-04-22',
    expiresAt: '2027-12-31',
  },
  {
    id: 'mc-mck-bias-fair-housing',
    title: '7-Hour National Valuation Bias and Fair Housing',
    hours: 7,
    state: 'Federal',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.8,
    price: 0,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2026-03-08',
    completedOn: '2026-04-04',
  },
  {
    id: 'mc-mck-fha-4000-1',
    title: 'The FHA Handbook 4000.1',
    hours: 7,
    state: 'TX',
    delivery: 'online',
    badge: 'elective',
    rating: 4.5,
    price: 79,
    myStatus: 'in-progress',
    progress: 30,
    status: 'in-progress',
    enrolledAt: '2026-04-02',
  },
  {
    id: 'mc-mck-income-approach',
    title: 'The Income Approach: An Overview',
    hours: 3,
    state: 'TX',
    delivery: 'online',
    badge: 'elective',
    rating: 4.4,
    price: 49,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2026-02-12',
    completedOn: '2026-03-20',
  },
  {
    id: 'mc-mck-adus',
    title: 'Small Spaces, Big Impact — Appraising ADUs',
    hours: 3,
    state: 'TX',
    delivery: 'online',
    badge: 'elective',
    rating: 4.6,
    price: 49,
    myStatus: 'not-started',
    enrolledAt: '2026-05-03',
  },
  {
    id: 'mc-mck-cost-approach',
    title: 'Cost Approach Theory',
    hours: 4,
    state: 'TX',
    delivery: 'online',
    badge: 'elective',
    rating: 4.5,
    price: 49,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2026-01-18',
    completedOn: '2026-03-11',
  },
  {
    id: 'mc-mck-land-valuation',
    title: 'Land and Site Valuation',
    hours: 5,
    state: 'TX',
    delivery: 'online',
    badge: 'elective',
    rating: 4.6,
    price: 59,
    myStatus: 'in-progress',
    progress: 22,
    status: 'in-progress',
    enrolledAt: '2026-04-18',
  },
  {
    id: 'mc-mck-mfg-housing',
    title: 'Appraisal of Manufactured Housing',
    hours: 3,
    state: 'TX',
    delivery: 'online',
    badge: 'elective',
    rating: 4.3,
    price: 49,
    myStatus: 'not-started',
    enrolledAt: '2026-04-29',
  },
  {
    id: 'mc-mck-residential-construction',
    title: 'Residential Construction and the Appraiser',
    hours: 7,
    state: 'TX',
    delivery: 'online',
    badge: 'elective',
    rating: 4.4,
    price: 69,
    myStatus: 'completed',
    status: 'completed',
    archived: true,
    enrolledAt: '2025-09-22',
    completedOn: '2025-11-03',
  },
  {
    id: 'mc-mck-uspap-24-25',
    title: '2024-2025 7-Hour National USPAP Update Course',
    hours: 7,
    state: 'Federal',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.7,
    price: 0,
    // A superseded cycle — done, then put away when the 2026-2027 course
    // replaced it. The archetypal reason to archive something.
    myStatus: 'completed',
    status: 'completed',
    archived: true,
    enrolledAt: '2024-12-04',
    completedOn: '2025-01-16',
  },
  {
    id: 'mc-mck-trainees',
    title: 'Practical Applications for Appraisers in Training',
    hours: 7,
    state: 'TX',
    delivery: 'online',
    badge: 'elective',
    rating: 4.5,
    price: 69,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2025-12-10',
    completedOn: '2026-01-23',
  },
  {
    id: 'mc-mck-supervisor',
    title: 'Supervisory Appraiser / Trainee Appraiser Course',
    hours: 4,
    state: 'TX',
    delivery: 'online',
    badge: 'elective',
    rating: 4.6,
    price: 49,
    myStatus: 'not-started',
    enrolledAt: '2026-05-02',
  },
]

const _ELITE_COURSES: MyCourseRecord[] = [
  {
    id: 'mc-elite-medical-errors',
    title: 'Prevention of Medical Errors',
    hours: 2,
    state: 'FL',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.8,
    price: 0,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2026-03-04',
    completedOn: '2026-03-25',
  },
  {
    id: 'mc-elite-fl-laws',
    title: 'Florida Laws and Rules for Nurses',
    hours: 2,
    state: 'FL',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.7,
    price: 0,
    myStatus: 'in-progress',
    progress: 60,
    status: 'in-progress',
    enrolledAt: '2026-04-26',
    expiresAt: '2027-07-31',
  },
  {
    id: 'mc-elite-human-trafficking',
    title: 'Human Trafficking Awareness for Healthcare Professionals',
    hours: 2,
    state: 'FL',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.6,
    price: 0,
    myStatus: 'not-started',
    enrolledAt: '2026-05-04',
  },
  {
    id: 'mc-elite-impairment',
    title: 'Recognizing Impairment in the Workplace',
    hours: 2,
    state: 'FL',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.5,
    price: 0,
    myStatus: 'not-started',
    enrolledAt: '2026-05-05',
  },
  {
    id: 'mc-elite-hiv-aids',
    title: 'HIV/AIDS — One-Time Florida Requirement',
    hours: 1,
    state: 'FL',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.6,
    price: 0,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2026-01-20',
    completedOn: '2026-02-22',
  },
  {
    id: 'mc-elite-pain-mgmt',
    title: 'Pain Management and Safe Prescribing',
    hours: 3,
    state: 'FL',
    delivery: 'online',
    badge: 'elective',
    rating: 4.7,
    price: 29,
    myStatus: 'in-progress',
    progress: 45,
    status: 'in-progress',
    enrolledAt: '2026-04-09',
  },
  {
    id: 'mc-elite-domestic-violence',
    title: 'Domestic Violence Awareness',
    hours: 2,
    state: 'FL',
    delivery: 'online',
    badge: 'elective',
    rating: 4.4,
    price: 19,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2026-02-15',
    completedOn: '2026-03-16',
  },
  {
    id: 'mc-elite-wound-care',
    title: 'Wound Care Essentials',
    hours: 4,
    state: 'FL',
    delivery: 'video',
    badge: 'elective',
    rating: 4.8,
    price: 39,
    myStatus: 'not-started',
    enrolledAt: '2026-04-28',
  },
  {
    id: 'mc-elite-pharm-update',
    title: 'Pharmacology Update for Nurses',
    hours: 5,
    state: 'FL',
    delivery: 'online',
    badge: 'elective',
    rating: 4.6,
    price: 49,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2025-12-19',
    completedOn: '2026-02-04',
  },
  {
    id: 'mc-elite-older-adult',
    title: 'Caring for the Older Adult',
    hours: 3,
    state: 'FL',
    delivery: 'online',
    badge: 'elective',
    rating: 4.5,
    price: 29,
    // Archived part-way through — the progress bar survives it, same as the
    // Failed badge does above.
    myStatus: 'in-progress',
    status: 'in-progress',
    archived: true,
    progress: 35,
    enrolledAt: '2025-08-30',
  },
  {
    id: 'mc-elite-mental-health',
    title: 'Mental Health First Aid for Nurses',
    hours: 4,
    state: 'FL',
    delivery: 'video',
    badge: 'elective',
    rating: 4.7,
    price: 39,
    myStatus: 'in-progress',
    progress: 18,
    status: 'in-progress',
    enrolledAt: '2026-04-20',
  },
  {
    id: 'mc-elite-diabetes',
    title: 'Diabetes Management Across the Lifespan',
    hours: 3,
    state: 'FL',
    delivery: 'online',
    badge: 'elective',
    rating: 4.6,
    price: 29,
    myStatus: 'not-started',
    enrolledAt: '2026-05-01',
  },
]

const _STC_COURSES: MyCourseRecord[] = [
  {
    id: 'mc-stc-sie',
    title: 'SIE Exam Prep',
    hours: 25,
    state: 'FED',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.8,
    price: 0,
    myStatus: 'in-progress',
    progress: 47,
    status: 'in-progress',
    enrolledAt: '2026-04-18',
    expiresAt: '2027-04-18',
  },
  {
    id: 'mc-stc-s7-topoff',
    title: 'Series 7 Top-Off — General Securities Representative',
    hours: 45,
    state: 'FED',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.7,
    price: 0,
    myStatus: 'in-progress',
    progress: 12,
    status: 'in-progress',
    enrolledAt: '2026-04-26',
  },
  {
    id: 'mc-stc-s63',
    title: 'Series 63 — Uniform Securities Agent State Law',
    hours: 12,
    state: 'FED',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.6,
    price: 0,
    myStatus: 'not-started',
    enrolledAt: '2026-05-02',
  },
  {
    id: 'mc-stc-s65',
    title: 'Series 65 — Investment Adviser Law',
    hours: 18,
    state: 'FED',
    delivery: 'online',
    badge: 'elective',
    rating: 4.5,
    price: 0,
    myStatus: 'not-started',
    enrolledAt: '2026-05-04',
  },
  {
    id: 'mc-stc-s66',
    title: 'Series 66 — Uniform Combined State Law',
    hours: 24,
    state: 'FED',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.7,
    price: 0,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2026-01-15',
    completedOn: '2026-02-22',
  },
  {
    id: 'mc-stc-s79',
    title: 'Series 79 — Investment Banking Representative',
    hours: 35,
    state: 'FED',
    delivery: 'online',
    badge: 'mandatory',
    rating: 4.8,
    price: 0,
    myStatus: 'in-progress',
    progress: 85,
    status: 'in-progress',
    enrolledAt: '2026-03-15',
    expiresAt: '2026-05-27',
  },
  {
    id: 'mc-stc-s24',
    title: 'Series 24 — General Securities Principal',
    hours: 35,
    state: 'FED',
    delivery: 'online',
    badge: 'elective',
    rating: 4.6,
    price: 599,
    myStatus: 'not-started',
    enrolledAt: '2026-04-30',
  },
  {
    id: 'mc-stc-s99',
    title: 'Series 99 — Operations Professional',
    hours: 18,
    state: 'FED',
    delivery: 'online',
    badge: 'elective',
    rating: 4.4,
    price: 199,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2025-11-28',
    completedOn: '2026-01-22',
  },
  {
    id: 'mc-stc-s6',
    title: 'Series 6 — Investment Company Products',
    hours: 22,
    state: 'FED',
    delivery: 'online',
    badge: 'elective',
    rating: 4.5,
    price: 299,
    myStatus: 'not-started',
    enrolledAt: '2026-04-25',
  },
  {
    id: 'mc-stc-s26',
    title: 'Series 26 — Investment Company Principal',
    hours: 20,
    state: 'FED',
    delivery: 'online',
    badge: 'elective',
    rating: 4.3,
    price: 399,
    // Bought, never opened, put away.
    myStatus: 'not-started',
    status: 'not-started',
    archived: true,
    enrolledAt: '2025-07-12',
  },
  {
    id: 'mc-stc-s9-10',
    title: 'Series 9/10 — General Securities Sales Supervisor',
    hours: 30,
    state: 'FED',
    delivery: 'online',
    badge: 'elective',
    rating: 4.6,
    price: 499,
    myStatus: 'completed',
    status: 'completed',
    enrolledAt: '2025-12-08',
    completedOn: '2026-01-19',
  },
  {
    id: 'mc-stc-s50',
    title: 'Series 50 — Municipal Advisor Representative',
    hours: 22,
    state: 'FED',
    delivery: 'online',
    badge: 'elective',
    rating: 4.4,
    price: 349,
    myStatus: 'in-progress',
    progress: 15,
    status: 'in-progress',
    enrolledAt: '2026-04-12',
  },
]

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
]

const _MY_COURSES_BY_BRAND: Record<Brand, MyCourseRecord[]> = {
  cre: _CRE_COURSES,
  mckissock: _MCKISSOCK_COURSES,
  elite: _ELITE_COURSES,
  fitzgerald: _ELITE_COURSES,
  stc: _STC_COURSES,
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

/** Back-compat export — defaults to CRE since that is the project's default
 *  brand per AccountContext. Prefer `myCoursesFor(brand)` in new code. */
export const MY_COURSES: MyCourseRecord[] = myCoursesFor('cre')

export const TOTAL_MY_COURSES = MY_COURSES.length
