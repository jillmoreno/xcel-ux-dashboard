import type { Learner } from './learners'
import { STAGE_LABEL } from './learners'

/**
 * XCEL ADMIN — THE REPORTS LIBRARY (2026-10-19). The reference's fifteen
 * reports, verbatim in name, description, category and last run, and what a
 * run returns: rows built from the admin roster, so a report's numbers are
 * the roster's numbers rather than a second, unrelated dataset (the
 * reference's runs return a bank's employees; ours return these recruits).
 */

export type ReportCategory = 'Progress' | 'Completion' | 'Compliance' | 'Insurance' | 'Audit'

export type ReportDef = {
  id: string
  name: string
  description: string
  category: ReportCategory
  lastRun: string
  isNew?: boolean
  favorite?: boolean
  scheduled?: string
}

export const ADMIN_REPORTS: ReportDef[] = [
  { id: 'course-summary', name: 'Course Summary', description: 'Enrollment, progress, and completion across active courses.', category: 'Progress', lastRun: 'Aug 4, 2026 9:12 AM', favorite: true, scheduled: 'Fridays at 8am' },
  { id: 'program-progress', name: 'Training Program Progress', description: 'Program-level progress, time spent, and pace by audience.', category: 'Progress', lastRun: 'Aug 2, 2026 11:18 AM', favorite: true },
  { id: 'audit-log', name: 'Audit Log / Activity Log', description: 'Admin and learner activity with before/after field values.', category: 'Audit', lastRun: 'Aug 5, 2026 9:55 AM', isNew: true },
  { id: 'assignment', name: 'Course Assignment / Enrollment', description: 'Who assigned each course and when learners enrolled.', category: 'Progress', lastRun: 'Jul 31, 2026 1:15 PM' },
  { id: 'completion', name: 'Course Completion', description: 'Completed and outstanding course assignments by learner.', category: 'Completion', lastRun: 'Aug 3, 2026 2:40 PM', scheduled: 'First of the month' },
  { id: 'course-progress', name: 'Course Progress', description: 'In-flight course progress with last activity and due dates.', category: 'Progress', lastRun: 'Aug 5, 2026 8:05 AM' },
  { id: 'insurance-listing', name: 'Insurance Course Listing', description: 'Licensure-state progress across course, prep, and simulated exam.', category: 'Insurance', lastRun: 'Aug 5, 2026 6:30 AM' },
  { id: 'insurance-lessons', name: 'Insurance Lesson Summary', description: 'Lesson-level status and quiz outcomes for insurance courses.', category: 'Insurance', lastRun: 'Aug 2, 2026 12:20 PM' },
  { id: 'required-pct', name: 'Required Course Percent Complete', description: 'Required-course completion with overdue counts by role.', category: 'Compliance', lastRun: 'Aug 4, 2026 3:05 PM' },
  { id: 'student-summary', name: 'Student Summary', description: 'Roll-up of assigned vs completed courses per learner.', category: 'Progress', lastRun: 'Aug 5, 2026 7:45 AM' },
  { id: 'transcript', name: 'Student Transcript', description: 'Learner history of courses and programs with credits and certificates.', category: 'Compliance', lastRun: 'Aug 1, 2026 10:00 AM' },
  { id: 'test-review', name: 'Test Review / Q&A', description: 'Most missed questions and percent correct by cohort.', category: 'Progress', lastRun: 'Jul 28, 2026 5:40 PM' },
  { id: 'time-spent', name: 'Time Spent / Test Attempts', description: 'Engagement time and assessment attempts with pass/fail.', category: 'Progress', lastRun: 'Aug 3, 2026 9:50 AM' },
  { id: 'program-completion', name: 'Training Program Completion', description: 'Program completions, scores, and overdue outcomes.', category: 'Completion', lastRun: 'Jul 29, 2026 4:22 PM' },
  { id: 'ple-progress', name: 'XCEL PLE Progress', description: 'Step 1 vs Steps 2–3 progress with exam-ready signal.', category: 'Insurance', lastRun: 'Aug 5, 2026 7:10 AM', scheduled: 'Mondays at 7am' },
]

export const REPORT_COLUMNS = [
  'Student name',
  'Email',
  'User status',
  'Department',
  'Supervisor',
  'Course name',
  'Assigned date',
  'Last active',
  '% Complete',
  'Status',
  'Exam date',
  'Time spent',
  'Score',
] as const

const DAY = 24 * 60 * 60 * 1000
const short = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/** One row per learner, in the report's shape. */
export function reportRows(learners: readonly Learner[]): string[][] {
  return learners.map((l) => {
    const minutes = Math.round(((l.contentPct ?? 0) / 100) * 40 * 60 + (l.prepPct ?? 0) * 6)
    return [
      l.name,
      l.email,
      l.lastActiveDays > 30 && l.stage !== 'licensed' ? 'Inactive' : 'Active',
      l.team,
      l.hiringManager ?? '—',
      l.course,
      short(l.enrolledDaysAgo),
      short(l.lastActiveDays),
      String(l.contentPct ?? 0),
      STAGE_LABEL[l.stage],
      l.examDate ?? '—',
      `${Math.floor(minutes / 60)}h ${minutes % 60}m`,
      l.score === null ? '—' : String(l.score),
    ]
  })
}
