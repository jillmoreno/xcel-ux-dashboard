import type { ComponentType } from 'react'
import {
  BookFull,
  CalendarRegular,
  ClipboardList,
  Layout,
  Notebook,
  ShoePrints,
} from '@/icons'
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
}

/**
 * ⚠ HYBRID'S RAIL IS ANJANI'S — 2026-10-08, the direct ask: "left rail needs to
 * match what is in anjanis prototype."
 *
 * Her `screen-dashboard` draws six rows, not eight: Dashboard, Course, Study
 * planner, Flashcards, Exam simulator, Progress. So three of the product's go
 * (Resources, Readiness, Rubi Insights), one arrives (Study planner), and
 * Overview is called Dashboard.
 *
 * ⚠ A SECOND LIST RATHER THAN AN EDIT, because `COMPASS_PAGES` above is Eric's
 * and his versions draw all eight — the note at `CompassLearningPage` says it
 * "carries exactly the eight rows the design draws". Editing it in place would
 * take three rows off his rail to settle a question about hers.
 *
 * ⚠ `study-planner` RENDERS AN EMPTY GROUND, exactly as Resources, Readiness
 * and Rubi Insights already do — `CompassPageBody` gives every page but
 * Overview a blank region. That is the existing honest placeholder rather than
 * a new dead end, and it is what her Planner screen would fill.
 *
 * ⚠ HER CASING, NOT THE PRODUCT'S — "Exam simulator", sentence case, as her
 * file has it. The first pass kept "Exam Simulator" on the grounds that it
 * might be her prototype's own styling rather than a decision; measuring the
 * rail settled it — her rows are 13px/400 with no text-transform, so the
 * capital is authored. Eric's list above keeps Title Case.
 */
export const HYBRID_COMPASS_PAGES: CompassPageRow[] = [
  { id: 'overview', label: 'Dashboard', icon: Layout },
  { id: 'course', label: 'Course', icon: BookFull },
  { id: 'study-planner', label: 'Study planner', icon: CalendarRegular },
  { id: 'flashcards', label: 'Flashcards', icon: Notebook },
  { id: 'exam-simulator', label: 'Exam simulator', icon: ClipboardList },
  { id: 'progress', label: 'Progress', icon: ShoePrints },
]
