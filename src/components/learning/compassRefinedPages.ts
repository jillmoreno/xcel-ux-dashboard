import type { JeffMvpPage } from '@/data/compassJeffMvpFixtures'

/**
 * WHOSE PAGE REFINED DRAWS, ONE ROW AT A TIME — 2026-11-10, Jillienne: "i
 * want to click on the refined version, and select components and edit them.
 * so set this up so i can do that without affecting Jeffs."
 *
 * ⚠ REFINED OWNED ONE COMPONENT BEFORE THIS. It was `CompassJeffMvpShell`
 * with `readiness='refined'` — his rail, his twelve other pages, one swap. So
 * editing any Refined page except Readiness edited JEFF'S page, and the two
 * versions would have stopped being two versions on the first change. This
 * map is what makes each page independently forkable.
 *
 * ⚠ EVERY ENTRY STARTS AT `jeff`, and that is the point of landing it on its
 * own: nothing moves on screen the day the shell arrives. A page becomes
 * Refined's when there is a reason, not in advance.
 *
 * HOW TO FORK ONE — the project's own rule (CLAUDE.md step 2, `CourseContentV2`
 * is the worked example), applied here:
 *
 *   1. copy `CompassJeffMvpOverview.tsx` → `CompassRefinedOverview.tsx`
 *   2. flip this map's `overview` to `'refined'`
 *   3. change the copy
 *
 * His file is untouched, so his arm cannot move. No conditionals threaded
 * through a shared page, which is the thing the fork rule exists to prevent.
 *
 * ⚠ THE LAYOUT FORKS; THE DATA DOES NOT. A Refined page imports
 * `compassJeffMvpFixtures.ts` like his does — "fork the layout, import the
 * data: if both versions duplicate the content, the comparison is no longer
 * about your change". Same for the stylesheet: a forked page keeps his
 * `cjm-*` classes and takes Refined-only rules under the shell's `crf`
 * wrapper, so 3,666 lines of his CSS are not copied per page and a later fix
 * to his styles is still one fix.
 *
 * ⚠ `anjani` IS IN THE UNION AND IS NOT YET USED. Four rows have a real
 * choice between the two designers — Overview, Learn, Study planner and
 * Readiness — and the whole reason Refined exists is to be composed from
 * both. The arm is here so taking her page is the same one-line move as
 * taking his, rather than a second mechanism invented later.
 */
export type RefinedSource = 'jeff' | 'anjani' | 'refined'

/** ⚠ THE RAIL IS A SLOT TOO. Bringing the page titles into line across the
 *  set (Jillienne, 2026-11-10) reaches the rail labels, and a rail is a page
 *  component like any other — forking it is the same three steps above, with
 *  `CompassRefinedRail` in place of a page. */
export type RefinedSlot = JeffMvpPage | 'rail'

export const REFINED_PAGE_SOURCE: Record<RefinedSlot, RefinedSource> = {
  rail: 'jeff',
  overview: 'jeff',
  learn: 'jeff',
  'study-planner': 'jeff',
  'prep-review': 'jeff',
  practice: 'jeff',
  flashcards: 'jeff',
  'exam-simulator': 'jeff',
  /* The one page that is already Refined's — `CompassReadinessRefined`,
     2026-11-09, his page rebuilt against Nina Conrad's "Compass Rapid
     Insights: Your Exam Prep". It is what every other row is heading for. */
  readiness: 'refined',
  course: 'jeff',
  'practice-session': 'jeff',
  'flashcard-topic': 'jeff',
  'flashcard-study': 'jeff',
  'exam-session': 'jeff',
}

/** Reading the map, with a named fallback rather than an `undefined` that
 *  renders nothing. A slot missing from the map is a page added to his MVP
 *  and not yet considered here; his is the honest answer until someone says
 *  otherwise. `CompassRefinedShell.test.tsx` pins that the map covers the
 *  whole union, so this fallback should never fire. */
export const refinedSourceFor = (slot: RefinedSlot): RefinedSource =>
  REFINED_PAGE_SOURCE[slot] ?? 'jeff'
