// TODO(data): replace with real Study Calendar API integration once the
// Dashboard 2 migration is wired up (TD-3340). Calendar is conceptually
// scoped to a single Learning Path per the QE PRD; V1 ships canned data
// for an STC SIE prep path until per-path calendars exist server-side.

export type StudyTaskKind = 'video' | 'quiz' | 'exam' | 'reading' | 'custom'
export type StudyTaskStatus = 'completed' | 'in-progress' | 'upcoming' | 'overdue'

export type StudyTask = {
  id: string
  title: string
  kind: StudyTaskKind
  /** Optional chapter / module label shown under the title. */
  context?: string
  status: StudyTaskStatus
  /** ISO yyyy-mm-dd. */
  dueDate: string
  durationMin: number
  /** 0-100 completion percentage. Required when status === 'in-progress'. */
  progress?: number
  /** Linked content URL — course-linked tasks have this set. */
  href?: string
  /**
   * True for course-linked tasks (auto-complete via the LMS). False for
   * custom tasks (PDF reads, scheduled calls, reminders) where the learner
   * has to mark complete themselves.
   */
  isCourseLinked: boolean
}

export type StudyCalendar = {
  id: string
  name: string
  examName: string
  /** ISO yyyy-mm-dd. */
  examDate: string
  /** Optional exam time, `HH:mm` (24h). Undefined when no time is set. */
  examTime?: string
  /** ISO yyyy-mm-dd. */
  startDate: string
  daysPerWeek: number
  bufferDays: number
  excludeNYSEHolidays: boolean
  /** When true, admin/manager has locked pacing settings from learner edits. */
  locked: boolean
  tasks: StudyTask[]
}

/**
 * Sample STC SIE calendar. "Today" for derived state lives in
 * `STUDY_CALENDAR_TODAY` so views can compute relative dates without
 * touching `new Date()` (keeps screenshots / tests deterministic).
 */
export const STUDY_CALENDAR_TODAY = '2026-05-19'

export const STUDY_CALENDAR: StudyCalendar = {
  id: 'stc-series79-15day',
  name: 'Series 79 - 15 Day Study Plan',
  examName: 'Series 79 Investment Banking Representative',
  examDate: '2026-05-27',
  startDate: '2026-05-06',
  daysPerWeek: 5,
  bufferDays: 1,
  excludeNYSEHolidays: true,
  locked: false,
  tasks: [
    // ---- Week 1 (Wed May 6 – Fri May 8) — all completed ----
    {
      id: 's79-w1-wed-1',
      title: 'View Chapter 01: Industry Terminology and Data Collection',
      kind: 'video',
      status: 'completed',
      dueDate: '2026-05-06',
      durationMin: 35,
      href: '/courses/series79-ch1-view',
      isCourseLinked: true,
    },
    {
      id: 's79-w1-wed-2',
      title: 'Read Chapter 01 - Industry Terminology and Data Collection',
      kind: 'reading',
      status: 'completed',
      dueDate: '2026-05-06',
      durationMin: 50,
      href: '/courses/series79-ch1-read',
      isCourseLinked: true,
    },
    {
      id: 's79-w1-wed-3',
      title: 'Complete Chapter 1 Quiz',
      kind: 'quiz',
      status: 'completed',
      dueDate: '2026-05-06',
      durationMin: 20,
      href: '/courses/series79-ch1-quiz',
      isCourseLinked: true,
    },
    {
      id: 's79-w1-thu-1',
      title: 'View Chapter 02: Public Offerings',
      kind: 'video',
      status: 'completed',
      dueDate: '2026-05-07',
      durationMin: 35,
      href: '/courses/series79-ch2-view',
      isCourseLinked: true,
    },
    {
      id: 's79-w1-thu-2',
      title: 'Read Chapter 02 - Public Offerings',
      kind: 'reading',
      status: 'completed',
      dueDate: '2026-05-07',
      durationMin: 50,
      href: '/courses/series79-ch2-read',
      isCourseLinked: true,
    },
    {
      id: 's79-w1-thu-3',
      title: 'Complete Chapter 2 Quiz',
      kind: 'quiz',
      status: 'completed',
      dueDate: '2026-05-07',
      durationMin: 20,
      href: '/courses/series79-ch2-quiz',
      isCourseLinked: true,
    },
    {
      id: 's79-w1-thu-4',
      title: 'View Chapter 03: Underwriting',
      kind: 'video',
      status: 'completed',
      dueDate: '2026-05-07',
      durationMin: 40,
      href: '/courses/series79-ch3-view',
      isCourseLinked: true,
    },
    {
      id: 's79-w1-thu-5',
      title: 'Read Chapter 03 - Underwriting',
      kind: 'reading',
      status: 'completed',
      dueDate: '2026-05-07',
      durationMin: 55,
      href: '/courses/series79-ch3-read',
      isCourseLinked: true,
    },
    {
      id: 's79-w1-thu-6',
      title: 'Complete Chapter 3 Quiz',
      kind: 'quiz',
      status: 'completed',
      dueDate: '2026-05-07',
      durationMin: 20,
      href: '/courses/series79-ch3-quiz',
      isCourseLinked: true,
    },
    {
      id: 's79-w1-fri-1',
      title: 'Complete Progress Exam 1A',
      kind: 'exam',
      status: 'completed',
      dueDate: '2026-05-08',
      durationMin: 30,
      href: '/courses/series79-pe1a',
      isCourseLinked: true,
    },
    {
      id: 's79-w1-fri-2',
      title: 'Complete Progress Exam 1B',
      kind: 'exam',
      status: 'completed',
      dueDate: '2026-05-08',
      durationMin: 30,
      href: '/courses/series79-pe1b',
      isCourseLinked: true,
    },
    {
      id: 's79-w1-fri-3',
      title: 'View Chapter 04: Exempt Securities and Exempt Transactions',
      kind: 'video',
      status: 'completed',
      dueDate: '2026-05-08',
      durationMin: 35,
      href: '/courses/series79-ch4-view',
      isCourseLinked: true,
    },
    {
      id: 's79-w1-fri-4',
      title: 'Read Chapter 04 - Exempt Securities and Exempt Transactions',
      kind: 'reading',
      status: 'completed',
      dueDate: '2026-05-08',
      durationMin: 50,
      href: '/courses/series79-ch4-read',
      isCourseLinked: true,
    },
    {
      id: 's79-w1-fri-5',
      title: 'Complete Chapter 4 Quiz',
      kind: 'quiz',
      status: 'completed',
      dueDate: '2026-05-08',
      durationMin: 20,
      href: '/courses/series79-ch4-quiz',
      isCourseLinked: true,
    },

    // ---- Week 2 (Mon May 11 – Fri May 15) — all completed ----
    {
      id: 's79-w2-mon-1',
      title: 'View Chapter 05: Mergers and Acquisitions',
      kind: 'video',
      status: 'completed',
      dueDate: '2026-05-11',
      durationMin: 40,
      href: '/courses/series79-ch5-view',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-mon-2',
      title: 'Read Chapter 05 - Mergers and Acquisitions',
      kind: 'reading',
      status: 'completed',
      dueDate: '2026-05-11',
      durationMin: 55,
      href: '/courses/series79-ch5-read',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-mon-3',
      title: 'Complete Chapter 5 Quiz',
      kind: 'quiz',
      status: 'completed',
      dueDate: '2026-05-11',
      durationMin: 20,
      href: '/courses/series79-ch5-quiz',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-mon-4',
      title: 'View Chapter 06: Tender Offers and M&A Rules',
      kind: 'video',
      status: 'completed',
      dueDate: '2026-05-11',
      durationMin: 35,
      href: '/courses/series79-ch6-view',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-mon-5',
      title: 'Read Chapter 06 - Tender Offers and M&A Rules',
      kind: 'reading',
      status: 'completed',
      dueDate: '2026-05-11',
      durationMin: 50,
      href: '/courses/series79-ch6-read',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-mon-6',
      title: 'Complete Chapter 6 Quiz',
      kind: 'quiz',
      status: 'completed',
      dueDate: '2026-05-11',
      durationMin: 20,
      href: '/courses/series79-ch6-quiz',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-tue-1',
      title: 'View Chapter 07: Financial Restructuring and Bankruptcy',
      kind: 'video',
      status: 'completed',
      dueDate: '2026-05-12',
      durationMin: 40,
      href: '/courses/series79-ch7-view',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-tue-2',
      title: 'Read Chapter 07 - Financial Restructuring and Bankruptcy',
      kind: 'reading',
      status: 'completed',
      dueDate: '2026-05-12',
      durationMin: 55,
      href: '/courses/series79-ch7-read',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-tue-3',
      title: 'Complete Chapter 7 Quiz',
      kind: 'quiz',
      status: 'completed',
      dueDate: '2026-05-12',
      durationMin: 20,
      href: '/courses/series79-ch7-quiz',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-tue-4',
      title: 'Complete Progress Exam 2A',
      kind: 'exam',
      status: 'completed',
      dueDate: '2026-05-12',
      durationMin: 30,
      href: '/courses/series79-pe2a',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-tue-5',
      title: 'Complete Progress Exam 2B',
      kind: 'exam',
      status: 'completed',
      dueDate: '2026-05-12',
      durationMin: 30,
      href: '/courses/series79-pe2b',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-wed-1',
      title: 'View Chapter 08: Financial Analysis',
      kind: 'video',
      status: 'completed',
      dueDate: '2026-05-13',
      durationMin: 40,
      href: '/courses/series79-ch8-view',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-wed-2',
      title: 'Read Chapter 08 - Financial Analysis',
      kind: 'reading',
      status: 'completed',
      dueDate: '2026-05-13',
      durationMin: 55,
      href: '/courses/series79-ch8-read',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-wed-3',
      title: 'Complete Chapter 8 Quiz',
      kind: 'quiz',
      status: 'completed',
      dueDate: '2026-05-13',
      durationMin: 20,
      href: '/courses/series79-ch8-quiz',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-wed-4',
      title: 'View Chapter 09: Valuation Analysis',
      kind: 'video',
      status: 'completed',
      dueDate: '2026-05-13',
      durationMin: 40,
      href: '/courses/series79-ch9-view',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-wed-5',
      title: 'Read Chapter 09 - Valuation Analysis',
      kind: 'reading',
      status: 'completed',
      dueDate: '2026-05-13',
      durationMin: 55,
      href: '/courses/series79-ch9-read',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-wed-6',
      title: 'Complete Chapter 9 Quiz',
      kind: 'quiz',
      status: 'completed',
      dueDate: '2026-05-13',
      durationMin: 20,
      href: '/courses/series79-ch9-quiz',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-thu-1',
      title: 'View Chapter 10: M&A Valuation',
      kind: 'video',
      status: 'completed',
      dueDate: '2026-05-14',
      durationMin: 40,
      href: '/courses/series79-ch10-view',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-thu-2',
      title: 'Read Chapter 10 - M&A Valuation',
      kind: 'reading',
      status: 'completed',
      dueDate: '2026-05-14',
      durationMin: 55,
      href: '/courses/series79-ch10-read',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-thu-3',
      title: 'Complete Chapter 10 Quiz',
      kind: 'quiz',
      status: 'completed',
      dueDate: '2026-05-14',
      durationMin: 20,
      href: '/courses/series79-ch10-quiz',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-thu-4',
      title: 'Complete Progress Exam 3A',
      kind: 'exam',
      status: 'completed',
      dueDate: '2026-05-14',
      durationMin: 30,
      href: '/courses/series79-pe3a',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-thu-5',
      title: 'Complete Progress Exam 3B',
      kind: 'exam',
      status: 'completed',
      dueDate: '2026-05-14',
      durationMin: 30,
      href: '/courses/series79-pe3b',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-fri-1',
      title: 'Complete Final Exam 01',
      kind: 'exam',
      status: 'completed',
      dueDate: '2026-05-15',
      durationMin: 90,
      href: '/courses/series79-fe01',
      isCourseLinked: true,
    },
    {
      id: 's79-w2-fri-2',
      title: 'Complete Final Exam 02',
      kind: 'exam',
      status: 'completed',
      dueDate: '2026-05-15',
      durationMin: 90,
      href: '/courses/series79-fe02',
      isCourseLinked: true,
    },

    // ---- Week 3 (Mon May 18 – Fri May 22) — Tue May 19 is today ----
    {
      id: 's79-w3-mon-1',
      title: 'Complete Final Exam 03',
      kind: 'exam',
      status: 'completed',
      dueDate: '2026-05-18',
      durationMin: 90,
      href: '/courses/series79-fe03',
      isCourseLinked: true,
    },
    {
      id: 's79-w3-mon-2',
      title: 'Complete Final Exam 04',
      kind: 'exam',
      status: 'completed',
      dueDate: '2026-05-18',
      durationMin: 90,
      href: '/courses/series79-fe04',
      isCourseLinked: true,
    },
    // Demo data — one overdue ("Off Track") task on Mon May 18 so the
    // chip filter + status sort have something concrete to surface.
    // Reading kind so it visually contrasts with the surrounding exams.
    {
      id: 's79-w3-mon-3',
      title: 'Review Chapter 08 — Trading Rules and Disclosure',
      kind: 'reading',
      status: 'overdue',
      dueDate: '2026-05-18',
      durationMin: 45,
      href: '/courses/series79-ch8-review',
      isCourseLinked: true,
    },
    // Today (May 19) — Greenlight 1 in progress.
    {
      id: 's79-w3-tue-1',
      title: 'Complete Greenlight 1',
      kind: 'exam',
      status: 'in-progress',
      dueDate: '2026-05-19',
      durationMin: 120,
      progress: 47,
      href: '/courses/series79-greenlight-1',
      isCourseLinked: true,
    },
    {
      id: 's79-w3-wed-1',
      title: 'Complete Final Exam 05',
      kind: 'exam',
      status: 'upcoming',
      dueDate: '2026-05-20',
      durationMin: 90,
      href: '/courses/series79-fe05',
      isCourseLinked: true,
    },
    {
      id: 's79-w3-thu-1',
      title: 'Complete Final Exam 06',
      kind: 'exam',
      status: 'upcoming',
      dueDate: '2026-05-21',
      durationMin: 90,
      href: '/courses/series79-fe06',
      isCourseLinked: true,
    },
    {
      id: 's79-w3-fri-1',
      title: 'Complete Final Exam 07',
      kind: 'exam',
      status: 'upcoming',
      dueDate: '2026-05-22',
      durationMin: 90,
      href: '/courses/series79-fe07',
      isCourseLinked: true,
    },

    // ---- Week 4 (Mon May 25 – Tue May 26) — final stretch before exam ----
    {
      id: 's79-w4-mon-1',
      title: 'Complete Final Exam 08',
      kind: 'exam',
      status: 'upcoming',
      dueDate: '2026-05-25',
      durationMin: 90,
      href: '/courses/series79-fe08',
      isCourseLinked: true,
    },
    {
      id: 's79-w4-tue-1',
      title: 'Review Crunch Time Facts',
      kind: 'reading',
      status: 'upcoming',
      dueDate: '2026-05-26',
      durationMin: 45,
      href: '/courses/series79-crunch',
      isCourseLinked: true,
    },
    {
      id: 's79-w4-tue-2',
      title: 'Complete Greenlight 2',
      kind: 'exam',
      status: 'upcoming',
      dueDate: '2026-05-26',
      durationMin: 120,
      href: '/courses/series79-greenlight-2',
      isCourseLinked: true,
    },
  ],
}

/**
 * XCEL Life & Health pre-licensing Study Plan.
 *
 * Structured on XCEL's own published 3-Part Training Program, which maps
 * cleanly onto `StudyTask` with no type changes:
 *
 *   Part 1 · Pre-License Education   lesson video (`video`) → Review Notes
 *                                    (`reading`, self-marked) → Practice
 *                                    Questions (`quiz`). Meets the state hour
 *                                    requirement.
 *   Part 2 · Prep Review Course      unlocked by completing Part 1.
 *   Part 3 · Exam Simulators         three, each weighted by topic to match the
 *                                    state exam, in the 24 hours before it.
 *
 * plus the named study tools — Livestream Exam Review (a scheduled live
 * session, so `custom` + self-marked), 800+ Flashcards, On-Demand Lecture
 * Videos, and Exam Cram.
 *
 * Anchored so `STUDY_CALENDAR_TODAY` (2026-05-19) lands mid-plan: 12 tasks
 * complete, Lesson 5's video in progress, the rest upcoming — ~32% by task
 * count, which lines up with the 30% the `xcel-fl-lh-prelicensing` learning
 * path reports by credit hour. `examDate` matches that path's exactly; if you
 * change one, change both.
 *
 * `excludeNYSEHolidays: false` — NYSE holidays are securities-specific and
 * insurance state exams are not scheduled around them. The settings sheet
 * hides the toggle off STC; the field stays because it is a required part of
 * `StudyCalendar` today. See the TODO there about a generic `holidayCalendar`.
 *
 * TODO(data): the brand file supplies the STRUCTURE (the 3-Part Program, the
 * study tools, the three simulators) but NOT a syllabus, so the eight lesson
 * TITLES are representative demo content — the line-of-authority names plus
 * the two CE topics XCEL does name (annuities, long-term care). Swap them for
 * the real Life & Health content outline before this is shown as curriculum.
 */
export const XCEL_LH_STUDY_CALENDAR: StudyCalendar = {
  id: 'xcel-lh-20day',
  name: 'Life & Health — 20 Day Study Plan',
  examName: 'Florida Life & Health Insurance Producer Exam',
  examDate: '2026-06-12',
  startDate: '2026-05-11',
  daysPerWeek: 5,
  bufferDays: 1,
  excludeNYSEHolidays: false,
  locked: false,
  tasks: [
    // ── Part 1 · Pre-License Education (weeks 1–3) ─────────────────────
    {
      id: 'xcel-lh-u1-video',
      title: 'Watch Lesson 1: Life Insurance Basics',
      kind: 'video',
      status: 'completed',
      dueDate: '2026-05-11',
      durationMin: 40,
      href: '/courses/xcel-lh-u1-video',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-u1-notes',
      title: 'Read Review Notes — Lesson 1: Life Insurance Basics',
      kind: 'reading',
      status: 'completed',
      dueDate: '2026-05-11',
      durationMin: 25,
      isCourseLinked: false,
    },
    {
      id: 'xcel-lh-u1-quiz',
      title: 'Complete Practice Questions — Lesson 1',
      kind: 'quiz',
      status: 'completed',
      dueDate: '2026-05-12',
      durationMin: 20,
      href: '/courses/xcel-lh-u1-quiz',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-u2-video',
      title: 'Watch Lesson 2: Life Insurance Policies',
      kind: 'video',
      status: 'completed',
      dueDate: '2026-05-12',
      durationMin: 40,
      href: '/courses/xcel-lh-u2-video',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-u2-notes',
      title: 'Read Review Notes — Lesson 2: Life Insurance Policies',
      kind: 'reading',
      status: 'completed',
      dueDate: '2026-05-13',
      durationMin: 25,
      isCourseLinked: false,
    },
    {
      id: 'xcel-lh-u2-quiz',
      title: 'Complete Practice Questions — Lesson 2',
      kind: 'quiz',
      status: 'completed',
      dueDate: '2026-05-13',
      durationMin: 20,
      href: '/courses/xcel-lh-u2-quiz',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-u3-video',
      title: 'Watch Lesson 3: Annuities',
      kind: 'video',
      status: 'completed',
      dueDate: '2026-05-14',
      durationMin: 40,
      href: '/courses/xcel-lh-u3-video',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-u3-notes',
      title: 'Read Review Notes — Lesson 3: Annuities',
      kind: 'reading',
      status: 'completed',
      dueDate: '2026-05-14',
      durationMin: 25,
      isCourseLinked: false,
    },
    {
      id: 'xcel-lh-u3-quiz',
      title: 'Complete Practice Questions — Lesson 3',
      kind: 'quiz',
      status: 'completed',
      dueDate: '2026-05-15',
      durationMin: 20,
      href: '/courses/xcel-lh-u3-quiz',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-u4-video',
      title: 'Watch Lesson 4: Health Insurance Basics',
      kind: 'video',
      status: 'completed',
      dueDate: '2026-05-15',
      durationMin: 40,
      href: '/courses/xcel-lh-u4-video',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-u4-notes',
      title: 'Read Review Notes — Lesson 4: Health Insurance Basics',
      kind: 'reading',
      status: 'completed',
      dueDate: '2026-05-18',
      durationMin: 25,
      isCourseLinked: false,
    },
    {
      id: 'xcel-lh-u4-quiz',
      title: 'Complete Practice Questions — Lesson 4',
      kind: 'quiz',
      status: 'completed',
      dueDate: '2026-05-18',
      durationMin: 20,
      href: '/courses/xcel-lh-u4-quiz',
      isCourseLinked: true,
    },
    // Today is 2026-05-19 — Lesson 5's video is the in-progress task.
    {
      id: 'xcel-lh-u5-video',
      title: 'Watch Lesson 5: Health Insurance Policies',
      kind: 'video',
      status: 'in-progress',
      dueDate: '2026-05-19',
      durationMin: 40,
      progress: 40,
      href: '/courses/xcel-lh-u5-video',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-u5-notes',
      title: 'Read Review Notes — Lesson 5: Health Insurance Policies',
      kind: 'reading',
      status: 'upcoming',
      dueDate: '2026-05-19',
      durationMin: 25,
      isCourseLinked: false,
    },
    {
      id: 'xcel-lh-u5-quiz',
      title: 'Complete Practice Questions — Lesson 5',
      kind: 'quiz',
      status: 'upcoming',
      dueDate: '2026-05-20',
      durationMin: 20,
      href: '/courses/xcel-lh-u5-quiz',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-u6-video',
      title: 'Watch Lesson 6: Long-Term Care',
      kind: 'video',
      status: 'upcoming',
      dueDate: '2026-05-20',
      durationMin: 40,
      href: '/courses/xcel-lh-u6-video',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-u6-notes',
      title: 'Read Review Notes — Lesson 6: Long-Term Care',
      kind: 'reading',
      status: 'upcoming',
      dueDate: '2026-05-21',
      durationMin: 25,
      isCourseLinked: false,
    },
    {
      id: 'xcel-lh-u6-quiz',
      title: 'Complete Practice Questions — Lesson 6',
      kind: 'quiz',
      status: 'upcoming',
      dueDate: '2026-05-21',
      durationMin: 20,
      href: '/courses/xcel-lh-u6-quiz',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-flashcards-1',
      title: 'Review Flashcards — Lessons 1–6',
      kind: 'quiz',
      status: 'upcoming',
      dueDate: '2026-05-22',
      durationMin: 30,
      href: '/courses/xcel-lh-flashcards-1',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-u7-video',
      title: 'Watch Lesson 7: Florida Laws & Rules',
      kind: 'video',
      status: 'upcoming',
      dueDate: '2026-05-25',
      durationMin: 40,
      href: '/courses/xcel-lh-u7-video',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-u7-notes',
      title: 'Read Review Notes — Lesson 7: Florida Laws & Rules',
      kind: 'reading',
      status: 'upcoming',
      dueDate: '2026-05-25',
      durationMin: 25,
      isCourseLinked: false,
    },
    {
      id: 'xcel-lh-u7-quiz',
      title: 'Complete Practice Questions — Lesson 7',
      kind: 'quiz',
      status: 'upcoming',
      dueDate: '2026-05-26',
      durationMin: 20,
      href: '/courses/xcel-lh-u7-quiz',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-u8-video',
      title: 'Watch Lesson 8: Ethics & Producer Responsibilities',
      kind: 'video',
      status: 'upcoming',
      dueDate: '2026-05-27',
      durationMin: 40,
      href: '/courses/xcel-lh-u8-video',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-u8-notes',
      title: 'Read Review Notes — Lesson 8: Ethics & Producer Responsibilities',
      kind: 'reading',
      status: 'upcoming',
      dueDate: '2026-05-27',
      durationMin: 25,
      isCourseLinked: false,
    },
    {
      id: 'xcel-lh-u8-quiz',
      title: 'Complete Practice Questions — Lesson 8',
      kind: 'quiz',
      status: 'upcoming',
      dueDate: '2026-05-28',
      durationMin: 20,
      href: '/courses/xcel-lh-u8-quiz',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-part1-recap',
      title: 'Read Part 1 Review Notes — full recap',
      kind: 'reading',
      status: 'upcoming',
      dueDate: '2026-05-29',
      durationMin: 45,
      isCourseLinked: false,
    },
    // ── Part 2 · Prep Review Course (unlocked by completing Part 1) ────
    {
      id: 'xcel-lh-prep-1',
      title: 'Prep Review Course — Module 1',
      kind: 'reading',
      status: 'upcoming',
      dueDate: '2026-06-01',
      durationMin: 50,
      href: '/courses/xcel-lh-prep-1',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-prep-2',
      title: 'Prep Review Course — Module 2',
      kind: 'reading',
      status: 'upcoming',
      dueDate: '2026-06-02',
      durationMin: 50,
      href: '/courses/xcel-lh-prep-2',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-prep-3',
      title: 'Prep Review Course — Module 3',
      kind: 'reading',
      status: 'upcoming',
      dueDate: '2026-06-03',
      durationMin: 50,
      href: '/courses/xcel-lh-prep-3',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-prep-4',
      title: 'Prep Review Course — Module 4',
      kind: 'reading',
      status: 'upcoming',
      dueDate: '2026-06-04',
      durationMin: 50,
      href: '/courses/xcel-lh-prep-4',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-lecture-recap',
      title: 'Watch On-Demand Lecture — full recap',
      kind: 'video',
      status: 'upcoming',
      dueDate: '2026-06-05',
      durationMin: 60,
      href: '/courses/xcel-lh-lecture-recap',
      isCourseLinked: true,
    },
    // ── Study tools · the final week ───────────────────────────────────
    {
      id: 'xcel-lh-flashcards-full',
      title: 'Review Flashcards — full 800+ deck',
      kind: 'quiz',
      status: 'upcoming',
      dueDate: '2026-06-08',
      durationMin: 45,
      href: '/courses/xcel-lh-flashcards-full',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-livestream',
      title: 'Attend the Livestream Exam Review (1 day)',
      kind: 'custom',
      status: 'upcoming',
      dueDate: '2026-06-09',
      durationMin: 360,
      isCourseLinked: false,
    },
    {
      id: 'xcel-lh-exam-cram',
      title: 'Watch Exam Cram',
      kind: 'video',
      status: 'upcoming',
      dueDate: '2026-06-10',
      durationMin: 90,
      href: '/courses/xcel-lh-exam-cram',
      isCourseLinked: true,
    },
    // ── Part 3 · Exam Simulators — the 24 hours before the state exam ──
    // ⚠ XCEL unlocks each simulator only when the previous one is complete.
    // `StudyTask` has no `prerequisite` / `locked` field, so the ORDER carries
    // that dependency and nothing enforces it. Do NOT reach for `gated` — that
    // means "not purchased", which is a different thing. Modelling the
    // dependency properly is a follow-up.
    {
      id: 'xcel-lh-sim-1',
      title: 'Take Exam Simulator 1',
      kind: 'exam',
      status: 'upcoming',
      dueDate: '2026-06-11',
      durationMin: 120,
      href: '/courses/xcel-lh-sim-1',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-sim-2',
      title: 'Take Exam Simulator 2',
      kind: 'exam',
      status: 'upcoming',
      dueDate: '2026-06-11',
      durationMin: 120,
      href: '/courses/xcel-lh-sim-2',
      isCourseLinked: true,
    },
    {
      id: 'xcel-lh-sim-3',
      title: 'Take Exam Simulator 3',
      kind: 'exam',
      status: 'upcoming',
      dueDate: '2026-06-11',
      durationMin: 120,
      href: '/courses/xcel-lh-sim-3',
      isCourseLinked: true,
    },
  ],
}

/**
 * XCEL Property & Casualty variant — the same plan shape with nothing started,
 * so the demo has a not-started Study Plan alongside the on-track one (the same
 * pairing STC gets from Series 79 / Series 63). Every task is `upcoming`,
 * progress cleared, and the whole run is shifted forward so day 1 is
 * `STUDY_CALENDAR_TODAY` — without the shift the cloned dates would sit in the
 * past and read as "overdue before you even started".
 */
function buildXcelNotStartedCalendar(): StudyCalendar {
  const offsetDays =
    (customIsoToUTC(STUDY_CALENDAR_TODAY) - customIsoToUTC(XCEL_LH_STUDY_CALENDAR.startDate)) /
    86400000
  // `progress` is dropped rather than destructured away. The two STC builders
  // above use `({ progress: _progress, ...t })`, which each cost a
  // `no-unused-vars` error; same result, one fewer.
  const tasks: StudyTask[] = XCEL_LH_STUDY_CALENDAR.tasks.map((t) => ({
    ...t,
    progress: undefined,
    status: 'upcoming' as const,
    dueDate: shiftIsoDateByDays(t.dueDate, offsetDays),
  }))
  return {
    ...XCEL_LH_STUDY_CALENDAR,
    id: 'xcel-pc-20day',
    name: 'Property & Casualty — 20 Day Study Plan',
    examName: 'Florida Property & Casualty Insurance Producer Exam',
    examDate: shiftIsoDateByDays(XCEL_LH_STUDY_CALENDAR.examDate, offsetDays),
    startDate: STUDY_CALENDAR_TODAY,
    tasks,
  }
}

/**
 * Set of STC Learning Path ids that currently have a Study Calendar
 * assigned. Anything outside this set returns `false` from
 * `hasStudyCalendarFor` and the Study Calendar tab surfaces its empty
 * state ("No calendar assigned to this path."). Today this covers all
 * three STC paths in `learningFixtures.ts`; the set exists so a future
 * non-exam STC path (e.g., a CE-style track) drops cleanly into the
 * empty branch.
 *
 * TODO(data): replace with a real per-path lookup once the back-end
 * exposes one calendar per Learning Path.
 */
const STC_PATHS_WITH_CALENDAR = new Set<string>([
  'series-79-15day',
  'series-79-calendar-first',
  'series-79-calendar-stacked',
  'series-79-calendar-in-tab',
  'series-7-topoff',
  'series-63-statelaw',
])

/**
 * XCEL Learning Path ids with a Study Plan. The two pre-licensing paths
 * qualify; the CE path deliberately does NOT — a renewal cycle with a
 * variable, sometimes birthday-based deadline is not the same object as a
 * countdown to a booked exam, and it drops cleanly into the empty branch
 * rather than being given a plan that misdescribes it.
 */
const XCEL_PATHS_WITH_CALENDAR = new Set<string>([
  'xcel-fl-lh-prelicensing',
  'xcel-fl-pc-prelicensing',
])

/** XCEL path treated as "not yet started" by the demo — see STC's equivalent. */
const XCEL_NOT_STARTED_PATH_ID = 'xcel-fl-pc-prelicensing'

/**
 * Whether a brand has the Study Plan feature at all.
 *
 * ⚠ THIS IS THE SINGLE GATE. It replaced SIX separate `brand === 'stc'` /
 * `brand !== 'stc'` literals — one here and five in `LearningPathPage`
 * (`showStudyCalendar`, `goalTrackerLabel`, `showGoalTrackerTab`,
 * `showCalendarPromo`, `showDailyTasksPromo`). Leaving even one behind gives
 * you a brand with a Study Plan tab and no Study Plan, or the reverse.
 *
 * Do NOT extend this by writing `brand !== 'stc' && brand !== 'xcel'` anywhere
 * — adding a brand is one entry here.
 *
 * WHICH PATHS within a supporting brand qualify is a separate question, asked
 * by `hasStudyCalendarFor`.
 */
export function supportsStudyPlan(brand: string | undefined): boolean {
  return brand === 'stc' || brand === 'xcel'
}

/**
 * STC Learning Path id treated as "not yet started" by the demo — its
 * calendar mirrors the default plan's task structure but no task is marked
 * complete, and the metadata (name / exam date / start date) is rewritten
 * to match the Series 63 path on STC. Other paths still get
 * `STUDY_CALENDAR` (Series 79) verbatim.
 */
const STC_NOT_STARTED_PATH_ID = 'series-63-statelaw'

/**
 * STC Learning Path id treated as "off track" by the demo — its
 * calendar mirrors the default plan's task structure but most past-
 * due tasks are flagged `overdue` with only a small handful marked
 * `completed`, dragging the completion rate to ~12% (matches the
 * progressPct surfaced on the Series 7 path entry).
 */
const STC_OFF_TRACK_PATH_ID = 'series-7-topoff'

/**
 * True when the given path has a Study Plan to render — the brand supports the
 * feature AND this particular path qualifies. The Study Plan tab uses it to
 * pick between the real panel and `StudyCalendarEmptyState`. `LearningPathPage`
 * reads the brand half through the same `supportsStudyPlan`, so the tab and its
 * contents can never disagree about whether the feature exists.
 */
export function hasStudyCalendarFor(
  brand: string | undefined,
  pathId: string | undefined,
): boolean {
  if (!supportsStudyPlan(brand)) return false
  if (!pathId) return false
  if (brand === 'xcel') return XCEL_PATHS_WITH_CALENDAR.has(pathId)
  return STC_PATHS_WITH_CALENDAR.has(pathId)
}

/**
 * Returns the Study Calendar for the given Learning Path id.
 *
 *   - Series 79 → default `STUDY_CALENDAR` (on-track variant)
 *   - Series 7  → off-track variant (most past-due tasks `overdue`,
 *                  ~12% completed)
 *   - Series 63 → not-started variant (every task `upcoming`)
 *
 * The 3 variants drive the STC demo trio so reviewers can compare the
 * on-track / off-track / not-started Study Calendar UX without
 * juggling separate fixture files. Task content stays Series 79-shaped
 * for the off-track + not-started variants today; titles can be
 * re-authored once Series 7 / Series 63 content lands in the catalog.
 *
 * TODO(data): replace with a real per-path calendar lookup once the
 * API exposes one calendar per Learning Path.
 */
export function studyCalendarFor(pathId?: string): StudyCalendar {
  // XCEL first — its ids are disjoint from STC's, so order is not load-bearing,
  // but the brand's paths must resolve to a brand's OWN plan. Falling through
  // to the Series 79 default would put securities tasks under an insurance
  // path, which is the one outcome worse than the empty state.
  if (pathId === XCEL_NOT_STARTED_PATH_ID) {
    return buildXcelNotStartedCalendar()
  }
  if (pathId === 'xcel-fl-lh-prelicensing') {
    return XCEL_LH_STUDY_CALENDAR
  }
  if (pathId === STC_OFF_TRACK_PATH_ID) {
    return buildOffTrackCalendar()
  }
  if (pathId === STC_NOT_STARTED_PATH_ID) {
    return buildNotStartedCalendar()
  }
  return STUDY_CALENDAR
}

/** Series 7 off-track variant — promotes every past-due task to
 *  `overdue` except for the first few (kept `completed` so the
 *  calendar shows some progress and the count matches the path's
 *  12% progressPct). Future tasks stay `upcoming`. */
function buildOffTrackCalendar(): StudyCalendar {
  // ~12% of the 40-task plan → leave the first ~5 past tasks marked
  // completed; everything else in the past becomes overdue.
  const completedTarget = Math.max(
    1,
    Math.round(STUDY_CALENDAR.tasks.length * 0.12),
  )
  let completedCount = 0
  const tasks: StudyTask[] = STUDY_CALENDAR.tasks.map(
    ({ progress: _progress, ...t }) => {
      if (t.dueDate >= STUDY_CALENDAR_TODAY) {
        // Future tasks — haven't been reached yet.
        return { ...t, status: 'upcoming' as const }
      }
      if (completedCount < completedTarget) {
        completedCount += 1
        return { ...t, status: 'completed' as const }
      }
      // Past task that wasn't finished in time → overdue.
      return { ...t, status: 'overdue' as const }
    },
  )
  return {
    ...STUDY_CALENDAR,
    id: 'stc-series7-topoff',
    name: 'Series 7 · Top-Off Study Plan',
    examName: 'Series 7 Top-Off — General Securities Representative',
    examDate: '2026-07-15',
    // Earlier start so the past-due window is wide enough to make the
    // "off-track" overdue cluster visible in the calendar grid.
    startDate: '2026-05-04',
    tasks,
  }
}

/** Series 63 not-started variant — every task `upcoming`, progress
 *  cleared, AND every task due-date shifted forward so the calendar
 *  starts on `STUDY_CALENDAR_TODAY`. Without the shift the cloned
 *  Series 79 tasks would still sit on May 6 – 27 (the source plan's
 *  window), which puts a chunk of them in the past and reads as
 *  "overdue before you even started." Shifting preserves the task
 *  cadence while anchoring day 1 to today. */
function buildNotStartedCalendar(): StudyCalendar {
  const newStartDate = STUDY_CALENDAR_TODAY
  const offsetDays =
    (customIsoToUTC(newStartDate) - customIsoToUTC(STUDY_CALENDAR.startDate)) /
    86400000
  const tasks: StudyTask[] = STUDY_CALENDAR.tasks.map(
    ({ progress: _progress, ...t }) => ({
      ...t,
      status: 'upcoming' as const,
      dueDate: shiftIsoDateByDays(t.dueDate, offsetDays),
    }),
  )
  return {
    ...STUDY_CALENDAR,
    id: 'stc-series63-statelaw',
    name: 'Series 63 · Study Plan',
    examName: 'Series 63 — Uniform Securities Agent State Law',
    examDate: '2026-08-22',
    startDate: newStartDate,
    tasks,
  }
}

/** Add N whole days to an ISO date string (yyyy-mm-dd). Pure helper
 *  used by the Not-Started calendar builder so the cloned task list
 *  can be re-anchored to a new startDate without manually rewriting
 *  every dueDate fixture. */
function shiftIsoDateByDays(iso: string, days: number): string {
  return customUtcToIso(customIsoToUTC(iso) + days * 86400000)
}

/**
 * Status-override variants exposed through the `study-calendar-status`
 * feature flag. `match` lets the path's natural status flow through
 * (Series 79 → On Track, Series 7 → Off Track, Series 63 → Not
 * Started). The three forced values morph whatever calendar the
 * learner is on into the matching state — handy for demoing each
 * status pill against the same path without swapping fixtures.
 */
export type StatusOverride = 'match' | 'not-started' | 'on-track' | 'off-track'

const STATUS_OVERRIDES: StatusOverride[] = [
  'match',
  'not-started',
  'on-track',
  'off-track',
]

/**
 * Narrows an untrusted string (e.g. a URL param) to a `StatusOverride`,
 * returning `undefined` for anything unrecognized so callers can fall
 * back to the feature flag / default.
 */
export function parseStatusOverride(
  raw: string | null | undefined,
): StatusOverride | undefined {
  return raw && (STATUS_OVERRIDES as string[]).includes(raw)
    ? (raw as StatusOverride)
    : undefined
}

/**
 * Returns a copy of `calendar` whose tasks have been re-statused to
 * match `override`. `match` is a no-op pass-through. The three forced
 * values mirror the per-path builders (`buildNotStartedCalendar`,
 * `buildOffTrackCalendar`, and the natural Series 79 default) but
 * preserve the source calendar's metadata (id, name, examName,
 * examDate) so the stat band reads against the correct path.
 */
export function applyStatusOverride(
  calendar: StudyCalendar,
  override: StatusOverride,
): StudyCalendar {
  if (override === 'match') return calendar

  if (override === 'not-started') {
    // Every task `upcoming`, dates shifted so day 1 = today. Mirrors
    // `buildNotStartedCalendar` but on the passed calendar's shape.
    const newStartDate = STUDY_CALENDAR_TODAY
    const offsetDays =
      (customIsoToUTC(newStartDate) - customIsoToUTC(calendar.startDate)) /
      86400000
    const tasks: StudyTask[] = calendar.tasks.map(
      ({ progress: _progress, ...t }) => ({
        ...t,
        status: 'upcoming' as const,
        dueDate: shiftIsoDateByDays(t.dueDate, offsetDays),
      }),
    )
    return { ...calendar, startDate: newStartDate, tasks }
  }

  if (override === 'on-track') {
    // Every past-due task completed, future tasks upcoming. Yields
    // a completion rate that meets or exceeds the elapsed-time
    // proportion, so `pacingStatus` returns 'on-track'.
    const tasks: StudyTask[] = calendar.tasks.map(
      ({ progress: _progress, ...t }) => {
        if (t.dueDate < STUDY_CALENDAR_TODAY) {
          return { ...t, status: 'completed' as const }
        }
        return { ...t, status: 'upcoming' as const }
      },
    )
    return { ...calendar, tasks }
  }

  // off-track — mirrors `buildOffTrackCalendar`: leave only the first
  // ~12% of past tasks completed; promote everything else in the past
  // to `overdue`. Future tasks stay `upcoming`.
  const completedTarget = Math.max(
    1,
    Math.round(calendar.tasks.length * 0.12),
  )
  let completedCount = 0
  const tasks: StudyTask[] = calendar.tasks.map(
    ({ progress: _progress, ...t }) => {
      if (t.dueDate >= STUDY_CALENDAR_TODAY) {
        return { ...t, status: 'upcoming' as const }
      }
      if (completedCount < completedTarget) {
        completedCount += 1
        return { ...t, status: 'completed' as const }
      }
      return { ...t, status: 'overdue' as const }
    },
  )
  return { ...calendar, tasks }
}

/* ----- Derived helpers ------------------------------------------------- */

export function weeksUntilExam(examDate: string, today = STUDY_CALENDAR_TODAY): number {
  const [y1, m1, d1] = examDate.split('-').map((p) => parseInt(p, 10))
  const [y2, m2, d2] = today.split('-').map((p) => parseInt(p, 10))
  const target = Date.UTC(y1, m1 - 1, d1)
  const now = Date.UTC(y2, m2 - 1, d2)
  const days = Math.max(0, Math.round((target - now) / 86400000))
  return Math.ceil(days / 7)
}

/** Whole-day countdown from `today` to `examDate`. Negative inputs
 *  (exam already passed) clamp to 0. */
export function daysUntilExam(examDate: string, today = STUDY_CALENDAR_TODAY): number {
  const [y1, m1, d1] = examDate.split('-').map((p) => parseInt(p, 10))
  const [y2, m2, d2] = today.split('-').map((p) => parseInt(p, 10))
  const target = Date.UTC(y1, m1 - 1, d1)
  const now = Date.UTC(y2, m2 - 1, d2)
  return Math.max(0, Math.round((target - now) / 86400000))
}

/** Pacing status — three buckets:
 *    `not-started` when the calendar has zero completed work
 *      (progressPct === 0). Surfaces when the learner has a calendar
 *      but hasn't begun working through tasks yet.
 *    `on-track` when completion meets or exceeds the proportion of
 *      elapsed time, OR the start date hasn't been reached yet (and
 *      any completion exists, so it's not a pure not-started case).
 *    `off-track` otherwise.
 */
export function pacingStatus(
  calendar: StudyCalendar,
  today = STUDY_CALENDAR_TODAY,
): 'not-started' | 'on-track' | 'off-track' {
  // 0% progress wins — even when the calendar window hasn't opened
  // yet, the learner reads "not started" more clearly than "on track".
  if (progressPct(calendar) === 0) return 'not-started'
  const [sy, sm, sd] = calendar.startDate.split('-').map((p) => parseInt(p, 10))
  const [ey, em, ed] = calendar.examDate.split('-').map((p) => parseInt(p, 10))
  const [ty, tm, td] = today.split('-').map((p) => parseInt(p, 10))
  const start = Date.UTC(sy, sm - 1, sd)
  const end = Date.UTC(ey, em - 1, ed)
  const now = Date.UTC(ty, tm - 1, td)
  if (now <= start || end <= start) return 'on-track'
  const elapsedDays = Math.max(0, (now - start) / 86400000)
  const totalDays = (end - start) / 86400000
  const expectedPct = Math.min(100, (elapsedDays / totalDays) * 100)
  // +1 tolerance keeps `on-track` from flipping for sub-1pp drift.
  return progressPct(calendar) + 1 >= expectedPct ? 'on-track' : 'off-track'
}

/** Total tasks + count completed — packaged for the stat band's
 *  "Tasks Completed" tile so consumers don't reimplement the filter. */
export function taskCompletion(calendar: StudyCalendar): { completed: number; total: number } {
  return {
    completed: calendar.tasks.filter((t) => t.status === 'completed').length,
    total: calendar.tasks.length,
  }
}

/** Format an ISO date as `M/D/YYYY` for display in stat tiles. Empty
 *  / invalid inputs return the literal placeholder text so the band
 *  still renders cleanly. */
export function formatStatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  if (!y || !m || !d) return 'mm/dd/yyyy'
  return `${m}/${d}/${y}`
}

export function progressPct(calendar: StudyCalendar): number {
  if (calendar.tasks.length === 0) return 0
  const done = calendar.tasks.filter((t) => t.status === 'completed').length
  return Math.round((done / calendar.tasks.length) * 100)
}

export function isOnTrack(calendar: StudyCalendar, today = STUDY_CALENDAR_TODAY): boolean {
  const expected = calendar.tasks.filter((t) => t.dueDate <= today).length
  if (expected === 0) return true
  const done = calendar.tasks.filter((t) => t.status === 'completed').length
  return done / expected >= 0.9
}

export function tasksOnDate(calendar: StudyCalendar, isoDate: string): StudyTask[] {
  return calendar.tasks.filter((t) => t.dueDate === isoDate)
}

/* ─── Custom events (user-created) ──────────────────────────────────
   Learner-added events that live alongside the auto-scheduled tasks.
   Created via the "Add Custom Event" panel (Calendar Actions →
   Add Custom Task). State is session-only — held in component state
   in `InlineStudyCalendar` and reset on page refresh per the demo
   spec; not part of the seed fixture data. */

export type CustomEventRepeat = 'none' | 'daily' | 'weekday' | 'weekly' | 'monthly'

export type CustomEvent = {
  id: string
  title: string
  /** ISO yyyy-mm-dd — anchor date of the first/only occurrence. */
  date: string
  repeat: CustomEventRepeat
  /** HH:MM 24-hour, e.g. '13:30'. Undefined when allDay or unset. */
  time?: string
  allDay: boolean
  /** Path/calendar scope. Set when the event was created from a given
   *  learning path so the in-memory map can key on pathId. */
  pathId?: string
}

/** A single materialized appearance of a CustomEvent on a calendar
 *  day. Recurring events expand into N occurrences via
 *  `expandCustomEventOccurrences` so the grid + task-list views can
 *  treat each appearance as an independent row keyed by `(eventId, iso)`. */
export type CustomEventOccurrence = {
  /** Source event id — recurring rules share this across all occurrences. */
  eventId: string
  /** ISO yyyy-mm-dd this occurrence lands on. */
  iso: string
  title: string
  time?: string
  allDay: boolean
  /** Carried through so the row can show "Repeats weekly" etc. without
   *  walking back to the source event. */
  repeat: CustomEventRepeat
}

/**
 * Expand a custom event's recurrence rule into ISO date occurrences
 * bounded by [start, end] inclusive. Used by the calendar grid + task
 * list to know which days a given event lands on.
 *
 * - `none`    → single occurrence on the anchor date
 * - `daily`   → every day from anchor through end
 * - `weekday` → Mon–Fri from anchor through end
 * - `weekly`  → same weekday each week from anchor through end
 * - `monthly` → same day-of-month each month from anchor through end
 *                (months without that day, e.g. Feb 30, are skipped)
 */
export function expandCustomEventOccurrences(
  event: CustomEvent,
  start: string,
  end: string,
): CustomEventOccurrence[] {
  const anchorMs = customIsoToUTC(event.date)
  const startMs = customIsoToUTC(start)
  const endMs = customIsoToUTC(end)
  const dates: string[] = []
  const DAY = 86400000

  switch (event.repeat) {
    case 'none': {
      if (anchorMs >= startMs && anchorMs <= endMs) {
        dates.push(customUtcToIso(anchorMs))
      }
      break
    }
    case 'daily': {
      const begin = Math.max(anchorMs, startMs)
      for (let ms = begin; ms <= endMs; ms += DAY) {
        dates.push(customUtcToIso(ms))
      }
      break
    }
    case 'weekday': {
      const begin = Math.max(anchorMs, startMs)
      for (let ms = begin; ms <= endMs; ms += DAY) {
        const dow = new Date(ms).getUTCDay()
        if (dow >= 1 && dow <= 5) dates.push(customUtcToIso(ms))
      }
      break
    }
    case 'weekly': {
      for (let ms = anchorMs; ms <= endMs; ms += 7 * DAY) {
        if (ms >= startMs) dates.push(customUtcToIso(ms))
      }
      break
    }
    case 'monthly': {
      const [, , dayStr] = event.date.split('-')
      const day = parseInt(dayStr, 10)
      let y = new Date(anchorMs).getUTCFullYear()
      let m = new Date(anchorMs).getUTCMonth()
      while (true) {
        const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
        if (day <= lastDay) {
          const ms = Date.UTC(y, m, day)
          if (ms > endMs) break
          if (ms >= startMs) {
            dates.push(
              `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            )
          }
        } else {
          // Day-of-month doesn't exist this month — skip and advance.
          const probe = Date.UTC(y, m, 1)
          if (probe > endMs) break
        }
        m += 1
        if (m > 11) {
          m = 0
          y += 1
        }
        if (Date.UTC(y, m, 1) > endMs + 31 * DAY) break
      }
      break
    }
  }

  return dates.map((iso) => ({
    eventId: event.id,
    iso,
    title: event.title,
    time: event.time,
    allDay: event.allDay,
    repeat: event.repeat,
  }))
}

/** Materialize every custom event for `[start, end]` and bucket them by
 *  ISO date. Used by the grid + task-list views so they can pull
 *  per-day occurrences in O(1) instead of expanding every event in the
 *  hot render path. */
export function customOccurrencesByDate(
  events: CustomEvent[],
  start: string,
  end: string,
): Map<string, CustomEventOccurrence[]> {
  const map = new Map<string, CustomEventOccurrence[]>()
  for (const ev of events) {
    for (const occ of expandCustomEventOccurrences(ev, start, end)) {
      const list = map.get(occ.iso) ?? []
      list.push(occ)
      map.set(occ.iso, list)
    }
  }
  return map
}

function customIsoToUTC(iso: string): number {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  return Date.UTC(y, m - 1, d)
}

function customUtcToIso(ms: number): string {
  const dt = new Date(ms)
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
