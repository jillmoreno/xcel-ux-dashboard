/**
 * XCEL ADMIN — THE LEARNER FIXTURE (2026-10-19, feat/XCEL-admin).
 *
 * The admin app rebuilt from colibri-b2b.vercel.app reads ONE roster, so every
 * page that counts learners agrees with every other. The shape and the counts
 * are the reference's own, read off its Students page:
 *
 *   198 students — the active pipeline (188) plus licensed in the last 90
 *   days (10). Not started 29 (9 invite open · 20 never launched), In
 *   progress 72 (47 in course · 25 in prep), Off track 65 (31 done with no
 *   prep · 34 no recent activity), Prepared to pass 22 (14 with an exam
 *   scheduled), Licensed 10.
 *
 * DEMO DATA. Names, emails and the agency are invented (`*.example.com`);
 * the figures are generated from a fixed seed, so a reload draws the same
 * roster and a test can pin a count.
 *
 * ⚠ ONE DEPARTURE FROM THE REFERENCE: its progress columns read "—" for
 * almost every row (its demo data does not carry them). These carry real
 * percentages, consistent with each learner's stage, so the rings and the
 * readiness columns have something to show.
 */

export type LearnerStage =
  | 'invite-open'
  | 'never-started'
  | 'in-course'
  | 'prepping'
  | 'done-no-prep'
  | 'stalled'
  | 'ready-to-test'
  | 'licensed'

/** The six tiles across the top of Students — `all` is the active pipeline. */
export type PipelineBucket = 'all' | 'not-started' | 'in-progress' | 'off-track' | 'prepared' | 'licensed'

export type PreparedToPass = 'not-started' | 'needs-work' | 'prepared'

export type Readiness = 'low' | 'moderate' | 'on-track'

export type Learner = {
  id: string
  name: string
  email: string
  /** The department (named for its lead, as the reference names them). */
  team: string
  hiringManager: string | null
  stage: LearnerStage
  /** Course content, 0–100; null before the course is opened. */
  contentPct: number | null
  /** Exam prep, 0–100; null before prep is opened. */
  prepPct: number | null
  /** Quiz + practice score band; null with no scores yet. */
  readiness: Readiness | null
  /** Quiz + practice score, when there is one. */
  score: number | null
  preparedToPass: PreparedToPass | null
  /** Days since the learner was last active. */
  lastActiveDays: number
  /** Days since enrollment (or since the invite, when it is still open). */
  enrolledDaysAgo: number
  /** ISO date, when an exam is booked (or was passed, for the licensed). */
  examDate: string | null
  hiddenFromReport: boolean
  state: 'NY' | 'NJ' | 'PA' | 'FL'
  course: string
  phone: string | null
}

/** The departments, as the reference's Department filter lists them. */
export const ADMIN_DEPARTMENTS = [
  'Alexis Hinojosa',
  'Amber Ramirez',
  'Andrea Rivera',
  'Cindy Yenkowski',
  'Coleen Acker',
  'Lance Carroll',
  'Mike Willits',
  'Adam Neal',
  'Adam Turch',
  'AJ Sheehan',
  'Corey Andrews',
  'Matt Wolk',
  'Sam Kwainoe',
  'Erin Bond',
  'Farmers National Recruiting Project',
  'Alex Andrews',
] as const

export const ADMIN_COMPANY = 'Farmers'
export const ADMIN_USER = { name: 'Cody McClintock', role: 'Administrator', initials: 'CM', department: 'Eric Department' }

const FIRST = [
  'Dana', 'Jordan', 'Priya', 'Olivia', 'James', 'Diego', 'Morgan', 'Lucas', 'Alex', 'Sophia', 'Taylor', 'Ethan',
  'Maya', 'Riley', 'Avery', 'Javon', 'Chen', 'Ava', 'Maria', 'Sam', 'Noah', 'Emma', 'Liam', 'Grace',
] as const
const LAST = [
  'Okonkwo', 'Jackson', 'Martinez', 'Lee', 'Thomas', 'Kim', 'Nguyen', 'Blake', 'Hall', 'Thompson', 'Walker',
  'Lewis', 'Garcia', 'Wilson', 'Moore', 'Anderson', 'Stone', 'White', 'Martin', 'Johnson', 'Patel', 'Reyes',
] as const

/** A small, fixed PRNG (mulberry32), so the roster is the same every load. */
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** How many of each stage — the reference's figures, exactly. */
const MIX: [LearnerStage, number][] = [
  ['invite-open', 9],
  ['never-started', 20],
  ['in-course', 47],
  ['prepping', 25],
  ['done-no-prep', 31],
  ['stalled', 34],
  ['ready-to-test', 22],
  ['licensed', 10],
]

const TODAY = new Date()

function isoInDays(days: number) {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function band(score: number): Readiness {
  return score >= 80 ? 'on-track' : score >= 70 ? 'moderate' : 'low'
}

function build(): Learner[] {
  const r = rng(20261019)
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)]
  const between = (lo: number, hi: number) => Math.round(lo + r() * (hi - lo))
  const used = new Set<string>()
  const out: Learner[] = []
  let readyWithExam = 0
  for (const [stage, count] of MIX) {
    for (let i = 0; i < count; i++) {
      let first: string
      let last: string
      let email: string
      do {
        first = pick(FIRST)
        last = pick(LAST)
        email = `${first}${last}${between(1, 160)}@rgn.example.com`.toLowerCase()
      } while (used.has(email))
      used.add(email)
      const team = pick(ADMIN_DEPARTMENTS)
      let contentPct: number | null = null
      let prepPct: number | null = null
      let score: number | null = null
      let preparedToPass: PreparedToPass | null = null
      let lastActiveDays = between(0, 6)
      let enrolledDaysAgo = between(5, 60)
      let examDate: string | null = null
      switch (stage) {
        case 'invite-open':
          enrolledDaysAgo = between(1, 14)
          lastActiveDays = enrolledDaysAgo
          break
        case 'never-started':
          enrolledDaysAgo = between(12, 120)
          lastActiveDays = enrolledDaysAgo
          break
        case 'in-course':
          contentPct = between(4, 92)
          score = contentPct > 15 ? between(62, 92) : null
          lastActiveDays = between(0, 6)
          break
        case 'prepping':
          contentPct = 100
          prepPct = between(8, 78)
          score = between(66, 90)
          preparedToPass = prepPct > 40 ? 'needs-work' : 'not-started'
          lastActiveDays = between(0, 5)
          break
        case 'done-no-prep':
          contentPct = 100
          prepPct = 0
          score = between(64, 86)
          preparedToPass = 'not-started'
          lastActiveDays = between(2, 40)
          break
        case 'stalled':
          contentPct = between(6, 70)
          score = contentPct > 15 ? between(58, 84) : null
          lastActiveDays = between(8, 75)
          break
        case 'ready-to-test':
          contentPct = 100
          prepPct = between(80, 100)
          score = between(80, 96)
          preparedToPass = 'prepared'
          lastActiveDays = between(0, 4)
          // 14 of the 22 have an exam booked.
          if (readyWithExam < 14) {
            examDate = isoInDays(between(3, 40))
            readyWithExam++
          }
          break
        case 'licensed':
          contentPct = 100
          prepPct = 100
          score = between(82, 97)
          preparedToPass = 'prepared'
          lastActiveDays = between(10, 45)
          examDate = isoInDays(-between(12, 45))
          break
      }
      out.push({
        id: email,
        name: `${first} ${last}`,
        email,
        team,
        hiringManager: r() < 0.12 ? null : pick(ADMIN_DEPARTMENTS.slice(0, 14)),
        stage,
        contentPct,
        prepPct,
        readiness: score === null ? null : band(score),
        score,
        preparedToPass,
        lastActiveDays,
        enrolledDaysAgo,
        examDate,
        hiddenFromReport: r() < 0.05,
        state: pick(['NY', 'NY', 'NY', 'NJ', 'PA', 'FL'] as const),
        course: 'Life & Health Pre-Licensing',
        phone: r() < 0.3 ? null : `(555) ${between(200, 899)}-${String(between(0, 9999)).padStart(4, '0')}`,
      })
    }
  }
  return out
}

export const ADMIN_LEARNERS: readonly Learner[] = build()

/** The three named demo learners the reference's chips jump to. */
export const ADMIN_DEMO_LEARNERS = {
  'brand-new': ADMIN_LEARNERS.find((l) => l.stage === 'invite-open')!,
  'in-flight': ADMIN_LEARNERS.find((l) => l.stage === 'in-course' && (l.contentPct ?? 0) > 40)!,
  complete: ADMIN_LEARNERS.find((l) => l.stage === 'licensed')!,
}

export function bucketOf(l: Learner): Exclude<PipelineBucket, 'all'> {
  switch (l.stage) {
    case 'invite-open':
    case 'never-started':
      return 'not-started'
    case 'in-course':
    case 'prepping':
      return 'in-progress'
    case 'done-no-prep':
    case 'stalled':
      return 'off-track'
    case 'ready-to-test':
      return 'prepared'
    case 'licensed':
      return 'licensed'
  }
}

export const STAGE_LABEL: Record<LearnerStage, string> = {
  'invite-open': 'Invite open',
  'never-started': 'Never started',
  'in-course': 'In course',
  prepping: 'Prepping',
  'done-no-prep': 'Done, no prep',
  stalled: 'Stalled',
  'ready-to-test': 'Ready to test',
  licensed: 'Licensed',
}

/** "Who needs you first" — the reference's default order: off track, then
 *  not started, in progress, prepared, licensed; the longest-quiet first
 *  within each. */
const NEED_ORDER: Record<Exclude<PipelineBucket, 'all'>, number> = {
  'off-track': 0,
  'not-started': 1,
  'in-progress': 2,
  prepared: 3,
  licensed: 4,
}

export function byNeed(a: Learner, b: Learner) {
  return NEED_ORDER[bucketOf(a)] - NEED_ORDER[bucketOf(b)] || b.lastActiveDays - a.lastActiveDays
}

export function relativeDays(days: number) {
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return days === 7 ? '7 days ago' : '1 week ago'
  if (days < 30) return `${Math.round(days / 7)} weeks ago`
  if (days < 60) return '1 month ago'
  return `${Math.round(days / 30)} months ago`
}

export function formatExamDate(iso: string | null) {
  if (!iso) return 'Not scheduled'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
