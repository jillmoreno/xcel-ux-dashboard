/**
 * The Compass COURSE landing — Anjani's `screen-course`, ported 2026-10-08.
 *
 * ⚠ NOT `compassCourseFixtures.ts`, which is a different file about a different
 * thing: that one holds the DESIGN's sample table of contents for the course
 * rail. This one is the page the Compass rail's "Course" row opens — her "Your
 * course" screen, with the resume card and the module list.
 *
 * ⚠ WHERE THIS CAME FROM, and the warning that comes with it. The content below
 * is transcribed from her standalone prototype
 * (`public/prototypes/xcel-compass-nudge-journey.html` on
 * `claude/gallant-feynman-aj0m0i`, Refinement row demo-004 — retired
 * 2026-10-08, see ARCHIVED_ITEMS `refinement-pacing-exploration`). She is still
 * working in that file, so IT is the source and this is a second home for the
 * same words; nothing tells this file when hers changes. The same caution
 * `compassLearningFixtures` and `compassSessionFixtures` carry applies here —
 * all three came out of the same prototype.
 *
 * ⚠ INVENTED FIGURES, ALL OF THEM. Every module count, status and lesson tally
 * is the prototype's demo data, not a fixture derived from this repo's
 * personas. Nothing here reads `learningFixtures`, the study calendar or the
 * readiness model, and it deliberately does not: the page is a layout argument
 * about a course with no real data behind it yet. When it gets one, this file
 * is what gets deleted, not extended — a half-real version, where the module
 * list reads a persona and the statuses do not, is the state worth avoiding.
 *
 * ⚠ THE FIVE MODULES ARE NOT THE PRODUCT'S 42 LESSONS. `NY_LH_LESSON_PARTS` and
 * the Testing fixtures describe the same course with different numbers, and the
 * course player's own rail draws a third set. Showing two of them on one screen
 * is the half-real state above; this page is hers end to end until somebody
 * reconciles them.
 */

/** What each module is to the learner right now — drives the pill and the link
 *  verb. */
export type CompassModuleState = 'complete' | 'not-proven' | 'in-progress' | 'up-next'

export type CompassModule = {
  /** "Module 1 · 7 lessons" — composed, not templated, because her file varies
   *  it ("Module 3 · 8 lessons · in progress"). */
  eyebrow: string
  title: string
  state: CompassModuleState
  /**
   * The pill's words.
   *
   * ⚠ "Not proven" IS NOT "incomplete", and the distinction is the whole
   * readiness idea: the learner finished the module and their scored answers
   * did not back it up. `compassLearningFixtures` draws the same line on the
   * assignments table.
   */
  statusLabel: string
  /** "Review" / "Resume" / "Start" — the verb belongs to the state. */
  actionLabel: string
}

export const COMPASS_COURSE_TITLE = 'Your course'

export const COMPASS_COURSE_LEAD =
  'The backbone of everything here. Each module is short, plain-language lessons, then straight into practice so it sticks. Rubi rides along the whole way — ask it to re-explain anything, any time.'

/** The resume card above the list. */
export const COMPASS_COURSE_CONTINUE = {
  eyebrow: 'Continue your course · 3 of 5',
  title: 'Annuities',
  action: 'Resume lesson',
}

export const COMPASS_MODULES_HEADING = 'All modules'

export const COMPASS_MODULES: CompassModule[] = [
  {
    eyebrow: 'Module 1 · 7 lessons',
    title: 'Life insurance policy types',
    state: 'complete',
    statusLabel: 'Complete',
    actionLabel: 'Review',
  },
  {
    eyebrow: 'Module 2 · 7 lessons',
    title: 'Policy provisions & riders',
    state: 'not-proven',
    statusLabel: 'Not proven',
    actionLabel: 'Review',
  },
  {
    eyebrow: 'Module 3 · 8 lessons · in progress',
    title: 'Annuities',
    state: 'in-progress',
    statusLabel: 'In progress',
    actionLabel: 'Resume',
  },
  {
    eyebrow: 'Module 4 · 8 lessons',
    title: 'Health & disability',
    state: 'up-next',
    statusLabel: 'Up next',
    actionLabel: 'Start',
  },
  {
    eyebrow: 'Module 5 · 6 lessons',
    title: 'Regulation & ethics',
    state: 'up-next',
    statusLabel: 'Up next',
    actionLabel: 'Start',
  },
]
