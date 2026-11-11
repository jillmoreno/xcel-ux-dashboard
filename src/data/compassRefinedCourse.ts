/**
 * THE FLORIDA LIFE & HEALTH COURSE, AS IT ACTUALLY IS — 2026-11-11,
 * Jillienne: "these are the actual sections from the florida life and health
 * course. Lets update the demo data for the refined section to match."
 *
 * Transcribed from the live course's section list. Forty-one rows: an
 * introduction, twelve Life chapters each followed by its exam, seven
 * Life & Health chapters each followed by its exam, and the Florida laws
 * chapter with its own exam.
 *
 * ⚠ AN EXAM IS A ROW, NOT A PROPERTY OF A CHAPTER. The course lists "Chapter
 * 1: Basic Principles…" and "Chapter 1 Exam: Basic Principles…" as two
 * entries a learner moves through in order, and the demo data had been
 * folding exams inside their chapter. That shape decides what "0 of 36"
 * counts, which is why it is modelled before anything is wired to it.
 *
 * ⚠ THE DOUBLE-NUMBERED TITLES ARE REAL AND ARE KEPT VERBATIM. From chapter
 * thirteen the course names each one twice — "Life & Health Chapter 13 |
 * Health Chapter 4: Health and Accident Insurance" — because the Health
 * syllabus restarts its own numbering inside the combined course. It reads
 * like a transcription error and is not one.
 *
 * ⚠ THE COUNT IS 41, NOT 36. Every stage fixture in
 * `compassReadinessFixtures.ts` says "N of 36 lessons", which came from
 * Jeff's prototype rather than from the course. Those sixteen stages are not
 * rewritten here — see the note on `REFINED_COURSE_PROGRESS`.
 *
 * ⚠ NO LESSON-LEVEL CONTENT, by the direct instruction: "do not worry about
 * the course content right now". What is inside a chapter stays Jeff's until
 * somebody has the real thing.
 */

export type RefinedSectionKind = 'lesson' | 'exam'

export type RefinedSection = {
  /** Position in the list the learner walks, 1-based. */
  n: number
  /** The row's title, exactly as the course prints it. */
  title: string
  kind: RefinedSectionKind
}

/** ⚠ ORDER IS THE COURSE'S AND IS LOAD-BEARING: "These lessons have to be
 *  taken in the order shown." */
export const REFINED_COURSE_SECTIONS: readonly RefinedSection[] = [
  { n: 1, title: 'Course Introduction - Life and Health Pre-licensing', kind: 'lesson' },
  { n: 2, title: 'Chapter 1: Basic Principles of Life and Health Insurance', kind: 'lesson' },
  { n: 3, title: 'Chapter 1 Exam: Basic Principles of Life and Health Insurance', kind: 'exam' },
  { n: 4, title: 'Chapter 2: Nature of Insurance', kind: 'lesson' },
  { n: 5, title: 'Chapter 2 Exam: Nature of Insurance', kind: 'exam' },
  { n: 6, title: 'Chapter 3: Legal Concepts of Insurance', kind: 'lesson' },
  { n: 7, title: 'Chapter 3 Exam: Legal Concepts of Insurance', kind: 'exam' },
  { n: 8, title: 'Chapter 4: Life Insurance Policy Types', kind: 'lesson' },
  { n: 9, title: 'Chapter 4 Exam: Life Insurance Policy Types', kind: 'exam' },
  { n: 10, title: 'Chapter 5: Life Insurance Provisions, Options, and Riders', kind: 'lesson' },
  { n: 11, title: 'Chapter 5 Exam: Life Insurance Provisions, Options, and Riders', kind: 'exam' },
  { n: 12, title: 'Chapter 6: Life Insurance Premiums Proceeds and Beneficiaries', kind: 'lesson' },
  { n: 13, title: 'Chapter 6 Exam: Life Insurance Premiums Proceeds and Beneficiaries', kind: 'exam' },
  { n: 14, title: 'Chapter 7: Life Insurance Underwriting and Policy Issue', kind: 'lesson' },
  { n: 15, title: 'Chapter 7 Exam: Life Insurance Underwriting and Policy Issue', kind: 'exam' },
  { n: 16, title: 'Chapter 8: Group Life Insurance', kind: 'lesson' },
  { n: 17, title: 'Chapter 8 Exam: Group Life Insurance', kind: 'exam' },
  { n: 18, title: 'Chapter 9: Annuities', kind: 'lesson' },
  { n: 19, title: 'Chapter 9 Exam: Annuities', kind: 'exam' },
  { n: 20, title: 'Chapter 10: Uses of Life Insurance', kind: 'lesson' },
  { n: 21, title: 'Chapter 10 Exam: Uses of Life Insurance', kind: 'exam' },
  { n: 22, title: 'Chapter 11: Retirement Plans', kind: 'lesson' },
  { n: 23, title: 'Chapter 11 Exam: Retirement Plans', kind: 'exam' },
  { n: 24, title: 'Chapter 12: Social Security', kind: 'lesson' },
  { n: 25, title: 'Chapter 12 Exam: Social Security', kind: 'exam' },
  { n: 26, title: 'Life & Health Chapter 13 | Health Chapter 4: Health and Accident Insurance', kind: 'lesson' },
  { n: 27, title: 'Life & Health Chapter 13 | Health Chapter 4 Exam: Health and Accident Insurance', kind: 'exam' },
  { n: 28, title: 'Life & Health Chapter 14 | Health Chapter 5: Health Insurance Providers', kind: 'lesson' },
  { n: 29, title: 'Life & Health Chapter 14 | Health Chapter 5 Exam: Health Insurance Providers', kind: 'exam' },
  { n: 30, title: 'Life & Health Chapter 15 | Health Chapter 6: Medical Expense Insurance', kind: 'lesson' },
  { n: 31, title: 'Life & Health Chapter 15 | Health Chapter 6 Exam: Medical Expense Insurance', kind: 'exam' },
  { n: 32, title: 'Life & Health Chapter 16 | Health Chapter 7: Disability Income Insurance', kind: 'lesson' },
  { n: 33, title: 'Life & Health Chapter 16 | Health Chapter 7 Exam: Disability Income Insurance', kind: 'exam' },
  { n: 34, title: 'Life & Health Chapter 17 | Health Chapter 8: Health Insurance Plans for Seniors', kind: 'lesson' },
  { n: 35, title: 'Life & Health Chapter 17 | Health Chapter 8 Exam: Health Insurance Plans for Seniors', kind: 'exam' },
  { n: 36, title: 'Life & Health Chapter 18 | Health Chapter 9: Health Insurance Policy Provisions', kind: 'lesson' },
  { n: 37, title: 'Life & Health Chapter 18 | Health Chapter 9 Exam: Health Insurance Policy Provisions', kind: 'exam' },
  {
    n: 38,
    title: 'Life & Health Chapter 19 | Health Chapter 10: Health Insurance Underwriting and Policy Issue',
    kind: 'lesson',
  },
  {
    n: 39,
    title: 'Life & Health Chapter 19 | Health Chapter 10 Exam: Health Insurance Underwriting and Policy Issue',
    kind: 'exam',
  },
  { n: 40, title: 'Florida Life and Health Laws, Rules, and Regulations', kind: 'lesson' },
  { n: 41, title: 'Chapter Exam: Florida Life and Health Laws and Rules', kind: 'exam' },
]

export const REFINED_COURSE_TOTALS = {
  sections: REFINED_COURSE_SECTIONS.length,
  lessons: REFINED_COURSE_SECTIONS.filter((s) => s.kind === 'lesson').length,
  exams: REFINED_COURSE_SECTIONS.filter((s) => s.kind === 'exam').length,
}

/**
 * WHERE THE DEMO LEARNER IS, read off the same screenshots.
 *
 * The introduction is complete with a score of 100 and offers "Review
 * Lesson"; Chapter 1 is in progress and offers "Continue"; every row after it
 * offers "Start". So: one section done, the second open, thirty-nine ahead.
 *
 * ⚠ IT DOES NOT REWRITE THE SIXTEEN STAGES. `compassReadinessFixtures.ts`
 * carries its own counts for each of q1–u5, evaluated out of Jeff's prototype
 * and internally consistent with his rings, bars and copy. Replacing 36 with
 * 41 in sixteen places would leave every other figure in those fixtures
 * describing a different course. This names the real course for the surfaces
 * that read it; bringing the stages across is its own pass, against real
 * numbers rather than a search and replace.
 */
export const REFINED_COURSE_PROGRESS = {
  /** Sections finished — the introduction. */
  done: 1,
  /** The row the learner is in. */
  currentN: 2,
}

/** The section the learner is in, for the Overview's next step. */
export const refinedCurrentSection = (): RefinedSection =>
  REFINED_COURSE_SECTIONS.find((s) => s.n === REFINED_COURSE_PROGRESS.currentN) ??
  REFINED_COURSE_SECTIONS[0]
