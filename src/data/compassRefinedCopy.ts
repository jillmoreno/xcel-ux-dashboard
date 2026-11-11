/**
 * REFINED'S OWN WORDS — the first fixture Refined forks, 2026-11-10.
 *
 * ⚠ THE COURSE IS AN EYEBROW ON EVERY PAGE NOW. Jillienne: "The Florida Life
 * & Health Pre-licensing should be an eyebrow about the title. And the
 * eyebrow should exist on EVERY page because this entire platform is about
 * that 1 course!" In Jeff's build the course name is a line under the
 * Overview's title and appears nowhere else — so a learner four pages deep
 * has nothing on screen saying what they are studying.
 *
 * ⚠ IT LIVES HERE RATHER THAN IN `JEFF_MVP_OVERVIEW_COPY`, which is where he
 * put it, for the reason the data rule gives: his fixture is the OVERVIEW's
 * copy, and this is the platform's. Reading it out of a page's fixture to
 * render it on twelve pages would make every page depend on the Overview.
 *
 * ⚠ IT IS A FORK, AND THE WORDS ARE HIS SO FAR. The strings are carried
 * verbatim from `JEFF_MVP_OVERVIEW_COPY.course` and `.access`; what changed
 * is where they are and what they are for. When Refined decides different
 * words, they change here and the commit says why — the shared-data rule
 * guards against accidental divergence, not against deciding.
 */
export const REFINED_COURSE = {
  /** The one course this platform is about. */
  name: 'Florida Life and Health Pre-licensing',
  /** ⚠ TO THE RIGHT OF THE NAME, dot-separated — the direct ask ("move the
   *  Access ends to the right of the florida eyebrow with a small dot
   *  divider"). It was a line in the Overview's meta row, beside two pills
   *  that are now gone. */
  access: 'Access ends Jan 20, 2027',
} as const

/**
 * THE OVERVIEW'S TITLE — one string for all sixteen states, 2026-11-11.
 *
 * ⚠ IT USED TO CHANGE WITH THE LEARNER'S PHASE. Jeff's prototype retitles the
 * page "Your exam prep" on the three P states and "Your learning journey" on
 * the other thirteen, on the argument that after the course this page becomes
 * a different page. Jillienne, landing on the default state: "why does this
 * say exam prep when we are on the overview page" — the rail row says
 * Overview, the page said something else, and nothing on screen reconciled
 * them. A learner who clicks Overview and arrives somewhere differently named
 * has to work out whether they went to the wrong place.
 *
 * ⚠ THE PHASE IS NOT LOST, it stops being the page's NAME. "Overview = Your
 * Learning Journey, and then there can be a small marker near it describing
 * the phase of the journey. We can touch on that later because it would
 * likely be described in the first widget of the overview page." So the
 * marker is deliberately not built yet — it belongs with that widget.
 *
 * ⚠ ONE CONSTANT, TWO COMPONENTS. The P series and the U/Q series are
 * different components; a string typed into both is two strings that agree
 * today. `CompassRefinedShell.test.tsx` holds every state to this one.
 */
export const REFINED_OVERVIEW_TITLE = 'Your Learning Journey'

/**
 * EVERY PAGE TITLE, IN ONE PLACE AND IN TITLE CASE — 2026-11-11, Jillienne:
 * "title case everywhere".
 *
 * ⚠ THE SET WAS MIXED AND NOBODY CHOSE IT. "Your Course", "Prep Review",
 * "Exam Simulator" and "Flashcards" were title case; "Your readiness",
 * "Study planner" and "Your learning journey" were sentence case. Both
 * conventions came through the port from different screens of Jeff's file, so
 * the rail and the pages disagreed with each other and with themselves.
 *
 * ⚠ THE MAP IS THE WHOLE SET, not just the three that changed. Listing only
 * the exceptions would mean the convention lives nowhere you can read it, and
 * the next page added would be a coin toss. `CompassRefinedShell.test.tsx`
 * holds every rail page's title to this map and every title in it to the
 * convention.
 *
 * ⚠ IT IS A FORK OF HIS WORDS, and the data rule covers it: a fixture forks
 * when Refined decides different words. `JEFF_MVP_*.title` keeps its own
 * casing — the version that still draws them is not changing.
 */
export const REFINED_PAGE_TITLES = {
  overview: REFINED_OVERVIEW_TITLE,
  learn: 'Your Course',
  'study-planner': 'Study Planner',
  'prep-review': 'Prep Review',
  practice: 'Practice',
  flashcards: 'Flashcards',
  'exam-simulator': 'Exam Simulator',
  readiness: 'Your Readiness',
} as const

/**
 * THE RAIL'S ROW LABELS, held to the same rule.
 *
 * ⚠ ONLY "Study planner" MOVED, and the rail is where it mattered most: the
 * row and the page it opens were spelled differently from each other.
 *
 * ⚠ THE "Exam prep" GROUP LABEL IS DELIBERATELY NOT HERE. Its capitals are
 * `text-transform` — the fixture says "Exam prep" and the stylesheet
 * uppercases it, which the 2026-11-05 parity run recorded the hard way. Title
 * casing the string would change nothing on screen and would break the parity
 * check against his `innerText`.
 */
export const REFINED_RAIL_LABELS: Record<string, string> = {
  overview: 'Overview',
  learn: 'Learn',
  'study-planner': 'Study Planner',
  'prep-review': 'Prep Review',
  practice: 'Practice',
  flashcards: 'Flashcards',
  'exam-simulator': 'Exam Simulator',
  readiness: 'Readiness',
}
