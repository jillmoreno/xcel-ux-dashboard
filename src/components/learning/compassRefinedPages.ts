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
 *   2. give the copy its own class prefix and its own stylesheet, on HOUSE
 *      COMPASS TOKENS — see the freeze rule below
 *   3. flip this map's `overview` to `'refined'`
 *   4. change the copy
 *
 * His file is untouched, so his arm cannot move. No conditionals threaded
 * through a shared page, which is the thing the fork rule exists to prevent.
 *
 * ⚠ THE DATA IS SHARED BY DEFAULT AND FORKED ON PURPOSE — 2026-11-10,
 * Jillienne: "even the data and styles if i decide to change in refined, do
 * it." A Refined page imports `compassJeffMvpFixtures.ts` like his does, so
 * that three versions showing the same learner are comparable — CLAUDE.md's
 * "fork the layout, import the data: if both versions duplicate the content,
 * the comparison is no longer about your change". That rule is about
 * ACCIDENTAL divergence: two copies of the same words drifting apart until
 * the versions differ for reasons nobody chose.
 *
 * It is not a rule against changing the words. Bringing the page titles into
 * line across the set is one of the things Refined exists to do, and a title
 * is a fixture — so when Refined's answer to a page includes different copy,
 * that fixture forks with the layout and the commit says which words changed
 * and why. A deliberate content difference IS a design decision and should be
 * visible as one; what the shared default prevents is the same decision being
 * made twice by accident.
 *
 * ⚠ THE STYLES FREEZE ON FORK — 2026-11-10, Jillienne's call, asked
 * directly: a forked page takes its own stylesheet and stops moving when
 * Jeff's does. The alternative (keep his `cjm-*` classes, override under a
 * wrapper) was cheaper and was rejected for the reason that decides it: he
 * hands over a new prototype every few weeks, and a restyle in one of them
 * would shift pages she had already settled, without anyone asking for it.
 *
 * ⚠ IT FREEZES ONTO THE HOUSE TOKENS, NOT ONTO A COPY OF HIS CSS, and that
 * is what makes the rule cheap instead of a 3,666-line duplication per page.
 * `CompassReadinessRefined` — the one page already forked, 2026-11-09 — uses
 * none of his classes: its own `cre-rdr-*` prefix, its own stylesheet, and
 * `--color-compass-page-*` / `--color-primary-*` throughout, on the direct
 * ask ("Move to house Compass tokens"). Every page after it follows that
 * page, so Refined converges on the system rather than on a snapshot of his
 * palette. A forked page that still wants one of his looks copies that rule,
 * and the copy is then Refined's to change.
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
