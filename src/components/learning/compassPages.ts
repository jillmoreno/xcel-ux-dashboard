import type { ComponentType } from 'react'
import { BookOpenRegular, CalendarRegular, GaugeLight, HouseRegular, NotebookRegular } from '@/icons'
import type { CompassPage } from './CompassCoursePlayer'

/**
 * ⚠ A PLAIN `.ts` MODULE ON PURPOSE. This list was exported from
 * `CompassCoursePlayer.tsx` and tripped react-refresh's "only export
 * components" rule — the same split `sheetProseStyles.ts` and
 * `pageHeaderStyles.ts` already make. `CompassRail` and `CompassLearningPage`
 * both read it, so it cannot live inside either of them either.
 */
export type CompassPageRow = {
  id: CompassPage
  label: string
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  /** Drawn but not a control — her Progress row, "not open yet" without a
   *  reason. */
  disabled?: boolean
}

/**
 * ⚠ ANJANI'S RAIL ROWS — 2026-10-15, from her second master (the file
 * published as the type-scale preview). On 2026-10-08 this was her six
 * label-only rows: Dashboard, Course, Study planner, Flashcards, Exam
 * simulator, Progress. Her rail now reads Overview, Learn, Study planner,
 * Ask Rubi, Progress — with an icon on each — and Flashcards and Exam
 * Simulator have moved under an EXAM PREP rule as LOCKED rows beside
 * Practice. The locked three are not pages (`COMPASS_RAIL_LOCKED` in the
 * fixtures); Ask Rubi is drawn by the rail itself, since it is not a page
 * either.
 *
 * ⚠ A SECOND LIST RATHER THAN AN EDIT, still: `COMPASS_PAGES` above is
 * Eric's and his versions draw all eight — the note at `CompassLearningPage`
 * says it "carries exactly the eight rows the design draws".
 *
 * ⚠ HER CASING, NOT THE PRODUCT'S — "Study planner", sentence case, as her
 * file has it; Eric's list keeps Title Case.
 */
export const HYBRID_COMPASS_PAGES: CompassPageRow[] = [
  { id: 'overview', label: 'Overview', icon: HouseRegular },
  { id: 'course', label: 'Learn', icon: BookOpenRegular },
  { id: 'study-planner', label: 'Study planner', icon: CalendarRegular },
  { id: 'progress', label: 'Progress', icon: GaugeLight, disabled: true },
]

/**
 * HER RAIL, PLUS THE WORKSPACE — 2026-11-04, from v4.
 *
 * A separate list rather than a `workspace: boolean` on the rows above, for
 * the reason `HYBRID_COMPASS_PAGES` is itself a second list rather than an
 * edit of `COMPASS_PAGES`: the rail that reads it should not have to know the
 * flag, and a row that is sometimes absent is easier to get wrong than two
 * lists that are each always right.
 *
 * ⚠ IT GOES DIRECTLY AFTER LEARN, and that is HERS, not a choice. Her
 * `addNav()` finds the nav item whose onclick is `showScreen('course')` — the
 * Learn row — clones it, relabels it Workspace and
 * `insertBefore(copy, anchor.nextSibling)`. Third row, between Learn and
 * Study planner.
 *
 * ⚠ THIS WAS WRONG UNTIL 2026-11-04 (second pass). The first port put the row
 * LAST, after Progress, and said in a comment and a test that her file had no
 * rail row at all so the position was the port's one invention. It did have
 * one: `addNav()` was inside the block I extracted and I did not read it.
 * Jillienne opened her Refinement link and the rail read Overview · Learn ·
 * Workspace · Study planner. Her order, restored.
 *
 * ⚠ HER ICON IS A BOOKMARK (`M6 4h12v16l-6-4-6 4z`), not a notebook. This
 * registry ships no bookmark, and inventing an SVG is a registry decision
 * rather than a porting one, so `NotebookRegular` stands in and this note is
 * the record. `Flag` was the other candidate and was rejected: `flag` is one
 * of the workspace's own mark types, and the nav row is not that.
 */
export const HYBRID_COMPASS_PAGES_WITH_WORKSPACE: CompassPageRow[] = [
  ...HYBRID_COMPASS_PAGES.slice(0, 2),
  { id: 'workspace', label: 'Workspace', icon: NotebookRegular },
  ...HYBRID_COMPASS_PAGES.slice(2),
]
