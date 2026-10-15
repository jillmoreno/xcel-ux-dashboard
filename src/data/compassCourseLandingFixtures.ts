/**
 * The Compass LEARN page — Anjani's `screen-course`, rebuilt 2026-10-15 from
 * her second master (the file published as the type-scale preview).
 *
 * ⚠ NOT `compassCourseFixtures.ts`, which is a different file about a
 * different thing: that one holds the DESIGN's sample table of contents for the
 * course rail. This one is the page the Compass rail's "Learn" row opens.
 *
 * ⚠ WHAT CHANGED FROM THE 2026-10-08 PORT, so it is not read as drift. Her
 * course page was "Your course" with a resume card and FIVE modules, each
 * with one of four states — Complete, Not proven, In progress, Up next — and
 * "Not proven" was the label worth protecting. Her second master replaces the
 * list with a GATED course in two parts: Part 1, Qualifying Education,
 * nineteen chapters taken in order, each chapter's lessons under it; Part 2,
 * Exam Preparation, locked until the last chapter is passed. The four states
 * are now three — passed, in progress, locked — and "Not proven" is gone from
 * this page (it still lives on the Overview's assignments table). The
 * chapter names are hers; the lesson titles are hers too, and she reused one
 * set of seven for both open chapters.
 *
 * ⚠ WHERE THIS CAME FROM, and the warning that comes with it: her file is the
 * source and this is a second home for the same words; nothing tells this
 * file when hers changes. Every figure is invented demo data.
 */

export const COMPASS_LEARN_TITLE = 'Your course'
export const COMPASS_LEARN_LEAD =
  'Work through it from the top. Each step opens the next one, and a locked step tells you exactly what opens it.'

/** The resume card. */
export const COMPASS_LEARN_RESUME = {
  eyebrow: 'Where you left off',
  title: 'Chapter 2 · Nature of Insurance',
  progressPct: 52,
  action: 'Resume lesson',
}

export type LessonState = 'done' | 'now' | 'upcoming'
export type CompassLesson = { title: string; state: LessonState }
export type CompassChapter = {
  number: number
  title: string
  /** "7 lessons" — only the open chapters say it. */
  lessonCount?: number
  state: 'passed' | 'here' | 'locked'
  /** The bar on the chapter you are in. */
  progressPct?: number
  lessons?: CompassLesson[]
  /** Why a locked chapter is locked — shown inline on a click, for 3.5s. */
  why?: string
}

const SEVEN = [
  'Introduction',
  'Benefits and the costs of insurance to society / professional designations',
  'Risk / loss exposure',
  'Insurance / indemnity / pay on behalf of / methods of handling risk / risk management techniques',
  'Elements of insurable risks / ideally insurable risk / rate filing and forms services',
  'Federal regulation',
  'Chapter Summary',
]

const LOCKED_TITLES = [
  'Legal Concepts of Insurance',
  'Life Insurance Policy Types',
  'Life Insurance Provisions, Options, and Riders',
  'Life Insurance Premiums Proceeds and Beneficiaries',
  'Life Insurance Underwriting and Policy Issue',
  'Group Life Insurance',
  'Annuities',
  'Uses of Life Insurance',
  'Retirement Plans',
  'Social Security',
  'Health and Accident Insurance',
  'Health Insurance Providers',
  'Medical Expense Insurance',
  'Disability Income Insurance',
  'Health Insurance Plans for Seniors',
  'Health Insurance Policy Provisions',
  'Health Insurance Underwriting and Policy Issue',
]

export const COMPASS_PART_1 = {
  eyebrow: 'Part 1 · 19 chapters · 28 of 40 hours',
  title: 'Qualifying Education',
  state: 'In progress',
}

export const COMPASS_CHAPTERS: readonly CompassChapter[] = [
  {
    number: 1,
    title: 'Basic Principles of Life and Health Insurance',
    lessonCount: 7,
    state: 'passed',
    lessons: SEVEN.map((title) => ({ title, state: 'done' as const })),
  },
  {
    number: 2,
    title: 'Nature of Insurance',
    lessonCount: 7,
    state: 'here',
    progressPct: 62,
    lessons: SEVEN.map((title, i) => ({ title, state: i < 4 ? 'done' : i === 4 ? 'now' : 'upcoming' })),
  },
  ...LOCKED_TITLES.map((title, i) => ({
    number: i + 3,
    title,
    state: 'locked' as const,
    why: `Pass the Chapter ${i + 2} exam to open this.`,
  })),
]

export const COMPASS_PART_2 = {
  eyebrow: 'Part 2 · opens when Part 1 is done',
  title: 'Exam Preparation',
  state: 'Locked',
  body: 'Prep review and the exam simulator open once every chapter of your course is passed. You are 28 of 40 hours in.',
  chips: ['Prep review', 'Exam simulator', 'Final exam'],
}
