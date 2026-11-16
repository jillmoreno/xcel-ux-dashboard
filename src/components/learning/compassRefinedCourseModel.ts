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

/** Where a roadmap card states its status. `compass-course-status`. */
export type CourseStatusStyle = 'tag' | 'under'

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
/**
 * HOW THE CHAPTER EXAM SITS IN AN OPEN MODULE — `compass-course-exam`,
 * 2026-11-16: "use option 5 as the default, but also build option 4 behind a
 * toggle to compare."
 *
 * ⚠ BOTH ARMS KEEP THE DIVIDER. That part was already right — "i like the
 * divider line above the exam" — and what they differ on is whether the exam
 * is a labelled LAST ROW of the lesson list or an OBJECT of its own below it.
 *
 * ⚠ `seam` IS THE DEFAULT. It adds a word and no new surface, it uses the
 * pattern the rail already has for group labels, and it keeps working in the
 * state the exam spends most of its life in — locked, with no button to
 * carry the difference.
 *
 * ⚠ `card` IS THE ONE WITH A COST TO WEIGH. Its second line is what earns it
 * the extra height, and both of that line's figures are invented — see
 * `REFINED_EXAM_FACTS`.
 */
export type ExamRowStyle = 'seam' | 'card'

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
  /** `compass-course-status` — the word beside the mark, or under the
   *  title with the bar next to it. */
  status: CourseStatusStyle
  /**
   * ⚠ `compass-overview-next-mark`, READ BY THIS PAGE TOO — 2026-11-12. The
   * next-step card is one component on two pages ("This should be a 1:1"),
   * so a shape flag that reached only one of them would be the first thing
   * to break the 1:1. It is the Overview's flag by name and history; Your
   * Course follows it rather than getting a second one.
   */
  nextMark: NextMarkStyle
  /** `compass-course-exam` — how the chapter exam sits in an open module. */
  examRow: ExamRowStyle
}

export const COURSE_DEFAULTS: CourseOptions = {
  /* ⚠ THESE FOLLOW THE FLAG CATALOG, ALWAYS. A component rendered without
     options must draw what the bar's defaults draw, or a test pins a shape
     nobody can see on the page — which is the whole reason this object
     carries notes rather than values alone.

     ⚠ SO THREE OF THEM MOVED ON 2026-11-16: "look at the current settings
     and mark those design tools as default." The audited `list` layout was
     the baseline because findings 1, 2, 3, 6, 7 and 8 were measured against
     it and fixed on it; the roadmap is what the page has been built to all
     week, and it is now what opens. `list` is still an arm of
     `compass-course-rows` and the findings are still fixed on it. */
  rows: 'cards',
  /* ⚠ OFF, BECAUSE THE SENTENCES ARE INVENTED. These defaults have to agree
     with the flag catalog or a component rendered without options draws
     something the bar never shows. */
  blurb: false,
  fold: true,
  /* ⚠ AGREES WITH `compass-course-image`'s own default — on since
     2026-11-14 — or a card rendered without options draws something the bar
     never shows. */
  image: true,
  chapterMark: 'icon',
  status: 'under',
  /* Agrees with `FOCUS_DEFAULTS.nextMark`, or a card rendered without
     options draws a shape the bar never shows. */
  nextMark: 'stacked',
  /* ⚠ AGREES WITH `compass-course-exam`'s own default. */
  examRow: 'seam',
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
  /** `compass-course-exam` — see `ExamRowStyle`. */
  examRow: ExamRowStyle
  /** `compass-course-mark` — see `CourseOptions`. */
  chapterMark: ChapterMarkStyle
  /** `compass-course-status` — see `CourseOptions`. */
  status: CourseStatusStyle
}
