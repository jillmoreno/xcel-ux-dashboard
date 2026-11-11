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
