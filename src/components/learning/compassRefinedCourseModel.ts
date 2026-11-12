/**
 * YOUR COURSE'S OPEN DECISIONS — its own module, 2026-11-12.
 *
 * ⚠ SPLIT OUT FOR FAST REFRESH, the same cut `compassRefinedFocusModel.ts`
 * records: a module that exports a component AND a constant drops out of
 * React's refresh boundary, so every edit to the page would full-reload
 * instead of swapping the component.
 */

import type { RefinedChapter, RefinedCourseView } from './compassRefinedLearnCourse'

/** Rows or roadmap. `compass-course-rows`. */
export type CourseRowStyle = 'list' | 'cards'

/**
 * THE THREE DECISIONS OPEN ON THIS PAGE, AS ONE PROP.
 *
 * One object rather than three props for the reason `FocusOptions` records:
 * each would have to be declared, destructured and forwarded through
 * `CompassRefinedShell` and `RefinedPage`, which is the friction that stops a
 * variant being tried.
 */
export type CourseOptions = {
  rows: CourseRowStyle
  /** ⚠ The invented one-sentence descriptions — see `REFINED_CHAPTER_BLURBS`. */
  blurb: boolean
  /** Whether the locked run folds behind a count. Audit finding 1. */
  fold: boolean
}

export const COURSE_DEFAULTS: CourseOptions = {
  /* ⚠ THE AUDITED LAYOUT IS THE BASELINE. Findings 1, 2, 3, 6, 7 and 8 were
     measured against `list` and fixed on it. */
  rows: 'list',
  /* ⚠ OFF, BECAUSE THE SENTENCES ARE INVENTED. These defaults have to agree
     with the flag catalog or a component rendered without options draws
     something the bar never shows. */
  blurb: false,
  fold: true,
}

/**
 * WHAT BOTH COURSE LAYOUTS ARE GIVEN — 2026-11-12.
 *
 * ⚠ THE FOLD IS COMPUTED ONCE, ABOVE BOTH. `shown`, `folded` and
 * `hiddenCount` are the same arithmetic whichever layout draws, and the
 * audit's finding is about the course rather than about a row design — two
 * copies of it would be two answers to finding 1.
 *
 * ⚠ AND THE OPEN-ROW STATE TOO, so flipping the layout in the design bar
 * keeps the chapter you had expanded expanded. A reviewer comparing two
 * arrangements should be comparing the same screen.
 */
export type CourseListProps = {
  header: RefinedCourseView['header']
  /** Every chapter, for the counts on the control. */
  chapters: RefinedChapter[]
  /** The ones that draw — all of them when the fold is off or opened. */
  shown: RefinedChapter[]
  folded: boolean
  hiddenCount: number
  cutoff: number
  setShowAll: (v: boolean) => void
  isOpen: (c: RefinedChapter) => boolean
  toggle: (n: number, expanded: boolean) => void
  openLesson: () => void
  /** `compass-course-blurb` — the invented sentences. */
  blurb: boolean
}
