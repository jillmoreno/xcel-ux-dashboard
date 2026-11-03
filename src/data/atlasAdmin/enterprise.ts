import { ADMIN_DEPARTMENTS, bucketOf, type Learner } from './learners'

/**
 * ATLAS ADMIN — ENTERPRISE INSIGHTS (2026-10-20, feat/atlas-admin).
 *
 * The reference's /enterprise pages answer two different questions, and so
 * draw on two populations:
 *
 *   - PRE-LICENSING (risk, readiness, intervention) — the store's roster,
 *     counted, so it agrees with Students.
 *   - CONTINUING EDUCATION (compliance, audit) — the agency's LICENSED
 *     producers, who owe CE hours by a renewal date. The roster has only
 *     ten of them, so they are their own fixture here: 420 producers from a
 *     fixed seed, the same shape as the reference's 2,500 (Compliant, In
 *     progress, Under review, Expiring soon, Non-compliant).
 *
 * ⚠ DEPARTURE FROM THE REFERENCE: its producers mix insurance with NMLS
 * mortgage and banking programs, in twenty US cities. These are one
 * insurance agency's, in the roster's four states, with CE hours as those
 * states set them (24 in NY, NJ and FL; 24 in PA every two years).
 */

export type CeLine = 'Life & Health' | 'Property & Casualty'
export type CeStatus = 'compliant' | 'in-progress' | 'review' | 'expiring' | 'non-compliant'

export type Producer = {
  id: string
  name: string
  email: string
  title: string
  license: string
  line: CeLine
  state: Learner['state']
  department: string
  manager: string
  hoursDone: number
  hoursRequired: number
  /** Days to the renewal deadline; negative once it has passed. */
  deadlineDays: number
  status: CeStatus
  /** The day the last CE completion was recorded, days ago. */
  lastCompletionDays: number
}

export const CE_STATUS_LABEL: Record<CeStatus, string> = {
  compliant: 'Compliant',
  'in-progress': 'In progress',
  review: 'Under review',
  expiring: 'Expiring soon',
  'non-compliant': 'Non-compliant',
}

export const MANAGERS = ['Rachel Kim', 'Tom Bradley', 'Mike Stevens', 'Dana Whitfield'] as const

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

const FIRST = ['Derek', 'Kyle', 'Ellen', 'Janie', 'Fanny', 'Bruce', 'Landon', 'James', 'Monica', 'Robert', 'Angela', 'Steven', 'Patricia', 'William', 'Sandra', 'Maya', 'Olivia', 'Alyssa', 'Grace', 'Riley', 'Sofia', 'Kai', 'Tristan', 'Ben']
const LAST = ['Todd', 'Thompson', 'Garrett', 'Rodriguez', 'Vaughn', 'Romero', 'Hale', 'Bailey', 'Chen', 'Pierce', 'Morris', 'Park', 'Wells', 'Foster', 'Hughes', 'Iverson', 'Garcia', 'Lopez', 'Kim', 'Davis', 'Campbell', 'Turner', 'Bennett', 'Edwards']
const TITLES = ['Insurance Agent', 'Insurance Agent', 'Senior Insurance Agent', 'Agency Producer', 'Account Manager', 'Agency Manager']
const STATES: Learner['state'][] = ['NY', 'NY', 'NJ', 'PA', 'FL', 'FL']

function buildProducers(): Producer[] {
  const r = rng(20261020)
  const out: Producer[] = []
  for (let i = 0; i < 420; i++) {
    const first = FIRST[Math.floor(r() * FIRST.length)]
    const last = LAST[Math.floor(r() * LAST.length)]
    const required = 24
    const roll = r()
    let status: CeStatus
    let done: number
    let deadline: number
    if (roll < 0.6) {
      status = 'compliant'
      done = required
      deadline = 30 + Math.floor(r() * 330)
    } else if (roll < 0.82) {
      status = 'in-progress'
      done = Math.floor(r() * (required - 2)) + 1
      deadline = 31 + Math.floor(r() * 300)
    } else if (roll < 0.87) {
      status = 'review'
      done = required
      deadline = 31 + Math.floor(r() * 200)
    } else if (roll < 0.95) {
      status = 'expiring'
      done = Math.floor(r() * (required - 1))
      deadline = 1 + Math.floor(r() * 30)
    } else {
      status = 'non-compliant'
      done = Math.floor(r() * (required - 4))
      deadline = -1 - Math.floor(r() * 20)
    }
    out.push({
      id: `P${(1001 + i).toString()}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i}`.toLowerCase() + '@agency.example.com',
      title: TITLES[Math.floor(r() * TITLES.length)],
      license: String(100000 + Math.floor(r() * 899999)),
      line: r() < 0.6 ? 'Life & Health' : 'Property & Casualty',
      state: STATES[Math.floor(r() * STATES.length)],
      department: ADMIN_DEPARTMENTS[Math.floor(r() * ADMIN_DEPARTMENTS.length)],
      manager: MANAGERS[Math.floor(r() * MANAGERS.length)],
      hoursDone: done,
      hoursRequired: required,
      deadlineDays: deadline,
      status,
      lastCompletionDays: 1 + Math.floor(r() * 120),
    })
  }
  return out
}

export const PRODUCERS: readonly Producer[] = buildProducers()

/* ---- pre-licensing risk, counted off the roster ---- */

export type RiskType = 'stalled' | 'low-velocity' | 'repeated-failure' | 'time-anomaly' | 'due-soon' | 'overdue'

export const RISK_LABEL: Record<RiskType, string> = {
  stalled: 'Stalled',
  'low-velocity': 'Low velocity',
  'repeated-failure': 'Repeated failure',
  'time-anomaly': 'Time anomaly',
  'due-soon': 'Due soon',
  overdue: 'Overdue',
}

export type Risk = { learner: Learner; type: RiskType; reason: string; priority: 'high' | 'medium'; action: string; tags: string[] }

const DAY = 86_400_000

function daysUntil(iso: string, now: number) {
  return Math.round((new Date(`${iso}T12:00:00`).getTime() - now) / DAY)
}

/**
 * The deterministic rules — no model — that flag a pre-licensing learner,
 * first match wins, in the order an admin would act on them:
 * an exam date passed without a licence, an exam inside 14 days without
 * being prepared, exam prep done but scores low (failing practice exams),
 * enrolled two weeks with the course never launched, no activity for 14+ days, under 2 points of content a week, and course
 * content finished implausibly fast.
 */
export function riskOf(l: Learner, now: number): Risk | null {
  // Licensed is done; an open invite has not joined yet, so nothing it has
  // not done is a risk — Invites is where those are chased.
  if (l.stage === 'licensed' || l.stage === 'invite-open') return null
  const content = l.contentPct ?? 0
  const stage = content < 25 ? 'early-stage' : content < 75 ? 'mid-progress' : 'near-completion'
  if (l.examDate) {
    const d = daysUntil(l.examDate, now)
    if (d < 0) return { learner: l, type: 'overdue', reason: `Exam date passed ${-d} days ago, no licence recorded`, priority: 'high', action: 'Confirm the result or rebook the exam', tags: ['overdue', stage] }
    if (d <= 14 && bucketOf(l) !== 'prepared') return { learner: l, type: 'due-soon', reason: `Exam in ${d} days, not yet prepared`, priority: 'high', action: 'Manager check-in before exam day', tags: ['due-soon', stage] }
  }
  if ((l.prepPct ?? 0) >= 60 && l.readiness === 'low') return { learner: l, type: 'repeated-failure', reason: `Practice exams below passing at ${l.prepPct}% prep`, priority: 'high', action: 'Additional study resources or tutoring', tags: ['repeated-failure', stage] }
  if (l.stage === 'never-started' && l.enrolledDaysAgo >= 14) return { learner: l, type: 'stalled', reason: `Enrolled ${l.enrolledDaysAgo} days ago, never launched the course`, priority: l.enrolledDaysAgo >= 30 ? 'high' : 'medium', action: 'Manager follow-up recommended', tags: ['stalled', 'never-started'] }
  if (l.lastActiveDays >= 14) return { learner: l, type: 'stalled', reason: `No activity in ${l.lastActiveDays} days`, priority: l.lastActiveDays >= 21 ? 'high' : 'medium', action: l.lastActiveDays >= 21 ? 'Manager follow-up recommended' : 'Re-engagement email', tags: ['stalled', stage] }
  const weeks = Math.max(1, l.enrolledDaysAgo / 7)
  if (l.enrolledDaysAgo >= 21 && content / weeks < 2) return { learner: l, type: 'low-velocity', reason: `${(content / weeks).toFixed(1)} points of content a week`, priority: 'medium', action: 'Pace adjustment notification', tags: ['low-velocity', stage] }
  if (content >= 100 && l.enrolledDaysAgo <= 5) return { learner: l, type: 'time-anomaly', reason: `Course finished in ${l.enrolledDaysAgo} days`, priority: 'medium', action: 'Review time-on-task before exam booking', tags: ['time-anomaly'] }
  return null
}

/** The cohort a learner started in — the month of enrolment. */
export function cohortOf(l: Learner, now: number) {
  const d = new Date(now - l.enrolledDaysAgo * DAY)
  return `${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} cohort`
}

/* ---- pass rate: CE final exams and the state exam, by cohort ---- */

export type PassCohort = { cohort: string; program: string; total: number; passed: number; failed: number; pending: number; attempts: number; weeks: number }

export const PASS_COHORTS: PassCohort[] = [
  { cohort: 'Q3 2026 Renewal', program: 'Life & Health CE', total: 148, passed: 121, failed: 7, pending: 20, attempts: 1.2, weeks: 4.2 },
  { cohort: 'Q3 2026 Renewal', program: 'Property & Casualty CE', total: 96, passed: 80, failed: 6, pending: 10, attempts: 1.3, weeks: 5.1 },
  { cohort: 'Q3 2026', program: 'Annuity Best Interest (4-Hour)', total: 72, passed: 66, failed: 3, pending: 3, attempts: 1.1, weeks: 1.6 },
  { cohort: 'Q2 2026', program: 'NY Life & Health State Exam', total: 41, passed: 29, failed: 9, pending: 3, attempts: 1.4, weeks: 9.8 },
  { cohort: 'Q2 2026', program: 'Florida 2-15 State Exam', total: 33, passed: 24, failed: 6, pending: 3, attempts: 1.5, weeks: 8.6 },
  { cohort: 'Q2 2026 Renewal', program: 'Life & Health CE', total: 131, passed: 124, failed: 7, pending: 0, attempts: 1.2, weeks: 4.5 },
]
