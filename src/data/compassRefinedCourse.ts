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

/**
 * WHAT A SECTION IS, which decides the icon beside it — 2026-11-11,
 * Jillienne: "If its a Lesson, an open book icon, if its an exam, a document
 * style icon with a checkmark, if its something else, let me know and we will
 * assign an icon. affidavit = document with signature, survey = checkbox list
 * icon."
 *
 * ⚠ `survey` AND `certificate` OCCUR NOW — 2026-11-12: "we will need the
 * Final Exam Section, as well as a survey section, and a certificate
 * section". They are the tail of the regulated sequence the fixtures already
 * name (lessons, affidavit, final exam, survey and certificate), and they
 * change the shape of the page's ending, which until now simply stopped
 * after the last chapter exam.
 *
 * ⚠ `affidavit` IS STILL UNREACHABLE. It belongs to the same sequence and is
 * not in the uploaded list; the kind and its icon wait rather than being
 * decided in a hurry when a row needs one.
 */
export type RefinedSectionKind =
  | 'lesson'
  | 'exam'
  | 'affidavit'
  | 'survey'
  | 'certificate'

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
  /* ⚠ THE COURSE'S ENDING — 2026-11-12, added on the direct ask. These three
     are not in the uploaded screenshots: that list is the CHAPTER list, and
     it stops at the last chapter exam. What follows a completed course is
     the regulated tail, and the fixtures have named it all along.

     ⚠ THE TITLES ARE MINE AND SHOULD BE CONFIRMED. "Final Exam" is what the
     stage fixtures call it ("Final course exam open" on q6); Course Survey
     and Certificate follow the same sequence's wording. If the real course
     names them differently — and a regulated course usually does, precisely —
     these three strings are the only place to change. */
  { n: 42, title: 'Final Exam', kind: 'exam' },
  { n: 43, title: 'Course Survey', kind: 'survey' },
  { n: 44, title: 'Certificate', kind: 'certificate' },
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

export type RefinedProgress = { done: number; currentN: number; pct: number }

/**
 * ONE DERIVATION OF HOW FAR THROUGH THE COURSE A LEARNER IS — 2026-11-12,
 * finding 4 of the Your Course audit.
 *
 * ⚠ TWO RINGS SAID TWO NUMBERS ABOUT ONE LEARNER. Your Course read 2% and
 * the Overview read 0%, because each derived progress from the other's
 * output: the Overview took the stage's own percentage and multiplied it by
 * the section count to get a done figure; Your Course took a typed done
 * figure and divided it by the section count to get a percentage. Neither is
 * wrong on its own, which is exactly why the disagreement survived — there
 * was nothing for either page to be checked against.
 *
 * ⚠ THE STAGE IS THE INPUT, and that is not a toss-up. Sixteen learner
 * states are what the demo bar flips through, so a page that does not read
 * the stage shows the same learner whichever one a reviewer picks — which
 * Your Course did, while the Overview beside it moved. The arithmetic below
 * is the Overview's, lifted out of `CompassRefinedFocus` so that both pages
 * run it rather than each keeping a version.
 *
 * ⚠ AND `currentN` IS `done + 1`, the course being linear: the row you are in
 * is the one after the last you finished. Capped at the final row so a
 * complete course does not point past its own end.
 */
export function refinedProgressAt(pct: string | number | undefined): RefinedProgress {
  const n = typeof pct === 'number' ? pct : Number.parseFloat(pct ?? '') || 0
  const clamped = Math.min(100, Math.max(0, n))
  const done = Math.round((clamped / 100) * REFINED_COURSE_TOTALS.sections)
  return {
    done,
    currentN: Math.min(done + 1, REFINED_COURSE_TOTALS.sections),
    pct: clamped,
  }
}

/** The section the learner is in, for the Overview's next step. */
export const refinedCurrentSection = (): RefinedSection =>
  REFINED_COURSE_SECTIONS.find((s) => s.n === REFINED_COURSE_PROGRESS.currentN) ??
  REFINED_COURSE_SECTIONS[0]
