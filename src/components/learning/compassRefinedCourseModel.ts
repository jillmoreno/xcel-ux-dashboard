/**
 * YOUR COURSE'S OPEN DECISIONS — its own module, 2026-11-12.
 *
 * ⚠ SPLIT OUT FOR FAST REFRESH, the same cut `compassRefinedFocusModel.ts`
 * records: a module that exports a component AND a constant drops out of
 * React's refresh boundary, so every edit to the page would full-reload
 * instead of swapping the component.
 */

import type { RefinedChapter, RefinedFinishStep } from './compassRefinedLearnCourse'
import type { NextMarkStyle } from './compassRefinedFocusModel'

/** What the roadmap tag leads with. `compass-course-mark`. */
export type ChapterMarkStyle = 'number' | 'icon' | 'kind'

/** The roadmap's quick filter — 2026-11-12. */
export type RoadmapFilter = 'all' | 'current' | 'done'

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
  /** `compass-course-image` — the course's art beside its name. */
  image: boolean
  /** `compass-course-mark` — the course's chapter number, or the state's
   *  own glyph on every row. */
  chapterMark: ChapterMarkStyle
  /**
   * ⚠ `compass-overview-next-mark`, READ BY THIS PAGE TOO — 2026-11-12. The
   * next-step card is one component on two pages ("This should be a 1:1"),
   * so a shape flag that reached only one of them would be the first thing
   * to break the 1:1. It is the Overview's flag by name and history; Your
   * Course follows it rather than getting a second one.
   */
  nextMark: NextMarkStyle
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
  image: false,
  chapterMark: 'number',
  /* Agrees with `FOCUS_DEFAULTS.nextMark`, or a card rendered without
     options draws a shape the bar never shows. */
  nextMark: 'stacked',
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
  /** Every chapter, for the counts on the control. */
  chapters: RefinedChapter[]
  /** The ones that draw — all of them when the fold is off or opened. */
  shown: RefinedChapter[]
  /**
   * ⚠ THE COURSE'S CLOSING STEPS, AS MODULES — 2026-11-13: "Exam, Survey,
   * and Certificate should all be their own modules." They had been a
   * separate "Finish Your Course" strip under the list; they are rows of the
   * same course and now draw as rows of the same roadmap.
   */
  finish: RefinedFinishStep[]
  /** The locked run is folded right now (the option is on and not opened). */
  folded: boolean
  /**
   * ⚠ THE OPTION ITSELF — `compass-course-fold`. `folded` above is the
   * locked run's current state; this is whether folding is switched on at
   * all, and the completed run at the top reads it too. One control for
   * both runs: "show me the whole course" has to mean the whole course.
   */
  fold: boolean
  hiddenCount: number
  cutoff: number
  setShowAll: (v: boolean) => void
  isOpen: (c: RefinedChapter) => boolean
  toggle: (n: number, expanded: boolean) => void
  openLesson: () => void
  /** `compass-course-blurb` — the invented sentences. */
  blurb: boolean
  /** `compass-course-mark` — see `CourseOptions`. */
  chapterMark: ChapterMarkStyle
}
