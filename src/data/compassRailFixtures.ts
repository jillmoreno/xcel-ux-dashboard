/**
 * The Compass RAIL's footer — Anjani's sidebar stats, ported 2026-10-08.
 *
 * ⚠ ITS OWN FILE BECAUSE THE RAIL IS SHARED CHROME IN HER DESIGN. Every one of
 * her screens draws the same sidebar, so this does not belong beside any single
 * screen's content — `compassCourseLandingFixtures` holds her Course page,
 * `compassLearningFixtures` her Dashboard, and this sits under both.
 *
 * ⚠ WHERE IT CAME FROM. Transcribed from her standalone prototype
 * (`public/prototypes/xcel-compass-nudge-journey.html` on
 * `claude/gallant-feynman-aj0m0i`), measured in the browser rather than read
 * off a screenshot. She is still working in that file, so IT is the source and
 * nothing tells this one when hers changes — the same caution the other two
 * Compass fixtures carry.
 *
 * ⚠ INVENTED FIGURES, AND THEY DISAGREE WITH THE PRODUCT'S ON PURPOSE. Her rail
 * says 28 of 40 hours and an exam on Aug 14; the shell says 42 lessons and a
 * December target. Neither is wired to the other, and reconciling them is a
 * decision nobody has made — see the same warning in
 * `compassCourseLandingFixtures`. When real data arrives this file is what gets
 * deleted, not extended.
 */

export const COMPASS_RAIL_WORDMARK = 'Compass'

export const COMPASS_RAIL_FOOTER = {
  hoursLabel: 'Course hours',
  /** "28 of 40 · to take the exam" — her wording, including the reason. The
   *  number alone would read as progress; the tail says what it is FOR. */
  hoursValue: '28 of 40 · to take the exam',
  examLabel: 'Exam',
  examDate: 'Aug 14',
  /**
   * ⚠ ITS OWN FIELD BECAUSE IT CARRIES ITS OWN INK. "not booked" is amber in
   * her design — the one warm thing in a grey rail — because an unbooked exam
   * is the single outstanding action. Folded into `examDate` it would lose
   * that and read as part of the date.
   */
  examState: 'not booked',
  learnerInitials: 'JR',
  learnerName: 'Jordan R.',
}
