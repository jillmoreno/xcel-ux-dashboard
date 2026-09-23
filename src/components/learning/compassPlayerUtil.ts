/* Pure helpers for `CompassCoursePlayer`. Split out for the reason
   `learningPathsHomeUtil` and `studyJourneyUtil` were: a component file that
   also exports a function trips `react-refresh/only-export-components`, and
   the player needs this callable from tests without mounting the shell. */

/**
 * "June 30, 2026" + "8 Days Out" from the stored date.
 *
 * `YYYY-MM-DD`, which is what `examDateStore` holds — the value an
 * `<input type="date">` produces, and the only shape `readExamDate` will
 * return (it regex-guards the rest). Written against `mm/dd/yyyy` first, which
 * meant the chip silently never rendered: `readExamDate` rejected every date
 * the learner had actually entered. A test caught it.
 *
 * PARSED FIELD BY FIELD rather than handed to `new Date(stored)`: the string
 * form is treated as UTC midnight, so in any timezone behind it the date comes
 * back a day early — the classic off-by-one that would have this chip state
 * the day before the exam.
 *
 * The countdown is measured from TODAY and floored at zero — a negative "days
 * out" would be a date already passed, which the chip should not state as a
 * countdown. Same shape the mock draws; the numbers are the learner's.
 */
export function formatExamChip(stored: string): { date: string; countdown: string } | null {
  const [yyyy, mm, dd] = stored.split('-').map((n) => Number(n))
  if (!mm || !dd || !yyyy) return null
  const target = new Date(yyyy, mm - 1, dd)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.max(0, Math.round((target.getTime() - startOfToday.getTime()) / 86_400_000))
  return {
    date: target.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    countdown: days === 1 ? '1 Day Out' : `${days} Days Out`,
  }
}



/**
 * THE HEIGHT OF THE FIRST ROW IN A LEFT COLUMN — 38px.
 *
 * Shared by the Compass player's breadcrumb (`Home / Overview / Course`) and
 * the dashboard rail's first section caption ("MY LEARNING"), because the two
 * are the SAME COLUMN as far as a learner is concerned: the player is a
 * full-window takeover, so entering and leaving a course swaps one for the
 * other in place.
 *
 * 2026-09-23, the direct ask — "so when they click back to home it doesn't feel
 * like the left nav is jumping around". The breadcrumb reserved 38px and the
 * caption block came to 24.5 (16.5 of text plus an 8px margin), so everything
 * below it — Home, My Courses, Certificates — sat 13.5px higher than the course
 * title it had just replaced. Small enough to read as a flicker rather than as
 * a layout, which is what makes it feel like a glitch.
 *
 * A CONSTANT RATHER THAN 38 TYPED TWICE: the two live in different components,
 * in different trees, and nothing renders them together, so a drift here is
 * invisible until someone switches views and watches for it.
 */
export const LEFT_COLUMN_FIRST_ROW_HEIGHT = 38
